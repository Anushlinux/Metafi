const { sendSMS } = require('./httpsms');
const { SessionManager } = require('./sessionManager');

/**
 * Conversation Manager for handling multi-turn SMS conversations
 */
class ConversationManager {
  constructor() {
    this.sessionManager = new SessionManager();
    this.conversationFlows = new Map();
    
    // Register default conversation flows
    this.registerDefaultFlows();
  }

  /**
   * Register default conversation flows
   */
  registerDefaultFlows() {
    // Balance inquiry flow
    this.conversationFlows.set('balance', {
      name: 'Balance Inquiry',
      steps: ['initial', 'complete']
    });

    // Send money flow
    this.conversationFlows.set('send', {
      name: 'Send Money',
      steps: ['initial', 'amount', 'recipient', 'confirmation', 'complete']
    });

    // Help flow
    this.conversationFlows.set('help', {
      name: 'Help',
      steps: ['initial', 'complete']
    });

    // Wallet creation flow
    this.conversationFlows.set('register', {
      name: 'Wallet Registration',
      steps: ['initial', 'confirmation', 'complete']
    });
  }

  /**
   * Start a new conversation
   */
  async startConversation(phoneNumber, flowType = 'help') {
    try {
      console.log(`[ConversationManager] Starting ${flowType} conversation for ${phoneNumber}`);
      
      const session = await this.sessionManager.getOrCreateSession(phoneNumber);
      
      // Clear any existing waiting state
      session.clearWaiting();
      
      // Add initial bot message
      const initialMessage = this.getInitialMessage(flowType);
      session.addMessage('bot', initialMessage, { flowType });
      
      // Set waiting state based on flow type
      const nextStep = this.getNextStep(flowType, 'initial');
      if (nextStep && nextStep !== 'complete') {
        session.setWaiting(nextStep, { flowType, step: 'initial' });
      }
      
      // Send initial message
      await this.sendMessage(phoneNumber, initialMessage);
      
      // Update session
      await this.sessionManager.updateSession(phoneNumber, session);
      
      return {
        success: true,
        flowType,
        message: initialMessage,
        waitingFor: session.waitingFor
      };
      
    } catch (error) {
      console.error(`[ConversationManager] Error starting conversation for ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Handle user reply
   */
  async handleReply(phoneNumber, userMessage) {
    try {
      console.log(`[ConversationManager] Handling reply from ${phoneNumber}: ${userMessage}`);
      
      const session = await this.sessionManager.getSession(phoneNumber);
      if (!session) {
        // No active session, start a new conversation
        return await this.startConversation(phoneNumber, 'help');
      }

      // Add user message to history
      session.addMessage('user', userMessage);
      
      // Check if we're waiting for a specific response
      if (session.isWaiting) {
        const result = await this.processWaitingResponse(session, userMessage);
        await this.sessionManager.updateSession(phoneNumber, session);
        return result;
      } else {
        // Not waiting, treat as new command
        const flowType = this.detectFlowType(userMessage);
        return await this.startConversation(phoneNumber, flowType);
      }
      
    } catch (error) {
      console.error(`[ConversationManager] Error handling reply from ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Process response when waiting for specific input
   */
  async processWaitingResponse(session, userMessage) {
    const { flowType, step } = session.context;
    const waitingFor = session.waitingFor;
    
    console.log(`[ConversationManager] Processing ${waitingFor} response for ${flowType} flow`);
    
    let botMessage = '';
    let nextStep = null;
    let shouldContinue = true;
    
    switch (waitingFor) {
      case 'amount':
        const amount = this.parseAmount(userMessage);
        if (amount && amount > 0) {
          session.context.amount = amount;
          botMessage = `Great! You want to send $${amount}. Who would you like to send it to? Please reply with the phone number (e.g., +1234567890).`;
          nextStep = 'recipient';
        } else {
          botMessage = 'Please enter a valid amount (e.g., 25.50).';
          nextStep = 'amount';
        }
        break;
        
      case 'recipient':
        const recipient = this.parsePhoneNumber(userMessage);
        if (recipient) {
          session.context.recipient = recipient;
          botMessage = `Confirm: Send $${session.context.amount} to ${recipient}?\n\nReply "yes" to confirm or "no" to cancel.`;
          nextStep = 'confirmation';
        } else {
          botMessage = 'Please enter a valid phone number (e.g., +1234567890).';
          nextStep = 'recipient';
        }
        break;
        
      case 'confirmation':
        if (/yes|y|confirm/i.test(userMessage)) {
          botMessage = `✅ Transfer completed!\n\nSent $${session.context.amount} to ${session.context.recipient}\nTransaction ID: TX${Date.now()}\nYour balance: $74.50 USDC`;
          nextStep = 'complete';
          shouldContinue = false;
        } else if (/no|n|cancel/i.test(userMessage)) {
          botMessage = 'Transfer cancelled. Type "help" to see available commands.';
          nextStep = 'complete';
          shouldContinue = false;
        } else {
          botMessage = 'Please reply "yes" to confirm or "no" to cancel.';
          nextStep = 'confirmation';
        }
        break;
        
      default:
        // Unknown waiting state, start new conversation
        return await this.startConversation(session.phoneNumber, 'help');
    }
    
    // Add bot message to history
    session.addMessage('bot', botMessage, { flowType, step: nextStep });
    
    // Send bot message
    await this.sendMessage(session.phoneNumber, botMessage);
    
    // Update session state
    if (shouldContinue && nextStep && nextStep !== 'complete') {
      session.setWaiting(nextStep, { flowType, step: nextStep });
    } else {
      session.clearWaiting();
      if (nextStep === 'complete') {
        // Clean up context after completion
        session.context = {};
      }
    }
    
    return {
      success: true,
      flowType,
      message: botMessage,
      waitingFor: session.waitingFor,
      completed: !shouldContinue
    };
  }

  /**
   * Send message via HTTPSMS
   */
  async sendMessage(phoneNumber, content) {
    try {
      console.log(`[ConversationManager] Sending message to ${phoneNumber}: ${content}`);
      const result = await sendSMS(phoneNumber, content);
      return result;
    } catch (error) {
      console.error(`[ConversationManager] Error sending message to ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get initial message for flow type
   */
  getInitialMessage(flowType) {
    const messages = {
      balance: '💰 Your USDC Balance\n\nAmount: 100.00 USDC\nAddress: 0x1234...5678\nLast Transaction: Today\n\nType "help" for more commands.',
      
      send: '💸 Send USDC\n\nHow much would you like to send? Please enter the amount (e.g., 25.50).',
      
      help: '🤖 Available Commands:\n\n• balance - Check your USDC balance\n• send - Send USDC to another number\n• register - Create a wallet\n• help - Show this help\n\nType any command to get started!',
      
      register: '🎉 Welcome to USDC Wallet!\n\nI\'ll create a wallet for your phone number.\n\nReply "yes" to confirm or "no" to cancel.'
    };
    
    return messages[flowType] || messages.help;
  }

  /**
   * Detect flow type from user message
   */
  detectFlowType(message) {
    const msg = message.toLowerCase().trim();
    
    if (/balance/i.test(msg)) return 'balance';
    if (/send/i.test(msg)) return 'send';
    if (/register|create|wallet/i.test(msg)) return 'register';
    if (/help/i.test(msg)) return 'help';
    
    return 'help'; // Default to help
  }

  /**
   * Get next step in flow
   */
  getNextStep(flowType, currentStep) {
    const flow = this.conversationFlows.get(flowType);
    if (!flow) return 'complete';
    
    const currentIndex = flow.steps.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex >= flow.steps.length - 1) {
      return 'complete';
    }
    
    return flow.steps[currentIndex + 1];
  }

  /**
   * Parse amount from user input
   */
  parseAmount(input) {
    const match = input.match(/(\d+(?:\.\d{1,2})?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Parse phone number from user input
   */
  parsePhoneNumber(input) {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // Add + if not present and looks like a phone number
    if (!cleaned.startsWith('+') && cleaned.length >= 10) {
      cleaned = '+' + cleaned;
    }
    
    // Basic validation
    if (cleaned.startsWith('+') && cleaned.length >= 11) {
      return cleaned;
    }
    
    return null;
  }

  /**
   * Get conversation statistics
   */
  async getStats() {
    const sessionStats = await this.sessionManager.getStats();
    return {
      ...sessionStats,
      registeredFlows: Array.from(this.conversationFlows.keys())
    };
  }

  /**
   * Get active sessions
   */
  async getActiveSessions() {
    return await this.sessionManager.getAllSessions();
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    await this.sessionManager.cleanupExpiredSessions();
  }

  /**
   * End conversation for a phone number
   */
  async endConversation(phoneNumber) {
    await this.sessionManager.deleteSession(phoneNumber);
    console.log(`[ConversationManager] Ended conversation for ${phoneNumber}`);
  }
}

module.exports = ConversationManager;
