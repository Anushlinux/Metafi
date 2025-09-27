const { GoogleGenAI } = require('@google/genai');
const config = require('./config.js');

async function getIntent(userMessage) {
  const ai = new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY,
  });
  
  const aiConfig = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    systemInstruction: [
      {
        text: `You will receive a message from whatsapp, you are a intent recognition chatbot backend for a whatsapp based web3 wallet that caters only to ethereum and its supported chains. You will classify the intent is which from the following options: 'create-wallet'(eg, I want to create a wallet), 'inr-transac' (eg, pay user1 1000 inr in form of eth), 'eth-tranfer'(eg, send user1 0.001eth), 'erc-20-transfer', 'swap-and-send-on-chain'(means he send user1 1eth worth of usdc or any eth supported token), 'swap-and-send-cross-chain'(send user1 1eth worth of btc or other chains), 'transaction-history'(eg, show my transaction history, my transactions with user1), 'token-analytics'(eg, show analytics for USDC, token stats for ETH), 'network-stats'(eg, show network statistics, ethereum network stats), 'realtime-transactions'(eg, show my recent transactions, real-time activity), 'defi-analytics'(eg, show Uniswap analytics, DeFi protocol stats), 'other-misc'(any other query or doubt related to eth and its working),  'other-trash'(all other messages except greetings)

Based on the intent you will provide a json object in output in following format:

If 'create-wallet':
{
    intent: "",
    message: something about Creating a wallet for you in different tones
}

If 'check-balance':
{
    intent: "",
    message: something like you have this much, in different tones
}

If 'inr-transac':
{
    intent: "",
    message: Sorry not supported yet but more respectful tone
}

If 'eth-tranfer':
{
    intent: ,
    to: address of receiver,
    amount: address to send in wei (convert from given eth in text)
}

If 'erc-20-transfer':
{
    intent: ,
    token: address of token to be sent
    to: address of receiver,
    amount: address to send in wei (convert from given eth in text)
}

If  'swap-and-send-on-chain':
{
    intent: "",
    message: Sorry not supported yet but more respectful tone
}

If  'swap-and-send-cross-chain':
{
    intent: "",
    message: Sorry not supported yet but more respectful tone
}

If 'other-misc': 
{
    intent: "",
    message: answer the query
}

If 'transaction-history':
{
    intent: "transaction-history",
    userAddress: "user's wallet address if mentioned",
    targetAddress: "specific address to check transactions with (optional)",
    network: "ethereum/polygon/arbitrum/optimism (default: ethereum)",
    limit: "number of transactions to fetch (default: 50)"
}

If 'token-analytics':
{
    intent: "token-analytics",
    tokenAddress: "token contract address",
    network: "ethereum/polygon/arbitrum/optimism (default: ethereum)",
    timeframe: "24h/7d/30d (default: 7d)"
}

If 'network-stats':
{
    intent: "network-stats",
    network: "ethereum/polygon/arbitrum/optimism (default: ethereum)"
}

If 'realtime-transactions':
{
    intent: "realtime-transactions",
    userAddress: "user's wallet address",
    network: "ethereum/polygon/arbitrum/optimism (default: ethereum)",
    limit: "number of transactions to fetch (default: 20)"
}

If 'defi-analytics':
{
    intent: "defi-analytics",
    protocolAddress: "DeFi protocol contract address",
    network: "ethereum/polygon/arbitrum/optimism (default: ethereum)"
}

If 'other-trash': 
{
    intent: "",
    message: Dont ask such questions, if greetings then greet properly`,
      }
    ],
  };
  
  const model = 'gemini-2.5-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: userMessage,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config: aiConfig,
    contents,
  });
  
  let result = '';
  for await (const chunk of response) {
    if (chunk.text) {
      result += chunk.text;
    }
  }
  
  return result;
}

module.exports = { getIntent };