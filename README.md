# Metafi

A Node.js SMS agent built with Express that handles incoming SMS messages and responds to commands like `balance`, `send`, and `help`. Uses HTTPSMS Cloud API for SMS communication.

## Features

- 📱 SMS command processing (`balance`, `send <amount> to <phone>`, `help`)
- 🔄 Automatic SMS replies using HTTPSMS Cloud API
- 🌐 Webhook endpoint for receiving SMS messages from HTTPSMS
- 💰 Demo wallet service with mock USDC balance and transfers
- ⚙️ Environment-based configuration
- 🔧 Development mode with auto-restart
- 🧪 End-to-end testing script

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- HTTPSMS Cloud API account and device
- ngrok (for local development)

## Quick Start

```bash
# Clone and setup
git clone https://github.com/Anushlinux/whatsapp-agent.git
cd whatsapp-agent
npm install

# Configure environment
cp .env.example .env
# Edit .env with your HTTPSMS credentials

# Start development server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Configure HTTPSMS webhook URL: https://your-ngrok-url.ngrok.io/sms
```

## HTTPSMS Quick Test

### Step A: HTTPSMS Dashboard Setup
1. In the HTTPSMS dashboard, set the **Incoming Webhook/Callback URL** to `https://<NGROK>.ngrok-free.dev/sms`
2. Confirm your device shows **Online/Heartbeat** status
3. Note your device ID and API key from the dashboard

### Step B: Start Server and ngrok
```bash
# Start the server
npm run dev

# In another terminal, start ngrok
ngrok http 3000
```

### Step C: Test SMS Sending
```bash
# Test sending SMS via HTTPSMS API
npm run test:sms -- +91XXXXXXXXXX

# Or set environment variable
export TEST_SMS_TO=+91XXXXXXXXXX
npm run test:sms
```

### Step D: Test SMS Receiving
1. Send an SMS to the SIM in your Android device
2. Check server logs for incoming webhook payload
3. Verify auto-reply is delivered to sender

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Anushlinux/whatsapp-agent.git
cd whatsapp-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your HTTPSMS configuration:
```env
# HTTPSMS Cloud API Configuration
PORT=3000
NODE_ENV=development
HTTPSMS_API_BASE=https://api.httpsms.com
HTTPSMS_API_KEY=sk_xxx_from_httpsms_dashboard
HTTPSMS_FROM_NUMBER=+91XXXXXXXXXX
HTTPSMS_DEVICE_ID=device_xxx
HTTPSMS_TIMEOUT=10000
```

**Configuration Notes:**
- **API Key**: Get from HTTPSMS dashboard under API settings
- **Device ID**: Found in device management section
- **FROM Number**: Must match the phone number registered in HTTPSMS dashboard
- **Timeout**: Request timeout in milliseconds (default: 10000)

## Development Setup with ngrok

### 1. Install ngrok

**Option A: Download from website**
- Visit [ngrok.com](https://ngrok.com)
- Sign up for a free account
- Download and install ngrok

**Option B: Install via package manager**
```bash
# macOS
brew install ngrok

# Windows (with Chocolatey)
choco install ngrok

# Linux
# Download from https://ngrok.com/download
```

### 2. Authenticate ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```
Get your auth token from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)

### 3. Start the development server
```bash
npm run dev
```

### 4. Start ngrok tunnel
In a new terminal window:
```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the forwarding URL** (e.g., `https://abc123.ngrok.io`)

## HTTPSMS Setup

### 1. Install HTTPSMS App on Android

