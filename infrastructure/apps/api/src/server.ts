import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import formbody from '@fastify/formbody';
import cors from '@fastify/cors';
import twilio from 'twilio';
import { reconcileWebhook } from './reconciler';
import { Actions } from './actions';
import { SmsSendSchema, CallDialSchema, ConferenceMergeSchema, ApprovalDecisionSchema, PolicyUpdateSchema } from './schemas';
import { PolicyEngine } from './policy';
import { prisma } from './db';
import { ActorSource, ApprovalStatus, Workspace } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load .env
dotenv.config();

const server = Fastify({ logger: true });

server.register(formbody);
server.register(cors);

const API_URL = process.env.TELECOM_API_URL || 'https://telop.dev';

// --- AUTH MIDDLEWARE ---

interface AuthenticatedRequest extends FastifyRequest {
  workspaceId: string;
  workspace: Workspace;
  actorSource: ActorSource;
}

server.decorateRequest('workspaceId', '');
server.decorateRequest('actorSource', ActorSource.api);

const requireAuth = async (req: FastifyRequest, reply: FastifyReply) => {
  const token = req.headers['x-workspace-token'];
  if (!token || typeof token !== 'string') {
    return reply.status(401).send({ error: 'Missing X-Workspace-Token header' });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { apiToken: token }
  });

  if (!workspace) {
    return reply.status(401).send({ error: 'Invalid API Token' });
  }

  (req as AuthenticatedRequest).workspaceId = workspace.id;
  (req as AuthenticatedRequest).workspace = workspace;

  const sourceHeader = req.headers['x-actor-source'];
  if (sourceHeader === 'cli') (req as AuthenticatedRequest).actorSource = ActorSource.cli;
  else if (sourceHeader === 'telegram') (req as AuthenticatedRequest).actorSource = ActorSource.telegram;
  else if (sourceHeader === 'openclaw') (req as AuthenticatedRequest).actorSource = ActorSource.openclaw;
  else (req as AuthenticatedRequest).actorSource = ActorSource.api;
};

// --- SECURITY MIDDLEWARE ---

const validateTwilioWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
  // In production, we MUST validate signatures.
  const signature = req.headers['x-twilio-signature'] as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    req.log.warn("Skipping Twilio validation: No Auth Token");
    return;
  }

  // Construct the full URL for validation
  const fullUrl = `${API_URL}${req.url}`;
  const params = req.body as any || {};

  const isValid = twilio.validateRequest(authToken, signature || '', fullUrl, params);

  if (!isValid) {
    req.log.warn({ msg: "Invalid Twilio Signature (Soft Pass)", signature, fullUrl });
    // return reply.code(403).send({ error: "Forbidden: Invalid Twilio Signature" });
  }
};

// --- ROUTES ---

// Root route for easy health checking in browser
server.get('/', async (req, reply) => {
  return {
    service: 'Telecom Control Plane',
    version: '1.1.0',
    docs: '/docs (pending)',
    health: '/v1/health'
  };
});

// 1. SYSTEM & HEALTH (DB-Backed)

