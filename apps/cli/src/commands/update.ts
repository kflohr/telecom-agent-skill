
import { Command } from 'commander';
import chalk from 'chalk';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerUpdateCommand(program: Command) {
    program
        .command('update')
        .description('Update the CLI to the latest version')
        .action(async () => {
            console.log(chalk.blue('ℹ Checking for updates...'));

            // 1. Determine Repo Root
            // Compiled file is in apps/cli/dist/commands/update.js (approx)
            // We need to go up: commands -> dist -> cli -> apps -> root
            // So ../../../../

            // Let's verify by checking for package.json or turbo.json
            let repoRoot = path.resolve(__dirname, '../../../../');

            // Fallback validation: Look for turbo.json
            if (!fs.existsSync(path.join(repoRoot, 'turbo.json'))) {
                // Try one level deeper just in case structure differs in dist
                repoRoot = path.resolve(__dirname, '../../../../../');
                if (!fs.existsSync(path.join(repoRoot, 'turbo.json'))) {
                    console.error(chalk.red('✘ Could not find repository root. Are you running this from the built distribution?'));
                    return;
                }
            }

            console.log(chalk.gray(`📂 Repository Root: ${repoRoot}`));

            const run = (cmd: string, cwd: string, stepName: string): Promise<void> => {
                return new Promise((resolve, reject) => {
                    console.log(chalk.yellow(`➤ ${stepName}...`));
                    exec(cmd, { cwd }, (error, stdout, stderr) => {
                        if (error) {
                            console.error(chalk.red(`✖ ${stepName} Failed`));
                            console.error(stderr || stdout);
                            reject(error);
                            return;
                        }
                        console.log(chalk.green(`✔ ${stepName} Complete`));
                        resolve();
                    });
                });
            };

            try {
                // 2. Git Pull
                await run('git pull', repoRoot, 'Pulling latest changes');

                // 3. Install Dependencies
                await run('npm install', repoRoot, 'Installing dependencies');

                // 4. Build
                await run('npm run build', repoRoot, 'Building project');

                console.log(chalk.green('\n✨ Update Successful! Run "telecom --version" to verify.'));
            } catch (e: any) {
                console.error(chalk.red('\n💥 Update Failed. You may need to update manually.'));
            }
        });
}
