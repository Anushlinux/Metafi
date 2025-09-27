const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { sendSMS } = require('./services/httpsms');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    
    let reply = 'Commands: BALANCE | SEND <amt> TO <phone> | HELP';
    
    if (/balance/i.test(content)) {
      reply = 'Your USDC balance is 100.00 (demo)';
    } else {
      const sendMatch = /^send\s+(\d+(?:\.\d+)?)\s+to\s+(\+\d{6,15})/i.exec(content);
      if (sendMatch) {
        const amount = sendMatch[1];
        const recipient = sendMatch[2];
        reply = `Sending ${amount} USDC to ${recipient}. (demo)`;
      }
    }
    
    // Send reply if we have a valid phone number
    if (from.startsWith('+')) {
      try {
        await sendSMS(from, reply);
        console.log(`[SMS Handler] Reply sent to ${from}: ${reply}`);
      } catch (error) {
        console.error(`[SMS Handler] Failed to send reply to ${from}:`, error);
      }
    }
    
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
});

module.exports = app;
