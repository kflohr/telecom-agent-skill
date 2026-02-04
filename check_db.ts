require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const workspaces = await prisma.workspace.findMany();
    console.log("Workspaces found:", workspaces.length);
    for (const w of workspaces) {
        console.log(`Workspace ${w.name} (${w.id}):`);
        console.log("  ProviderConfig:", JSON.stringify(w.providerConfig, null, 2));
    }
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
