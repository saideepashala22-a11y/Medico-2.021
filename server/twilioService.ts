import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const isConfigured = accountSid && authToken && twilioPhoneNumber;
const client = isConfigured ? twilio(accountSid, authToken) : null;

export async function sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
  if (!client || !isConfigured) {
    console.warn('Twilio not configured. OTP sending skipped. Would send OTP:', otp, 'to phone:', phoneNumber);
    return false;
  }

  try {
    const message = await client.messages.create({
      body: `Your Nakshatra Hospital password reset OTP is: ${otp}. This code will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    
    console.log(`OTP sent successfully. Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}