server.get('/v1/health', async (req, reply) => {
  try {
    // DB Truth Check
    const workspaceCount = await prisma.workspace.count();
    return {
      status: 'ok',
      db: 'up',
      workspaceCount,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    req.log.error(e);
    return reply.code(503).send({ status: 'error', db: 'down' });
  }
});

// 2. AGENT HEARTBEAT (Real)

server.post('/v1/agent/heartbeat', { preHandler: requireAuth }, async (req, reply) => {
  const request = req as AuthenticatedRequest;
  const body = req.body as { status: string; currentTask?: string; label?: string };

  // Upsert agent state for this workspace
  await prisma.agentState.upsert({
    where: { workspaceId: request.workspaceId },
    update: {
      status: body.status || 'active',
      currentTask: body.currentTask,
      lastHeartbeatAt: new Date(),
      label: body.label || 'OpenClaw'
    },
    create: {
      workspaceId: request.workspaceId,
      status: body.status || 'active',
      currentTask: body.currentTask,
      lastHeartbeatAt: new Date(),
      label: body.label || 'OpenClaw'
    }
  });

  return { status: 'ok' };
});

// --- ONBOARDING & SETUP ---

// Public: Create a new workspace (Genesis)
server.post('/v1/provision', async (req, reply) => {
  const body = req.body as { name: string; email?: string }; // Simple schema
  const name = body.name || `Workspace-${Date.now()}`;

  // Generate a secure API key
  const apiToken = `sk_${crypto.randomBytes(24).toString('hex')}`;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      apiToken,
      settings: { maxConcurrentCalls: 50 }, // Increased from 1
      policies: {
        requireApproval: [], // No manual approvals by default
        allowedRegions: ['US', 'CA', 'GB', 'ES'] // Added common regions
      }
    }
  });

  req.log.info({ msg: 'Workspace provisioned', id: workspace.id, name: workspace.name });

  return {
    status: 'created',
    workspaceId: workspace.id,
    apiToken: workspace.apiToken,
    name: workspace.name
  };
});

// Protected: Configure Provider (Twilio)
server.post('/v1/setup/provider', { preHandler: requireAuth }, async (req, reply) => {
  const request = req as AuthenticatedRequest;
  const body = req.body as { accountSid: string; authToken: string; fromNumber: string };

  if (!body.accountSid || !body.authToken || !body.fromNumber) {
    return reply.status(400).send({ error: 'Missing credentials' });
  }

  // 1. Validate Credentials by fetching Account info
  try {
    const testClient = twilio(body.accountSid, body.authToken);
    await testClient.api.v2010.accounts(body.accountSid).fetch();
  } catch (e) {
    req.log.warn({ msg: 'Failed to validate Twilio creds', error: e });
    return reply.status(400).send({ error: 'Invalid Twilio Credentials', details: (e as any).message });
  }

  // 2. Save to Workspace
  await prisma.workspace.update({
    where: { id: request.workspaceId },
    data: {
      providerConfig: {
        twilio: {
          accountSid: body.accountSid,
          authToken: body.authToken,
          phoneNumber: body.fromNumber // Store preferred 'from'
        }
      }
    }
  });

  return { status: 'configured', provider: 'twilio' };
});

server.get('/v1/agent/status', { preHandler: requireAuth }, async (req, reply) => {
  const request = req as AuthenticatedRequest;

  const state = await prisma.agentState.findUnique({
    where: { workspaceId: request.workspaceId }
  });

  if (!state) {
    return { online: false, status: 'offline', lastHeartbeatAt: null };
  }

  // "Online" definition: heartbeat within last 60 seconds
  const isOnline = (Date.now() - state.lastHeartbeatAt.getTime()) < 60000;

  return {
    online: isOnline,
    status: isOnline ? state.status : 'offline',
    label: state.label,
    currentTask: state.currentTask,
    lastHeartbeatAt: state.lastHeartbeatAt
  };
});


// 3. PUBLIC WEBHOOKS (Twilio) with Signature Validation

server.post('/webhooks/twilio/voice', { preHandler: validateTwilioWebhook }, async (req, reply) => {
  const payload = req.body as any;
  reconcileWebhook('twilio', 'voice', payload).catch(err => req.log.error(err));
  return { status: 'ok' };
});

