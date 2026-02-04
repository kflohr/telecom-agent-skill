import { Workspace } from '@prisma/client';
import twilio from 'twilio';

// Lazy client that doesn't crash on import if env vars are missing
export const globalTwilioClient = new Proxy({}, {
  get: (_target, prop) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      const client = twilio(accountSid, authToken);
      return (client as any)[prop];
    }
    // Only throw if someone actually tries to USE the global client
    return () => { throw new Error("Twilio Credentials not configured in .env"); }
  }
}) as any;

export const getTwilioClient = (workspace?: Workspace) => {
  if (workspace && workspace.providerConfig) {
    const config = (workspace.providerConfig as any).twilio;
    if (config && config.accountSid && config.authToken) {
      return twilio(config.accountSid, config.authToken);
    }
  }

  // Fallback to global (env vars) if available
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    return twilio(accountSid, authToken);
  }

  return globalTwilioClient; // Will throw if used
};

export const TWILIO_NUMBER = process.env.TWILIO_NUMBER || '+15550000000';
