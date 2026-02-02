import { getTwilioClient, TWILIO_NUMBER } from './twilio';
import { prisma } from './db';
import { Workspace, ActorSource } from '@prisma/client'; // Keep types, remove Enums if they fail
// Using string literals for Enums to avoid build issues with generated client
const CallState = { initiated: 'initiated', failed: 'failed' };
const SmsStatus = { queued: 'queued', sending: 'sending', failed: 'failed' };
const SmsDirection = { outbound: 'outbound' };
const ConferenceState = { created: 'created' };

const WEBHOOK_BASE = process.env.TELECOM_API_URL || 'http://localhost:3000';

export const Actions = {

  async dial(workspace: Workspace, to: string, from = TWILIO_NUMBER, actor: ActorSource = ActorSource.api, record = false, transcribe = false) {
    const activeClient = getTwilioClient(workspace);
    const workspaceId = workspace.id;

    // Smart Defaults: If using global default, try to use workspace config
    if (from === TWILIO_NUMBER && workspace.providerConfig) {
      const conf = (workspace.providerConfig as any).twilio;
      if (conf && conf.phoneNumber) {
        from = conf.phoneNumber;
      }
    }

    // 1. Create DB Record (Initiated)
    const leg = await prisma.callLeg.create({
      data: {
        workspaceId,
        direction: 'outbound-api',
        from,
        to,
        state: CallState.initiated as any,
      }
    });

    // 2. Call Twilio
    try {
      const params = new URLSearchParams();
      if (record) params.append('record', 'true');
      if (transcribe) params.append('transcribe', 'true');

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const webhookUrl = `${WEBHOOK_BASE}/webhooks/twilio/twiml/outbound${queryString}`;

      const call = await activeClient.calls.create({
        url: webhookUrl, // TwiML bin or handler
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
        data: { state: CallState.failed as any, rawLastEvent: { error: e.message } }
      });
      throw e;
    }
  },

  async sms(workspace: Workspace, to: string, body: string, actor: ActorSource = ActorSource.api) {
    const activeClient = getTwilioClient(workspace);
    const workspaceId = workspace.id;

    const msg = await prisma.smsMessage.create({
      data: {
        workspaceId,
        direction: SmsDirection.outbound as any,
        status: SmsStatus.queued as any,
        from: TWILIO_NUMBER,
        to,
        body,
        bodyHash: 'hash-placeholder'
      }
    });

    try {
      const res = await activeClient.messages.create({
        body,
        to,
        from: TWILIO_NUMBER,
        statusCallback: `${WEBHOOK_BASE}/webhooks/twilio/sms`
      });

      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { messageSid: res.sid, status: SmsStatus.sending as any }
      });

      return { success: true, messageSid: res.sid };
    } catch (e: any) {
      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { status: SmsStatus.failed as any, errorMessage: e.message }
      });
      throw e;
    }
  },

  async merge(workspace: Workspace, callSidA: string, callSidB: string, actor: ActorSource = ActorSource.api) {
    const activeClient = getTwilioClient(workspace);
    const workspaceId = workspace.id;
    const friendlyName = `merge_${Date.now()}`;

    // 1. Create Conference Record
    await prisma.conference.create({
      data: {
        workspaceId,
        friendlyName,
        state: ConferenceState.created as any
      } as any // Force cast to avoid strict shape checks
    });

    // 2. Redirect both calls to the conference
    const twiml = `<Response><Dial><Conference>${friendlyName}</Conference></Dial></Response>`;

    const p1 = activeClient.calls(callSidA).update({ twiml });
    const p2 = activeClient.calls(callSidB).update({ twiml });

    await Promise.all([p1, p2]);

    // Audit Log handled by caller
    return { success: true, friendlyName };
  },

  async hangup(workspace: Workspace, callSid: string, actor: ActorSource = ActorSource.api) {
    const activeClient = getTwilioClient(workspace);

    // Update Twilio Call to 'completed'
    await activeClient.calls(callSid).update({ status: 'completed' });

    // Update DB (optimistically, let webhook confirm)
    await prisma.callLeg.updateMany({
      where: { callSid, workspaceId: workspace.id },
      data: { state: 'completed' as any, endedAt: new Date() }
    });

    return { success: true, callSid };
  }
};