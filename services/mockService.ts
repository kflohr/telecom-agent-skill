import {
    CallLeg,
    CallState,
    Conference,
    ConferenceState,
    SmsMessage,
    SmsDirection,
    SmsStatus,
    Approval,
    ApprovalStatus,
    ActorSource,
    AuditLog
} from '../types';

// CONFIG
const env = (import.meta as any).env || {};
const API_URL = env.VITE_API_URL;
const API_TOKEN = env.VITE_API_TOKEN || 'demo-token';
const USE_REAL_API = !!API_URL;

// --- MOCK STATE (Fallback) ---
let mockCalls: CallLeg[] = [
    { id: '1', callSid: 'CA_MOCK_1', direction: 'outbound-api', from: '+14155550100', to: '+14155550199', state: CallState.IN_PROGRESS, startedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
];
let mockConferences: Conference[] = [];
let mockMessages: SmsMessage[] = [];
let mockApprovals: Approval[] = [];
let mockAuditLogs: AuditLog[] = [];

// --- HELPER: API REQUEST ---
const apiRequest = async (path: string, method: string = 'GET', body?: any) => {
    if (!USE_REAL_API) return null;
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Workspace-Token': API_TOKEN,
                'X-Actor-Source': 'web'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        const text = await res.text();
        try {
            const json = JSON.parse(text);
            if (!res.ok) throw new Error(json.error || json.message || res.statusText);
            return json;
        } catch (e) {
            if (!res.ok) throw new Error(res.statusText);
            return { message: text };
        }
    } catch (e: any) {
        console.error("API Error:", e);
        throw e;
    }
};

// --- SYSTEM HEALTH ---

export const getSystemHealth = async () => {
    if (USE_REAL_API) {
        // Parallel fetch for DB health and Agent status
        const [health, agentStatus] = await Promise.all([
            apiRequest('/v1/health').catch(() => ({ status: 'error' })),
            apiRequest('/v1/agent/status').catch(() => ({ status: 'offline', online: false }))
        ]);

        return {
            status: health.status === 'ok' ? 'ok' : 'error',
            services: {
                database: health.db === 'up' ? 'connected' : 'disconnected',
                twilio: 'connected', // Assumed for now
                agent: {
                    status: agentStatus.status || 'offline',
                    label: agentStatus.label || 'Unknown',
                    lastSeen: agentStatus.lastHeartbeatAt
                }
            }
        };
    }
    // Mock Health
    return {
        status: 'ok',
        services: {
            database: 'connected',
            twilio: 'connected',
            agent: { status: 'active', label: 'OpenClaw (Sim)', lastSeen: Date.now() }
        }
    }
};


// --- READ OPERATIONS ---

export const getStats = async () => {
    if (USE_REAL_API) {
        const data = await apiRequest('/v1/status/recent');
        return data.stats;
    }
    // Mock
    return {
        activeCalls: mockCalls.length,
        activeConferences: mockConferences.length,
        pendingApprovals: mockApprovals.filter(a => a.status === ApprovalStatus.PENDING).length,
        smsToday: mockMessages.length + 12
    };
};

export const getCalls = async (): Promise<CallLeg[]> => {
    if (USE_REAL_API) {
        const data = await apiRequest('/v1/status/recent'); // Optimized to get all in one go or use /v1/calls
        return data.calls || [];
    }
    return [...mockCalls];
};

export const getConferences = async (): Promise<Conference[]> => {
    if (USE_REAL_API) {
        const data = await apiRequest('/v1/conferences');
        return data || [];
    }
    return [...mockConferences];
};

export const getMessages = async (): Promise<SmsMessage[]> => {
    if (USE_REAL_API) {
        return await apiRequest('/v1/sms/recent') || [];
    }
    return [...mockMessages];
};

export const getApprovals = async (): Promise<Approval[]> => {
    if (USE_REAL_API) {
        return await apiRequest('/v1/approvals/pending') || [];
    }
    return [...mockApprovals];
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
    if (USE_REAL_API) {
        return await apiRequest('/v1/audit/recent') || [];
    }
    return [...mockAuditLogs];
};

// --- WRITE OPERATIONS ---

export const executeHangup = async (callSid: string) => {
    if (USE_REAL_API) {
        console.warn("API Hangup endpoint not yet exposed in this version.");
        return;
    }
    mockCalls = mockCalls.filter(c => c.callSid !== callSid);
};

export const executeHold = async (callSid: string, onHold: boolean) => {
    if (USE_REAL_API) {
        console.warn("API Hold endpoint not yet exposed.");
        return;
    }
    console.log("Mock Hold", callSid, onHold);
};

export const executeSms = async (to: string, body: string) => {
    if (USE_REAL_API) {
        return await apiRequest('/v1/sms/send', 'POST', { to, body });
    }
    const msg = {
        id: Math.random().toString(),
        messageSid: 'SM_MOCK_' + Date.now(),
        direction: SmsDirection.OUTBOUND,
        status: SmsStatus.QUEUED,
        from: 'MOCK',
        to,
        body,
        sentAt: new Date().toISOString()
    } as SmsMessage;
    mockMessages.unshift(msg);
    return msg;
};

