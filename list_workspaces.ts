
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workspaces = await prisma.workspace.findMany();
    console.log('Workspaces found:', workspaces.length);
    workspaces.forEach(w => {
        console.log(`ID: ${w.id}, Token: ${w.apiToken}, Config:`, JSON.stringify(w.providerConfig));
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
