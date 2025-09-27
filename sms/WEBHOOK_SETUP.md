# HTTPSMS Webhook Setup Guide

## Problem Solved

Your automated tests work because they make direct HTTP requests to your `/sms` endpoint, but manual SMS messages don't work because **HTTPSMS Cloud API doesn't know where to forward incoming messages**.

## Solution

I've added webhook configuration functionality to automatically configure HTTPSMS to forward incoming messages to your server.

## Quick Setup

### 1. Start Your Server
```bash
npm run dev
```

### 2. Start ngrok Tunnel (in another terminal)
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 3. Configure Webhook
```bash
npm run setup:webhook -- http://localhost:3000 https://proforeign-climactic-marcelle.ngrok-free.dev/sms
```

### 4. Test Manual SMS
Send an SMS to your phone number from another device and check your server logs!

## Detailed Setup

### Step 1: Environment Configuration
Your `.env` file should have:
```env
HTTPSMS_API_BASE=https://api.httpsms.com
HTTPSMS_API_KEY=uk_XOMv1Hy-qRVPUA_PE0p22xPI8b8ig6yg8hN8XUDlrbjXXKP6kh0dt71kWViFZTZS
HTTPSMS_FROM_NUMBER=+919324617696
HTTPSMS_DEVICE_ID=9544ff5f-e96e-47fa-8f67-16ccbfacef4e
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Create Public Tunnel
Install ngrok if you haven't:
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com
```

Start tunnel:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Configure Webhook
```bash
npm run setup:webhook -- http://localhost:3000 https://abc123.ngrok.io/sms
```

This will:
- Test HTTPSMS connection
- Show current webhook configuration
- Configure the webhook URL
- Test the webhook

### Step 5: Test Manual Messages
1. Send an SMS to `+919324617696` from another phone
2. Check your server logs for incoming webhook
3. Try commands: `help`, `balance`, `send`

## New API Endpoints

I've added these endpoints to your server:

### Configure Webhook
```bash
curl -X POST http://localhost:3000/httpsms/webhook/configure \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://abc123.ngrok.io/sms"}'
```

### Check Webhook Status
```bash
curl http://localhost:3000/httpsms/webhook/status
```

### Test HTTPSMS Connection
```bash
curl http://localhost:3000/httpsms/test
```

## Troubleshooting

### Webhook Not Receiving Messages
1. Check ngrok is running: `curl https://abc123.ngrok.io/health`
2. Verify webhook configuration: `curl http://localhost:3000/httpsms/webhook/status`
3. Check server logs for incoming webhooks

### HTTPSMS Connection Issues
1. Verify API key and device ID in `.env`
2. Test connection: `curl http://localhost:3000/httpsms/test`
3. Check HTTPSMS dashboard for device status

### Manual Messages Still Not Working
1. Ensure webhook is configured: `npm run setup:webhook -- http://localhost:3000 https://abc123.ngrok.io/sms`
2. Check that ngrok URL is accessible from internet
3. Verify HTTPSMS device is online and connected

## What Changed

### New Functions in `httpsms.js`:
- `configureWebhook(webhookUrl)` - Configure HTTPSMS webhook
- `getWebhookConfig()` - Get current webhook configuration

### New Server Endpoints:
- `POST /httpsms/webhook/configure` - Configure webhook
- `GET /httpsms/webhook/status` - Check webhook status

### New Setup Script:
- `scripts/setup-webhook.js` - Automated webhook configuration
- `npm run setup:webhook` - Run setup script

## Testing

### Automated Tests (Still Work)
```bash
npm run test:conversations
npm run demo
```

### Manual Tests (Now Work!)
1. Send SMS to your phone number
2. Check server logs
3. Verify conversation flow

## Production Considerations

For production deployment:
1. Use a stable domain instead of ngrok
2. Implement webhook signature verification
3. Add rate limiting and error handling
4. Use HTTPS with valid SSL certificates
5. Monitor webhook delivery success rates

## Next Steps

1. **Test the setup** with manual SMS messages
2. **Verify webhook configuration** is working
3. **Test different conversation flows** (help, balance, send)
4. **Deploy to production** with proper domain and SSL

Your manual SMS messages should now work exactly like the automated tests!
