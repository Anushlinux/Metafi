# Test Questions for WhatsApp Web3 Agent

## 🧪 **The Graph (Subgraphs) Test Questions**

### **Transaction History Tests**
```
1. "Show my transaction history"
2. "Show my transactions with 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
3. "Get my last 20 transactions on polygon"
4. "Show transaction history for 0x1234567890123456789012345678901234567890"
5. "What are my recent transactions on arbitrum?"
```

### **Token Analytics Tests**
```
6. "Show analytics for USDC"
7. "Token stats for ETH"
8. "USDT analytics on polygon"
9. "Show me WETH token information"
10. "What's the volume for DAI token?"
```

### **Network Statistics Tests**
```
11. "Show ethereum network stats"
12. "Network statistics for polygon"
13. "What's the current network status?"
14. "Show me arbitrum network overview"
15. "Optimism network statistics"
```

### **Pool Analytics Tests**
```
16. "Show pool analytics for 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
17. "What's the TVL for USDC/ETH pool?"
18. "Show me Uniswap V3 pool stats"
```

---

## ⚡ **Substreams Test Questions**

### **Real-time Transactions Tests**
```
19. "Show my recent transactions"
20. "Real-time activity for 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
21. "Latest transactions on my wallet"
22. "Show me live transactions for 0x1234567890123456789012345678901234567890"
23. "What's happening on ethereum right now?"
```

### **Real-time Token Transfers Tests**
```
24. "Show my recent token transfers"
25. "Live USDC transfers for 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
26. "Real-time ERC-20 transfers"
27. "Show me live token activity"
```

### **Real-time Token Analytics Tests**
```
28. "Show real-time USDC analytics"
29. "Live ETH token stats"
30. "Real-time token volume for USDT"
31. "What's the current price action for WETH?"
```

### **Real-time Network Stats Tests**
```
32. "Show real-time network statistics"
33. "Live ethereum network activity"
34. "Current network health status"
35. "Real-time blockchain metrics"
```

### **DeFi Analytics Tests**
```
36. "Show Uniswap analytics"
37. "DeFi stats for SushiSwap"
38. "Protocol performance for 0x1234567890123456789012345678901234567890"
39. "Live DeFi protocol metrics"
40. "Real-time AAVE statistics"
```

---

## 🔄 **Mixed Tests (Both Services)**

### **Historical vs Real-time Comparison**
```
41. "Show my transaction history and recent activity"
42. "Compare historical vs real-time USDC volume"
43. "Show me both historical and live network stats"
44. "Token analytics: historical and current"
```

### **Multi-network Tests**
```
45. "Show ethereum and polygon network stats"
46. "Compare arbitrum vs optimism activity"
47. "Multi-chain token analytics for USDC"
48. "Cross-chain transaction history"
```

---

## 🎯 **Edge Cases and Error Handling**

### **Invalid Address Tests**
```
49. "Show transactions for 0xinvalid"
50. "Analytics for invalid token address"
51. "Network stats for fake network"
```

### **Empty Data Tests**
```
52. "Show transactions for 0x0000000000000000000000000000000000000000"
53. "Analytics for non-existent token"
54. "History for new wallet with no transactions"
```

### **Network-specific Tests**
```
55. "Show polygon transactions on ethereum network"
56. "Arbitrum stats on optimism"
57. "Cross-network token analytics"
```

---

## 📊 **Performance Tests**

### **Large Data Tests**
```
58. "Show all my transactions" (no limit)
59. "Get 1000 recent transactions"
60. "Show complete token history"
61. "Full network statistics"
```

### **Rate Limit Tests**
```
62. Send multiple rapid requests
63. Test concurrent queries
64. Stress test with multiple users
```

---

## 🚀 **Quick Test Script**

Run these in sequence to test both services:

```bash
# Test The Graph (Subgraphs)
"Show ethereum network stats"
"Show analytics for USDC"
"Show my transaction history"

# Test Substreams
"Show my recent transactions"
"Real-time USDC analytics"
"Live network statistics"

# Test Error Handling
"Show transactions for 0xinvalid"
"Analytics for fake token"
```

---

## 📝 **Expected Responses**

### **The Graph Responses:**
- Historical data with timestamps
- Structured analytics with metrics
- Network statistics with totals
- Transaction history with details

### **Substreams Responses:**
- Real-time data with "live" indicators
- Current network activity
- Recent transactions with status
- Live token metrics

### **Error Responses:**
- Clear error messages
- Suggestions for valid inputs
- Graceful fallbacks
- User-friendly explanations