export const updateApproval = async (id: string, status: ApprovalStatus) => {
    if (USE_REAL_API) {
        const decision = status === ApprovalStatus.APPROVED ? 'approve' : 'deny';
        return await apiRequest(`/v1/approvals/${id}/decision`, 'POST', { decision });
    }
    const idx = mockApprovals.findIndex(a => a.id === id);
    if (idx !== -1) mockApprovals[idx].status = status;
};

// --- COMMAND PARSER (Browser Implementation of CLI) ---
// This allows the Web Terminal to mimic the CLI behavior by hitting the API directly

export const processCommand = async (cmdStr: string): Promise<{ output: any; status: 'success' | 'error' | 'pending' | 'system' }> => {
    if (!cmdStr.trim()) return { output: '', status: 'system' };

    const args = cmdStr.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(a => a.replace(/"/g, '')) || [];
    const base = args[0];
    const noun = args[1];
    const verb = args[2];

    if (base !== 'telecom') {
        return { output: 'Command not found. Try "telecom help".', status: 'error' };
    }

    try {
        if (noun === 'call') {
            if (verb === 'dial') {
                const to = args[3];
                const fromIdx = args.indexOf('--from');
                const from = fromIdx > -1 ? args[fromIdx + 1] : undefined;

                if (!to) throw new Error("Missing argument: <to>");

                if (USE_REAL_API) {
                    const res = await apiRequest('/v1/calls/dial', 'POST', { to, from });
                    return { output: JSON.stringify(res, null, 2), status: 'success' };
                } else {
                    return { output: "Simulated Call Initiated: CA_MOCK_123", status: 'success' };
                }
            }
            if (verb === 'merge') {
                const sidA = args[3];
                const sidB = args[4];
                if (!sidA || !sidB) throw new Error("Missing arguments: <sidA> <sidB>");

                if (USE_REAL_API) {
                    const res = await apiRequest('/v1/conferences/merge', 'POST', { callSidA: sidA, callSidB: sidB });
                    return { output: JSON.stringify(res, null, 2), status: 'success' };
                } else {
                    return { output: "Simulated Merge Requested", status: 'success' };
                }
            }
            if (verb === 'list') {
                if (USE_REAL_API) {
                    const res = await apiRequest('/v1/calls');
                    return { output: JSON.stringify(res, null, 2), status: 'success' };
                }
                return { output: JSON.stringify(mockCalls, null, 2), status: 'success' };
            }
        }

        if (noun === 'sms') {
            if (verb === 'send') {
                const to = args[3];
                // Handle message body which might be multiple args or quoted
                let body = args.slice(4).join(' ');
                if (!to || !body) throw new Error("Usage: telecom sms send <to> <message>");

                if (USE_REAL_API) {
                    const res = await apiRequest('/v1/sms/send', 'POST', { to, body });
                    return { output: JSON.stringify(res, null, 2), status: 'success' };
                }
                return { output: "Simulated SMS Queued", status: 'success' };
            }
        }

        if (noun === 'approvals') {
            if (verb === 'list') {
                if (USE_REAL_API) {
                    const res = await apiRequest('/v1/approvals/pending');
                    return { output: JSON.stringify(res, null, 2), status: 'success' };
                }
                return { output: JSON.stringify(mockApprovals, null, 2), status: 'success' };
            }
        }

        if (noun === 'approve') {
            const id = args[2];
            if (!id) throw new Error("Missing argument: <id>");
            if (USE_REAL_API) {
                const res = await apiRequest(`/v1/approvals/${id}/decision`, 'POST', { decision: 'approve' });
                return { output: JSON.stringify(res, null, 2), status: 'success' };
            }
            return { output: `Approved ${id} (Simulated)`, status: 'success' };
        }

        if (noun === 'deny') {
            const id = args[2];
            const reason = args[3]; // simplifed
            if (!id) throw new Error("Missing argument: <id>");
            if (USE_REAL_API) {
                const res = await apiRequest(`/v1/approvals/${id}/decision`, 'POST', { decision: 'deny', reason });
                return { output: JSON.stringify(res, null, 2), status: 'success' };
            }
            return { output: `Denied ${id} (Simulated)`, status: 'success' };
        }

        if (noun === 'status') {
            const stats = await getStats();
            return { output: JSON.stringify(stats, null, 2), status: 'success' };
        }

        if (noun === 'help') {
            return {
                output: `Available commands:
  telecom call dial <to> [--from <num>]
  telecom call merge <sidA> <sidB>
  telecom call list
  telecom sms send <to> <message>
  telecom approvals list
  telecom approve <id>
  telecom deny <id>
  telecom status`, status: 'system'
            };
        }

        return { output: `Unknown command: ${noun} ${verb || ''}`, status: 'error' };

    } catch (e: any) {
        return { output: e.message || 'Error processing command', status: 'error' };
    }
};