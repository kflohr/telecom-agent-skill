// Enums matching Prisma Schema
// Note: Frontend uses UPPERCASE enum keys for convention, mapped to lowercase Prisma values where necessary in API layer

export enum ActorSource {
  TELEGRAM = 'telegram',
  CLI = 'cli',
  OPENCLAW = 'openclaw',
  SYSTEM = 'system',
  WEB = 'web'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
  EXPIRED = 'expired'
}

export enum ApprovalType {
  CALL_DIAL = 'call_dial',
  SMS_SEND = 'sms_send',
  CONFERENCE_MERGE = 'conference_merge',
  CONFERENCE_ADD_PARTICIPANT = 'conference_add_participant',
  PARTICIPANT_UPDATE = 'participant_update'
}

export enum CallState {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BUSY = 'busy',
  NO_ANSWER = 'no_answer',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export enum ConferenceState {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum SmsDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound'
}

export enum SmsStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  UNDELIVERED = 'undelivered',
  FAILED = 'failed',
  RECEIVED = 'received'
}

// Interfaces aligned with Prisma Models

export interface Workspace {
  id: string;
  name: string;
}

export interface CallLeg {
  id: string;
  workspaceId?: string; // Optional for UI-only views
  callSid: string;
  direction: 'inbound' | 'outbound-api' | string;
  from: string;
  to: string;
  label?: string;
  state: CallState;
  
  startedAt?: string;
  endedAt?: string;
  duration?: number; // seconds
  
  // UI helpers
  participants?: Participant[]; 
}

export interface Participant {
  id: string;
  participantSid: string;
  callSid: string;
  conferenceSid: string;
  
  muted: boolean;
  onHold: boolean;
  
  joinedAt: string;
  leftAt?: string;
}

export interface Conference {
  id: string;
  conferenceSid: string;
  friendlyName: string;
  state: ConferenceState;
  
  startedAt: string;
  endedAt?: string;
  
  participants: Participant[]; // Hydrated for UI
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
  deliveredAt?: string;
}

export interface Approval {
  id: string;
  status: ApprovalStatus;
  type: ApprovalType;
  
  actorSource: ActorSource;
  actorLabel: string;
  
  action: string; 
  payload: any; // Checked against Zod schemas in API
  
  createdAt: string;
  expiresAt?: string;
}

export interface AuditLog {
  id: string;
  actorSource: ActorSource;
  actorLabel: string;
  
  action: string;
  entityType: string;
  entityId: string;
  
  ok: boolean;
  error?: string;
  data: any;
  
  createdAt: string;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}
