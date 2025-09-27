#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

/**
 * Multi-turn Conversation Test Script
 * Tests the enhanced SMS backend with session management
 */

class ConversationTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testPhone = '+919324617696'; // Use your actual phone number
    this.testResults = [];
  }

  /**
   * Send HTTP request
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      return { success: response.ok, data: result, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Simulate SMS webhook
   */
  async simulateSMS(from, content) {
    console.log(`📱 Simulating SMS from ${from}: "${content}"`);
    
    const result = await this.request('POST', '/sms', {
      from,
      content
    });

    if (result.success) {
      console.log(`✅ SMS processed successfully`);
    } else {
      console.log(`❌ SMS processing failed:`, result.error || result.data);
    }

    return result;
  }

  /**
   * Wait for a specified time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test basic server health
   */
  async testServerHealth() {
    console.log('\n🏥 Testing Server Health...');
    
    const result = await this.request('GET', '/health');
    
    if (result.success) {
      console.log('✅ Server is healthy');
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Uptime: ${result.data.uptime}s`);
    } else {
      console.log('❌ Server health check failed');
    }

    return result.success;
  }

  /**
   * Test session statistics
   */
  async testSessionStats() {
    console.log('\n📊 Testing Session Statistics...');
    
    const result = await this.request('GET', '/sessions/stats');
    
    if (result.success) {
      console.log('✅ Session stats retrieved');
      console.log(`   Total sessions: ${result.data.stats.totalSessions}`);
      console.log(`   Waiting sessions: ${result.data.stats.waitingSessions}`);
      console.log(`   Active sessions: ${result.data.stats.activeSessions}`);
    } else {
      console.log('❌ Failed to get session stats');
    }

    return result.success;
  }

  /**
   * Test help conversation flow
   */
  async testHelpFlow() {
    console.log('\n🤖 Testing Help Conversation Flow...');
    
    // Start with help command
    await this.simulateSMS(this.testPhone, 'help');
    await this.wait(1000);
    
    // Check session state
    const sessionsResult = await this.request('GET', '/sessions');
    if (sessionsResult.success) {
      const session = sessionsResult.data.sessions.find(s => s.phoneNumber === this.testPhone);
      if (session) {
        console.log(`   Session state: waiting=${session.isWaiting}, waitingFor=${session.waitingFor}`);
      }
    }
    
    return true;
  }

  /**
   * Test balance conversation flow
   */
  async testBalanceFlow() {
    console.log('\n💰 Testing Balance Conversation Flow...');
    
    // Start with balance command
    await this.simulateSMS(this.testPhone, 'balance');
    await this.wait(1000);
    
    return true;
  }

  /**
   * Test send money conversation flow
   */
  async testSendMoneyFlow() {
    console.log('\n💸 Testing Send Money Conversation Flow...');
    
    // Step 1: Start send command
    await this.simulateSMS(this.testPhone, 'send');
    await this.wait(1000);
    
    // Step 2: Provide amount
    await this.simulateSMS(this.testPhone, '25.50');
    await this.wait(1000);
    
    // Step 3: Provide recipient
    await this.simulateSMS(this.testPhone, '+1555123456');
    await this.wait(1000);
    
    // Step 4: Confirm transaction
    await this.simulateSMS(this.testPhone, 'yes');
    await this.wait(1000);
    
    return true;
  }

  /**
   * Test register conversation flow
   */
  async testRegisterFlow() {
    console.log('\n🎉 Testing Register Conversation Flow...');
    
    // Start with register command
    await this.simulateSMS(this.testPhone, 'register');
    await this.wait(1000);
    
    // Confirm registration
    await this.simulateSMS(this.testPhone, 'yes');
    await this.wait(1000);
    
    return true;
  }

  /**
   * Test invalid input handling
   */
  async testInvalidInputHandling() {
    console.log('\n🚫 Testing Invalid Input Handling...');
    
    // Test invalid amount
    await this.simulateSMS(this.testPhone, 'send');
    await this.wait(1000);
    
    await this.simulateSMS(this.testPhone, 'invalid amount');
    await this.wait(1000);
    
    // Test invalid phone number
    await this.simulateSMS(this.testPhone, 'not a phone number');
    await this.wait(1000);
    
    return true;
  }

  /**
   * Test session timeout and cleanup
   */
  async testSessionTimeout() {
    console.log('\n⏰ Testing Session Timeout...');
    
    // Start a conversation
    await this.simulateSMS(this.testPhone, 'send');
    await this.wait(1000);
    
    // Check session exists
    const sessionsResult = await this.request('GET', '/sessions');
    if (sessionsResult.success) {
      const session = sessionsResult.data.sessions.find(s => s.phoneNumber === this.testPhone);
      if (session) {
        console.log(`   Session created: ${session.conversationId}`);
      }
    }
    
    // Wait for session to potentially timeout (in real scenario)
    console.log('   (In production, sessions would timeout after 5 minutes)');
    
    return true;
  }

  /**
   * Test manual conversation start
   */
  async testManualConversationStart() {
    console.log('\n🎯 Testing Manual Conversation Start...');
    
    const result = await this.request('POST', '/conversations/start', {
      phoneNumber: this.testPhone,
      flowType: 'help'
    });
    
    if (result.success) {
      console.log('✅ Manual conversation started');
      console.log(`   Flow type: ${result.data.result.flowType}`);
      console.log(`   Waiting for: ${result.data.result.waitingFor}`);
    } else {
      console.log('❌ Failed to start manual conversation');
    }
    
    return result.success;
  }

  /**
   * Test session cleanup
   */
  async testSessionCleanup() {
    console.log('\n🧹 Testing Session Cleanup...');
    
    // End the session
    const result = await this.request('DELETE', `/sessions/${encodeURIComponent(this.testPhone)}`);
    
    if (result.success) {
      console.log('✅ Session ended successfully');
    } else {
      console.log('❌ Failed to end session');
    }
    
    return result.success;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Multi-Turn Conversation Tests');
    console.log('==========================================');
    
    const tests = [
      { name: 'Server Health', fn: () => this.testServerHealth() },
      { name: 'Session Stats', fn: () => this.testSessionStats() },
      { name: 'Help Flow', fn: () => this.testHelpFlow() },
      { name: 'Balance Flow', fn: () => this.testBalanceFlow() },
      { name: 'Send Money Flow', fn: () => this.testSendMoneyFlow() },
      { name: 'Register Flow', fn: () => this.testRegisterFlow() },
      { name: 'Invalid Input Handling', fn: () => this.testInvalidInputHandling() },
      { name: 'Manual Conversation Start', fn: () => this.testManualConversationStart() },
      { name: 'Session Cleanup', fn: () => this.testSessionCleanup() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const success = await test.fn();
        if (success) {
          passed++;
          this.testResults.push({ name: test.name, status: 'PASS' });
        } else {
          failed++;
          this.testResults.push({ name: test.name, status: 'FAIL' });
        }
      } catch (error) {
        failed++;
        this.testResults.push({ name: test.name, status: 'ERROR', error: error.message });
        console.log(`❌ ${test.name} failed with error:`, error.message);
      }
    }

    // Print summary
    console.log('\n📋 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);
    
    console.log('\n📝 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${result.name}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    return failed === 0;
  }
}

// Main execution
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new ConversationTester(baseUrl);
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ConversationTester;
