# Testing Guide for WhatsApp Agent

## Quick Test Setup (5 minutes)

### Step 1: Basic Setup
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start the server
npm run dev
```

### Step 2: Test Server is Running
```bash
# Test basic server functionality
curl http://localhost:3000/
# Should return: {"message": "WhatsApp Agent Server is running!", "status": "active", ...}

# Test health endpoint
curl http://localhost:3000/health
# Should return: {"status": "healthy", "uptime": ..., "timestamp": ...}
```

### Step 3: Set Up ngrok Tunnel
```bash
# In a new terminal, start ngrok
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

**Copy this ngrok URL** - you'll need it for webhook testing.

## Testing SMS Commands (Without Real SMS)

### Test 1: Simulate Incoming SMS via API

```bash
# Replace 'abc123.ngrok.io' with your actual ngrok URL

# Test 'balance' command
curl -X POST https://abc123.ngrok.io/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "balance"
  }'

# Test 'register' command
curl -X POST https://abc123.ngrok.io/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1555123456",
    "message": "register"
  }'

# Test 'send' command
curl -X POST https://abc123.ngrok.io/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "send 25.50 to +1555123456"
  }'

# Test 'help' command
curl -X POST https://abc123.ngrok.io/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "help"
  }'
```

### Test 2: Check Wallet Service Directly

```bash
# Test SMS Gateway status
curl http://localhost:3000/sms-gateway/status

# Test SMS Gateway connection
curl http://localhost:3000/sms-gateway/test

# View configured URLs
curl http://localhost:3000/sms-gateway/urls
```

## Expected Test Results

### 1. Balance Command Response
When testing with `+1234567890` (pre-configured mock wallet):
```
💰 Your USDC Balance

Amount: 100.00 USDC
Address: 0x1234567890abcdef1234567890abcdef12345678
Last Transaction: 9/27/2024
```

### 2. Register Command Response
When testing with a new phone number:
```
🎉 Wallet Created Successfully!

Phone: +1555123456
Address: 0x[random_address]
Balance: 0 USDC

Your wallet is ready to use! Type "help" to see available commands.
```

### 3. Send Command Response
```
✅ Transfer Confirmation

Amount: 25.5 USDC
Recipient: +1555123456
Status: Completed

Transaction ID: TX[timestamp][random]
Your Balance: 74.50 USDC
Time: [current_time]
```

### 4. Help Command Response
```
🤖 Available Commands:

• balance - Check your USDC balance
• send <amount> to <phone> - Send USDC to another number
• register - Create a wallet for your phone number
• help - Show this help message

Examples:
• balance
• send 25.00 to +1234567890
• register
• help
```

## Advanced Testing with Real SMS

### Option 1: Using Twilio (Recommended for Testing)

1. **Set up Twilio account** (free tier available)
2. **Get phone number** from Twilio
3. **Configure webhook** in Twilio console:
   - Webhook URL: `https://your-ngrok-url.ngrok.io/sms`
   - HTTP Method: POST
4. **Send SMS** to your Twilio number
5. **Check server logs** for processing

### Option 2: Using Android HTTPSMS App

1. **Install HTTPSMS** from Google Play Store
2. **Configure app**:
   - Enable HTTP API Server (port 8080)
   - Set webhook URL: `https://your-ngrok-url.ngrok.io/sms`
3. **Update .env**:
   ```env
   HTTPSMS_GATEWAY_URL=http://[your-android-ip]:8080
   HTTPSMS_DEVICE_ID=your_device_id
   ```
4. **Send SMS** to Android device
5. **Check server logs** for processing

## Troubleshooting Common Issues

### Issue 1: "Connection refused" error
**Solution**: Make sure ngrok is running and the URL in your webhook is correct.

### Issue 2: "Wallet not found" for balance command
**Solution**: First send "register" command to create a wallet for that phone number.

### Issue 3: SMS not sending replies
**Solution**: Check that SMS_GATEWAY_URL is configured correctly in .env file.

### Issue 4: ngrok tunnel disconnected
**Solution**: Restart ngrok and update webhook URLs with the new ngrok URL.

## Monitoring and Debugging

### View Server Logs
```bash
# Server logs show all SMS processing
npm run dev
# Watch for messages like:
# [SMS Handler] Sending SMS to +1234567890: [message]
# [Wallet Service] Getting balance for phone: +1234567890
```

### Test Individual Components
```bash
# Test wallet service functions
node -e "
const wallet = require('./services/walletService');
wallet.getBalance('+1234567890').then(console.log);
"

# Test SMS gateway service
node -e "
const sms = require('./services/smsGatewayService');
sms.validateConfiguration().then(console.log);
"
```

## Load Testing (Optional)

```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config
cat > load-test.yml << 'EOF'
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "SMS Command Test"
    requests:
      - post:
          url: "/sms"
          json:
            from: "+1{{ $randomInt(1000000000, 9999999999) }}"
            message: "balance"
EOF

# Run load test
artillery run load-test.yml
```

## Success Criteria

✅ **Basic Setup**: Server starts without errors  
✅ **API Endpoints**: All endpoints return expected responses  
✅ **SMS Commands**: All commands (balance, send, register, help) work correctly  
✅ **Wallet Logic**: Balance checking and transfers work as expected  
✅ **Error Handling**: Invalid commands return helpful error messages  
✅ **ngrok Integration**: Webhooks can be received from external services  

## Next Steps

1. **Integrate Real SMS Provider**: Replace mock SMS gateway with Twilio/HTTPSMS
2. **Add Real Wallet**: Integrate Circle USDC SDK for actual crypto transactions
3. **Add Database**: Replace in-memory storage with PostgreSQL/MongoDB
4. **Add Authentication**: Implement user authentication and security
5. **Deploy to Production**: Use Heroku, AWS, or similar platform
