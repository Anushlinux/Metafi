#!/usr/bin/env node

require('dotenv').config();
const ConversationManager = require('../src/services/conversationManager');

/**
 * Simple Demo Script - Test conversation logic without SMS sending
 */
class ConversationDemo {
  constructor() {
    this.conversationManager = new ConversationManager();
    this.testPhone = '+919324617696'; // Use your actual phone number
  }

  /**
   * Mock SMS sending for demo purposes
   */
  async mockSendSMS(phoneNumber, content) {
    console.log(`📱 [MOCK SMS] To ${phoneNumber}:`);
    console.log(`   ${content}`);
    console.log('');
    return { success: true, mock: true };
  }

  /**
   * Override the sendMessage method for demo
   */
  async demoConversation() {
    // Override the sendMessage method to use mock
    this.conversationManager.sendMessage = this.mockSendSMS.bind(this);

    console.log('🎭 Conversation Demo - Multi-turn SMS Flow');
    console.log('==========================================');
    console.log('');

    try {
      // Test 1: Help conversation
      console.log('🤖 Test 1: Help Conversation');
      console.log('----------------------------');
      await this.conversationManager.startConversation(this.testPhone, 'help');
      await this.wait(1000);

      // Test 2: Send money flow
      console.log('💸 Test 2: Send Money Flow');
      console.log('--------------------------');
      
      // Start send conversation
      await this.conversationManager.startConversation(this.testPhone, 'send');
      await this.wait(1000);
      
      // Provide amount
      await this.conversationManager.handleReply(this.testPhone, '25.50');
      await this.wait(1000);
      
      // Provide recipient
      await this.conversationManager.handleReply(this.testPhone, '+1555123456');
      await this.wait(1000);
      
      // Confirm transaction
      await this.conversationManager.handleReply(this.testPhone, 'yes');
      await this.wait(1000);

      // Test 3: Balance check
      console.log('💰 Test 3: Balance Check');
      console.log('------------------------');
      await this.conversationManager.startConversation(this.testPhone, 'balance');
      await this.wait(1000);

      // Test 4: Invalid input handling
      console.log('🚫 Test 4: Invalid Input Handling');
      console.log('----------------------------------');
      await this.conversationManager.startConversation(this.testPhone, 'send');
      await this.wait(1000);
      await this.conversationManager.handleReply(this.testPhone, 'invalid amount');
      await this.wait(1000);

      // Show session stats
      console.log('📊 Session Statistics');
      console.log('--------------------');
      try {
        const stats = await this.conversationManager.getStats();
        console.log(`   Total sessions: ${stats.totalSessions}`);
        console.log(`   Waiting sessions: ${stats.waitingSessions}`);
        console.log(`   Active sessions: ${stats.activeSessions}`);
        console.log('');
      } catch (error) {
        console.log('   Session stats not available in demo mode');
        console.log('');
      }

      console.log('✅ Demo completed successfully!');
      console.log('');
      console.log('💡 Key Features Demonstrated:');
      console.log('   • Session creation and management');
      console.log('   • Multi-turn conversation flows');
      console.log('   • State tracking (waiting for user input)');
      console.log('   • Context preservation between messages');
      console.log('   • Error handling for invalid inputs');
      console.log('   • Automatic session cleanup');

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }

  /**
   * Wait for specified milliseconds
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run demo
async function main() {
  const demo = new ConversationDemo();
  await demo.demoConversation();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ConversationDemo;