**Step 1: Download and Install**
1. Open **Google Play Store** on your Android device
2. Search for "HTTPSMS" or visit: [HTTPSMS on Google Play](https://play.google.com/store/apps/details?id=com.httpsms)
3. Install the app by **HTTPSMS** (by the official developer)
4. Open the app after installation

**Step 2: Grant Permissions**
1. When prompted, grant **SMS permissions** to HTTPSMS
2. Grant **Phone permissions** (for device identification)
3. Grant **Storage permissions** (for message logs)
4. Optionally grant **Notification permissions** for status updates

**Step 3: Initial App Configuration**
1. Open HTTPSMS app
2. Go to **Settings** (gear icon)
3. Enable **HTTP API Server** (toggle ON)
4. Set **Server Port** to `8080` (default)
5. Enable **Allow External Connections** (for network access)

### 2. Network Configuration Options

#### Option A: Direct Local Network Connection (Development)

**For Local Development Only:**
1. Ensure your Android device and development server are on the same WiFi network
2. Find your Android device's IP address:
   - Go to **Settings** → **WiFi** → Tap your connected network
   - Note the IP address (e.g., `192.168.1.100`)
3. Update your `.env` file:
   ```env
   HTTPSMS_GATEWAY_URL=http://192.168.1.100:8080
   HTTPSMS_DEVICE_ID=your_device_id_here
   ```

**Security Note:** This method is only suitable for development. For production, use Option B or C.

#### Option B: SSH Tunnel (Recommended for Production)

**Step 1: Set up SSH Access**
1. Ensure your Android device has SSH access (via apps like **Termux** or **SSH Server**)
2. Or use a computer/server that can access your Android device
3. Note the SSH connection details (host, port, username)

**Step 2: Create SSH Tunnel**
```bash
# Create SSH tunnel from your server to Android device
ssh -L 8080:localhost:8080 username@android-device-ip

# Or if using a jump server
ssh -L 8080:android-device-ip:8080 username@jump-server-ip
```

**Step 3: Configure Backend**
```env
HTTPSMS_GATEWAY_URL=http://localhost:8080
HTTPSMS_DEVICE_ID=your_device_id_here
```

#### Option C: VPN/Proxy Service (Advanced)

**Step 1: Set up VPN or Proxy**
1. Use services like **ngrok**, **Cloudflare Tunnel**, or **WireGuard VPN**
2. Configure tunnel to expose Android device port 8080

**Step 2: Configure Backend**
```env
HTTPSMS_GATEWAY_URL=https://your-tunnel-url.ngrok.io
HTTPSMS_API_KEY=your_secure_api_key
HTTPSMS_DEVICE_ID=your_device_id_here
```

### 3. Configure SMS Forwarding Webhook

**Step 1: Get Your Backend Webhook URL**
1. Start your backend server: `npm run dev`
2. Start ngrok tunnel: `ngrok http 3000`
3. Copy your ngrok URL (e.g., `https://abc123.ngrok.io`)

**Step 2: Configure HTTPSMS Webhook**
1. Open HTTPSMS app on Android
2. Go to **Settings** → **Webhooks**
3. Configure webhook settings:
   - **Webhook URL**: `https://abc123.ngrok.io/sms`
   - **HTTP Method**: `POST`
   - **Content-Type**: `application/json`
   - **Enable Incoming SMS Webhook**: ✅ ON
   - **Enable Outgoing SMS Webhook**: ✅ ON (optional)

**Step 3: Test Webhook Configuration**
1. Send a test SMS to your Android device
2. Check your backend logs for incoming webhook
3. Verify the webhook is received correctly

**Alternative Endpoints:**
- Primary: `/sms` (recommended)
- Legacy: `/webhook/httpsms` (backward compatibility)

### 4. Security Configuration

**Step 1: Enable API Authentication (Recommended)**
1. In HTTPSMS app, go to **Settings** → **Security**
2. Generate or set an **API Key**
3. Update your `.env` file:
   ```env
   HTTPSMS_API_KEY=your_generated_api_key_here
   ```

**Step 2: Configure Device ID**
1. In HTTPSMS app, go to **Settings** → **Device**
2. Note your **Device ID**
3. Update your `.env` file:
   ```env
   HTTPSMS_DEVICE_ID=your_device_id_here
   ```

**Step 3: Network Security**
- Use HTTPS endpoints when possible
- Implement API key authentication
- Consider IP whitelisting for production
- Use VPN or SSH tunnels for secure connections

### 5. Test HTTPSMS Connection

**Step 1: Test Backend Connection**
```bash
# Test HTTPSMS connection
curl http://localhost:3000/httpsms/test

# Check HTTPSMS status
curl http://localhost:3000/httpsms/status

# View configured URLs
curl http://localhost:3000/httpsms/urls
```

**Step 2: Test SMS Sending**
```bash
# Send test SMS via API
curl -X POST http://localhost:3000/httpsms/send \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Test message"}'
```

**Step 3: Test SMS Receiving**
1. Send an SMS to your Android device
2. Check backend logs for webhook reception
3. Verify SMS processing and response

### 6. Advanced Network Setup

#### SSH Tunnel Setup (Recommended for Production)

**Step 1: Install SSH Server on Android**
```bash
# Option A: Using Termux (recommended)
# Install Termux from F-Droid or Google Play
# Then install SSH server:
pkg install openssh
sshd

# Option B: Using SSHDroid app
# Download from Google Play Store
# Configure username/password and start service
```

**Step 2: Create Persistent SSH Tunnel**
```bash
# Create SSH tunnel (run this on your server)
ssh -f -N -L 8080:localhost:8080 username@android-device-ip

# Or create a systemd service for automatic startup
sudo tee /etc/systemd/system/httpsms-tunnel.service > /dev/null <<EOF
[Unit]
Description=HTTPSMS SSH Tunnel
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/usr/bin/ssh -N -L 8080:localhost:8080 username@android-device-ip
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable httpsms-tunnel.service
sudo systemctl start httpsms-tunnel.service
```

#### VPN Setup (Advanced)

**Option A: WireGuard VPN**
```bash
# Install WireGuard on Android (from Google Play)
# Configure WireGuard server on your infrastructure
# Create tunnel configuration for Android device
```

**Option B: Cloudflare Tunnel**
```bash
# Install cloudflared on Android device
# Configure tunnel to expose HTTPSMS API
cloudflared tunnel --url http://localhost:8080
```

#### Load Balancer Setup (Multiple Devices)

**Step 1: Configure Multiple Android Devices**
```env
# Device 1
HTTPSMS_GATEWAY_URL=http://localhost:8081
HTTPSMS_DEVICE_ID=device_1_id

# Device 2  
HTTPSMS_GATEWAY_URL=http://localhost:8082
HTTPSMS_DEVICE_ID=device_2_id
```

**Step 2: Implement Device Selection Logic**
```javascript
// In your backend, implement device selection
const devices = [
  { id: 'device_1', url: 'http://localhost:8081', status: 'active' },
  { id: 'device_2', url: 'http://localhost:8082', status: 'active' }
];

function selectDevice() {
  return devices.find(d => d.status === 'active');
}
```

### 7. Production Deployment Considerations

**Network Security:**
- Use HTTPS endpoints with valid SSL certificates
- Implement proper authentication and authorization
- Use VPN or private networks for device connections
- Monitor and log all SMS activities
- Implement rate limiting and DDoS protection

**Scalability:**
- Consider load balancing for multiple Android devices
- Implement device failover mechanisms
- Use message queues for high-volume SMS processing
- Implement horizontal scaling with multiple backend instances

**Monitoring:**
- Set up health checks for HTTPSMS connections
- Monitor webhook delivery success rates
- Implement alerting for connection failures
- Use monitoring tools like Prometheus/Grafana

**Backup and Recovery:**
- Implement SMS message backup and recovery
- Set up device failover procedures
- Create disaster recovery plans
- Regular testing of backup systems

## SMS Provider Webhook Configuration

### 1. Configure Your SMS Provider
Configure your SMS provider to send webhooks to your ngrok URL:
- **Webhook URL**: `https://your-ngrok-url.ngrok.io/sms`
- **HTTP Method**: `POST`
- **Content-Type**: `application/json` or `application/x-www-form-urlencoded`

### 2. Expected Webhook Payload
The server expects incoming webhooks with the following structure:
```json
{
  "From": "+1234567890",
  "To": "+0987654321", 
  "Body": "balance",
  "MessageSid": "unique_message_id"
}
```

### 3. Test the Setup
Send an SMS to your configured phone number with any of these commands:
- `balance` - Check USDC balance
- `send 25.50 to +1234567890` - Send USDC
- `register` - Create a wallet
- `help` - Show available commands

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `balance` | Check your USDC balance (demo) | `balance` |
| `send <amount> to <phone>` | Send USDC to another number (demo) | `send 25.50 to +1234567890` |
| `help` | Show available commands | `help` |

## API Endpoints

- `GET /` - Server status
- `GET /health` - Health check
- `GET /httpsms/test` - Test HTTPSMS connection
- `POST /sms` - SMS webhook endpoint

## Scripts

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Test SMS sending
npm run test:sms -- +91XXXXXXXXXX

# Build (no build step required for JavaScript)
npm run build
```

## HTTPSMS Integration

The application integrates with HTTPSMS Cloud API for SMS communication.

### HTTPSMS Features

- **Cloud API**: Uses HTTPSMS cloud service for reliable SMS delivery
- **Webhook Support**: Automatic webhook callbacks for incoming SMS
- **Device Management**: Multiple device support with device IDs
- **Security**: API key authentication with x-api-key header
- **E.164 Format**: Automatic phone number normalization

### HTTPSMS API Payload Format

The application sends SMS messages using this payload structure:
```json
{
  "from": "+91XXXXXXXXXX",
  "to": "+1234567890",
  "content": "Your message content",
  "device_id": "device_xxx"
}
```

### HTTPSMS Webhook Format

The `/sms` endpoint expects HTTPSMS webhook payloads with this format:
```json
{
  "from": "+1234567890",
  "to": "+91XXXXXXXXXX", 
  "content": "balance",
  "messageId": "unique_id",
  "timestamp": "2024-01-01T00:00:00Z",
  "deviceId": "device_123"
}
```

**Required fields**: `from`, `content`  
**Optional fields**: `to`, `messageId`, `timestamp`, `deviceId`

### Environment Configuration

Configure HTTPSMS in `.env`:

**Development Configuration:**
```env
# Direct connection to Android device (same network)
HTTPSMS_GATEWAY_URL=http://192.168.1.100:8080
HTTPSMS_API_KEY=your_api_key_here
HTTPSMS_DEVICE_ID=your_device_id_here
HTTPSMS_TIMEOUT=10000
```

**Production Configuration (SSH Tunnel):**
```env
# SSH tunnel to Android device
HTTPSMS_GATEWAY_URL=http://localhost:8080
HTTPSMS_API_KEY=your_secure_api_key_here
HTTPSMS_DEVICE_ID=your_device_id_here
HTTPSMS_TIMEOUT=15000
```

**Production Configuration (VPN/Proxy):**
```env
# Secure tunnel via VPN or proxy service
HTTPSMS_GATEWAY_URL=https://your-secure-tunnel.com/api/messages
HTTPSMS_API_KEY=your_secure_api_key_here
HTTPSMS_DEVICE_ID=your_device_id_here
HTTPSMS_TIMEOUT=20000
```

### Configurable URLs

The service automatically generates URLs based on your gateway configuration:

- **SMS Sending**: `{HTTPSMS_GATEWAY_URL}/send`
- **SMS Receiving**: `{HTTPSMS_GATEWAY_URL}/receive`
- **Device Status**: `{HTTPSMS_GATEWAY_URL}/status`
- **Health Check**: `{HTTPSMS_GATEWAY_URL}/health`

View configured URLs: `GET /httpsms/urls`

## Wallet Service Architecture

The application includes a modular wallet service (`services/walletService.js`) that provides:

- **Mock Data**: Currently uses in-memory storage for development/testing
- **Phone-based Wallets**: Each phone number gets a unique wallet address
- **USDC Transactions**: Support for balance checking and transfers
- **Integration Ready**: Designed for easy integration with real wallet providers

### Integration Hooks

The service includes integration templates for:
- **Circle USDC SDK**: Template in `services/integrations/circleIntegration.js`
- **Other Providers**: Extensible architecture for Coinbase, MetaMask, etc.

### Wallet Functions

```javascript
// Get balance for a phone number
const balance = await walletService.getBalance('+1234567890');

// Send USDC between phone numbers
const transfer = await walletService.sendUSDC('+1234567890', '+0987654321', 25.50);

// Create new wallet
const wallet = await walletService.createWallet('+1234567890');
```

## Project Structure

```
whatsapp-agent/
├── src/
│   ├── server.js                 # Main Express server
│   └── services/
│       └── httpsms.js            # HTTPSMS Cloud API service
├── scripts/
│   └── send-test.js              # End-to-end SMS test script
├── package.json                   # Dependencies and scripts
├── .env.example                  # Environment template
├── .gitignore                     # Git ignore rules
├── nodemon.json                   # Nodemon configuration
└── README.md                      # This file
```

## Troubleshooting

### Common Issues

1. **HTTPSMS API Key Issues**
   - Verify API key is correct in `.env` file
   - Check API key has proper permissions in HTTPSMS dashboard
   - Ensure API key is not expired

2. **Device Connection Issues**
   - Verify device shows "Online" status in HTTPSMS dashboard
   - Check device ID matches the one in `.env` file
   - Ensure Android device has internet connection

3. **Webhook Not Receiving Messages**
   - Verify webhook URL is correct: `https://your-url.ngrok.io/sms`
   - Check ngrok tunnel is active and stable
   - Ensure HTTPSMS dashboard webhook is enabled

4. **SMS Not Sending**
   - Test connection: `curl http://localhost:3000/httpsms/test`
   - Verify FROM number matches registered phone in dashboard
   - Check phone numbers are in E.164 format (+country code)

5. **Environment Variables Not Loading**
   - Ensure `.env` file exists in project root
   - Check `.env` file syntax (no spaces around =)
   - Restart server after changing `.env` file

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

ISC License - see package.json for details
