import { createHash } from 'crypto';
import { prisma } from './db';
import { ActorSource } from '@prisma/client';

// Local Enums to bypass build issues if Prisma generation is out of sync
const CallState = { initiated: 'initiated', ringing: 'ringing', in_progress: 'in_progress', completed: 'completed', busy: 'busy', no_answer: 'no_answer', failed: 'failed', canceled: 'canceled' };
const SmsStatus = { queued: 'queued', sending: 'sending', sent: 'sent', delivered: 'delivered', undelivered: 'undelivered', failed: 'failed', received: 'received' };
const ConferenceState = { created: 'created', in_progress: 'in_progress', completed: 'completed' };

// Generate a deterministic key for Twilio events
const generateEventKey = (provider: string, type: string, sid: string, status: string) => {
  return `${provider}:${type}:${sid}:${status}`;
};

export const reconcileWebhook = async (provider: 'twilio', eventType: 'voice' | 'sms' | 'conference', payload: any) => {
  const { CallSid, MessageSid, ConferenceSid, CallStatus, MessageStatus, StatusCallbackEvent } = payload;

  // Determine unique IDs based on event type
  let sid = '';
  let status = '';

  if (eventType === 'voice') {
    sid = CallSid;
    status = CallStatus;
  } else if (eventType === 'sms') {
    sid = MessageSid;
    status = MessageStatus;
  } else if (eventType === 'conference') {
    sid = ConferenceSid;
    status = StatusCallbackEvent; // participant-join, participant-leave, conference-start, conference-end
  }

  if (!sid || !status) {
    console.warn('Webhook received without SID or Status', payload);
    return;
  }

  const eventKey = generateEventKey(provider, eventType, sid, status);
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  // 1. Idempotency Check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventKey }
  });

  if (existingEvent) {
    console.log(`[Reconciler] Skipping duplicate event: ${eventKey}`);
    return;
  }

  // Fetch Default Workspace (MVP)
  const workspace = await prisma.workspace.findFirst();
  const workspaceId = workspace?.id;

  if (!workspaceId) {
    console.error(`[Reconciler] No workspace found! Cannot process event.`);
    return;
  }

  console.log(`[Reconciler] Processing ${eventKey} for Workspace: ${workspaceId}`);

  // 2. State Transition & DB Update
  try {
    await prisma.$transaction(async (tx) => {

      // --- VOICE EVENTS ---
      if (eventType === 'voice') {
        const mappedState = mapTwilioCallState(status);

        // Find or create the leg (inbound calls might not exist yet)
        await tx.callLeg.upsert({
          where: { callSid: sid },
          update: {
            state: mappedState,
            updatedAt: new Date(),
            rawLastEvent: payload as any
          },
          create: {
            workspaceId,
            callSid: sid,
            direction: payload.Direction || 'inbound',
            from: payload.From,
            to: payload.To,
            state: mappedState,
            startedAt: new Date(),
            rawLastEvent: payload as any
          }
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            workspaceId,
            actorSource: ActorSource.system,
            actorLabel: 'Twilio Webhook',
            action: `call.status.${status}`,
            entityType: 'CallLeg',
            entityId: sid,
            ok: true,
            data: { status, duration: payload.CallDuration }
          }
        });
      }

      // --- SMS EVENTS ---
      if (eventType === 'sms') {
        const mappedStatus = mapTwilioSmsStatus(status);

        await tx.smsMessage.upsert({
          where: { messageSid: sid },
          update: {
            status: mappedStatus,
            deliveredAt: mappedStatus === 'delivered' ? new Date() : undefined,
            updatedAt: new Date(),
            rawLastEvent: payload as any
          },
          create: {
            workspaceId,
            messageSid: sid,
            direction: 'inbound', // If it didn't exist, it's inbound
            status: mappedStatus,
            from: payload.From,
            to: payload.To,
            body: payload.Body || '',
            bodyHash: createHash('sha256').update(payload.Body || '').digest('hex'),
            receivedAt: new Date(),
            rawLastEvent: payload as any
          }
        });

        await tx.auditLog.create({
          data: {
            workspaceId,
            actorSource: ActorSource.system,
            actorLabel: 'Twilio Webhook',
            action: `sms.status.${status}`,
            entityType: 'SmsMessage',
            entityId: sid,
            ok: true,
            data: { status }
          }
        });
      }

      // --- CONFERENCE EVENTS ---
      if (eventType === 'conference') {
        // Handle participant join/leave or conference start/end
        if (status === 'conference-start') {
          await tx.conference.upsert({
            where: { conferenceSid: sid },
            update: { state: ConferenceState.in_progress as any } as any,
            create: {
              workspaceId,
              conferenceSid: sid,
              friendlyName: payload.FriendlyName,
              state: ConferenceState.in_progress as any
            } as any
          });
        } else if (status === 'conference-end') {
          await tx.conference.updateMany({
            where: { conferenceSid: sid },
            data: { state: ConferenceState.completed as any } as any
          });
        }

        // Handle Participants
        if (status === 'participant-join') {
          const callSid = payload.CallSid;

          // Ensure Conference exists first (it should, but strictly safe upsert)
          const conf = await tx.conference.upsert({
            where: { conferenceSid: sid },
            update: {},
            create: {
              workspaceId,
              conferenceSid: sid,
              friendlyName: payload.FriendlyName,
              state: ConferenceState.in_progress as any
            } as any
          });

          await tx.participant.create({
            data: {
              conferenceId: conf.id,
              callSid: callSid,
              participantSid: payload.CallSid,
              joinedAt: new Date(),
              muted: payload.Muted === 'true',
              onHold: payload.Hold === 'true'
            }
          });
        }
      }

      // 3. Record the Event (Idempotency Lock)
      await tx.webhookEvent.create({
        data: {
          workspaceId,
          provider,
          eventKey,
          eventType,
          payloadHash,
          payload: payload as any
        }
      });
    });
  } catch (error) {
    console.error(`[Reconciler] Error processing ${eventKey}:`, error);
  }
};

// Helpers
const mapTwilioCallState = (status: string): any => {
  switch (status) {
    case 'initiated': return CallState.initiated;
    case 'ringing': return CallState.ringing;
    case 'in-progress': return CallState.in_progress;
    case 'completed': return CallState.completed;
    case 'busy': return CallState.busy;
    case 'no-answer': return CallState.no_answer;
    case 'failed': return CallState.failed;
    case 'canceled': return CallState.canceled;
    default: return CallState.initiated;
  }
};

const mapTwilioSmsStatus = (status: string): any => {
  switch (status) {
    case 'queued': return SmsStatus.queued;
    case 'sending': return SmsStatus.sending;
    case 'sent': return SmsStatus.sent;
    case 'delivered': return SmsStatus.delivered;
    case 'undelivered': return SmsStatus.undelivered;
    case 'failed': return SmsStatus.failed;
    case 'received': return SmsStatus.received;
    default: return SmsStatus.queued;
  }
};