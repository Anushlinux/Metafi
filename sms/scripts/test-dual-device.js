#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

/**
 * Dual Device Test Script
 * Tests the dual device SMS gateway functionality
 */

class DualDeviceTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testPhone = '+919324617696'; 
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
   * Wait for a specified time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test server health
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
   * Test Device 1 connection
   */
  async testDevice1Connection() {
    console.log('\n📱 Testing Device 1 Connection...');
    
    const result = await this.request('GET', '/device1/test');
    
    if (result.success) {
      console.log('✅ Device 1 connection successful');
      console.log(`   Device: ${result.data.device}`);
      console.log(`   Status: ${result.data.status}`);
    } else {
      console.log('❌ Device 1 connection failed');
      console.log(`   Error: ${result.data.error}`);
    }

    return result.success;
  }

  /**
   * Test Device 2 connection
   */
  async testDevice2Connection() {
    console.log('\n📱 Testing Device 2 Connection...');
    
    const result = await this.request('GET', '/device2/test');
    
    if (result.success) {
      console.log('✅ Device 2 connection successful');
      console.log(`   Device: ${result.data.device}`);
      console.log(`   Status: ${result.data.status}`);
    } else {
      console.log('❌ Device 2 connection failed');
      console.log(`   Error: ${result.data.error}`);
    }

    return result.success;
  }

  /**
   * Test Device 1 webhook status
   */
  async testDevice1WebhookStatus() {
    console.log('\n🔗 Testing Device 1 Webhook Status...');
    
    const result = await this.request('GET', '/device1/webhook/status');
    
    if (result.success) {
      console.log('✅ Device 1 webhook status retrieved');
      console.log(`   Webhooks: ${JSON.stringify(result.data.webhooks, null, 2)}`);
    } else {
      console.log('❌ Failed to get Device 1 webhook status');
      console.log(`   Error: ${result.data.error}`);
    }

    return result.success;
  }

  /**
   * Test Device 2 webhook status
   */
  async testDevice2WebhookStatus() {
    console.log('\n🔗 Testing Device 2 Webhook Status...');
    
    const result = await this.request('GET', '/device2/webhook/status');
    
    if (result.success) {
      console.log('✅ Device 2 webhook status retrieved');
      console.log(`   Webhooks: ${JSON.stringify(result.data.webhooks, null, 2)}`);
    } else {
      console.log('❌ Failed to get Device 2 webhook status');
      console.log(`   Error: ${result.data.error}`);
    }

    return result.success;
  }

  /**
   * Simulate Device 1 webhook
   */
  async simulateDevice1Webhook(from, content) {
    console.log(`📱 Simulating Device 1 webhook from ${from}: "${content}"`);
    
    const result = await this.request('POST', '/device1/incoming', {
      from,
      content
    });

    if (result.success) {
      console.log(`✅ Device 1 webhook processed successfully`);
    } else {
      console.log(`❌ Device 1 webhook processing failed:`, result.error || result.data);
    }

    return result;
  }

  /**
   * Simulate Device 2 webhook
   */
  async simulateDevice2Webhook(from, content) {
    console.log(`📱 Simulating Device 2 webhook from ${from}: "${content}"`);
    
    const result = await this.request('POST', '/device2/incoming', {
      from,
      content
    });

    if (result.success) {
      console.log(`✅ Device 2 webhook processed successfully`);
    } else {
      console.log(`❌ Device 2 webhook processing failed:`, result.error || result.data);
    }

    return result;
  }

  /**
   * Test dual device conversation flow
   */
  async testDualDeviceConversation() {
    console.log('\n💬 Testing Dual Device Conversation Flow...');
    
    // Test 1: Help conversation via Device 2 (incoming)
    console.log('\n🤖 Test 1: Help Conversation via Device 2');
    await this.simulateDevice2Webhook(this.testPhone, 'help');
    await this.wait(1000);

    // Test 2: Send money flow via Device 2 (incoming)
    console.log('\n💸 Test 2: Send Money Flow via Device 2');
    
    // Start send conversation
    await this.simulateDevice2Webhook(this.testPhone, 'send');
    await this.wait(1000);
    
    // Provide amount
    await this.simulateDevice2Webhook(this.testPhone, '25.50');
    await this.wait(1000);
    
    // Provide recipient
    await this.simulateDevice2Webhook(this.testPhone, '+1555123456');
    await this.wait(1000);
    
    // Confirm transaction
    await this.simulateDevice2Webhook(this.testPhone, 'yes');
    await this.wait(1000);

    // Test 3: Balance check via Device 2 (incoming)
    console.log('\n💰 Test 3: Balance Check via Device 2');
    await this.simulateDevice2Webhook(this.testPhone, 'balance');
    await this.wait(1000);

    // Test 4: Device 1 delivery status
    console.log('\n📊 Test 4: Device 1 Delivery Status');
    await this.simulateDevice1Webhook(this.testPhone, '');
    await this.wait(1000);

    return true;
  }

  /**
   * Test webhook configuration
   */
  async testWebhookConfiguration() {
    console.log('\n⚙️ Testing Webhook Configuration...');
    
    const ngrokUrl = process.argv[2] || 'https://abc123.ngrok.io';
    
    // Configure Device 1 webhook
    console.log('\n🔧 Configuring Device 1 webhook...');
    const device1Result = await this.request('POST', '/device1/webhook/configure', {
      webhookUrl: `${ngrokUrl}/device1/incoming`
    });
    
    if (device1Result.success) {
      console.log('✅ Device 1 webhook configured successfully');
    } else {
      console.log('❌ Device 1 webhook configuration failed');
      console.log(`   Error: ${device1Result.data.error}`);
    }

    // Configure Device 2 webhook
    console.log('\n🔧 Configuring Device 2 webhook...');
    const device2Result = await this.request('POST', '/device2/webhook/configure', {
      webhookUrl: `${ngrokUrl}/device2/incoming`
    });
    
    if (device2Result.success) {
      console.log('✅ Device 2 webhook configured successfully');
    } else {
      console.log('❌ Device 2 webhook configuration failed');
      console.log(`   Error: ${device2Result.data.error}`);
    }

    return device1Result.success && device2Result.success;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Dual Device Tests');
    console.log('==============================');
    
    const tests = [
      { name: 'Server Health', fn: () => this.testServerHealth() },
      { name: 'Device 1 Connection', fn: () => this.testDevice1Connection() },
      { name: 'Device 2 Connection', fn: () => this.testDevice2Connection() },
      { name: 'Device 1 Webhook Status', fn: () => this.testDevice1WebhookStatus() },
      { name: 'Device 2 Webhook Status', fn: () => this.testDevice2WebhookStatus() },
      { name: 'Dual Device Conversation', fn: () => this.testDualDeviceConversation() }
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
  const tester = new DualDeviceTester(baseUrl);
  
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

module.exports = DualDeviceTester;
