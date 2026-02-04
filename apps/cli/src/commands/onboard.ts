import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { readConfig, writeConfig, configPath } from '../lib/localConfig.js';
import { isInteractive } from '../lib/prompt.js';
// Use node-fetch for API calls (native in recent Node, but let's ensure type safety)
// Using untyped helper for now to keep it simple, or reuse existing client if available.
import { getConfig } from '../config.js';

// Simple fetch wrapper
async function apiCall(method: string, url: string, body?: any, token?: string) {
    const target = url; // Caller constructs full URL
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['x-workspace-token'] = token;

    const res = await fetch(target, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { }
        throw new Error(json?.error || res.statusText);
    }
    return res.json();
}

export function registerOnboard(program: Command) {
    program
        .command('onboard')
        .description('Interactive setup wizard')
        .option('--api <url>', 'API URL', 'https://telop.dev')
        .option('--name <name>', 'Workspace Name')
        .option('--sid <sid>', 'Twilio Account SID')
        .option('--token <token>', 'Twilio Auth Token')
        .option('--from <number>', 'Twilio From Number')
        .option('--reset', 'Reset configuration and create new workspace')
        .action(async (options) => {
            console.log(chalk.bold.blue('\n📡 Telecom Control Plane: Setup Wizard\n'));

            // Check moved to individual steps to allow partial flag usage
            // if (!isInteractive()) { ... }

            const existing = readConfig();
            const apiUrl = options.api || existing?.apiUrl || 'https://telop.dev';

            let workspaceToken = existing?.workspaceToken;
            let workspaceId = existing?.workspaceId;

            // Ensure config is updated if API URL flag is provided
            if (options.api && options.api !== existing?.apiUrl) {
                writeConfig({
                    apiUrl: options.api,
                    workspaceToken,
                    workspaceId
                });
                console.log(chalk.green(`✓ Updated API URL to ${options.api}`));
            }

            if (options.reset) {
                workspaceToken = undefined;
                workspaceId = undefined;
                console.log(chalk.yellow('ℹ Unsetting existing configuration (Force Reset)'));
            }

            // STEP 1: CREATE WORKSPACE
            if (!workspaceToken) {
                let name = options.name;
                if (!name) {
                    if (!isInteractive()) {
                        console.error('Error: --name is required in non-interactive mode.');
                        process.exit(1);
                    }
                    const answer = await inquirer.prompt([{
                        type: 'input',
                        name: 'name',
                        message: 'Name your workspace:',
                        default: 'My Ops Workspace'
                    }]);
                    name = answer.name;
                }

                const spinner = ora('Creating workspace...').start();
                try {
                    const res: any = await apiCall('POST', `${apiUrl}/v1/provision`, { name });
                    workspaceToken = res.apiToken;
                    workspaceId = res.workspaceId;

                    writeConfig({ apiUrl, workspaceToken, workspaceId });
                    spinner.succeed(`Workspace '${res.name}' created!`);
                    console.log(chalk.gray(`   Key saved to ${configPath()}`));
                } catch (e: any) {
                    spinner.fail(`Failed to create workspace: ${e.message}`);
                    process.exit(1);
                }
            } else {
                console.log(chalk.green('✓ Using existing workspace config'));
            }

            // STEP 2: CONNECT TWILIO
            console.log(chalk.yellow('\nStep 2: Connect Twilio Provider'));

            let sid = options.sid;
            let token = options.token;
            let from = options.from;

            if (!sid || !token || !from) {
                if (!isInteractive()) {
                    console.error('Error: --sid, --token, and --from are required in non-interactive mode (or via config).');
                    process.exit(1);
                }
                console.log(chalk.gray('Enter your Twilio credentials to enable calls & SMS.'));
                const creds = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'sid',
                        message: 'Account SID:',
                        default: sid,
                        validate: (input) => input.startsWith('AC') ? true : 'Must start with AC',
                        when: !sid
                    },
                    {
                        type: 'password',
                        name: 'token',
                        message: 'Auth Token:',
                        default: token,
                        when: !token
                    },
                    {
                        type: 'input',
                        name: 'from',
                        message: 'Default From Number:',
                        default: from || '+1',
                        when: !from
                    }
                ]);
                if (!sid) sid = creds.sid;
                if (!token) token = creds.token;
                if (!from) from = creds.from;
            }

            const spinner2 = ora('Verifying & Connecting...').start();
            try {
                await apiCall(
                    'POST',
                    `${apiUrl}/v1/setup/provider`,
                    { accountSid: sid, authToken: token, fromNumber: from },
                    workspaceToken
                );
                spinner2.succeed('Twilio connected successfully!');
            } catch (e: any) {
                spinner2.fail(`Connection failed: ${e.message}`);
                console.log(chalk.red('Check your credentials and try again.'));
                process.exit(1);
            }

            // STEP 3: TEST CALL
            console.log(chalk.yellow('\nStep 3: Verification'));
            const { testCall } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'testCall',
                    message: 'Place a test call to verify everything works?',
                    default: true
                }
            ]);

            if (testCall) {
                const { dest } = await inquirer.prompt([
                    { type: 'input', name: 'dest', message: 'Enter phone number to call:' }
                ]);

                const spinner3 = ora('Placing call...').start();
                try {
                    const res: any = await apiCall('POST', `${apiUrl}/v1/calls/dial`, { to: dest }, workspaceToken);

                    // Check for Approval (202)
                    if (res.status === 'pending_approval') {
                        spinner3.info('Call pending approval!');
                        console.log(chalk.yellow(`   Approval ID: ${res.approvalId}`));
                        console.log(chalk.gray('   Use the dashboard or CLI to approve this action.'));
                    } else {
                        spinner3.succeed('Call Initiated!');
                        console.log(chalk.green(`   Call SID: ${res.callId}`));
                        console.log(chalk.gray('   Your phone should ring shortly.'));
                    }

                } catch (e: any) {
                    spinner3.fail(`Test call failed: ${e.message}`);
                }
            }

            // STEP 4: FUN MODE TEASER
            if (testCall) {
                console.log(chalk.magenta('\nStep 4: Have some fun? 🎭'));
                const { tryFun } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'tryFun',
                    message: 'Want to try "Fun Mode"? I can call you as your AI Assistant.',
                    default: true
                }]);

                if (tryFun) {
                    const { identity, funType, dest } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'dest',
                            message: 'Number to call:',
                        },
                        {
                            type: 'list',
                            name: 'funType',
                            message: 'Select audio payload:',
                            choices: ['rickroll', 'saxoroll', 'nyan'],
                            default: 'rickroll'
                        },
                        {
                            type: 'input',
                            name: 'identity',
                            message: 'Who should I say I am?',
                            default: 'Your Loyal AI Assistant'
                        }
                    ]);

                    const spinner4 = ora('Dispatching Fun Mode...').start();
                    try {
                        const res: any = await apiCall('POST', `${apiUrl}/v1/test/audio`, {
                            to: dest,
                            type: funType,
                            identity: identity
                        }, workspaceToken);

                        spinner4.succeed('Call Dispatched! Enjoy the show. 🎵');
                    } catch (e: any) {
                        spinner4.fail(`Fun mode failed: ${e.message}`);
                    }
                }
            }

            console.log(chalk.bold.green('\n✅ Setup Complete!'));
            console.log(`Run 'export TELECOM_API_TOKEN=${workspaceToken}' to use the CLI normally.`);

            console.log(chalk.blue('\n🚀 Pro Tip: Bulk Calling'));
            console.log(chalk.gray('Need to call a list of leads safely?'));
            console.log(`Run: ${chalk.bold('telecom campaign create "My List" --file leads.csv')}`);
        });
}