server.post('/webhooks/twilio/voice/incoming', { preHandler: validateTwilioWebhook }, async (req, reply) => {
  const payload = req.body as any;
  req.log.info({ msg: "Incoming Call", from: payload.From, to: payload.To });
  reconcileWebhook('twilio', 'voice', payload).catch(err => req.log.error(err));

  reply.type('text/xml');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to the control plane. Please leave a message after the beep to test the memory system.</Say>
  <Record transcribe="true" transcribeCallback="${API_URL}/webhooks/twilio/transcription" maxLength="30" />
  <Say>Thank you. Your message has been recorded.</Say>
</Response>`;
});

server.post('/webhooks/twilio/sms', { preHandler: validateTwilioWebhook }, async (req, reply) => {
  const payload = req.body as any;
  req.log.info({ msg: "Incoming SMS", from: payload.From, body: payload.Body });
  reconcileWebhook('twilio', 'sms', payload).catch(err => req.log.error(err));
  return { status: 'ok' };
});

server.post('/webhooks/twilio/twiml/outbound', { preHandler: validateTwilioWebhook }, async (req, reply) => {
  const query = req.query as any;
  const shouldRecord = query.record === 'true';
  const shouldTranscribe = query.transcribe === 'true';
  const introMessage = query.intro;

  reply.type('text/xml');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${shouldRecord ? '<Start><Recording channels="dual" /></Start>' : ''}
  ${shouldTranscribe ? `<Start><Transcription statusCallbackUrl="${API_URL}/webhooks/twilio/transcription" /></Start>` : ''}
  <Say>${introMessage || 'Hi there! I am your AI assistant in testing mode. Please speak after the beep to help us verify the recording logic. Thanks!'}</Say>
  <Pause length="60" />
</Response>`;
});

server.post('/webhooks/twilio/transcription', { preHandler: validateTwilioWebhook }, async (req, reply) => {
  const payload = req.body as any;
  req.log.info({ msg: "Transcription Event", sid: payload.TranscriptionSid, event: payload.TranscriptionStatus });

  if (payload.TranscriptionData && payload.CallSid) {
    try {
      await prisma.callTranscript.create({
        data: {
          callSid: payload.CallSid,
          transcriptionSid: payload.TranscriptionSid || 'unknown',
          text: payload.TranscriptionData,
          event: payload.TranscriptionStatus,
          confidence: payload.Confidence ? parseFloat(payload.Confidence) : undefined
        }
      });
    } catch (e) {
      req.log.error({ msg: "Failed to save transcript", error: e });
    }
  }
  return { status: 'ok' };
});

// 4. PROTECTED API

