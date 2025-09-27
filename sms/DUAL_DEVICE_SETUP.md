# Dual Device SMS Gateway Setup Guide

## Overview

This backend now supports **two Android devices** acting as a dual SMS gateway to ensure robust two-way SMS conversation handling without same-device webhook limitations.

## Architecture

- **Device 1**: Primary outgoing device (sends bot replies)
- **Device 2**: Primary incoming device (receives user messages)
- **Webhook Flow**: Device 2 receives → Bot processes → Device 1 sends reply

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# HTTPSMS API Configuration
HTTPSMS_API_BASE=https://api.httpsms.com

# Device 1 (Outgoing Primary)
HTTPSMS_API_KEY_DEVICE1=your_device1_api_key
HTTPSMS_FROM_NUMBER_DEVICE1=+91XXXXXXXXXX
HTTPSMS_DEVICE_ID_DEVICE1=your_device1_id

# Device 2 (Incoming Primary)
HTTPSMS_API_KEY_DEVICE2=your_device2_api_key
HTTPSMS_FROM_NUMBER_DEVICE2=+91XXXXXXXXXX
HTTPSMS_DEVICE_ID_DEVICE2=your_device2_id

# Optional
HTTPSMS_TIMEOUT=10000
```

### Legacy Support

The following legacy variables are still supported for backward compatibility:

```env
HTTPSMS_API_KEY=your_api_key
HTTPSMS_FROM_NUMBER=+91XXXXXXXXXX
HTTPSMS_DEVICE_ID=your_device_id
```

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

### 3. Configure Dual Device Webhooks
```bash
npm run setup:dual-device -- http://localhost:3000 https://abc123.ngrok.io
```

### 4. Test Dual Device Setup
```bash
npm run test:dual-device
```

### 5. Test Manual SMS
Send an SMS to your Device 2 number from another device and check your server logs!

## Detailed Setup

### Step 1: Environment Configuration

Your `.env` file should have both device configurations:

```env
# HTTPSMS API Configuration
HTTPSMS_API_BASE=https://api.httpsms.com

# Device 1 (Outgoing Primary)
HTTPSMS_API_KEY_DEVICE1=uk_XOMv1Hy-qRVPUA_PE0p22xPI8b8ig6yg8hN8XUDlrbjXXKP6kh0dt71kWViFZTZS
HTTPSMS_FROM_NUMBER_DEVICE1=+919324617696
HTTPSMS_DEVICE_ID_DEVICE1=9544ff5f-e96e-47fa-8f67-16ccbfacef4e

# Device 2 (Incoming Primary)
HTTPSMS_API_KEY_DEVICE2=uk_ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZA567BCD890EFG
HTTPSMS_FROM_NUMBER_DEVICE2=+919876543210
HTTPSMS_DEVICE_ID_DEVICE2=12345678-1234-1234-1234-123456789abc
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

### Step 4: Configure Dual Device Webhooks
```bash
npm run setup:dual-device -- http://localhost:3000 https://abc123.ngrok.io
```

This will:
- Test both device connections
- Show current webhook configurations
- Configure Device 1 webhook: `https://abc123.ngrok.io/device1/incoming`
- Configure Device 2 webhook: `https://abc123.ngrok.io/device2/incoming`
- Test both webhook endpoints

### Step 5: Test Manual Messages
1. Send an SMS to your Device 2 number from another phone
2. Check your server logs for incoming webhook
3. Try commands: `help`, `balance`, `send`

## API Endpoints

### Device-Specific Endpoints

#### Device 1 (Outgoing)
- `GET /device1/test` - Test Device 1 connection
- `GET /device1/webhook/status` - Get Device 1 webhook status
- `POST /device1/webhook/configure` - Configure Device 1 webhook
- `POST /device1/incoming` - Device 1 webhook endpoint

#### Device 2 (Incoming)
- `GET /device2/test` - Test Device 2 connection
- `GET /device2/webhook/status` - Get Device 2 webhook status
- `POST /device2/webhook/configure` - Configure Device 2 webhook
- `POST /device2/incoming` - Device 2 webhook endpoint (main incoming)

### Legacy Endpoints (Backward Compatibility)
- `GET /httpsms/test` - Test both device connections
- `GET /httpsms/webhook/status` - Get webhook status (Device 2)
- `POST /httpsms/webhook/configure` - Configure webhook (Device 2)
- `POST /sms` - Legacy webhook endpoint

### Session Management
- `GET /sessions/stats` - Get session statistics
- `GET /sessions` - Get active sessions
- `DELETE /sessions/:phoneNumber` - End session
- `POST /conversations/start` - Start manual conversation

## Testing

### Automated Tests
```bash
# Test dual device functionality
npm run test:dual-device

# Test conversation flows
npm run test:conversations

# Demo conversation logic
npm run demo
```

### Manual Tests
1. Send SMS to Device 2 number
2. Check server logs for incoming webhook
3. Verify conversation flow
4. Confirm replies are sent via Device 1

## Message Flow

```
User SMS → Device 2 → /device2/incoming → Bot Processing → Device 1 → User Reply
```

1. **Incoming**: User sends SMS to Device 2 number
2. **Webhook**: HTTPSMS forwards to `/device2/incoming`
3. **Processing**: Bot processes message and generates reply
4. **Outgoing**: Bot sends reply via Device 1
5. **Delivery**: User receives reply from Device 1 number

## Troubleshooting

### Device Connection Issues
1. Verify API keys and device IDs in `.env`
2. Test individual device connections:
   ```bash
   curl http://localhost:3000/device1/test
   curl http://localhost:3000/device2/test
   ```

### Webhook Not Receiving Messages
1. Check ngrok is running: `curl https://abc123.ngrok.io/health`
2. Verify webhook configurations:
   ```bash
   curl http://localhost:3000/device1/webhook/status
   curl http://localhost:3000/device2/webhook/status
   ```
3. Check server logs for incoming webhooks

### Manual Messages Still Not Working
1. Ensure both webhooks are configured:
   ```bash
   npm run setup:dual-device -- http://localhost:3000 https://abc123.ngrok.io
   ```
2. Check that ngrok URL is accessible from internet
3. Verify both HTTPSMS devices are online and connected
4. Test with different phone numbers

### Session Issues
1. Check session statistics: `curl http://localhost:3000/sessions/stats`
2. View active sessions: `curl http://localhost:3000/sessions`
3. End problematic sessions: `curl -X DELETE http://localhost:3000/sessions/+91XXXXXXXXXX`

## Production Considerations

For production deployment:

1. **Use stable domains** instead of ngrok
2. **Implement webhook signature verification** for security
3. **Add rate limiting** and error handling
4. **Use HTTPS** with valid SSL certificates
5. **Monitor webhook delivery** success rates
6. **Set up logging** and monitoring
7. **Configure device failover** if one device goes offline

## Benefits of Dual Device Setup

1. **Reliability**: Redundancy if one device fails
2. **Performance**: Dedicated devices for specific functions
3. **Scalability**: Can handle higher message volumes
4. **Flexibility**: Different phone numbers for different purposes
5. **Debugging**: Easier to trace message flows

## Next Steps

1. **Test the setup** with manual SMS messages
2. **Verify webhook configurations** are working
3. **Test different conversation flows** (help, balance, send)
4. **Monitor message delivery** and response times
5. **Deploy to production** with proper domain and SSL
6. **Set up monitoring** and alerting

Your dual device SMS gateway is now ready for robust two-way conversations!
