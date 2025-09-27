// Configuration file for WhatsApp Web3 Agent
// Copy this file to config.js and fill in your API keys

module.exports = {
  // Gemini AI API Key
  GEMINI_API_KEY: 'your_gemini_api_key_here',
  
  // Substreams API Key (from StreamingFast)
  SUBSTREAMS_API_KEY: 'your_substreams_api_key_here',
  
  // The Graph API Key (optional, for higher rate limits)
  GRAPH_API_KEY: 'your_graph_api_key_here',
  
  
  // Default network
  DEFAULT_NETWORK: 'ethereum',
  
  // Default limits
  DEFAULT_TRANSACTION_LIMIT: 50,
  DEFAULT_REALTIME_LIMIT: 20,
  
  // Supported networks
  SUPPORTED_NETWORKS: ['ethereum', 'polygon', 'arbitrum', 'optimism']
};
