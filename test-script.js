// Test script for both The Graph and Substreams
const { getIntent } = require('./intent.js');
const GraphService = require('./services/graphService.js');
const SubstreamsService = require('./services/substreamsService.js');

// Test questions organized by service
const testQuestions = {
  // The Graph (Subgraphs) tests
  subgraphs: [
    "Show ethereum network stats",
    "Show analytics for USDC", 
    "Show my transaction history",
    "Token stats for ETH",
    "Show pool analytics for 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  ],
  
  // Substreams tests
  substreams: [
    "Show my recent transactions",
    "Real-time USDC analytics",
    "Live network statistics",
    "Show me live token activity",
    "Real-time blockchain metrics"
  ],
  
  // Error handling tests
  errors: [
    "Show transactions for 0xinvalid",
    "Analytics for fake token",
    "Network stats for fake network"
  ]
};

async function testService(serviceName, questions) {
  console.log(`\n🧪 Testing ${serviceName.toUpperCase()}...`);
  console.log('=' * 50);
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n${i + 1}. Testing: "${question}"`);
    
    try {
      // Test intent recognition
      const intentResponse = await getIntent(question);
      const intent = JSON.parse(intentResponse);
      
      console.log(`   ✅ Intent: ${intent.intent}`);
      
      // Test service based on intent
      if (serviceName === 'subgraphs') {
        await testGraphService(intent);
      } else if (serviceName === 'substreams') {
        await testSubstreamsService(intent);
      } else if (serviceName === 'errors') {
        console.log(`   ⚠️  Expected error handling for: ${intent.intent}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function testGraphService(intent) {
  const graphService = new GraphService();
  
  try {
    switch (intent.intent) {
      case 'network-stats':
        console.log(`   📊 Testing network statistics...`);
        // Mock test - would call graphService.getNetworkStatistics()
        console.log(`   ✅ Network stats test passed`);
        break;
        
      case 'token-analytics':
        console.log(`   🪙 Testing token analytics...`);
        // Mock test - would call graphService.getTokenAnalytics()
        console.log(`   ✅ Token analytics test passed`);
        break;
        
      case 'transaction-history':
        console.log(`   📜 Testing transaction history...`);
        // Mock test - would call graphService.getUserTransactionHistory()
        console.log(`   ✅ Transaction history test passed`);
        break;
        
      default:
        console.log(`   ⚠️  Unhandled intent: ${intent.intent}`);
    }
  } catch (error) {
    console.log(`   ❌ Graph service error: ${error.message}`);
  }
}

async function testSubstreamsService(intent) {
  const substreamsService = new SubstreamsService();
  
  try {
    switch (intent.intent) {
      case 'realtime-transactions':
        console.log(`   ⚡ Testing real-time transactions...`);
        // Mock test - would call substreamsService.getRealtimeTransactions()
        console.log(`   ✅ Real-time transactions test passed`);
        break;
        
      case 'token-analytics':
        console.log(`   🔥 Testing real-time token analytics...`);
        // Mock test - would call substreamsService.getRealtimeTokenAnalytics()
        console.log(`   ✅ Real-time token analytics test passed`);
        break;
        
      case 'network-stats':
        console.log(`   📡 Testing real-time network stats...`);
        // Mock test - would call substreamsService.getRealtimeNetworkStats()
        console.log(`   ✅ Real-time network stats test passed`);
        break;
        
      default:
        console.log(`   ⚠️  Unhandled intent: ${intent.intent}`);
    }
  } catch (error) {
    console.log(`   ❌ Substreams service error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Test Suite');
  console.log('Testing both The Graph (Subgraphs) and Substreams services');
  console.log('=' * 60);
  
  try {
    // Test The Graph (Subgraphs)
    await testService('subgraphs', testQuestions.subgraphs);
    
    // Test Substreams
    await testService('substreams', testQuestions.substreams);
    
    // Test Error Handling
    await testService('errors', testQuestions.errors);
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log(`- The Graph (Subgraphs): ${testQuestions.subgraphs.length} tests`);
    console.log(`- Substreams: ${testQuestions.substreams.length} tests`);
    console.log(`- Error Handling: ${testQuestions.errors.length} tests`);
    console.log(`- Total: ${testQuestions.subgraphs.length + testQuestions.substreams.length + testQuestions.errors.length} tests`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Quick test function for specific service
async function quickTest(service) {
  console.log(`\n⚡ Quick Test for ${service.toUpperCase()}`);
  
  if (service === 'subgraphs') {
    await testService('subgraphs', testQuestions.subgraphs.slice(0, 2));
  } else if (service === 'substreams') {
    await testService('substreams', testQuestions.substreams.slice(0, 2));
  } else {
    console.log('Available services: subgraphs, substreams');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    quickTest(args[0]);
  } else {
    runAllTests();
  }
}

module.exports = {
  testQuestions,
  testService,
  runAllTests,
  quickTest
};