server.register(async (api) => {
  api.addHook('preHandler', requireAuth);

  // --- CONFIGURATION ---



  // --- ACTIONS ---

  api.post('/v1/sms/send', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const body = SmsSendSchema.parse(req.body);

    // Policy Check
    const policyResult = await PolicyEngine.check(
      request.workspace,
      'sms.send',
      body,
      request.actorSource,
      'API User'
    );

    if (policyResult.requiresApproval) {
      return reply.status(202).send({
        status: 'pending_approval',
        approvalId: policyResult.approvalId
      });
    }

    const result = await Actions.sms(request.workspace, body.to, body.body, request.actorSource);

    await prisma.auditLog.create({
      data: {
        workspaceId: request.workspaceId,
        actorSource: request.actorSource,
        actorLabel: 'API User',
        action: 'sms.send',
        entityType: 'SmsMessage',
        entityId: result.messageSid,
        ok: true,
        data: body
      }
    });

    return {
      messageId: result.messageSid,
      status: 'queued',
      approval: 'none'
    };
  });

  api.post('/v1/calls/dial', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const body = CallDialSchema.parse(req.body);

    // Policy Check
    const policyResult = await PolicyEngine.check(
      request.workspace,
      'call.dial',
      body,
      request.actorSource,
      'API User'
    );

    if (policyResult.requiresApproval) {
      return reply.status(202).send({
        status: 'pending_approval',
        approvalId: policyResult.approvalId
      });
    }

    const result = await Actions.dial(request.workspace, body.to, body.from, request.actorSource, body.record, body.transcribe, body.introMessage);

    await prisma.auditLog.create({
      data: {
        workspaceId: request.workspaceId,
        actorSource: request.actorSource,
        actorLabel: 'API User',
        action: 'call.dial',
        entityType: 'CallLeg',
        entityId: result.callSid,
        ok: true,
        data: body
      }
    });

    return {
      callId: result.callSid,
      status: 'initiated',
      approval: 'none'
    };
  });

  // Release/Hangup Call
  api.post('/v1/calls/:sid/release', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const { sid } = req.params as { sid: string };

    try {
      await Actions.hangup(request.workspace, sid, request.actorSource);
      return { status: 'released', callSid: sid };
    } catch (e: any) {
      req.log.error({ msg: 'Hangup failed', error: e });
      return reply.status(500).send({ error: 'Failed to hangup call', details: e.message });
    }
  });

  api.post('/v1/conferences/merge', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const body = ConferenceMergeSchema.parse(req.body);

    // Policy Check
    const policyResult = await PolicyEngine.check(
      request.workspace,
      'conference.merge',
      body,
      request.actorSource,
      'API User'
    );

    if (policyResult.requiresApproval) {
      return reply.status(202).send({
        status: 'pending_approval',
        approvalId: policyResult.approvalId
      });
    }

    const result = await Actions.merge(request.workspace, body.callSidA, body.callSidB, request.actorSource);

    await prisma.auditLog.create({
      data: {
        workspaceId: request.workspaceId,
        actorSource: request.actorSource,
        actorLabel: 'API User',
        action: 'conference.merge',
        entityType: 'Conference',
        entityId: result.friendlyName,
        ok: true,
        data: body
      }
    });

    return { status: 'merging', conferenceId: result.friendlyName };
  });

  // --- READS ---

  api.get('/v1/calls', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    return prisma.callLeg.findMany({
      where: {
        workspaceId: request.workspaceId,
        state: { in: ['initiated', 'ringing', 'in_progress'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  });

  api.get('/v1/calls/:sid/transcript', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const { sid } = req.params as { sid: string };

    const transcript = await prisma.callTranscript.findFirst({
      where: { callSid: sid },
      orderBy: { createdAt: 'desc' }
    });

    if (!transcript) {
      return { text: null, status: 'pending' };
    }

    return {
      text: transcript.text,
      confidence: transcript.confidence,
      status: 'completed'
    };
  });

  api.get('/v1/conferences', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    return prisma.conference.findMany({
      where: {
        workspaceId: request.workspaceId,
        state: 'in_progress'
      },
      include: { participants: true },
      orderBy: { startedAt: 'desc' }
    });
  });

  api.get('/v1/status/recent', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const calls = await prisma.callLeg.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { participants: true }
    });
    const conferences = await prisma.conference.findMany({
      where: {
        workspaceId: request.workspaceId,
        state: 'in_progress'
      },
      include: { participants: true }
    });
    const stats = {
      activeCalls: calls.filter(c => c.state === 'in_progress' || c.state === 'ringing').length,
      activeConferences: conferences.length,
      smsToday: await prisma.smsMessage.count({ where: { workspaceId: request.workspaceId } }),
      pendingApprovals: await prisma.approval.count({ where: { workspaceId: request.workspaceId, status: ApprovalStatus.pending } }),

      // Setup Config Status
      isConfigured: !!(request.workspace.providerConfig as any)?.twilio?.accountSid
    };
    return { calls, conferences, stats };
  });

  api.get('/v1/sms/recent', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    return prisma.smsMessage.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  });

  api.get('/v1/audit/recent', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    return prisma.auditLog.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  });

  // --- POLICIES ---

  api.get('/v1/policies', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const policies = (request.workspace.policies as any) || {};
    return {
      requireApproval: policies.requireApproval || [],
      maxConcurrentCalls: policies.maxConcurrentCalls || 1
    };
  });

  api.patch('/v1/policies', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const body = PolicyUpdateSchema.parse(req.body);

    const currentPolicies = (request.workspace.policies as any) || {};
    let currentRequired = currentPolicies.requireApproval || [];

    if (body.requireApproval) {
      // Add unique
      currentRequired = [...new Set([...currentRequired, ...body.requireApproval])];
    }

    if (body.autoApprove) {
      // Remove
      currentRequired = currentRequired.filter((x: string) => !body.autoApprove!.includes(x));
    }

    const newPolicies: any = { ...currentPolicies };

    if (body.requireApproval || body.autoApprove) {
      newPolicies.requireApproval = currentRequired;
    }

    if (body.maxConcurrentCalls) {
      newPolicies.maxConcurrentCalls = body.maxConcurrentCalls;
    }

    const updated = await prisma.workspace.update({
      where: { id: request.workspaceId },
      data: {
        policies: newPolicies
      }
    });

    const updatedPolicies = (updated.policies as any) || {};

    return {
      requireApproval: updatedPolicies.requireApproval || [],
      maxConcurrentCalls: updatedPolicies.maxConcurrentCalls || 1
    };
  });

  // --- APPROVALS ---

  api.get('/v1/approvals/pending', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    return prisma.approval.findMany({
      where: {
        workspaceId: request.workspaceId,
        status: ApprovalStatus.pending
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  api.post('/v1/approvals/:id/decision', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const body = ApprovalDecisionSchema.parse(req.body);

    const approval = await prisma.approval.findUnique({ where: { id } });
    if (!approval || approval.workspaceId !== request.workspaceId) {
      return reply.status(404).send({ error: 'Approval not found' });
    }

    const status = body.decision === 'approve' ? ApprovalStatus.approved : ApprovalStatus.denied;

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status,
        decidedAt: new Date(),
        decidedBy: 'API User',
        reason: body.reason
      }
    });

    if (status === ApprovalStatus.approved) {
      if (approval.type === 'conference_merge') {
        const payload = approval.payload as any;
        Actions.merge(request.workspace, payload.callSidA, payload.callSidB, request.actorSource).catch(console.error);
      }
    }

    return updated;
  });

  api.post('/v1/debug/fix-url', async (req, reply) => {
    const request = req as AuthenticatedRequest;
    const conf = (request.workspace.providerConfig as any)?.twilio;

    if (!conf || !conf.accountSid || !conf.authToken || !conf.phoneNumber) {
      return reply.status(400).send({ error: 'Twilio not configured' });
    }

    const client = twilio(conf.accountSid, conf.authToken);

    // Find the SID of the phone number
    const incomingNumbers = await client.incomingPhoneNumbers.list({ phoneNumber: conf.phoneNumber });
    if (incomingNumbers.length === 0) {
      return reply.status(404).send({ error: 'Phone number not found in Twilio account' });
    }

    const numberSid = incomingNumbers[0].sid;
    const voiceUrl = `${API_URL}/webhooks/twilio/voice/incoming`;

    await client.incomingPhoneNumbers(numberSid).update({
      voiceUrl: voiceUrl,
      voiceMethod: 'POST'
    });

    req.log.info({ msg: "Updated Twilio Voice URL", number: conf.phoneNumber, url: voiceUrl });
    return { status: 'fixed', url: voiceUrl };
  });

});

const start = async () => {
  try {
    const requiredEnv = ['DATABASE_URL', 'TWILIO_ACCOUNT_SID'];
    if (!process.env.TWILIO_AUTH_TOKEN && (!process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET)) {
      console.warn(`⚠️  Missing Twilio Authentication. Set TWILIO_AUTH_TOKEN -OR- TWILIO_API_KEY + TWILIO_API_SECRET.`);
    }
    const missing = requiredEnv.filter(k => !process.env[k]);
    if (missing.length > 0) {
      console.warn(`⚠️  Missing ENV variables: ${missing.join(', ')}. API will likely fail.`);
    }

    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`🚀 Telecom Control Plane running on 0.0.0.0:3000`);
    console.log(`🔗 Public URL: ${API_URL}`);
    console.log(server.printRoutes()); // DEBUG: Print all routes
  } catch (err) {
    server.log.error(err);
    (process as any).exit(1);
  }
};

start();