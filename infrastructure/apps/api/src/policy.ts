import { Workspace, ApprovalStatus, ActorSource } from '@prisma/client';
import { prisma } from './db';

export interface WorkspacePolicies {
    requireApproval?: string[]; // e.g. ['call.dial', 'conference.merge', 'sms.send']
    allowedRegions?: string[];
    maxConcurrentCalls?: number;
}

export interface PolicyCheckResult {
    requiresApproval: boolean;
    approvalId?: string;
}

export class PolicyEngine {
    static async check(
        workspace: Workspace,
        action: string,
        payload: any,
        actorSource: ActorSource,
        actorLabel: string
    ): Promise<PolicyCheckResult> {
        const policies = workspace.policies as unknown as WorkspacePolicies;
        const requireApprovalList = policies?.requireApproval || [];

        // 1. Rate Limiting (Max Concurrent Calls)
        if (action === 'call.dial') {
            const settings = workspace.settings as any;
            const maxCalls = policies?.maxConcurrentCalls || settings?.maxConcurrentCalls || 1; // Prioritize policy config

            const currentCalls = await prisma.callLeg.count({
                where: {
                    workspaceId: workspace.id,
                    state: { in: ['initiated', 'ringing', 'in_progress'] }
                }
            });

            if (currentCalls >= maxCalls) {
                // Create an 'auto-denied' or 'pending' approval? 
                // For V1 Hardening, let's trigger an Approval Request so a human *could* override it, 
                // or just to let them know it was blocked.
                // Actually, contract says "Policy Violation", usually 429 or similar.
                // But to keep interface simple: we return requiresApproval = true.
                // The API will return 202 Pending Approval.

                const approval = await prisma.approval.create({
                    data: {
                        workspaceId: workspace.id,
                        status: ApprovalStatus.pending,
                        type: 'limit_exceeded',
                        actorSource,
                        actorLabel,
                        action,
                        payload: { ...payload, reason: `Max concurrent calls reached (${currentCalls}/${maxCalls})` }
                    }
                });

                return { requiresApproval: true, approvalId: approval.id };
            }
        }

        // 2. Permission Check (Specific Action Config)
        if (requireApprovalList.includes(action)) {
            // Create Approval Request
            const approval = await prisma.approval.create({
                data: {
                    workspaceId: workspace.id,
                    status: ApprovalStatus.pending,
                    type: action.replace('.', '_'), // e.g. call_dial
                    actorSource,
                    actorLabel,
                    action,
                    payload: payload
                }
            });

            return { requiresApproval: true, approvalId: approval.id };
        }

        // 2. Future: Check rate limits, allowed regions, etc.
        // For now, if no approval needed, return false
        return { requiresApproval: false };
    }
}
