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
 * Get HTTPSMS configuration for Device 1 (outgoing primarily)
 */
function getDevice1Config() {
  return {
    API_BASE: process.env.HTTPSMS_API_BASE,
    API_KEY: process.env.HTTPSMS_API_KEY_DEVICE1,
    FROM: process.env.HTTPSMS_FROM_NUMBER_DEVICE1,
    DEVICE_ID: process.env.HTTPSMS_DEVICE_ID_DEVICE1,
    TIMEOUT: Number(process.env.HTTPSMS_TIMEOUT || 10000)
  };
}

/**
 * Get HTTPSMS configuration for Device 2 (incoming only)
 */
function getDevice2Config() {
  return {
    API_BASE: process.env.HTTPSMS_API_BASE,
    API_KEY: process.env.HTTPSMS_API_KEY_DEVICE2,
    FROM: process.env.HTTPSMS_FROM_NUMBER_DEVICE2,
    DEVICE_ID: process.env.HTTPSMS_DEVICE_ID_DEVICE2,
    TIMEOUT: Number(process.env.HTTPSMS_TIMEOUT || 10000)
  };
}

/**
 * Send SMS via HTTPSMS Cloud API using Device 1
 * @param {string} to - Recipient phone number in E.164 format
 * @param {string} content - SMS message content
 * @returns {Promise<Object>} - API response
 */
