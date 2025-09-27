// Basic test script for blockchain analytics features (no API keys required)
const GraphService = require('./services/graphService.js');
const SubstreamsService = require('./services/substreamsService.js');

async function testBasicFunctionality() {
    console.log('🧪 Testing Basic Functionality (No API Keys Required)...\n');
    
    const graphService = new GraphService();
    const substreamsService = new SubstreamsService();
    
    // Test 1: Address validation
    console.log('1. Testing Address Validation:');
    const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'; // This is actually invalid
    const knownValidAddress = '0x0000000000000000000000000000000000000000'; // Known valid address
    const invalidAddress = '0xinvalid';
    
    console.log(`   Test address ${validAddress}: ${graphService.isValidAddress(validAddress)}`);
    console.log(`   Known valid address ${knownValidAddress}: ${graphService.isValidAddress(knownValidAddress)}`);
    console.log(`   Invalid address ${invalidAddress}: ${graphService.isValidAddress(invalidAddress)}`);
    console.log(`   Substreams test address: ${substreamsService.isValidAddress(validAddress)}`);
    console.log(`   Substreams known valid: ${substreamsService.isValidAddress(knownValidAddress)}`);
    console.log(`   Substreams invalid address: ${substreamsService.isValidAddress(invalidAddress)}`);
    
    // Test 2: Token value formatting
    console.log('\n2. Testing Token Value Formatting:');
    const tokenValue = '1000000000000000000'; // 1 ETH in wei
    const formattedValue = substreamsService.formatTokenValue(tokenValue, 18);
    console.log(`   ${tokenValue} wei = ${formattedValue} ETH`);
    
    const usdcValue = '1000000'; // 1 USDC (6 decimals)
    const formattedUSDC = substreamsService.formatTokenValue(usdcValue, 6);
    console.log(`   ${usdcValue} wei = ${formattedUSDC} USDC`);
    
    // Test 3: USD value estimation
    console.log('\n3. Testing USD Value Estimation:');
    const ethValue = '1.5';
    const usdValue = substreamsService.estimateUSDValue(ethValue);
    console.log(`   ${ethValue} ETH = $${usdValue} USD`);
    
    // Test 4: Service initialization
    console.log('\n4. Testing Service Initialization:');
    console.log(`   Graph Service endpoints: ${Object.keys(graphService.endpoints).join(', ')}`);
    console.log(`   Substreams Service endpoints: ${Object.keys(substreamsService.endpoints).join(', ')}`);
    console.log(`   Substreams Service modules: ${Object.keys(substreamsService.modules).join(', ')}`);
    
    // Test 5: Response formatting (with mock data)
    console.log('\n5. Testing Response Formatting:');
    
    // Mock transaction history data
    const mockTransactionHistory = {
        message: "Found 3 transactions",
        count: 3,
        totalValueUSD: "1250.50",
        transactions: [
            {
                type: "Sent",
                token0: { symbol: "ETH" },
                token1: { symbol: "USDC" },
                date: "12/15/2023",
                time: "14:30:25",
                usdValue: "500.00",
                txHash: "0x1234abcd5678efgh9012ijkl3456mnop"
            },
            {
                type: "Received",
                token0: { symbol: "USDT" },
                token1: { symbol: "ETH" },
                date: "12/14/2023",
                time: "09:15:10",
                usdValue: "750.50",
                txHash: "0x5678efgh9012ijkl3456mnop7890qrst"
            }
        ]
    };
    
    const formattedHistory = formatTransactionHistoryResponse(mockTransactionHistory);
    console.log('   Formatted transaction history:');
    console.log(formattedHistory);
    
    // Mock token analytics data
    const mockTokenAnalytics = {
        message: "Analytics for USDC",
        analytics: {
            symbol: "USDC",
            name: "USD Coin",
            totalSupply: "25000000000",
            volume24h: "1250000000",
            volume7d: "8750000000",
            txCount: "45000",
            totalValueLockedUSD: "2100000000",
            priceInETH: "0.0005"
        }
    };
    
    const formattedAnalytics = formatTokenAnalyticsResponse(mockTokenAnalytics);
    console.log('\n   Formatted token analytics:');
    console.log(formattedAnalytics);
    
    console.log('\n✅ All basic tests completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Get API keys:');
    console.log('   - Gemini API: https://makersuite.google.com/app/apikey');
    console.log('   - Substreams API: https://app.streamingfast.io/');
    console.log('   - The Graph API: https://thegraph.com/studio/');
    console.log('2. Copy config.example.js to config.js and add your keys');
    console.log('3. Run: npm start');
}

// Response formatting functions (copied from client.js)
function formatTransactionHistoryResponse(result) {
    if (!result.transactions || result.transactions.length === 0) {
        return result.message;
    }
    
    let response = `${result.message}\n\n`;
    response += `Total Value: $${result.totalValueUSD}\n\n`;
    
    result.transactions.slice(0, 10).forEach((tx, index) => {
        response += `${index + 1}. ${tx.type} ${tx.token0.symbol}/${tx.token1.symbol}\n`;
        response += `   Date: ${tx.date} ${tx.time}\n`;
        response += `   Value: $${tx.usdValue}\n`;
        response += `   TX: ${tx.txHash.substring(0, 10)}...\n\n`;
    });
    
    if (result.transactions.length > 10) {
        response += `... and ${result.transactions.length - 10} more transactions`;
    }
    
    return response;
}

function formatTokenAnalyticsResponse(result) {
    if (!result.analytics) {
        return result.message;
    }
    
    const analytics = result.analytics;
    let response = `${result.message}\n\n`;
    response += `📊 Token Analytics:\n`;
    response += `Symbol: ${analytics.symbol}\n`;
    response += `Name: ${analytics.name}\n`;
    response += `Total Supply: ${analytics.totalSupply}\n`;
    response += `Volume (24h): $${analytics.volume24h}\n`;
    response += `Volume (7d): $${analytics.volume7d}\n`;
    response += `Transactions: ${analytics.txCount}\n`;
    response += `TVL: $${analytics.totalValueLockedUSD}\n`;
    response += `Price (ETH): ${analytics.priceInETH} ETH\n`;
    
    return response;
}

// Run tests if this file is executed directly
if (require.main === module) {
    testBasicFunctionality();
}

module.exports = { testBasicFunctionality };
