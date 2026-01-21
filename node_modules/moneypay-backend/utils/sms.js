import twilio from 'twilio';

let client = null;

const getTwilioClient = () => {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.warn('Twilio credentials not set. SMS will be disabled.');
    return null;
  }
  client = twilio(sid, token);
  return client;
};

export const sendSMS = async (phoneNumber, message) => {
  try {
    const cli = getTwilioClient();
    if (!cli) {
      console.warn('Skipping SMS send - Twilio not configured');
      return null;
    }
    const result = await cli.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return result;
  } catch (error) {
    console.error('SMS Error:', error);
    // Don't throw - just log the error to prevent SMS failures from breaking the app
    return null;
  }
};

export const sendVerificationCode = async (phoneNumber, code) => {
  const message = `Your MoneyPay verification code is: ${code}. Valid for 10 minutes.`;
  return sendSMS(phoneNumber, message);
};

export const sendTransactionSMS = async (phoneNumber, transactionDetails) => {
  const { amount, receiver, transactionId } = transactionDetails;
  const message = `MoneyPay: You have sent SSP ${amount} to ${receiver}. Transaction ID: ${transactionId}`;
  return sendSMS(phoneNumber, message);
};
