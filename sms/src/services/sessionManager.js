const { v4: uuidv4 } = require('uuid');

/**
 * Session state for conversation management
 */
class SessionState {
  constructor(phoneNumber, conversationId = null) {
    this.phoneNumber = phoneNumber;
    this.conversationId = conversationId || uuidv4();
    this.isWaiting = false;
    this.waitingFor = null; // What we're waiting for (e.g., 'amount', 'recipient', 'confirmation')
    this.context = {}; // Additional context data
    this.messages = []; // Message history
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.timeout = null; // Timeout reference for cleanup
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(type, content, metadata = {}) {
    const message = {
      id: uuidv4(),
      type, // 'user' or 'bot'
      content,
      timestamp: new Date(),
      metadata
    };
    this.messages.push(message);
    this.lastActivity = new Date();
    return message;
  }

  /**
   * Set waiting state
   */
  setWaiting(waitingFor, context = {}) {
    this.isWaiting = true;
    this.waitingFor = waitingFor;
    this.context = { ...this.context, ...context };
    this.lastActivity = new Date();
  }

  /**
   * Clear waiting state
   */
  clearWaiting() {
    this.isWaiting = false;
    this.waitingFor = null;
    this.lastActivity = new Date();
  }

  /**
   * Check if session is expired
   */
  isExpired(timeoutMs = 300000) { // 5 minutes default
    return Date.now() - this.lastActivity.getTime() > timeoutMs;
  }

  /**
   * Get session summary for debugging
   */
  getSummary() {
    return {
      phoneNumber: this.phoneNumber,
      conversationId: this.conversationId,
      isWaiting: this.isWaiting,
      waitingFor: this.waitingFor,
      messageCount: this.messages.length,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      isExpired: this.isExpired()
    };
  }
}

/**
 * In-memory session store
 */
class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
    this.timeouts = new Map();
    this.maxSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 1000;
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 300000; // 5 minutes
    
    // Cleanup expired sessions every minute
    setInterval(() => this.cleanupExpiredSessions(), 60000);
  }

  /**
   * Get session by phone number
   */
  async getSession(phoneNumber) {
    const session = this.sessions.get(phoneNumber);
    if (session && session.isExpired(this.sessionTimeout)) {
      await this.deleteSession(phoneNumber);
      return null;
    }
    return session;
  }

  /**
   * Create or update session
   */
  async setSession(phoneNumber, sessionState) {
    // Check if we're at capacity
    if (this.sessions.size >= this.maxSessions) {
      await this.cleanupExpiredSessions();
      if (this.sessions.size >= this.maxSessions) {
        throw new Error('Session store at capacity');
      }
    }

    this.sessions.set(phoneNumber, sessionState);
    
    // Set timeout for session cleanup
    if (sessionState.timeout) {
      clearTimeout(sessionState.timeout);
    }
    
    sessionState.timeout = setTimeout(() => {
      this.deleteSession(phoneNumber);
    }, this.sessionTimeout);
    
    this.timeouts.set(phoneNumber, sessionState.timeout);
  }

  /**
   * Delete session
   */
  async deleteSession(phoneNumber) {
    const session = this.sessions.get(phoneNumber);
    if (session && session.timeout) {
      clearTimeout(session.timeout);
    }
    
    this.sessions.delete(phoneNumber);
    this.timeouts.delete(phoneNumber);
  }

  /**
   * Get all sessions (for debugging)
   */
  async getAllSessions() {
    const sessions = [];
    for (const [phone, session] of this.sessions.entries()) {
      sessions.push({
        phoneNumber: phone,
        ...session.getSummary()
      });
    }
    return sessions;
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    const expiredPhones = [];
    for (const [phone, session] of this.sessions.entries()) {
      if (session.isExpired(this.sessionTimeout)) {
        expiredPhones.push(phone);
      }
    }
    
    for (const phone of expiredPhones) {
      await this.deleteSession(phone);
    }
    
    if (expiredPhones.length > 0) {
      console.log(`[SessionManager] Cleaned up ${expiredPhones.length} expired sessions`);
    }
  }

  /**
   * Get session statistics
   */
  async getStats() {
    const sessions = await this.getAllSessions();
    const waitingSessions = sessions.filter(s => s.isWaiting);
    
    return {
      totalSessions: sessions.length,
      waitingSessions: waitingSessions.length,
      activeSessions: sessions.filter(s => !s.isExpired()).length,
      expiredSessions: sessions.filter(s => s.isExpired()).length
    };
  }
}

