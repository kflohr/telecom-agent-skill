import { z } from 'zod';

// --- PRIMITIVES ---
export const E164Number = z.string().regex(/^\+[1-9]\d{1,14}$/, "Must be E.164 format (e.g. +14155550100)");
export const Sid = z.string().startsWith("CA").or(z.string().startsWith("SM")).or(z.string().startsWith("CF"));

// --- ACTION SCHEMAS ---

export const SmsSendSchema = z.object({
    to: E164Number,
    body: z.string().min(1).max(1600, "Message too long"),
    from: E164Number.optional(),
    requireApproval: z.boolean().optional().default(false)
});

export const CallDialSchema = z.object({
    to: E164Number,
    from: E164Number.optional(),
    label: z.string().optional(),
    requireApproval: z.boolean().optional().default(false)
});

export const ConferenceMergeSchema = z.object({
    callSidA: z.string().startsWith("CA"),
    callSidB: z.string().startsWith("CA"),
    friendlyName: z.string().optional(),
    requireApproval: z.boolean().optional().default(true) // Merges are risky, default to approval
});

export const ParticipantUpdateSchema = z.object({
    conferenceSid: z.string().startsWith("CF").optional(), // Optional if we infer from context
    participantSid: z.string().startsWith("PA").or(z.string().startsWith("CA")), // Can identify by CallSid
    muted: z.boolean().optional(),
    hold: z.boolean().optional()
});

export const ApprovalDecisionSchema = z.object({
    decision: z.enum(['approve', 'deny']),
    reason: z.string().optional()
});

// --- TYPES INFERRED FROM SCHEMAS ---
export type SmsSendRequest = z.infer<typeof SmsSendSchema>;
export type CallDialRequest = z.infer<typeof CallDialSchema>;
export type MergeCallRequest = z.infer<typeof ConferenceMergeSchema>;
export type ParticipantUpdateRequest = z.infer<typeof ParticipantUpdateSchema>;
