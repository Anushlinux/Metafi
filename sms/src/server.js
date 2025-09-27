const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const ConversationManager = require('./services/conversationManager');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize conversation manager
const conversationManager = new ConversationManager();

// Middleware
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'WhatsApp Agent Server is running!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// HTTPSMS webhook endpoint for receiving SMS (legacy endpoint for backward compatibility)
app.post('/sms', async (req, res) => {
  try {
    console.log('Inbound webhook (legacy):', req.body);
    
    const content = String(req.body.content || req.body.message || '').trim();
    const from = String(req.body.from || req.body.sender || '').trim();
    
    console.log(`[SMS Handler Legacy] Received from ${from}: ${content}`);
    
    // Validate phone number
    if (!from.startsWith('+')) {
      console.log(`[SMS Handler Legacy] Invalid phone number format: ${from}`);
      return res.status(200).json({ ok: false, error: 'Invalid phone number' });
    }
    
    // Handle the conversation asynchronously
    setImmediate(async () => {
      try {
        const result = await conversationManager.handleReply(from, content);
        console.log(`[SMS Handler Legacy] Conversation handled for ${from}:`, {
          flowType: result.flowType,
          waitingFor: result.waitingFor,
          completed: result.completed
        });
      } catch (error) {
        console.error(`[SMS Handler Legacy] Error handling conversation for ${from}:`, error);
        
        // Send error message to user
        try {
          await conversationManager.sendMessage(from, 'Sorry, I encountered an error. Please try again or type "help" for assistance.');
        } catch (sendError) {
          console.error(`[SMS Handler Legacy] Failed to send error message to ${from}:`, sendError);
        }
      }
    });
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[SMS Handler Legacy] Error processing webhook:', error);
    res.status(200).json({ ok: false });
  }
});

// Device 1 webhook endpoint (outgoing primarily, can handle delivery status)
app.post('/device1/incoming', async (req, res) => {
  try {
    console.log('Device 1 inbound webhook:', req.body);
    
    const content = String(req.body.content || req.body.message || '').trim();
    const from = String(req.body.from || req.body.sender || '').trim();
    const to = String(req.body.to || req.body.receiver || '').trim();
    
    console.log(`[Device1 Handler] Received from ${from} to ${to}: ${content}`);
    
    // Log raw payload for debugging
    console.log(`[Device1 Handler] Raw payload:`, JSON.stringify(req.body, null, 2));
    
    // Handle delivery status or optional inbound messages
    if (req.body.type === 'delivery_status' || req.body.status) {
      console.log(`[Device1 Handler] Delivery status update:`, req.body);
      return res.status(200).json({ ok: true, processed: 'delivery_status' });
    }
    
    // If it's an actual message, process it
    if (content && from.startsWith('+')) {
      // Handle the conversation asynchronously
      setImmediate(async () => {
        try {
          const result = await conversationManager.handleReply(from, content);
          console.log(`[Device1 Handler] Conversation handled for ${from}:`, {
            flowType: result.flowType,
            waitingFor: result.waitingFor,
            completed: result.completed
          });
        } catch (error) {
          console.error(`[Device1 Handler] Error handling conversation for ${from}:`, error);
          
          // Send error message to user via Device 1
          try {
            await conversationManager.sendMessage(from, 'Sorry, I encountered an error. Please try again or type "help" for assistance.');
          } catch (sendError) {
            console.error(`[Device1 Handler] Failed to send error message to ${from}:`, sendError);
          }
        }
      });
    }
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[Device1 Handler] Error processing webhook:', error);
    res.status(200).json({ ok: false });
  }
});

// Device 2 webhook endpoint (main incoming SMS webhook)
app.post('/device2/incoming', async (req, res) => {
  try {
    console.log('Device 2 inbound webhook:', req.body);
    
    const content = String(req.body.content || req.body.message || '').trim();
    const from = String(req.body.from || req.body.sender || '').trim();
    const to = String(req.body.to || req.body.receiver || '').trim();
    
    console.log(`[Device2 Handler] Received from ${from} to ${to}: ${content}`);
    
    // Log raw payload for debugging
    console.log(`[Device2 Handler] Raw payload:`, JSON.stringify(req.body, null, 2));
    
    // Validate phone number
    if (!from.startsWith('+')) {
      console.log(`[Device2 Handler] Invalid phone number format: ${from}`);
      return res.status(200).json({ ok: false, error: 'Invalid phone number' });
    }
    
    // Handle the conversation asynchronously
    setImmediate(async () => {
      try {
        const result = await conversationManager.handleReply(from, content);
        console.log(`[Device2 Handler] Conversation handled for ${from}:`, {
          flowType: result.flowType,
          waitingFor: result.waitingFor,
          completed: result.completed
        });
      } catch (error) {
        console.error(`[Device2 Handler] Error handling conversation for ${from}:`, error);
        
        // Send error message to user via Device 1 (outgoing device)
        try {
          await conversationManager.sendMessage(from, 'Sorry, I encountered an error. Please try again or type "help" for assistance.');
        } catch (sendError) {
          console.error(`[Device2 Handler] Failed to send error message to ${from}:`, sendError);
        }
      }
    });
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[Device2 Handler] Error processing webhook:', error);
    res.status(200).json({ ok: false });
  }
});

