
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    // Simple argument parsing
    const nameArg = args.find(arg => arg.startsWith('--name='));
    const sidArg = args.find(arg => arg.startsWith('--sid='));
    const tokenArg = args.find(arg => arg.startsWith('--token='));

    const apiKeyArg = args.find(arg => arg.startsWith('--apiKey='));
    const apiSecretArg = args.find(arg => arg.startsWith('--apiSecret='));

    if (!nameArg || !sidArg || (!tokenArg && (!apiKeyArg || !apiSecretArg))) {
        console.error('Usage: npx tsx scripts/create-workspace.ts --name="MyAgent" --sid="AC..." --token="auth..."');
        console.error('   OR: npx tsx scripts/create-workspace.ts --name="MyAgent" --sid="AC..." --apiKey="SK..." --apiSecret="secret..."');
        process.exit(1);
    }

    const name = nameArg.split('=')[1];
    const accountSid = sidArg.split('=')[1];
    const authToken = tokenArg ? tokenArg.split('=')[1] : undefined;
    const twilioApiKey = apiKeyArg ? apiKeyArg.split('=')[1] : undefined;
    const twilioApiSecret = apiSecretArg ? apiSecretArg.split('=')[1] : undefined;

    if (!name || !accountSid || (!authToken && (!twilioApiKey || !twilioApiSecret))) {
        console.error('Error: Missing values for arguments.');
        process.exit(1);
    }

    // Generate a secure API key
    const generatedApiKey = `sk_${crypto.randomBytes(24).toString('hex')}`;

    console.log(`Creating workspace '${name}'...`);

    const providerConfig = authToken
        ? { twilio: { accountSid, authToken } }
        : { twilio: { accountSid, apiKey: twilioApiKey, apiSecret: twilioApiSecret } };

    try {
        const workspace = await prisma.workspace.create({
            data: {
                name,
                apiToken: generatedApiKey,
                providerConfig,
                policies: {
                    // Default policies for a new workspace
                    requireApproval: [], // No approvals required by default (yet)
                    allowedRegions: ['US', 'CA'], // Default to North America
                    maxConcurrentCalls: 1, // Safe default
                },
                settings: {
                    maxConcurrentCalls: 1,
                }
            },
        });

        console.log(`\n✅ Workspace Created Successfully!`);
        console.log(`----------------------------------------`);
        console.log(`Name:        ${workspace.name}`);
        console.log(`ID:          ${workspace.id}`);
        console.log(`API Key:     ${generatedApiKey}`);
        console.log(`----------------------------------------`);
        console.log(`\nNext Steps:`);
        console.log(`1. Export this key in your environment:`);
        console.log(`   export TELECOM_API_KEY=${generatedApiKey}`);
        console.log(`2. Use the CLI with this workspace context.`);

    } catch (error) {
        console.error('Error creating workspace:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
