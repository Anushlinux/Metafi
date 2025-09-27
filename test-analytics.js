// Test script for blockchain analytics features
const { getIntent } = require('./intent.js');
const GraphService = require('./services/graphService.js');
const SubstreamsService = require('./services/substreamsService.js');

// Test messages for different intents
const testMessages = [
    "Show my transaction history",
    "Show my transactions with 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "Show analytics for USDC",
    "Show ethereum network stats",
    "Show my recent transactions",
    "Show Uniswap analytics",
    "Create a new wallet for me",
    "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
];

async function testIntentRecognition() {
    console.log('🧪 Testing Intent Recognition...\n');
    
    for (const message of testMessages) {
        try {
            console.log(`📝 Message: "${message}"`);
            const intentResponse = await getIntent(message);
            const intent = JSON.parse(intentResponse);
            
            console.log(`🎯 Intent: ${intent.intent}`);
            if (intent.message) {
                console.log(`💬 Response: ${intent.message}`);
            }
            if (intent.userAddress) {
                console.log(`👤 User Address: ${intent.userAddress}`);
            }
            if (intent.targetAddress) {
                console.log(`🎯 Target Address: ${intent.targetAddress}`);
            }
            if (intent.tokenAddress) {
                console.log(`🪙 Token Address: ${intent.tokenAddress}`);
            }
            if (intent.network) {
                console.log(`🌐 Network: ${intent.network}`);
            }
            if (intent.limit) {
                console.log(`📊 Limit: ${intent.limit}`);
            }
            
            console.log('---\n');
        } catch (error) {
            console.error(`❌ Error testing message "${message}":`, error.message);
            console.log('---\n');
        }
    }
}

async function testGraphService() {
    console.log('🔍 Testing Graph Service...\n');
    
    const graphService = new GraphService();
    
    // Test address validation
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    console.log(`✅ Address validation for ${testAddress}: ${graphService.isValidAddress(testAddress)}`);
    
    // Test invalid address
    const invalidAddress = '0xinvalid';
    console.log(`❌ Address validation for ${invalidAddress}: ${graphService.isValidAddress(invalidAddress)}`);
    
    console.log('---\n');
}

async function testSubstreamsService() {
    console.log('⚡ Testing Substreams Service...\n');
    
    const substreamsService = new SubstreamsService();
    
    // Test address validation
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    console.log(`✅ Address validation for ${testAddress}: ${substreamsService.isValidAddress(testAddress)}`);
    
    // Test token value formatting
    const tokenValue = '1000000000000000000'; // 1 ETH in wei
    const formattedValue = substreamsService.formatTokenValue(tokenValue, 18);
    console.log(`🪙 Token value formatting: ${tokenValue} wei = ${formattedValue} ETH`);
    
    console.log('---\n');
}

async function runTests() {
    console.log('🚀 Starting Blockchain Analytics Tests\n');
    console.log('=' * 50);
    
    try {
        await testIntentRecognition();
        await testGraphService();
        await testSubstreamsService();
        
        console.log('✅ All tests completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Set up your API keys in config.js');
        console.log('2. Install dependencies: npm install');
        console.log('3. Run the WhatsApp client: node client.js');
        console.log('4. Test with real blockchain data');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testIntentRecognition,
    testGraphService,
    testSubstreamsService,
    runTests
};
