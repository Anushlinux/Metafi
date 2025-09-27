#!/usr/bin/env node

require('dotenv').config();
const { configureWebhook, getWebhookConfig, testConnection } = require('../src/services/httpsms');

/**
 * HTTPSMS Webhook Setup Script
 * Configures HTTPSMS Cloud API to forward incoming messages to your webhook
 */

class WebhookSetup {
  constructor() {
    this.baseUrl = process.argv[2] || 'http://localhost:3000';
    this.webhookUrl = process.argv[3];
  }

  /**
   * Test HTTPSMS connection
   */
  async testConnection() {
    console.log('🔗 Testing HTTPSMS connection...');
    
    try {
      const result = await testConnection();
      
      if (result.success) {
        console.log('✅ HTTPSMS connection successful');
        console.log(`   Status: ${result.status}`);
        return true;
      } else {
        console.log('❌ HTTPSMS connection failed');
        console.log(`   Error: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.log('❌ HTTPSMS connection test failed');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current webhook configuration
   */
  async getCurrentWebhooks() {
    console.log('\n📋 Getting current webhook configuration...');
    
    try {
      const result = await getWebhookConfig();
      
      if (result.success) {
        console.log('✅ Webhook configuration retrieved');
        console.log(`   Webhooks: ${JSON.stringify(result.webhooks, null, 2)}`);
        return result.webhooks;
      } else {
        console.log('❌ Failed to get webhook configuration');
        return null;
      }
    } catch (error) {
      console.log('❌ Error getting webhook configuration');
      console.log(`   Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Configure webhook URL
   */
  async configureWebhook(webhookUrl) {
    console.log(`\n🔧 Configuring webhook: ${webhookUrl}`);
    
    try {
      const result = await configureWebhook(webhookUrl);
      
      if (result.success) {
        console.log('✅ Webhook configured successfully');
        console.log(`   URL: ${result.webhookUrl}`);
        console.log(`   Result: ${JSON.stringify(result.result, null, 2)}`);
        return true;
      } else {
        console.log('❌ Webhook configuration failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Error configuring webhook');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test webhook by sending a test message
   */
  async testWebhook() {
    console.log('\n🧪 Testing webhook with a test message...');
    
    try {
      const fetch = require('node-fetch');
      
      // Send a test message to trigger webhook
      const response = await fetch(`${this.baseUrl}/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.HTTPSMS_FROM_NUMBER || '+1234567890',
          content: 'test webhook'
        })
      });
      
      if (response.ok) {
        console.log('✅ Test webhook call successful');
        console.log('   Check your server logs for incoming webhook');
        return true;
      } else {
        console.log('❌ Test webhook call failed');
        console.log(`   Status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Error testing webhook');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Show usage instructions
   */
  showUsage() {
    console.log('\n📖 Usage Instructions:');
    console.log('=====================');
    console.log('');
    console.log('1. Start your server:');
    console.log('   npm run dev');
    console.log('');
    console.log('2. Start ngrok tunnel (in another terminal):');
    console.log('   ngrok http 3000');
    console.log('');
    console.log('3. Configure webhook:');
    console.log('   node scripts/setup-webhook.js [base-url] [webhook-url]');
    console.log('');
    console.log('   Example:');
    console.log('   node scripts/setup-webhook.js http://localhost:3000 https://abc123.ngrok.io/sms');
    console.log('');
    console.log('4. Test manual SMS:');
    console.log('   Send an SMS to your phone number from another device');
    console.log('   Check server logs for incoming webhook');
    console.log('');
    console.log('💡 Tips:');
    console.log('   • Make sure your .env file has correct HTTPSMS configuration');
    console.log('   • Use ngrok or similar service for public webhook URL');
    console.log('   • Test with different phone numbers');
    console.log('');
  }

  /**
   * Run the complete setup
   */
  async runSetup() {
    console.log('🚀 HTTPSMS Webhook Setup');
    console.log('========================');
    console.log('');
    
    // Check if webhook URL is provided
    if (!this.webhookUrl) {
      console.log('❌ Webhook URL is required');
      this.showUsage();
      return false;
    }
    
    // Test connection
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.log('\n❌ Cannot proceed without HTTPSMS connection');
      return false;
    }
    
    // Get current webhooks
    await this.getCurrentWebhooks();
    
    // Configure webhook
    const webhookOk = await this.configureWebhook(this.webhookUrl);
    if (!webhookOk) {
      console.log('\n❌ Webhook configuration failed');
      return false;
    }
    
    // Test webhook
    await this.testWebhook();
    
    console.log('\n✅ Setup completed successfully!');
    console.log('');
    console.log('🎉 Your HTTPSMS is now configured to forward incoming messages');
    console.log('   to your webhook endpoint.');
    console.log('');
    console.log('📱 Next steps:');
    console.log('   1. Send an SMS to your phone number from another device');
    console.log('   2. Check your server logs for incoming webhook');
    console.log('   3. Test different commands: help, balance, send');
    console.log('');
    
    return true;
  }
}

// Main execution
async function main() {
  const setup = new WebhookSetup();
  
  try {
    const success = await setup.runSetup();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = WebhookSetup;
