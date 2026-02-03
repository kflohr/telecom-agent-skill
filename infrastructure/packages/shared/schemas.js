"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalDecisionSchema = exports.ParticipantUpdateSchema = exports.ConferenceMergeSchema = exports.CallDialSchema = exports.SmsSendSchema = exports.Sid = exports.E164Number = void 0;
const zod_1 = require("zod");
// --- PRIMITIVES ---
exports.E164Number = zod_1.z.string().regex(/^\+[1-9]\d{1,14}$/, "Must be E.164 format (e.g. +14155550100)");
exports.Sid = zod_1.z.string().startsWith("CA").or(zod_1.z.string().startsWith("SM")).or(zod_1.z.string().startsWith("CF"));
// --- ACTION SCHEMAS ---
exports.SmsSendSchema = zod_1.z.object({
    to: exports.E164Number,
    body: zod_1.z.string().min(1).max(1600, "Message too long"),
    from: exports.E164Number.optional(),
    requireApproval: zod_1.z.boolean().optional().default(false)
});
exports.CallDialSchema = zod_1.z.object({
    to: exports.E164Number,
    from: exports.E164Number.optional(),
    label: zod_1.z.string().optional(),
    requireApproval: zod_1.z.boolean().optional().default(false)
});
exports.ConferenceMergeSchema = zod_1.z.object({
    callSidA: zod_1.z.string().startsWith("CA"),
    callSidB: zod_1.z.string().startsWith("CA"),
    friendlyName: zod_1.z.string().optional(),
    requireApproval: zod_1.z.boolean().optional().default(true) // Merges are risky, default to approval
});
exports.ParticipantUpdateSchema = zod_1.z.object({
    conferenceSid: zod_1.z.string().startsWith("CF").optional(), // Optional if we infer from context
    participantSid: zod_1.z.string().startsWith("PA").or(zod_1.z.string().startsWith("CA")), // Can identify by CallSid
    muted: zod_1.z.boolean().optional(),
    hold: zod_1.z.boolean().optional()
});
exports.ApprovalDecisionSchema = zod_1.z.object({
    decision: zod_1.z.enum(['approve', 'deny']),
    reason: zod_1.z.string().optional()
});
