# Blockchain Analytics Integration

This document describes the blockchain analytics features integrated into the WhatsApp Web3 Agent using The Graph and Substreams.

## Features

### 1. Transaction History
- **User Transaction History**: Get complete transaction history for a user's wallet
- **Transactions Between Users**: Get transaction history between two specific addresses
- **Multi-network Support**: Ethereum, Polygon, Arbitrum, Optimism

**Example Queries:**
- "Show my transaction history"
- "Show my transactions with 0x1234..."
- "Get my last 20 transactions on polygon"

### 2. Token Analytics
- **Token Statistics**: Volume, price, market cap, TVL
- **Historical Data**: 24h, 7d, 30d analytics
- **Token Information**: Symbol, name, decimals, total supply

**Example Queries:**
- "Show analytics for USDC"
- "Token stats for ETH"
- "USDT analytics on polygon"

### 3. Network Statistics
- **Network Overview**: Total volume, TVL, transaction count
- **Top Tokens**: Most active tokens by volume
- **Network Health**: Block time, gas prices, active addresses

**Example Queries:**
- "Show ethereum network stats"
- "Network statistics for polygon"
- "What's the current network status?"

### 4. Real-time Transactions
- **Live Activity**: Real-time transaction monitoring
- **Recent Transactions**: Latest transactions for an address
- **Transaction Details**: Gas usage, status, method calls

**Example Queries:**
- "Show my recent transactions"
- "Real-time activity for 0x1234..."
- "Latest transactions on my wallet"

### 5. DeFi Analytics
- **Protocol Statistics**: TVL, volume, user count
- **Protocol Performance**: Fees, transactions, user growth
- **Multi-protocol Support**: Uniswap, SushiSwap, etc.

**Example Queries:**
- "Show Uniswap analytics"
- "DeFi stats for SushiSwap"
- "Protocol performance for 0x1234..."

## Technical Implementation

### The Graph Integration
- **GraphQL Queries**: Efficient data fetching from indexed blockchain data
- **Subgraph Support**: Multiple subgraphs for different protocols
- **Caching**: Optimized queries with result caching

### Substreams Integration
- **Real-time Data**: Live blockchain data streaming
- **High Performance**: Fast data processing and delivery
- **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Optimism

### Intent Recognition
The system uses Gemini AI to understand natural language queries and extract:
- Intent type (transaction-history, token-analytics, etc.)
- Parameters (addresses, networks, limits)
- Context (timeframes, specific tokens)

## API Endpoints

### The Graph Endpoints
- Ethereum: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3`
- Polygon: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon`
- Arbitrum: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum`
- Optimism: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism`

### Substreams Endpoints
- Ethereum: `https://api.streamingfast.io/substreams/v1/ethereum-mainnet`
- Polygon: `https://api.streamingfast.io/substreams/v1/polygon-mainnet`
- Arbitrum: `https://api.streamingfast.io/substreams/v1/arbitrum-mainnet`
- Optimism: `https://api.streamingfast.io/substreams/v1/optimism-mainnet`

## Configuration

1. Copy `config.example.js` to `config.js`
2. Fill in your API keys:
   - Gemini API Key
   - Substreams API Key
   - The Graph API Key (optional)
   - RPC URLs for different networks

## Usage Examples

### Transaction History
```
User: "Show my transaction history"
Bot: "Found 15 transactions
Total Value: $2,450.50

1. Sent ETH/USDC
   Date: 12/15/2023 14:30:25
   Value: $150.00
   TX: 0x1234abcd...

2. Received USDT/ETH
   Date: 12/14/2023 09:15:10
   Value: $300.00
   TX: 0x5678efgh..."
```

### Token Analytics
```
User: "Show analytics for USDC"
Bot: "Real-time Analytics for USDC

📊 Token Analytics:
Symbol: USDC
Name: USD Coin
Total Supply: 25,000,000,000
Volume (24h): $1,250,000,000
Volume (7d): $8,750,000,000
Transactions: 45,000
TVL: $2,100,000,000
Price (ETH): 0.0005 ETH"
```

### Network Statistics
```
User: "Show ethereum network stats"
Bot: "Real-time Network Statistics

🌐 Network Statistics:
Total Volume: $15,000,000,000
Total Value Locked: $45,000,000,000
Total Transactions: 1,200,000
Total Pairs: 85,000

🏆 Top Tokens:
1. ETH - Vol: $5,000,000,000
2. USDC - Vol: $3,000,000,000
3. USDT - Vol: $2,500,000,000
4. WETH - Vol: $2,000,000,000
5. DAI - Vol: $1,500,000,000"
```

## Error Handling

The system includes comprehensive error handling:
- Invalid addresses
- Network connectivity issues
- API rate limits
- Data parsing errors
- Timeout handling

## Performance Optimization

- **Caching**: Results are cached to reduce API calls
- **Rate Limiting**: Respects API rate limits
- **Batch Queries**: Multiple queries combined when possible
- **Error Recovery**: Graceful fallbacks for failed requests

## Future Enhancements

- **Price Feeds**: Real-time price data integration
- **Portfolio Analytics**: User portfolio tracking
- **Alert System**: Transaction and price alerts
- **Advanced Charts**: Visual data representation
- **Cross-chain Analytics**: Multi-chain portfolio view
