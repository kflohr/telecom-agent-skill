
import { Command } from 'commander';
import { request as api } from '../api.js';
import { Output } from '../output.js';

export const registerPolicyCommands = (program: Command) => {
    const policy = program.command('policy')
        .description('Manage workspace policies and configuration');

    policy.command('get')
        .description('Get current policy configuration')
        .action(async () => {
            const output = new Output(!!program.opts().human);
            try {
                const config = await api('GET', '/v1/policies');
                output.info('Current Policy Configuration:');
                console.log(JSON.stringify(config, null, 2));
            } catch (err: any) {
                output.error(`Failed to fetch policies: ${err.message}`);
            }
        });

    policy.command('set')
        .description('Update policy configuration')
        .option('--auto-approve <actions...>', 'Actions to auto-approve (removes from requireApproval)')
        .option('--require-approval <actions...>', 'Actions to require approval for')
        .option('--concurrency <limit>', 'Max concurrent calls')
        .action(async (options) => {
            const output = new Output(!!program.opts().human);
            try {
                const payload: any = {};

                if (options.autoApprove) payload.autoApprove = options.autoApprove;
                if (options.requireApproval) payload.requireApproval = options.requireApproval;
                if (options.concurrency) payload.maxConcurrentCalls = parseInt(options.concurrency, 10);

                if (Object.keys(payload).length === 0) {
                    output.warn('No options provided. Use --help to see available options.');
                    return;
                }

                const result = await api('PATCH', '/v1/policies', payload);
                output.success('Policy updated successfully.');
                console.log(JSON.stringify(result, null, 2));
            } catch (err: any) {
                output.error(`Failed to update policy: ${err.message}`);
            }
        });
};
