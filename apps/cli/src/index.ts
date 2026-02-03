#!/usr/bin/env -S node --no-warnings

import { Command } from 'commander';
import { z } from 'zod';
import chalk from 'chalk';
import { request } from './http.js';
import { Output } from './output.js';
// Using local schemas copy for self-contained packaging
import { CallDialSchema, SmsSendSchema, ConferenceMergeSchema } from './lib/schemas.js';

import { registerOnboard } from './commands/onboard.js';
import { registerPolicyCommands } from './commands/policy.js';
import { registerAgentCommands } from './commands/agent.js';

const program = new Command();
registerOnboard(program);
registerPolicyCommands(program);
registerAgentCommands(program);
let output: Output;

program
  .name('telecom')
  .description('Telecom-as-Code Operator CLI')
  .version('1.1.0')
  .option('--human', 'Output human readable text instead of JSON')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    output = new Output(!!opts.human);
  });

const handleError = (err: any) => {
  if (output) output.error(err);
  else console.error(JSON.stringify(err));

  if (err instanceof z.ZodError) (process as any).exit(2);
  (process as any).exit(err.exitCode || 1);
};

// --- CALL COMMANDS ---
const call = program.command('call').description('Voice operations');

call.command('dial')
  .description('Initiate outbound call')
  .argument('<to>', 'Destination E.164')
  .option('-f, --from <number>', 'Caller ID')
  .option('--record', 'Record the call')
  .option('--transcribe', 'Transcribe the call (implies --record)')
  .action(async (to, opts) => {
    try {
      const payload = CallDialSchema.parse({
        to,
        from: opts.from,
        record: opts.record || opts.transcribe,
        transcribe: opts.transcribe
      });
      const res = await request('POST', '/v1/calls/dial', payload);

      if (opts.human || program.opts().human) {
        console.log(chalk.green('✔ Call Initiated'));
        console.log(`SID: ${chalk.bold(res.callId)}`);
      } else {
        output.log(res);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        handleError({ message: 'Validation Error', code: 'VALIDATION_ERROR', details: err.errors, exitCode: 2 });
      } else {
        handleError(err);
      }
    }
  });

call.command('hangup')
  .description('Terminate a call')
  .argument('<sid>', 'Call SID to hang up')
  .action(async (sid) => {
    try {
      const res = await request('POST', `/v1/calls/${sid}/release`);
      if (program.opts().human) {
        console.log(chalk.yellow(`✔ Call ${sid} released`));
      } else {
        output.log(res);
      }
    } catch (err) { handleError(err); }
  });

call.command('merge')
  .description('Merge two calls')
  .argument('<callSidA>')
  .argument('<callSidB>')
  .action(async (callSidA, callSidB, opts) => {
    try {
      const payload = ConferenceMergeSchema.parse({ callSidA, callSidB });
      const res = await request('POST', '/v1/conferences/merge', payload);

      if (opts.human || program.opts().human) {
        console.log(chalk.green('✔ Merge Requested'));
        console.log(`Conference: ${chalk.bold(res.friendlyName)}`);
      } else {
        output.log(res);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        handleError({ message: 'Validation Error', code: 'VALIDATION_ERROR', details: err.errors, exitCode: 2 });
      } else {
        handleError(err);
      }
    }
  });

call.command('list')
  .description('List active calls')
  .action(async () => {
    try {
      const res = await request('GET', '/v1/calls');
      if (program.opts().human) {
        if (res.length === 0) console.log(chalk.gray('No active calls.'));
        else output.table(['SID', 'Status', 'From', 'To'], res.map((c: any) => [c.callSid, c.state, c.from, c.to]));
      } else {
        output.log(res);
      }
    } catch (err) { handleError(err); }
  });

// --- SMS COMMANDS ---
const sms = program.command('sms').description('Messaging operations');

sms.command('send')
  .description('Send SMS')
  .argument('<to>')
  .argument('<message>')
  .action(async (to, message) => {
    try {
      const payload = SmsSendSchema.parse({ to, body: message });
      const res = await request('POST', '/v1/sms/send', payload);

      if (program.opts().human) {
        console.log(chalk.green('✔ SMS Queued'));
        console.log(`SID: ${chalk.bold(res.messageSid)}`);
      } else {
        output.log(res);
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        handleError({ message: 'Validation Error', code: 'VALIDATION_ERROR', details: err.errors, exitCode: 2 });
      } else {
        handleError(err);
      }
    }
  });

// --- APPROVALS COMMANDS ---
const approvals = program.command('approvals').description('Approval queue');

approvals.command('list')
  .description('List pending approvals')
  .action(async () => {
    try {
      const res = await request('GET', '/v1/approvals/pending');
      if (program.opts().human) {
        if (res.length === 0) console.log(chalk.gray('No pending approvals.'));
        else output.table(['ID', 'Type', 'Action'], res.map((a: any) => [a.id, a.type, a.action]));
      } else {
        output.log(res);
      }
    } catch (err) { handleError(err); }
  });

// --- ROOT COMMANDS ---
program.command('approve')
  .description('Approve a request')
  .argument('<id>')
  .action(async (id) => {
    try {
      const res = await request('POST', `/v1/approvals/${id}/decision`, { decision: 'approve' });
      if (program.opts().human) console.log(chalk.green(`✔ Approved ${id}`));
      else output.log(res);
    } catch (err) { handleError(err); }
  });

program.command('deny')
  .description('Deny a request')
  .argument('<id>')
  .argument('[reason]')
  .action(async (id, reason) => {
    try {
      const res = await request('POST', `/v1/approvals/${id}/decision`, { decision: 'deny', reason });
      if (program.opts().human) console.log(chalk.red(`✖ Denied ${id}`));
      else output.log(res);
    } catch (err) { handleError(err); }
  });

// --- CONFERENCES COMMANDS ---
const confs = program.command('confs').description('Conference operations');

confs.command('list')
  .description('List active conferences')
  .action(async () => {
    try {
      const res = await request('GET', '/v1/conferences');
      if (program.opts().human) {
        if (res.length === 0) console.log(chalk.gray('No active conferences.'));
        else output.table(['SID', 'Friendly Name', 'State'], res.map((c: any) => [c.conferenceSid, c.friendlyName, c.state]));
      } else {
        output.log(res);
      }
    } catch (err) { handleError(err); }
  });

// --- ALIASES ---
program.command('merge')
  .argument('<callSidA>')
  .argument('<callSidB>')
  .action(async (a, b) => {
    // Re-invoke the sub-command logic directly or via emit, but simpler to just call logic
    // Duplicating logic here for simplicity in single-file strictness
    try {
      const payload = ConferenceMergeSchema.parse({ callSidA: a, callSidB: b });
      const res = await request('POST', '/v1/conferences/merge', payload);
      if (program.opts().human) {
        console.log(chalk.green('✔ Merge Requested'));
        console.log(`Conference: ${chalk.bold(res.friendlyName)}`);
      } else output.log(res);
    } catch (err: any) {
      if (err instanceof z.ZodError) handleError({ message: 'Validation Error', code: 'VALIDATION_ERROR', details: err.errors, exitCode: 2 });
      else handleError(err);
    }
  });

program.parse();