/**
 * Redis session store
 */
class RedisSessionStore {
  constructor() {
    this.redis = require('redis').createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redis.on('error', (err) => {
      console.error('[SessionManager] Redis error:', err);
    });
    
    this.redis.on('connect', () => {
      console.log('[SessionManager] Connected to Redis');
    });
    
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 300000; // 5 minutes
  }

  async connect() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  async disconnect() {
    if (this.redis.isOpen) {
      await this.redis.disconnect();
    }
  }

  /**
   * Get session by phone number
   */
  async getSession(phoneNumber) {
    await this.connect();
    const sessionData = await this.redis.get(`session:${phoneNumber}`);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    // Reconstruct SessionState object
    const sessionState = new SessionState(session.phoneNumber, session.conversationId);
    Object.assign(sessionState, session);
    
    if (sessionState.isExpired(this.sessionTimeout)) {
      await this.deleteSession(phoneNumber);
      return null;
    }
    
    return sessionState;
  }

  /**
   * Create or update session
   */
  async setSession(phoneNumber, sessionState) {
    await this.connect();
    const sessionData = JSON.stringify(sessionState);
    await this.redis.setEx(`session:${phoneNumber}`, this.sessionTimeout / 1000, sessionData);
  }

  /**
   * Delete session
   */
  async deleteSession(phoneNumber) {
    await this.connect();
    await this.redis.del(`session:${phoneNumber}`);
  }

  /**
   * Get all sessions (for debugging)
   */
  async getAllSessions() {
    await this.connect();
    const keys = await this.redis.keys('session:*');
    const sessions = [];
    
    for (const key of keys) {
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        sessions.push({
          phoneNumber: session.phoneNumber,
          ...session
        });
      }
    }
    
    return sessions;
  }

  /**
   * Get session statistics
   */
  async getStats() {
    const sessions = await this.getAllSessions();
    const waitingSessions = sessions.filter(s => s.isWaiting);
    
    return {
      totalSessions: sessions.length,
      waitingSessions: waitingSessions.length,
      activeSessions: sessions.filter(s => !s.isExpired()).length,
      expiredSessions: sessions.filter(s => s.isExpired()).length
    };
  }
}

/**
 * Session Manager Factory
 */
class SessionManager {
  constructor() {
    const storeType = process.env.SESSION_STORE || 'memory';
    
    if (storeType === 'redis') {
      this.store = new RedisSessionStore();
    } else {
      this.store = new InMemorySessionStore();
    }
    
    console.log(`[SessionManager] Using ${storeType} session store`);
  }

  /**
   * Get session by phone number
   */
  async getSession(phoneNumber) {
    return await this.store.getSession(phoneNumber);
  }

  /**
   * Get or create session for phone number
   */
  async getOrCreateSession(phoneNumber) {
    let session = await this.store.getSession(phoneNumber);
    
    if (!session) {
      session = new SessionState(phoneNumber);
      await this.store.setSession(phoneNumber, session);
      console.log(`[SessionManager] Created new session for ${phoneNumber}`);
    }
    
    return session;
  }

  /**
   * Update session
   */
  async updateSession(phoneNumber, sessionState) {
    await this.store.setSession(phoneNumber, sessionState);
  }

  /**
   * Delete session
   */
  async deleteSession(phoneNumber) {
    await this.store.deleteSession(phoneNumber);
    console.log(`[SessionManager] Deleted session for ${phoneNumber}`);
  }

  /**
   * Get session statistics
   */
  async getStats() {
    return await this.store.getStats();
  }

  /**
   * Get all sessions (for debugging)
   */
  async getAllSessions() {
    return await this.store.getAllSessions();
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    if (this.store.cleanupExpiredSessions) {
      await this.store.cleanupExpiredSessions();
    }
  }
}

module.exports = {
  SessionState,
  SessionManager,
  InMemorySessionStore,
  RedisSessionStore
};
