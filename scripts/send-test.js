require('dotenv').config();
const { sendSMS } = require('../src/services/httpsms');

(async () => {
  try {
    // Get TO phone number from command line argument or environment variable
    const to = process.argv[2] || process.env.TEST_SMS_TO;
    
    if (!to) {
      throw new Error('Provide E.164 TO as argv or TEST_SMS_TO env');
    }
    
    console.log(`[Test] Sending SMS to: ${to}`);
    
    const result = await sendSMS(to, 'HTTPSMS hello from test');
    
    console.log('Sent:', JSON.stringify(result, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error('[Test] Error:', error.message);
    process.exit(1);
  }
})();
