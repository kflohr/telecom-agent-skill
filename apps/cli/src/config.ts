import dotenv from 'dotenv';
import { z } from 'zod';
import chalk from 'chalk';
import { readConfig } from './lib/localConfig.js';

dotenv.config();

const ConfigSchema = z.object({
  TELECOM_API_URL: z.string().url().default('http://localhost:3000'),
  TELECOM_API_TOKEN: z.string().min(1, "API Token is required")
});

export const getConfig = (validate = true) => {
  const local: any = readConfig() || {};

  // Merge Env (High Priority) <- Local Config (Low Priority)
  const merged = {
    TELECOM_API_URL: process.env.TELECOM_API_URL || local.apiUrl,
    TELECOM_API_TOKEN: process.env.TELECOM_API_TOKEN || local.workspaceToken
  };

  const result = ConfigSchema.safeParse(merged);

  if (!validate) {
    // Return what we have, using defaults if possible
    return {
      TELECOM_API_URL: merged.TELECOM_API_URL || 'http://localhost:3000',
      TELECOM_API_TOKEN: merged.TELECOM_API_TOKEN || ''
    };
  }

  if (!result.success) {
    console.error(chalk.red('Configuration Error:'));
    result.error.issues.forEach(issue => {
      console.error(chalk.gray(`- ${issue.path.join('.')}: ${issue.message}`));
    });
    console.error(chalk.yellow('\nPlease run "telecom onboard" OR set TELECOM_API_URL and TELECOM_API_TOKEN in your environment.'));
    (process as any).exit(2);
  }

  return result.data;
};