async function sendSMSDevice1(to, content) {
  try {
    console.log(`[HTTPSMS Device1] Sending SMS to ${to}: ${content}`);
    
    const config = getDevice1Config();
    
    // Validate required environment variables
    if (!config.API_BASE || !config.API_KEY || !config.FROM || !config.DEVICE_ID) {
      throw new Error('Missing required HTTPSMS Device1 environment variables');
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
      throw new Error(`HTTPSMS Device1 send failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS Device1] SMS sent successfully:`, result);
    
    return result;
    
  } catch (error) {
    console.error('[HTTPSMS Device1] Error sending SMS:', error);
    throw error;
  }
}

/**
 * Send SMS via HTTPSMS Cloud API using Device 2
 * @param {string} to - Recipient phone number in E.164 format
 * @param {string} content - SMS message content
 * @returns {Promise<Object>} - API response
 */
async function sendSMSDevice2(to, content) {
  try {
    console.log(`[HTTPSMS Device2] Sending SMS to ${to}: ${content}`);
    
    const config = getDevice2Config();
    
    // Validate required environment variables
    if (!config.API_BASE || !config.API_KEY || !config.FROM || !config.DEVICE_ID) {
      throw new Error('Missing required HTTPSMS Device2 environment variables');
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
      throw new Error(`HTTPSMS Device2 send failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS Device2] SMS sent successfully:`, result);
    
    return result;
    
  } catch (error) {
    console.error('[HTTPSMS Device2] Error sending SMS:', error);
    throw error;
  }
}

/**
 * Send SMS via HTTPSMS Cloud API (legacy function for backward compatibility)
 * @param {string} to - Recipient phone number in E.164 format
 * @param {string} content - SMS message content
 * @returns {Promise<Object>} - API response
 */
async function sendSMS(to, content) {
  // Default to Device 1 for outgoing messages
  return await sendSMSDevice1(to, content);
}

/**
 * Send SMS via specified device
 * @param {number} deviceNumber - Device number (1 or 2)
 * @param {string} to - Recipient phone number in E.164 format
 * @param {string} content - SMS message content
 * @returns {Promise<Object>} - API response
 */
async function sendSMSByDevice(deviceNumber, to, content) {
  if (deviceNumber === 1) {
    return await sendSMSDevice1(to, content);
  } else if (deviceNumber === 2) {
    return await sendSMSDevice2(to, content);
  } else {
    throw new Error(`Invalid device number: ${deviceNumber}. Must be 1 or 2.`);
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
 * Configure webhook URL for HTTPSMS Cloud API (Device 1)
 * @param {string} webhookUrl - The webhook URL to receive incoming messages
 * @returns {Promise<Object>} - Configuration result
 */
async function configureWebhookDevice1(webhookUrl) {
  try {
    console.log(`[HTTPSMS Device1] Configuring webhook: ${webhookUrl}`);
    
    const config = getDevice1Config();
    
    if (!config.API_BASE || !config.API_KEY) {
      throw new Error('Missing required HTTPSMS Device1 environment variables');
    }
    
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }
    
    // First, check if there are existing webhooks
    const existingWebhooks = await getWebhookConfigDevice1();
    let webhookId = null;
    
    if (existingWebhooks.success && existingWebhooks.webhooks.data && existingWebhooks.webhooks.data.length > 0) {
      // Use the first existing webhook
      webhookId = existingWebhooks.webhooks.data[0].id;
      console.log(`[HTTPSMS Device1] Found existing webhook: ${webhookId}`);
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    let response;
    if (webhookId) {
      // Update existing webhook
      console.log(`[HTTPSMS Device1] Updating existing webhook: ${webhookId}`);
      response = await fetch(`${config.API_BASE}/v1/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.API_KEY
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['message.phone.received'],
          phone_numbers: existingWebhooks.webhooks.data[0].phone_numbers
        }),
        signal: controller.signal
      });
    } else {
      // Create new webhook
      console.log(`[HTTPSMS Device1] Creating new webhook`);
      response = await fetch(`${config.API_BASE}/v1/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.API_KEY
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['message.phone.received']
        }),
        signal: controller.signal
      });
    }
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Device1 webhook configuration failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS Device1] Webhook configured successfully:`, result);
    
    return {
      success: true,
      webhookUrl,
      result,
      action: webhookId ? 'updated' : 'created'
    };
    
  } catch (error) {
    console.error('[HTTPSMS Device1] Error configuring webhook:', error);
    throw error;
  }
}

/**
 * Configure webhook URL for HTTPSMS Cloud API (Device 2)
 * @param {string} webhookUrl - The webhook URL to receive incoming messages
 * @returns {Promise<Object>} - Configuration result
 */
async function configureWebhookDevice2(webhookUrl) {
  try {
    console.log(`[HTTPSMS Device2] Configuring webhook: ${webhookUrl}`);
    
    const config = getDevice2Config();
    
    if (!config.API_BASE || !config.API_KEY) {
      throw new Error('Missing required HTTPSMS Device2 environment variables');
    }
    
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }
    
    // First, check if there are existing webhooks
    const existingWebhooks = await getWebhookConfigDevice2();
    let webhookId = null;
    
    if (existingWebhooks.success && existingWebhooks.webhooks.data && existingWebhooks.webhooks.data.length > 0) {
      // Use the first existing webhook
      webhookId = existingWebhooks.webhooks.data[0].id;
      console.log(`[HTTPSMS Device2] Found existing webhook: ${webhookId}`);
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    let response;
    if (webhookId) {
      // Update existing webhook
      console.log(`[HTTPSMS Device2] Updating existing webhook: ${webhookId}`);
      response = await fetch(`${config.API_BASE}/v1/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.API_KEY
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['message.phone.received'],
          phone_numbers: existingWebhooks.webhooks.data[0].phone_numbers
        }),
        signal: controller.signal
      });
    } else {
      // Create new webhook
      console.log(`[HTTPSMS Device2] Creating new webhook`);
      response = await fetch(`${config.API_BASE}/v1/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.API_KEY
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['message.phone.received']
        }),
        signal: controller.signal
      });
    }
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Device2 webhook configuration failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS Device2] Webhook configured successfully:`, result);
    
    return {
      success: true,
      webhookUrl,
      result,
      action: webhookId ? 'updated' : 'created'
    };
    
  } catch (error) {
    console.error('[HTTPSMS Device2] Error configuring webhook:', error);
    throw error;
  }
}

/**
 * Configure webhook URL for HTTPSMS Cloud API (legacy function for backward compatibility)
 * @param {string} webhookUrl - The webhook URL to receive incoming messages
 * @returns {Promise<Object>} - Configuration result
 */
async function configureWebhook(webhookUrl) {
  // Default to Device 2 for incoming messages
  return await configureWebhookDevice2(webhookUrl);
}

/**
 * Get current webhook configuration for Device 1
 * @returns {Promise<Object>} - Current webhook configuration
 */
