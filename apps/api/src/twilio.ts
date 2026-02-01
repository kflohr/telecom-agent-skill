import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.warn("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. API actions will fail.");
}

export const twilioClient = twilio(accountSid, authToken);
export const TWILIO_NUMBER = process.env.TWILIO_NUMBER || '+15550000000';
