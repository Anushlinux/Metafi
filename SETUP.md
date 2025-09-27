# Setup Guide for WhatsApp Web3 Agent

## 🔐 API Keys Setup

### 1. Get Your API Keys

**Gemini AI API Key:**
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key

**Substreams API Key (Optional):**
- Go to [StreamingFast](https://app.streamingfast.io/)
- Sign up and get your API key
- Copy the key

**The Graph API Key (Optional):**
- Go to [The Graph Studio](https://thegraph.com/studio/)
- Sign up and get your API key
- Copy the key

### 2. Configure Your Keys

1. **Copy the config file:**
   ```bash
   cp config.example.js config.js
   ```

2. **Edit config.js with your API keys:**
   ```javascript
   module.exports = {
     // Gemini AI API Key (REQUIRED)
     GEMINI_API_KEY: 'your_actual_gemini_api_key_here',
     
     // Substreams API Key (OPTIONAL - for real-time data)
     SUBSTREAMS_API_KEY: 'your_substreams_api_key_here',
     
     // The Graph API Key (OPTIONAL - for higher rate limits)
     GRAPH_API_KEY: 'your_graph_api_key_here',
     
     
     // Default settings
     DEFAULT_NETWORK: 'ethereum',
     DEFAULT_TRANSACTION_LIMIT: 50,
     DEFAULT_REALTIME_LIMIT: 20,
     SUPPORTED_NETWORKS: ['ethereum', 'polygon', 'arbitrum', 'optimism']
   };
   ```

## 🚀 Running the Agent

### 1. Install Dependencies
```bash
npm install
```

### 2. Test Basic Functionality (No API keys required)
```bash
npm run test:basic
```

### 3. Test Full Analytics (Requires API keys)
```bash
npm run test:analytics
```

### 4. Start the WhatsApp Agent
```bash
npm start
```

## 🔒 Security Notes

- **config.js is already in .gitignore** - your API keys won't be pushed to git
- **config.example.js** is safe to commit - it contains no real keys
- Never share your API keys publicly
- Keep your config.js file secure

## 📱 Using the Agent

1. Run `npm start`
2. Scan the QR code with WhatsApp
3. Send messages to the bot:

**Example queries:**
- "Show my transaction history"
- "Show analytics for USDC"
- "Show ethereum network stats"
- "Show my recent transactions"
- "Create a new wallet for me"

## 🛠️ Troubleshooting

### Common Issues:

1. **"Could not load the default credentials"**
   - Make sure you've set up your Gemini API key in config.js

2. **"Address validation error"**
   - This is normal for invalid addresses
   - Use valid Ethereum addresses (42 characters starting with 0x)

3. **"Error fetching transaction history"**
   - Make sure you have valid API keys
   - Check your internet connection

### Getting Help:

- Check the logs in the terminal
- Run `npm run test:basic` to verify basic functionality
- Make sure all dependencies are installed: `npm install`

## 📋 What's Included

- ✅ WhatsApp Web3 Agent
- ✅ Blockchain analytics via The Graph
- ✅ Real-time data via Substreams
- ✅ Multi-network support (Ethereum, Polygon, Arbitrum, Optimism)
- ✅ Natural language processing with Gemini AI
- ✅ Transaction history queries
- ✅ Token analytics
- ✅ Network statistics
- ✅ DeFi protocol analytics
- ✅ Secure API key management
- ✅ Comprehensive testing
- ✅ Documentation

## 🎯 Next Steps

1. Set up your API keys
2. Test the basic functionality
3. Run the agent
4. Start chatting with your Web3 wallet bot!
