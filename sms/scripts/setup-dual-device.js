#!/usr/bin/env node

require('dotenv').config();
const { 
  configureWebhookDevice1, 
  configureWebhookDevice2, 
  getWebhookConfigDevice1, 
  getWebhookConfigDevice2, 
  testConnectionDevice1, 
  testConnectionDevice2 
} = require('../src/services/httpsms');

/**
 * Dual Device Webhook Setup Script
 * Configures both Device 1 and Device 2 webhooks for dual SMS gateway
 */

class DualDeviceSetup {
  constructor() {
    this.baseUrl = process.argv[2] || 'http://localhost:3000';
    this.ngrokUrl = process.argv[3];
  }

  /**
   * Test Device 1 connection
   */
  async testDevice1Connection() {
    console.log('🔗 Testing Device 1 connection...');
    
    try {
      const result = await testConnectionDevice1();
      
      if (result.success) {
        console.log('✅ Device 1 connection successful');
        console.log(`   Status: ${result.status}`);
        return true;
      } else {
        console.log('❌ Device 1 connection failed');
        console.log(`   Error: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Device 1 connection test failed');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test Device 2 connection
   */
  async testDevice2Connection() {
    console.log('🔗 Testing Device 2 connection...');
    
    try {
      const result = await testConnectionDevice2();
      
      if (result.success) {
        console.log('✅ Device 2 connection successful');
        console.log(`   Status: ${result.status}`);
        return true;
      } else {
        console.log('❌ Device 2 connection failed');
        console.log(`   Error: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Device 2 connection test failed');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current webhook configuration for Device 1
   */
  async getCurrentDevice1Webhooks() {
    console.log('\n📋 Getting current Device 1 webhook configuration...');
    
    try {
      const result = await getWebhookConfigDevice1();
      
      if (result.success) {
        console.log('✅ Device 1 webhook configuration retrieved');
        console.log(`   Webhooks: ${JSON.stringify(result.webhooks, null, 2)}`);
        return result.webhooks;
      } else {
        console.log('❌ Failed to get Device 1 webhook configuration');
        return null;
      }
    } catch (error) {
      console.log('❌ Error getting Device 1 webhook configuration');
      console.log(`   Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get current webhook configuration for Device 2
   */
  async getCurrentDevice2Webhooks() {
    console.log('\n📋 Getting current Device 2 webhook configuration...');
    
    try {
      const result = await getWebhookConfigDevice2();
      
      if (result.success) {
        console.log('✅ Device 2 webhook configuration retrieved');
        console.log(`   Webhooks: ${JSON.stringify(result.webhooks, null, 2)}`);
        return result.webhooks;
      } else {
        console.log('❌ Failed to get Device 2 webhook configuration');
        return null;
      }
    } catch (error) {
      console.log('❌ Error getting Device 2 webhook configuration');
      console.log(`   Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Configure Device 1 webhook
   */
  async configureDevice1Webhook(webhookUrl) {
    console.log(`\n🔧 Configuring Device 1 webhook: ${webhookUrl}`);
    
    try {
      const result = await configureWebhookDevice1(webhookUrl);
      
      if (result.success) {
        console.log('✅ Device 1 webhook configured successfully');
        console.log(`   URL: ${result.webhookUrl}`);
        console.log(`   Action: ${result.action}`);
        return true;
      } else {
        console.log('❌ Device 1 webhook configuration failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Error configuring Device 1 webhook');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Configure Device 2 webhook
   */
  async configureDevice2Webhook(webhookUrl) {
    console.log(`\n🔧 Configuring Device 2 webhook: ${webhookUrl}`);
    
    try {
      const result = await configureWebhookDevice2(webhookUrl);
      
      if (result.success) {
        console.log('✅ Device 2 webhook configured successfully');
        console.log(`   URL: ${result.webhookUrl}`);
        console.log(`   Action: ${result.action}`);
        return true;
      } else {
        console.log('❌ Device 2 webhook configuration failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Error configuring Device 2 webhook');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test webhook endpoints
   */
  async testWebhookEndpoints() {
    console.log('\n🧪 Testing webhook endpoints...');
    
    try {
      const fetch = require('node-fetch');
      
      // Test Device 1 webhook
      const device1Response = await fetch(`${this.baseUrl}/device1/incoming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.HTTPSMS_FROM_NUMBER_DEVICE1 || '+1234567890',
          content: 'test webhook device1'
        })
      });
      
      if (device1Response.ok) {
        console.log('✅ Device 1 webhook endpoint test successful');
      } else {
        console.log('❌ Device 1 webhook endpoint test failed');
        console.log(`   Status: ${device1Response.status}`);
      }

      // Test Device 2 webhook
      const device2Response = await fetch(`${this.baseUrl}/device2/incoming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.HTTPSMS_FROM_NUMBER_DEVICE2 || '+1234567890',
          content: 'test webhook device2'
        })
      });
      
      if (device2Response.ok) {
        console.log('✅ Device 2 webhook endpoint test successful');
      } else {
        console.log('❌ Device 2 webhook endpoint test failed');
        console.log(`   Status: ${device2Response.status}`);
      }

      return device1Response.ok && device2Response.ok;
    } catch (error) {
      console.log('❌ Error testing webhook endpoints');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Show usage instructions
   */
  showUsage() {
    console.log('\n📖 Usage Instructions:');
    console.log('======================');
    console.log('');
    console.log('1. Start your server:');
    console.log('   npm run dev');
    console.log('');
    console.log('2. Start ngrok tunnel (in another terminal):');
    console.log('   ngrok http 3000');
    console.log('');
    console.log('3. Configure dual device webhooks:');
    console.log('   node scripts/setup-dual-device.js [base-url] [ngrok-url]');
    console.log('');
    console.log('   Example:');
    console.log('   node scripts/setup-dual-device.js http://localhost:3000 https://abc123.ngrok.io');
    console.log('');
    console.log('4. Test dual device setup:');
    console.log('   npm run test:dual-device');
    console.log('');
    console.log('💡 Tips:');
    console.log('   • Make sure your .env file has both Device 1 and Device 2 configuration');
    console.log('   • Device 1 is used for outgoing messages');
    console.log('   • Device 2 is used for incoming messages');
    console.log('   • Use ngrok or similar service for public webhook URLs');
    console.log('');
  }

  /**
   * Run the complete dual device setup
   */
  async runSetup() {
    console.log('🚀 Dual Device Webhook Setup');
    console.log('============================');
    console.log('');
    
    // Check if ngrok URL is provided
    if (!this.ngrokUrl) {
      console.log('❌ Ngrok URL is required');
      this.showUsage();
      return false;
    }
    
    // Test Device 1 connection
    const device1ConnectionOk = await this.testDevice1Connection();
    if (!device1ConnectionOk) {
      console.log('\n❌ Cannot proceed without Device 1 connection');
      return false;
    }
    
    // Test Device 2 connection
    const device2ConnectionOk = await this.testDevice2Connection();
    if (!device2ConnectionOk) {
      console.log('\n❌ Cannot proceed without Device 2 connection');
      return false;
    }
    
    // Get current webhooks
    await this.getCurrentDevice1Webhooks();
    await this.getCurrentDevice2Webhooks();
    
    // Configure Device 1 webhook
    const device1WebhookUrl = `${this.ngrokUrl}/device1/incoming`;
    const device1WebhookOk = await this.configureDevice1Webhook(device1WebhookUrl);
    if (!device1WebhookOk) {
      console.log('\n❌ Device 1 webhook configuration failed');
      return false;
    }
    
    // Configure Device 2 webhook
    const device2WebhookUrl = `${this.ngrokUrl}/device2/incoming`;
    const device2WebhookOk = await this.configureDevice2Webhook(device2WebhookUrl);
    if (!device2WebhookOk) {
      console.log('\n❌ Device 2 webhook configuration failed');
      return false;
    }
    
    // Test webhook endpoints
    await this.testWebhookEndpoints();
    
    console.log('\n✅ Dual device setup completed successfully!');
    console.log('');
    console.log('🎉 Your dual device SMS gateway is now configured:');
    console.log('   • Device 1 (outgoing): ' + device1WebhookUrl);
    console.log('   • Device 2 (incoming): ' + device2WebhookUrl);
    console.log('');
    console.log('📱 Next steps:');
    console.log('   1. Test the setup: npm run test:dual-device');
    console.log('   2. Send SMS to Device 2 number from another device');
    console.log('   3. Check server logs for incoming webhooks');
    console.log('   4. Test different commands: help, balance, send');
    console.log('');
    
    return true;
  }
}

// Main execution
async function main() {
  const setup = new DualDeviceSetup();
  
  try {
    const success = await setup.runSetup();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Dual device setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DualDeviceSetup;
