import { Command } from 'commander';
import { z } from 'zod';
import chalk from 'chalk';
import { request } from '../http.js';
import { Output } from '../output.js';
import { CallDialSchema } from '../lib/schemas.js';

export function registerAgentCommands(program: Command) {
    const agent = program.command('agent').description('Autonomous Agent operations');
    const output = new Output(program.opts().human);

    agent.command('call')
        .description('Initiate an autonomous agent call')
        .argument('<to>', 'Destination E.164')
        .option('--intro <text>', 'Text-to-Speech Intro Message', 'Hello. I am an AI agent calling on behalf of my user.')
        .option('--from <number>', 'Caller ID')
        .action(async (to, opts) => {
            try {
                // Construct payload using shared schema
                const payload = CallDialSchema.parse({
                    to,
                    from: opts.from,
                    introMessage: opts.intro,
                    record: true,        // Enforce recording for agents
                    transcribe: true     // Enforce transcription for agents
                });

                console.log(chalk.blue(`🤖 Agent actuating... Dialing ${to}`));
                const res = await request('POST', '/v1/calls/dial', payload);

                if (program.opts().human) {
                    console.log(chalk.green('✔ Agent Call Dispatched'));
                    console.log(`SID: ${chalk.bold(res.callId)}`);
                    console.log(chalk.gray('The agent will speak: "' + opts.intro + '"'));
                } else {
                    output.log(res);
                }

            } catch (err: any) {
                if (err instanceof z.ZodError) {
                    console.error(chalk.red('Validation Error:'));
                    console.error(err.errors);
                } else {
                    console.error(chalk.red(err.message || 'Error executing agent command'));
                }
                process.exit(1);
            }
        });

    agent.command('memory')
        .description('Retrieve agent memory (transcripts) for a call')
        .argument('<sid>', 'Call SID')
        .action(async (sid) => {
            try {
                const res: any = await request('GET', `/v1/calls/${sid}/transcript`);

                if (program.opts().human) {
                    if (!res.text) {
                        console.log(chalk.yellow('⏳ Memory forming... (Transcription processing or empty)'));
                    } else {
                        console.log(chalk.bold.blue('🧠 Agent Memory Retrieved:'));
                        console.log(chalk.white(res.text));
                        if (res.confidence) console.log(chalk.gray(`(Confidence: ${res.confidence})`));
                    }
                } else {
                    output.log(res);
                }
            } catch (err: any) {
                console.error(chalk.red(err.message));
                process.exit(1);
            }
        });
}
