import dotenv from 'dotenv';
import { z } from 'zod';
import chalk from 'chalk';

dotenv.config();

const ConfigSchema = z.object({
  TELECOM_API_URL: z.string().url().default('http://localhost:3000'),
  TELECOM_API_TOKEN: z.string().min(1, "API Token is required")
});

export const getConfig = () => {
  const result = ConfigSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error(chalk.red('Configuration Error:'));
    result.error.issues.forEach(issue => {
      console.error(chalk.gray(`- ${issue.path.join('.')}: ${issue.message}`));
    });
    console.error(chalk.yellow('\nPlease set TELECOM_API_URL and TELECOM_API_TOKEN in your environment.'));
    (process as any).exit(2); // Validation error code
  }
  
  return result.data;
};