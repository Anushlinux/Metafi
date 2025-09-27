const fetch = require('node-fetch');

/**
 * Get HTTPSMS configuration from environment
 */
function getConfig() {
  return {
    API_BASE: process.env.HTTPSMS_API_BASE,
    API_KEY: process.env.HTTPSMS_API_KEY,
    FROM: process.env.HTTPSMS_FROM_NUMBER,
    DEVICE_ID: process.env.HTTPSMS_DEVICE_ID,
    TIMEOUT: Number(process.env.HTTPSMS_TIMEOUT || 10000)
  };
}

/**
 * Send SMS via HTTPSMS Cloud API
 * @param {string} to - Recipient phone number in E.164 format
 * @param {string} content - SMS message content
 * @returns {Promise<Object>} - API response
 */
async function sendSMS(to, content) {
  try {
    console.log(`[HTTPSMS] Sending SMS to ${to}: ${content}`);
    
    const config = getConfig();
    
    // Validate required environment variables
    if (!config.API_BASE || !config.API_KEY || !config.FROM || !config.DEVICE_ID) {
      throw new Error('Missing required HTTPSMS environment variables');
    }
    
    // Validate inputs
    if (!to || !content) {
      throw new Error('Phone number and content are required');
    }
    
    // Ensure phone numbers are in E.164 format
    const normalizedTo = normalizePhoneNumber(to);
    const normalizedFrom = normalizePhoneNumber(config.FROM);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    const response = await fetch(`${config.API_BASE}/v1/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.API_KEY
      },
      body: JSON.stringify({
        from: normalizedFrom,
        to: normalizedTo,
        content: content,
        device_id: config.DEVICE_ID
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTPSMS send failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS] SMS sent successfully:`, result);
    
    return result;
    
  } catch (error) {
    console.error('[HTTPSMS] Error sending SMS:', error);
    throw error;
  }
}

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Raw phone number
 * @returns {string} - Normalized phone number in E.164 format
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Add + if not present and starts with country code
  if (!normalized.startsWith('+') && normalized.length >= 10) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

/**
 * Test HTTPSMS connection
 * @returns {Promise<Object>} - Connection test result
 */
async function testConnection() {
  try {
    console.log('[HTTPSMS] Testing connection...');
    
    const config = getConfig();
    
    if (!config.API_BASE || !config.API_KEY) {
      return {
        success: false,
        error: 'HTTPSMS API configuration missing'
      };
    }
    
    // Test with a simple request to check API connectivity
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    const response = await fetch(`${config.API_BASE}/v1/devices`, {
      method: 'GET',
      headers: {
        'x-api-key': config.API_KEY
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      return {
        success: true,
        connected: true,
        status: 'connected'
      };
    } else {
      return {
        success: false,
        connected: false,
        error: `API returned ${response.status}`
      };
    }
    
  } catch (error) {
    console.error('[HTTPSMS] Connection test failed:', error);
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  sendSMS,
  testConnection,
  normalizePhoneNumber
};
