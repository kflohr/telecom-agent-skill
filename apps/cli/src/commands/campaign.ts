
import { Command } from 'commander';
import { request } from '../http.js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { z } from 'zod';

// Simple CSV Parser (robust enough for name,phone)
function parseCsv(filePath: string): { to: string }[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/); // Handle Windows line endings
    const items: { to: string }[] = [];

    // Auto-detect header
    const hasHeader = lines[0]?.toLowerCase().includes('phone');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, but could use a library for quoted fields in future
        const parts = line.split(',');

        // Strategy: Look for the part that looks like a phone number
        // Support: +1234567890, 1234567890, (123) 456-7890
        const phonePart = parts.find(p => p.replace(/\D/g, '').length >= 10);

        if (phonePart) {
            // Clean number
            let clean = phonePart.replace(/\D/g, '');
            if (clean.length === 10) clean = '1' + clean; // Add US country code default
            items.push({ to: '+' + clean });
        }
    }
    return items;
}

export function registerCampaignCommands(program: Command) {
    const campaign = program.command('campaign')
        .description('Bulk calling operations');

    campaign.command('create')
        .argument('<name>', 'Campaign Name')
        .requiredOption('-f, --file <path>', 'Path to CSV file (must contain phone numbers)')
        .action(async (name, opts) => {
            const spinner = ora('Reading file...').start();
            try {
                // 1. Parse File
                if (!fs.existsSync(opts.file)) {
                    spinner.fail(`File not found: ${opts.file}`);
                    return;
                }

                const items = parseCsv(opts.file);
                if (items.length === 0) {
                    spinner.fail('No valid phone numbers found in file. Ensure columns have 10+ digit numbers.');
                    return;
                }

                spinner.text = `Found ${items.length} contacts. Creating campaign '${name}'...`;

                // 2. Create Campaign
                const campRes = await request('POST', '/v1/campaigns', { name });
                const campaignId = campRes.id;

                // 3. Upload Items
                spinner.text = 'Uploading queue items...';
                const itemRes = await request('POST', `/v1/campaigns/${campaignId}/items`, { items });

                spinner.succeed(chalk.green('Campaign Started! 🚀'));
                console.log(`\nID: ${chalk.bold(campaignId)}`);
                console.log(`Queue: ${itemRes.count} items loaded.`);
                console.log(chalk.gray(`Rate Limit: ~30 calls/minute (Safe Mode)`));
                console.log(`Monitor: Run 'telecom campaign status ${campaignId}'`);

            } catch (error: any) {
                spinner.fail(`Failed: ${error.message}`);
            }
        });

    campaign.command('status')
        .argument('<id>', 'Campaign ID')
        .option('--json', 'Output raw JSON for agents')
        .action(async (id, opts) => {
            try {
                const res = await request('GET', `/v1/campaigns/${id}`);

                if (opts.json) {
                    console.log(JSON.stringify(res, null, 2));
                    return;
                }

                console.log(chalk.bold(`\nCampaign: ${res.name}`));
                console.log(`Status: ${res.status.toUpperCase()}`);

                const p = res.progress;
                const bars = Math.floor(p.percentage / 5);
                const empty = 20 - bars;
                const barStr = '█'.repeat(bars) + '░'.repeat(empty);

                console.log(`\nProgress: [${chalk.green(barStr)}] ${p.percentage}%`);
                console.log(`Completed: ${p.completed} / ${p.total}`);
                console.log(`Pending:   ${p.pending}`);

                if (p.pending > 0) {
                    const estSeconds = p.pending * 2; // 2 sec/call
                    const estMinutes = Math.ceil(estSeconds / 60);
                    console.log(chalk.blue(`\n⏱️  Est. Remaining: ~${estMinutes} mins`));
                }

                if (res.status === 'completed') {
                    console.log(chalk.green('\n✅ All Done!'));
                }

            } catch (err: any) {
                if (opts.json) {
                    console.error(JSON.stringify({ error: err.message }));
                } else {
                    console.error(chalk.red(err.message));
                }
            }
        });

    campaign.command('list')
        .option('--json', 'Output raw JSON for agents')
        .action(async (opts) => {
            try {
                const list = await request('GET', '/v1/campaigns');

                if (opts.json) {
                    console.log(JSON.stringify(list, null, 2));
                    return;
                }

                if (list.length === 0) {
                    console.log('No campaigns found.');
                    return;
                }
                console.table(list.map((c: any) => ({
                    ID: c.id,
                    Name: c.name,
                    Status: c.status,
                    Items: c.totalItems,
                    Created: new Date(c.createdAt).toLocaleDateString()
                })));
            } catch (err: any) {
                if (opts.json) {
                    console.error(JSON.stringify({ error: err.message }));
                } else {
                    console.error(chalk.red(err.message));
                }
            }
        });
}
