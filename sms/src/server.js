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

// HTTPSMS webhook endpoint for receiving SMS
app.post('/sms', async (req, res) => {
  try {
    console.log('Inbound webhook:', req.body);
    
    const content = String(req.body.content || req.body.message || '').trim();
    const from = String(req.body.from || req.body.sender || '').trim();
    
    console.log(`[SMS Handler] Received from ${from}: ${content}`);
    
    // Validate phone number
    if (!from.startsWith('+')) {
      console.log(`[SMS Handler] Invalid phone number format: ${from}`);
      return res.status(200).json({ ok: false, error: 'Invalid phone number' });
    }
    
    // Handle the conversation asynchronously
    setImmediate(async () => {
      try {
        const result = await conversationManager.handleReply(from, content);
        console.log(`[SMS Handler] Conversation handled for ${from}:`, {
          flowType: result.flowType,
          waitingFor: result.waitingFor,
          completed: result.completed
        });
      } catch (error) {
        console.error(`[SMS Handler] Error handling conversation for ${from}:`, error);
        
        // Send error message to user
        try {
          await conversationManager.sendMessage(from, 'Sorry, I encountered an error. Please try again or type "help" for assistance.');
        } catch (sendError) {
          console.error(`[SMS Handler] Failed to send error message to ${from}:`, sendError);
        }
      }
    });
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[SMS Handler] Error processing webhook:', error);
    res.status(200).json({ ok: false });
  }
});

// HTTPSMS connection test endpoint
app.get('/httpsms/test', async (req, res) => {
  try {
    const { testConnection } = require('./services/httpsms');
    const result = await testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'HTTPSMS connection test successful',
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
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