async function getWebhookConfigDevice1() {
  try {
    console.log('[HTTPSMS Device1] Getting webhook configuration...');
    
    const config = getDevice1Config();
    
    if (!config.API_BASE || !config.API_KEY) {
      throw new Error('Missing required HTTPSMS Device1 environment variables');
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    const response = await fetch(`${config.API_BASE}/v1/webhooks`, {
      method: 'GET',
      headers: {
        'x-api-key': config.API_KEY
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Device1 webhook config: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS Device1] Webhook configuration retrieved:`, result);
    
    return {
      success: true,
      webhooks: result
    };
    
  } catch (error) {
    console.error('[HTTPSMS Device1] Error getting webhook config:', error);
    throw error;
  }
}

/**
 * Get current webhook configuration for Device 2
 * @returns {Promise<Object>} - Current webhook configuration
 */
async function getWebhookConfigDevice2() {
  try {
    console.log('[HTTPSMS Device2] Getting webhook configuration...');
    
    const config = getDevice2Config();
    
    if (!config.API_BASE || !config.API_KEY) {
      throw new Error('Missing required HTTPSMS Device2 environment variables');
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    const response = await fetch(`${config.API_BASE}/v1/webhooks`, {
      method: 'GET',
      headers: {
        'x-api-key': config.API_KEY
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Device2 webhook config: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[HTTPSMS Device2] Webhook configuration retrieved:`, result);
    
    return {
      success: true,
      webhooks: result
    };
    
  } catch (error) {
    console.error('[HTTPSMS Device2] Error getting webhook config:', error);
    throw error;
  }
}

/**
 * Get current webhook configuration (legacy function for backward compatibility)
 * @returns {Promise<Object>} - Current webhook configuration
 */
async function getWebhookConfig() {
  // Default to Device 2 for incoming messages
  return await getWebhookConfigDevice2();
}

/**
 * Test HTTPSMS connection for Device 1
 * @returns {Promise<Object>} - Connection test result
 */
async function testConnectionDevice1() {
  try {
    console.log('[HTTPSMS Device1] Testing connection...');
    
    const config = getDevice1Config();
    
    if (!config.API_BASE || !config.API_KEY) {
      return {
        success: false,
        error: 'HTTPSMS Device1 API configuration missing'
      };
    }
    
    // Test with a simple request to check API connectivity
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    const response = await fetch(`${config.API_BASE}/v1/webhooks`, {
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
        status: 'connected',
        device: 'Device1'
      };
    } else {
      return {
        success: false,
        connected: false,
        error: `Device1 API returned ${response.status}`
      };
    }
    
  } catch (error) {
    console.error('[HTTPSMS Device1] Connection test failed:', error);
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
}

/**
 * Test HTTPSMS connection for Device 2
 * @returns {Promise<Object>} - Connection test result
 */
async function testConnectionDevice2() {
  try {
    console.log('[HTTPSMS Device2] Testing connection...');
    
    const config = getDevice2Config();
    
    if (!config.API_BASE || !config.API_KEY) {
      return {
        success: false,
        error: 'HTTPSMS Device2 API configuration missing'
      };
    }
    
    // Test with a simple request to check API connectivity
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    const response = await fetch(`${config.API_BASE}/v1/webhooks`, {
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
        status: 'connected',
        device: 'Device2'
      };
    } else {
      return {
        success: false,
        connected: false,
        error: `Device2 API returned ${response.status}`
      };
    }
    
  } catch (error) {
    console.error('[HTTPSMS Device2] Connection test failed:', error);
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
}

/**
 * Test HTTPSMS connection (legacy function for backward compatibility)
 * @returns {Promise<Object>} - Connection test result
 */
async function testConnection() {
  // Test both devices
  const device1Result = await testConnectionDevice1();
  const device2Result = await testConnectionDevice2();
  
  return {
    success: device1Result.success && device2Result.success,
    devices: {
      device1: device1Result,
      device2: device2Result
    }
  };
}

module.exports = {
  // Legacy functions (backward compatibility)
  sendSMS,
  testConnection,
  configureWebhook,
  getWebhookConfig,
  normalizePhoneNumber,
  
  // Device-specific functions
  sendSMSDevice1,
  sendSMSDevice2,
  sendSMSByDevice,
  testConnectionDevice1,
  testConnectionDevice2,
  configureWebhookDevice1,
  configureWebhookDevice2,
  getWebhookConfigDevice1,
  getWebhookConfigDevice2,
  
  // Configuration functions
  getDevice1Config,
  getDevice2Config
};
