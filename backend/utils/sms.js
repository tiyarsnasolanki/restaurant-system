/**
 * SMS Utility - Supports Fast2SMS (India) and Twilio
 * Set SMS_PROVIDER=fast2sms or twilio in .env
 */

const sendBillSMS = async (phone, message) => {
  const provider = process.env.SMS_PROVIDER || 'fast2sms';

  try {
    if (provider === 'fast2sms') {
      // Fast2SMS - popular in India
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          language: 'english',
          flash: 0,
          numbers: phone.replace('+91', '').replace(/\s/g, ''),
        }),
      });
      const data = await response.json();
      return data;
    } else if (provider === 'twilio') {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return result;
    }

    // Fallback: log to console in development
    console.log(`📱 SMS to ${phone}: ${message}`);
    return { success: true, mock: true };
  } catch (err) {
    console.error('SMS error:', err.message);
    throw err;
  }
};

// WhatsApp via Twilio or Meta API (placeholder)
const sendWhatsApp = async (phone, message) => {
  try {
    // Using Twilio WhatsApp sandbox (format: whatsapp:+91XXXXXXXXXX)
    if (process.env.TWILIO_ACCOUNT_SID) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const result = await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phone}`,
      });
      return result;
    }

    // Fallback
    console.log(`💬 WhatsApp to ${phone}: ${message}`);
    return { success: true, mock: true };
  } catch (err) {
    console.error('WhatsApp error:', err.message);
    throw err;
  }
};

module.exports = { sendBillSMS, sendWhatsApp };
