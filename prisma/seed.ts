import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seed...');

  // 1. Ensure the Default Workspace exists
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { id: 'default' }
  });

  if (existingWorkspace) {
    console.log(`✅ Workspace already exists: ${existingWorkspace.name} (${existingWorkspace.id})`);
    console.log(`🔑 API Token: ${existingWorkspace.apiToken}`);
    return;
  }

  // 2. Create default Workspace
  const token = 'sk_' + randomBytes(16).toString('hex');
  const workspace = await prisma.workspace.create({
    data: {
      id: 'default',
      name: 'Production',
      apiToken: token,
      settings: {
        maxConcurrentCalls: 10,
        enforceApproval: true
      }
    }
  });

  console.log(`\n🎉 Genesis Complete!`);
  console.log(`---------------------------------------------------`);
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`API Token:    ${token}`);
  console.log(`---------------------------------------------------`);
  console.log(`⚠️  Copy this Token into your .env file as TELECOM_API_TOKEN`);
}

main()
  .catch((e) => {
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });