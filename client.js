const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { getIntent } = require('./intent.js');
const GraphService = require('./services/graphService.js');
const SubstreamsService = require('./services/substreamsService.js');

const client = new Client();
const graphService = new GraphService();
const substreamsService = new SubstreamsService();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    try {
        const intentResponse = await getIntent(msg.body);
        console.log('Intent response:', intentResponse);
        
        // Parse the JSON response and handle accordingly
        const intent = JSON.parse(intentResponse);
        
        let responseMessage = '';
        
        // Handle different intents
        switch (intent.intent) {
            case 'create-wallet':
            case 'inr-transac':
            case 'swap-and-send-on-chain':
            case 'swap-and-send-cross-chain':
            case 'other-misc':
            case 'other-trash':
                responseMessage = intent.message;
                break;
                
            case 'eth-tranfer':
            case 'erc-20-transfer':
                responseMessage = `Processing ${intent.intent}...\nTo: ${intent.to}\nAmount: ${intent.amount}`;
                break;
                
            case 'transaction-history':
                try {
                    const network = intent.network || 'ethereum';
                    const limit = intent.limit || 50;
                    
                    if (intent.targetAddress) {
                        // Get transactions between two addresses
                        const result = await graphService.getTransactionHistory(
                            intent.userAddress, 
                            intent.targetAddress, 
                            network, 
                            limit
                        );
                        responseMessage = formatTransactionHistoryResponse(result);
                    } else {
                        // Get user's complete transaction history
                        const result = await graphService.getUserTransactionHistory(
                            intent.userAddress, 
                            network, 
                            limit
                        );
                        responseMessage = formatTransactionHistoryResponse(result);
                    }
                } catch (error) {
                    responseMessage = `Error fetching transaction history: ${error.message}`;
                }
                break;
                
            case 'token-analytics':
                try {
                    const network = intent.network || 'ethereum';
                    const timeframe = intent.timeframe || '7d';
                    
                    const result = await graphService.getTokenAnalytics(
                        intent.tokenAddress, 
                        network, 
                        timeframe
                    );
                    responseMessage = formatTokenAnalyticsResponse(result);
                } catch (error) {
                    responseMessage = `Error fetching token analytics: ${error.message}`;
                }
                break;
                
            case 'network-stats':
                try {
                    const network = intent.network || 'ethereum';
                    const result = await graphService.getNetworkStatistics(network);
                    responseMessage = formatNetworkStatsResponse(result);
                } catch (error) {
                    responseMessage = `Error fetching network statistics: ${error.message}`;
                }
                break;
                
            case 'realtime-transactions':
                try {
                    const network = intent.network || 'ethereum';
                    const limit = intent.limit || 20;
                    
                    const result = await substreamsService.getRealtimeTransactions(
                        intent.userAddress, 
                        network, 
                        limit
                    );
                    responseMessage = formatRealtimeTransactionsResponse(result);
                } catch (error) {
                    responseMessage = `Error fetching real-time transactions: ${error.message}`;
                }
                break;
                
            case 'defi-analytics':
                try {
                    const network = intent.network || 'ethereum';
                    const result = await substreamsService.getRealtimeDeFiAnalytics(
                        intent.protocolAddress, 
                        network
                    );
                    responseMessage = formatDeFiAnalyticsResponse(result);
                } catch (error) {
                    responseMessage = `Error fetching DeFi analytics: ${error.message}`;
                }
                break;
                
            default:
                responseMessage = intent.message || 'Unknown intent. Please try again.';
        }
        
        if (responseMessage) {
            console.log('Sending message:\n', responseMessage);
            // msg.reply(responseMessage); // Commented out for testing
        }
    } catch (error) {
        console.error('Error processing message:', error);
        // msg.reply('Sorry, I encountered an error processing your request. Please try again.');
    }
});

// Response formatting functions
function formatTransactionHistoryResponse(result) {
    if (!result.transactions || result.transactions.length === 0) {
        return result.message;
    }
    
    let response = `${result.message}\n\n`;
    response += `Total Value: $${result.totalValueUSD}\n\n`;
    
    result.transactions.slice(0, 10).forEach((tx, index) => {
        response += `${index + 1}. ${tx.type} ${tx.token0.symbol}/${tx.token1.symbol}\n`;
        response += `   Date: ${tx.date} ${tx.time}\n`;
        response += `   Value: $${tx.usdValue}\n`;
        response += `   TX: ${tx.txHash.substring(0, 10)}...\n\n`;
    });
    
    if (result.transactions.length > 10) {
        response += `... and ${result.transactions.length - 10} more transactions`;
    }
    
    return response;
}

function formatTokenAnalyticsResponse(result) {
    if (!result.analytics) {
        return result.message;
    }
    
    const analytics = result.analytics;
    let response = `${result.message}\n\n`;
    response += `📊 Token Analytics:\n`;
    response += `Symbol: ${analytics.symbol}\n`;
    response += `Name: ${analytics.name}\n`;
    response += `Total Supply: ${analytics.totalSupply}\n`;
    response += `Volume (24h): $${analytics.volume24h}\n`;
    response += `Volume (7d): $${analytics.volume7d}\n`;
    response += `Transactions: ${analytics.txCount}\n`;
    response += `TVL: $${analytics.totalValueLockedUSD}\n`;
    response += `Price (ETH): ${analytics.priceInETH} ETH\n`;
    
    return response;
}

function formatNetworkStatsResponse(result) {
    if (!result.statistics) {
        return result.message;
    }
    
    const stats = result.statistics;
    let response = `${result.message}\n\n`;
    response += `🌐 Network Statistics:\n`;
    response += `Total Volume: $${stats.totalVolumeUSD}\n`;
    response += `Total Value Locked: $${stats.totalValueLockedUSD}\n`;
    response += `Total Transactions: ${stats.totalTransactions}\n`;
    response += `Total Pairs: ${stats.totalPairs}\n\n`;
    
    if (stats.topTokens && stats.topTokens.length > 0) {
        response += `🏆 Top Tokens:\n`;
        stats.topTokens.slice(0, 5).forEach((token, index) => {
            response += `${index + 1}. ${token.symbol} - Vol: $${token.volumeUSD}\n`;
        });
    }
    
    return response;
}

function formatRealtimeTransactionsResponse(result) {
    if (!result.transactions || result.transactions.length === 0) {
        return result.message;
    }
    
    let response = `${result.message}\n\n`;
    response += `Total Value: ${result.totalValueETH} ETH\n\n`;
    
    result.transactions.slice(0, 10).forEach((tx, index) => {
        response += `${index + 1}. ${tx.from.substring(0, 6)}... → ${tx.to.substring(0, 6)}...\n`;
        response += `   Value: ${tx.value} ETH\n`;
        response += `   Date: ${tx.date} ${tx.time}\n`;
        response += `   Status: ${tx.status}\n`;
        response += `   TX: ${tx.hash.substring(0, 10)}...\n\n`;
    });
    
    if (result.transactions.length > 10) {
        response += `... and ${result.transactions.length - 10} more transactions`;
    }
    
    return response;
}

function formatDeFiAnalyticsResponse(result) {
    if (!result.analytics) {
        return result.message;
    }
    
    const analytics = result.analytics;
    let response = `${result.message}\n\n`;
    response += `🏦 DeFi Protocol Analytics:\n`;
    response += `Name: ${analytics.name}\n`;
    response += `Type: ${analytics.type}\n`;
    response += `TVL: $${analytics.totalValueLocked}\n`;
    response += `Volume (24h): $${analytics.volume24h}\n`;
    response += `Volume (7d): $${analytics.volume7d}\n`;
    response += `Users (24h): ${analytics.users24h}\n`;
    response += `Users (7d): ${analytics.users7d}\n`;
    response += `Transactions (24h): ${analytics.transactions24h}\n`;
    response += `Fees (24h): $${analytics.fees24h}\n`;
    response += `Last Updated: ${analytics.lastUpdated}\n`;
    
    return response;
}

client.initialize();