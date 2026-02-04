
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const token = 'sk_live_289347293847';
    console.log("Clearing config for token:", token);

    try {
        const updated = await prisma.workspace.update({
            where: { apiToken: token },
            data: { providerConfig: {} }
        });
        console.log("SUCCESS: Configuration cleared for workspace:", updated.id);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
