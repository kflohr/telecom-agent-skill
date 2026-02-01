import { twilioClient, TWILIO_NUMBER } from './twilio';
import { prisma } from './db';
import { CallState, SmsStatus, SmsDirection, ActorSource, ConferenceState } from '@prisma/client';

const WEBHOOK_BASE = process.env.API_URL || 'http://localhost:3000';

export const Actions = {
  
  async dial(workspaceId: string, to: string, from = TWILIO_NUMBER, actor: ActorSource = ActorSource.api) {
    // 1. Create DB Record (Initiated)
    const leg = await prisma.callLeg.create({
      data: {
        workspaceId,
        direction: 'outbound-api',
        from,
        to,
        state: CallState.initiated,
      }
    });

    // 2. Call Twilio
    try {
      const call = await twilioClient.calls.create({
        url: `${WEBHOOK_BASE}/webhooks/twilio/twiml/outbound`, // TwiML bin or handler
        to,
        from,
        statusCallback: `${WEBHOOK_BASE}/webhooks/twilio/voice`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      });

      // 3. Update with Sid
      await prisma.callLeg.update({
        where: { id: leg.id },
        data: { callSid: call.sid }
      });

      return { success: true, callSid: call.sid, id: leg.id };
    } catch (e: any) {
      await prisma.callLeg.update({
        where: { id: leg.id },
        data: { state: CallState.failed, rawLastEvent: { error: e.message } }
      });
      throw e;
    }
  },

  async sms(workspaceId: string, to: string, body: string, actor: ActorSource = ActorSource.api) {
    const msg = await prisma.smsMessage.create({
      data: {
        workspaceId,
        direction: SmsDirection.outbound,
        status: SmsStatus.queued,
        from: TWILIO_NUMBER,
        to,
        body,
        bodyHash: 'hash-placeholder'
      }
    });

    try {
      const res = await twilioClient.messages.create({
        body,
        to,
        from: TWILIO_NUMBER,
        statusCallback: `${WEBHOOK_BASE}/webhooks/twilio/sms`
      });

      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { messageSid: res.sid, status: SmsStatus.sending }
      });

      return { success: true, messageSid: res.sid };
    } catch (e: any) {
      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { status: SmsStatus.failed, errorMessage: e.message }
      });
      throw e;
    }
  },

  async merge(workspaceId: string, callSidA: string, callSidB: string, actor: ActorSource = ActorSource.api) {
    const friendlyName = `merge_${Date.now()}`;
    
    // 1. Create Conference Record
    await prisma.conference.create({
      data: {
        workspaceId,
        friendlyName,
        state: ConferenceState.created
      }
    });

    // 2. Redirect both calls to the conference
    const twiml = `<Response><Dial><Conference>${friendlyName}</Conference></Dial></Response>`;

    const p1 = twilioClient.calls(callSidA).update({ twiml });
    const p2 = twilioClient.calls(callSidB).update({ twiml });

    await Promise.all([p1, p2]);

    // Audit Log handled by caller
    return { success: true, friendlyName };
  }
};