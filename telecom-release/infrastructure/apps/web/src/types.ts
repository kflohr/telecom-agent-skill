export enum CallState {
    QUEUED = 'queued',
    RINGING = 'ringing',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    BUSY = 'busy',
    NO_ANSWER = 'no-answer'
}

export enum ConferenceState {
    INIT = 'init',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed'
}

export enum SmsDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound-api',
    OUTBOUND_REPLY = 'outbound-reply'
}

export enum SmsStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    RECEIVED = 'received'
}

export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DENIED = 'denied',
    EXPIRED = 'expired'
}

export enum ActorSource {
    WEB = 'web',
    API = 'api',
    SYSTEM = 'system'
}

export interface CallLeg {
    id: string;
    callSid: string;
    direction: 'inbound' | 'outbound-api' | 'outbound-dial';
    from: string;
    to: string;
    state: CallState;
    startedAt?: string;
    duration?: number;
    price?: number;
}

export interface ConferenceParticipant {
    id: string;
    callSid: string;
    label: string;
    muted: boolean;
    joinedAt: string;
}

export interface Conference {
    id: string;
    friendlyName: string;
    sid: string;
    status: ConferenceState; // maps to state in UI
    state: ConferenceState;
    participants: ConferenceParticipant[];
    startedAt: string;
}

export interface SmsMessage {
    id: string;
    messageSid: string;
    direction: SmsDirection;
    status: SmsStatus;
    from: string;
    to: string;
    body: string;
    sentAt: string;
    price?: number;
}

export interface Approval {
    id: string;
    action: string;
    description: string;
    status: ApprovalStatus;
    requestedAt: string;
    expiresAt: string;
    data: any;
}

export interface AuditLog {
    id: string;
    action: string;
    actor: string;
    source: ActorSource;
    resource: string;
    timestamp: string;
    metadata?: any;
}

// Stats Interface
export interface DashboardStats {
    activeCalls: number;
    activeConferences: number;
    smsToday: number;
    pendingApprovals: number;
    isConfigured: boolean;
    isMock: boolean;
}
