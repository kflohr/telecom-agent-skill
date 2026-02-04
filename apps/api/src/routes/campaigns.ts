import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { AuthenticatedRequest, PRE_HANDLER_AUTH } from '../server';

export async function campaignRoutes(server: FastifyInstance) {

    // Create Campaign
    server.post('/v1/campaigns', { preHandler: PRE_HANDLER_AUTH }, async (req, reply) => {
        const request = req as AuthenticatedRequest;
        const { name } = req.body as { name: string };

        if (!name) return reply.code(400).send({ error: "Name is required" });

        const campaign = await prisma.campaign.create({
            data: {
                name,
                workspaceId: request.workspaceId
            }
        });

        return campaign;
    });

    // Add Items (Batch)
    server.post('/v1/campaigns/:id/items', { preHandler: PRE_HANDLER_AUTH }, async (req, reply) => {
        const request = req as AuthenticatedRequest;
        const { id } = req.params as { id: string };
        const { items } = req.body as { items: { to: string }[] };

        if (!items || !Array.isArray(items)) return reply.code(400).send({ error: "Items array is required" });

        // Verify ownership
        const campaign = await prisma.campaign.findUnique({ where: { id } });
        if (!campaign || campaign.workspaceId !== request.workspaceId) {
            return reply.code(404).send({ error: "Campaign not found" });
        }

        // Batch create
        const created = await prisma.campaignItem.createMany({
            data: items.map(item => ({
                campaignId: id,
                to: item.to,
                status: 'pending'
            }))
        });

        return { count: created.count, message: "Items added to queue" };
    });

    // List Campaigns
    server.get('/v1/campaigns', { preHandler: PRE_HANDLER_AUTH }, async (req, reply) => {
        const request = req as AuthenticatedRequest;

        const campaigns = await prisma.campaign.findMany({
            where: { workspaceId: request.workspaceId },
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return campaigns.map(c => ({
            ...c,
            totalItems: c._count.items
        }));
    });

    // Get Status (with progress)
    server.get('/v1/campaigns/:id', { preHandler: PRE_HANDLER_AUTH }, async (req, reply) => {
        const request = req as AuthenticatedRequest;
        const { id } = req.params as { id: string };

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { items: true }
                }
            }
        });

        if (!campaign || campaign.workspaceId !== request.workspaceId) {
            return reply.code(404).send({ error: "Campaign not found" });
        }

        // Get count of completed
        const completed = await prisma.campaignItem.count({
            where: { campaignId: id, status: { in: ['completed', 'failed', 'initiated'] } }
        });

        const pending = await prisma.campaignItem.count({
            where: { campaignId: id, status: 'pending' }
        });

        return {
            ...campaign,
            progress: {
                total: campaign._count.items,
                completed,
                pending,
                percentage: campaign._count.items > 0 ? Math.round((completed / campaign._count.items) * 100) : 0
            }
        };
    });

    // Pause/Resume
    server.post('/v1/campaigns/:id/status', { preHandler: PRE_HANDLER_AUTH }, async (req, reply) => {
        const request = req as AuthenticatedRequest;
        const { id } = req.params as { id: string };
        const { status } = req.body as { status: 'active' | 'paused' };

        if (!['active', 'paused'].includes(status)) return reply.code(400).send({ error: "Invalid status" });

        const campaign = await prisma.campaign.findUnique({ where: { id } });
        if (!campaign || campaign.workspaceId !== request.workspaceId) {
            return reply.code(404).send({ error: "Campaign not found" });
        }

        const updated = await prisma.campaign.update({
            where: { id },
            data: { status }
        });

        return updated;
    });
}
