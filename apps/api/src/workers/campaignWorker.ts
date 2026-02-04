import { prisma } from '../db';
import twilio from 'twilio';

const POLLING_INTERVAL = 2000; // 2 seconds (0.5 CPS)

export class CampaignWorker {
    private isRunning = false;
    private timeout: NodeJS.Timeout | null = null;

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('👷 Campaign Worker Started');
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.timeout) clearTimeout(this.timeout);
        console.log('👷 Campaign Worker Stopped');
    }

    private async loop() {
        if (!this.isRunning) return;

        try {
            await this.processNext();
        } catch (err) {
            console.error('Worker Error:', err);
        }

        // Schedule next run ONLY after current one finishes
        if (this.isRunning) {
            this.timeout = setTimeout(() => this.loop(), POLLING_INTERVAL);
        }
    }

    private async processNext() {
        // 1. Find ONE pending item from an ACTIVE campaign
        const item = await prisma.campaignItem.findFirst({
            where: {
                status: 'pending',
                campaign: {
                    status: 'active'
                }
            },
            include: {
                campaign: true
            },
            orderBy: { createdAt: 'asc' } // FIFO
        });

        if (!item) return; // Queue empty

        console.log(`👷 Processing Item ${item.id} for ${item.to}`);

        // 2. Get Workspace Config
        const workspace = await prisma.workspace.findUnique({
            where: { id: item.campaign.workspaceId }
        });

        const config = workspace?.providerConfig as any;
        const accountSid = config?.twilio?.accountSid;
        const authToken = config?.twilio?.authToken;
        const fromNumber = config?.twilio?.phoneNumber || config?.twilio?.fromNumber;

        if (!accountSid || !authToken || !fromNumber) {
            await prisma.campaignItem.update({
                where: { id: item.id },
                data: { status: 'failed', error: 'Twilio not configured' }
            });
            return;
        }

        // 3. Dispatch Call
        const client = twilio(accountSid, authToken);

        try {
            const call = await client.calls.create({
                from: fromNumber,
                to: item.to,
                url: 'http://demo.twilio.com/docs/voice.xml', // Future: Dynamic TwiML
                statusCallback: `https://telop.dev/webhooks/twilio/voice/status`,
                statusCallbackMethod: 'POST'
            });

            // 4. Update Success
            await prisma.campaignItem.update({
                where: { id: item.id },
                data: {
                    status: 'initiated',
                    callSid: call.sid,
                    attempts: { increment: 1 }
                }
            });
            console.log(`✅ Dispatched ${call.sid}`);

        } catch (e: any) {
            console.error(`❌ Call Failed: ${e.message}`);
            await prisma.campaignItem.update({
                where: { id: item.id },
                data: {
                    status: 'failed',
                    error: e.message,
                    attempts: { increment: 1 }
                }
            });
        }
    }
}

export const campaignWorker = new CampaignWorker();
