
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const token = 'sk_live_289347293847';
    console.log("Clearing config for token:", token);

    const updated = await prisma.workspace.update({
        where: { apiToken: token },
        data: { providerConfig: {} } // Clear it
    });

    console.log("Cleared! New Config:", JSON.stringify(updated.providerConfig));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
