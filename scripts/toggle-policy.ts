import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find the 'Default' workspace
    const workspace = await prisma.workspace.findFirst({
        where: { name: 'Default' }
    });

    if (!workspace) {
        console.error('Workspace Default not found');
        return;
    }

    console.log('Current policies:', workspace.policies);

    // Update to require approval for call.dial
    await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
            policies: {
                requireApproval: ['call.dial', 'conference.merge'],
                allowedRegions: ['US', 'CA'],
                maxConcurrentCalls: 1
            }
        }
    });

    console.log('Updated policies to require approval for call.dial');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