// HTTPSMS connection test endpoint (legacy)
app.get('/httpsms/test', async (req, res) => {
  try {
    const { testConnection } = require('./services/httpsms');
    const result = await testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'HTTPSMS connection test successful',
        devices: result.devices
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        devices: result.devices
      });
    }
  } catch (error) {
    console.error('Error testing HTTPSMS connection:', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed'
    });
  }
});

// Device 1 connection test endpoint
app.get('/device1/test', async (req, res) => {
  try {
    const { testConnectionDevice1 } = require('./services/httpsms');
    const result = await testConnectionDevice1();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Device 1 connection test successful',
        device: result.device,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing Device 1 connection:', error);
    res.status(500).json({
      success: false,
      error: 'Device 1 connection test failed'
    });
  }
});

// Device 2 connection test endpoint
app.get('/device2/test', async (req, res) => {
  try {
    const { testConnectionDevice2 } = require('./services/httpsms');
    const result = await testConnectionDevice2();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Device 2 connection test successful',
        device: result.device,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing Device 2 connection:', error);
    res.status(500).json({
      success: false,
      error: 'Device 2 connection test failed'
    });
  }
});

// HTTPSMS webhook configuration endpoint (legacy)
app.post('/httpsms/webhook/configure', async (req, res) => {
  try {
    const { configureWebhook } = require('./services/httpsms');
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }
    
    const result = await configureWebhook(webhookUrl);
    
    res.json({
      success: true,
      message: 'Webhook configured successfully',
      webhookUrl: result.webhookUrl,
      result: result.result
    });
  } catch (error) {
    console.error('Error configuring webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Device 1 webhook configuration endpoint
app.post('/device1/webhook/configure', async (req, res) => {
  try {
    const { configureWebhookDevice1 } = require('./services/httpsms');
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }
    
    const result = await configureWebhookDevice1(webhookUrl);
    
    res.json({
      success: true,
      message: 'Device 1 webhook configured successfully',
      webhookUrl: result.webhookUrl,
      result: result.result
    });
  } catch (error) {
    console.error('Error configuring Device 1 webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Device 2 webhook configuration endpoint
app.post('/device2/webhook/configure', async (req, res) => {
  try {
    const { configureWebhookDevice2 } = require('./services/httpsms');
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }
    
    const result = await configureWebhookDevice2(webhookUrl);
    
    res.json({
      success: true,
      message: 'Device 2 webhook configured successfully',
      webhookUrl: result.webhookUrl,
      result: result.result
    });
  } catch (error) {
    console.error('Error configuring Device 2 webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// HTTPSMS webhook status endpoint (legacy)
app.get('/httpsms/webhook/status', async (req, res) => {
  try {
    const { getWebhookConfig } = require('./services/httpsms');
    const result = await getWebhookConfig();
    
    res.json({
      success: true,
      webhooks: result.webhooks
    });
  } catch (error) {
    console.error('Error getting webhook status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Device 1 webhook status endpoint
app.get('/device1/webhook/status', async (req, res) => {
  try {
    const { getWebhookConfigDevice1 } = require('./services/httpsms');
    const result = await getWebhookConfigDevice1();
    
    res.json({
      success: true,
      webhooks: result.webhooks
    });
  } catch (error) {
    console.error('Error getting Device 1 webhook status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Device 2 webhook status endpoint
app.get('/device2/webhook/status', async (req, res) => {
  try {
    const { getWebhookConfigDevice2 } = require('./services/httpsms');
    const result = await getWebhookConfigDevice2();
    
    res.json({
      success: true,
      webhooks: result.webhooks
    });
  } catch (error) {
    console.error('Error getting Device 2 webhook status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Session management endpoints
app.get('/sessions/stats', async (req, res) => {
  try {
    const stats = await conversationManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session statistics'
    });
  }
});

app.get('/sessions', async (req, res) => {
  try {
    const sessions = await conversationManager.getActiveSessions();
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

app.delete('/sessions/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    await conversationManager.endConversation(phoneNumber);
    res.json({
      success: true,
      message: `Session ended for ${phoneNumber}`
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Manual conversation start endpoint (for testing)
app.post('/conversations/start', async (req, res) => {
  try {
    const { phoneNumber, flowType = 'help' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    const result = await conversationManager.startConversation(phoneNumber, flowType);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SMS server on :${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log HTTPSMS configuration status
  if (process.env.HTTPSMS_API_KEY && process.env.HTTPSMS_FROM_NUMBER) {
    console.log(`HTTPSMS configured: ${process.env.HTTPSMS_FROM_NUMBER}`);
  } else {
    console.warn('HTTPSMS configuration incomplete - check .env file');
  }
  
  // Log session store configuration
  const sessionStore = process.env.SESSION_STORE || 'memory';
  console.log(`Session store: ${sessionStore}`);
  
  // Setup periodic session cleanup
  setInterval(async () => {
    try {
      await conversationManager.cleanupExpiredSessions();
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }, 60000); // Every minute
});

module.exports = app;
