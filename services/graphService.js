const { GraphQLClient } = require('graphql-request');
const { ethers } = require('ethers');
const config = require('../config.js');

class GraphService {
  constructor() {
    // Updated endpoints for The Graph decentralized network
    this.endpoints = {
      ethereum: 'https://gateway.thegraph.com/api/public/subgraphs/id/5zvR82QoaXuFy9pDDObNJgYaTxCkAkHYKkgLVnWwbhcm',
      polygon: 'https://gateway.thegraph.com/api/public/subgraphs/id/3hCPRGf4z88VC5rsBKU5AA9FBBq5nF3jbVJG7Wjd2JRZ',
      arbitrum: 'https://gateway.thegraph.com/api/public/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM',
      optimism: 'https://gateway.thegraph.com/api/public/subgraphs/id/Cghf4LfVqPiFw6fp6Y5X5Ubc8UpmUhSfJL82zwiBFLaj'
    };
    
    this.clients = {};
    
    // Initialize clients
    Object.keys(this.endpoints).forEach(network => {
      this.clients[network] = new GraphQLClient(this.endpoints[network]);
    });

    // Alternative APIs for fallback
    this.alternativeAPIs = {
      etherscan: 'https://api.etherscan.io/api',
      coingecko: 'https://api.coingecko.com/api/v3'
    };
  }

  // Get transaction history between two addresses
  async getTransactionHistory(fromAddress, toAddress, network = 'ethereum', limit = 100) {
    try {
      const query = `
        query GetTransactions($from: String!, $to: String!, $first: Int!) {
          swaps(
            where: {
              or: [
                { sender: $from, recipient: $to },
                { sender: $to, recipient: $from }
              ]
            }
            first: $first
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            transaction {
              id
              timestamp
              blockNumber
            }
            sender
            recipient
            amount0
            amount1
            amountUSD
            token0 {
              symbol
              name
              decimals
            }
            token1 {
              symbol
              name
              decimals
            }
          }
        }
      `;

      const variables = {
        from: fromAddress.toLowerCase(),
        to: toAddress.toLowerCase(),
        first: limit
      };

      const data = await this.clients[network].request(query, variables);
      return this.formatTransactionHistory(data.swaps);
    } catch (error) {
      console.error('Error fetching transaction history from The Graph:', error);
      
      // Fallback to alternative APIs
      try {
        return await this.getTransactionHistoryFromAlternativeAPIs(fromAddress, toAddress, network, limit);
      } catch (fallbackError) {
        console.error('Error fetching from alternative APIs:', fallbackError);
        throw new Error('Failed to fetch transaction history from all sources');
      }
    }
  }

  // Fallback method for transaction history using Etherscan
  async getTransactionHistoryFromAlternativeAPIs(fromAddress, toAddress, network = 'ethereum', limit = 100) {
    try {
      const axios = require('axios');
      
      // Use Etherscan API for transaction history
      const etherscanResponse = await axios.get(
        `${this.alternativeAPIs.etherscan}?module=account&action=txlist&address=${fromAddress}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=YourApiKeyToken`
      );
      
      const transactions = Array.isArray(etherscanResponse.data.result) ? etherscanResponse.data.result : [];
      
      // Filter transactions between the two addresses
      const filteredTransactions = transactions.filter(tx => 
        (tx.from.toLowerCase() === fromAddress.toLowerCase() && tx.to.toLowerCase() === toAddress.toLowerCase()) ||
        (tx.from.toLowerCase() === toAddress.toLowerCase() && tx.to.toLowerCase() === fromAddress.toLowerCase())
      );
      
      return this.formatAlternativeTransactionHistory(filteredTransactions);
      
    } catch (error) {
      console.error('Error fetching from Etherscan:', error);
      
      // Final fallback - return empty result
      return {
        message: "Transaction history temporarily unavailable. Please try again later.",
        count: 0,
        transactions: [],
        note: "Unable to fetch transaction data from available sources."
      };
    }
  }

  // Get user's complete transaction history
  async getUserTransactionHistory(userAddress, network = 'ethereum', limit = 100) {
    try {
      const query = `
        query GetUserTransactions($user: String!, $first: Int!) {
          swaps(
            where: {
              or: [
                { sender: $user },
                { recipient: $user }
              ]
            }
            first: $first
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            transaction {
              id
              timestamp
              blockNumber
            }
            sender
            recipient
            amount0
            amount1
            amountUSD
            token0 {
              symbol
              name
              decimals
            }
            token1 {
              symbol
              name
              decimals
            }
          }
        }
      `;

      const variables = {
        user: userAddress.toLowerCase(),
        first: limit
      };

      const data = await this.clients[network].request(query, variables);
      return this.formatTransactionHistory(data.swaps);
    } catch (error) {
      console.error('Error fetching user transaction history from The Graph:', error);
      
      // Fallback to alternative APIs
      try {
        return await this.getUserTransactionHistoryFromAlternativeAPIs(userAddress, network, limit);
      } catch (fallbackError) {
        console.error('Error fetching from alternative APIs:', fallbackError);
        throw new Error('Failed to fetch user transaction history from all sources');
      }
    }
  }

  // Fallback method for user transaction history using Etherscan
  async getUserTransactionHistoryFromAlternativeAPIs(userAddress, network = 'ethereum', limit = 100) {
    try {
      const axios = require('axios');
      
      // Use Etherscan API for user transaction history
      const etherscanResponse = await axios.get(
        `${this.alternativeAPIs.etherscan}?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=YourApiKeyToken`
      );
      
      const transactions = Array.isArray(etherscanResponse.data.result) ? etherscanResponse.data.result : [];
      
      return this.formatAlternativeTransactionHistory(transactions);
      
    } catch (error) {
      console.error('Error fetching from Etherscan:', error);
      
      // Final fallback - return empty result
      return {
        message: "Transaction history temporarily unavailable. Please try again later.",
        count: 0,
        transactions: [],
        note: "Unable to fetch transaction data from available sources."
      };
    }
  }

  // Get token statistics and analytics
  async getTokenAnalytics(tokenAddress, network = 'ethereum', days = 7) {
    try {
      // Try The Graph first
      const query = `
        query GetTokenAnalytics($token: String!, $days: Int!) {
          token(id: $token) {
            id
            symbol
            name
            decimals
            totalSupply
            volumeUSD
            txCount
            totalValueLockedUSD
            derivedETH
          }
          swaps(
            where: {
              or: [
                { token0: $token },
                { token1: $token }
              ]
            }
            first: 1000
            orderBy: timestamp
            orderDirection: desc
          ) {
            amountUSD
            timestamp
            transaction {
              id
            }
          }
        }
      `;

      const variables = {
        token: tokenAddress.toLowerCase(),
        days: days
      };

      const data = await this.clients[network].request(query, variables);
      return this.formatTokenAnalytics(data);
    } catch (error) {
      console.error('Error fetching token analytics from The Graph:', error);
      
      // Fallback to alternative APIs
      try {
        return await this.getTokenAnalyticsFromAlternativeAPIs(tokenAddress, network);
      } catch (fallbackError) {
        console.error('Error fetching from alternative APIs:', fallbackError);
        throw new Error('Failed to fetch token analytics from all sources');
      }
    }
  }

  // Fallback method using alternative APIs
  async getTokenAnalyticsFromAlternativeAPIs(tokenAddress, network = 'ethereum') {
    try {
      // Use CoinGecko API for token information
      const axios = require('axios');
      
      // First, try to get token info from CoinGecko
      const coingeckoResponse = await axios.get(
        `${this.alternativeAPIs.coingecko}/coins/ethereum/contract/${tokenAddress.toLowerCase()}`
      );
      
      const tokenData = coingeckoResponse.data;
      
      // Get additional data from Etherscan if available
      let etherscanData = null;
      try {
        const etherscanResponse = await axios.get(
          `${this.alternativeAPIs.etherscan}?module=stats&action=tokensupply&contractaddress=${tokenAddress}&apikey=YourApiKeyToken`
        );
        etherscanData = etherscanResponse.data;
      } catch (etherscanError) {
        console.warn('Etherscan API unavailable, using CoinGecko data only');
      }
      
      return this.formatAlternativeTokenAnalytics(tokenData, etherscanData);
      
    } catch (error) {
      console.error('Error fetching from alternative APIs:', error);
      
      // Final fallback - return basic token info if we can get it
      return {
        message: "Limited token data available due to API limitations",
        analytics: {
          symbol: "Unknown",
          name: "Unknown Token",
          totalSupply: "N/A",
          volumeUSD: "0.00",
          volume24h: "0.00",
          volume7d: "0.00",
          txCount: "N/A",
          totalValueLockedUSD: "0.00",
          derivedETH: "0.000000",
          priceInETH: "0.000000",
          note: "Token analytics temporarily unavailable. Please try again later."
        }
      };
    }
  }

  // Format alternative API response
  formatAlternativeTokenAnalytics(coingeckoData, etherscanData = null) {
    try {
      const marketData = coingeckoData.market_data || {};
      
      return {
        message: `Analytics for ${coingeckoData.symbol?.toUpperCase() || 'Unknown'} (${coingeckoData.name || 'Unknown Token'})`,
        analytics: {
          symbol: coingeckoData.symbol?.toUpperCase() || 'Unknown',
          name: coingeckoData.name || 'Unknown Token',
          totalSupply: etherscanData?.result || coingeckoData.market_data?.total_supply || 'N/A',
          volumeUSD: (marketData.total_volume?.usd || 0).toFixed(2),
          volume24h: (marketData.total_volume?.usd || 0).toFixed(2),
          volume7d: ((marketData.total_volume?.usd || 0) * 7).toFixed(2), // Estimate
          txCount: 'N/A',
          totalValueLockedUSD: (marketData.market_cap?.usd || 0).toFixed(2),
          derivedETH: (marketData.current_price?.eth || 0).toFixed(6),
          priceInETH: (marketData.current_price?.eth || 0).toFixed(6),
          priceUSD: (marketData.current_price?.usd || 0).toFixed(4),
          marketCap: (marketData.market_cap?.usd || 0).toFixed(2),
          priceChange24h: (marketData.price_change_percentage_24h || 0).toFixed(2) + '%'
        }
      };
    } catch (error) {
      console.error('Error formatting alternative token analytics:', error);
      throw error;
    }
  }

  // Get network statistics
  async getNetworkStatistics(network = 'ethereum') {
    try {
      const query = `
        query GetNetworkStats {
          uniswapFactories(first: 1) {
            id
            totalVolumeUSD
            totalValueLockedUSD
            txCount
            pairCount
          }
          tokens(first: 10, orderBy: volumeUSD, orderDirection: desc) {
            id
            symbol
            name
            volumeUSD
            totalValueLockedUSD
          }
        }
      `;

      const data = await this.clients[network].request(query);
      return this.formatNetworkStatistics(data);
    } catch (error) {
      console.error('Error fetching network statistics from The Graph:', error);
      
      // Fallback to alternative APIs
      try {
        return await this.getNetworkStatisticsFromAlternativeAPIs(network);
      } catch (fallbackError) {
        console.error('Error fetching from alternative APIs:', fallbackError);
        throw new Error('Failed to fetch network statistics from all sources');
      }
    }
  }

  // Fallback method for network statistics using CoinGecko
  async getNetworkStatisticsFromAlternativeAPIs(network = 'ethereum') {
    try {
      const axios = require('axios');
      
      // Use CoinGecko API for network statistics
      const coingeckoResponse = await axios.get(
        `${this.alternativeAPIs.coingecko}/global`
      );
      
      const globalData = coingeckoResponse.data.data;
      
      return this.formatAlternativeNetworkStatistics(globalData, network);
      
    } catch (error) {
      console.error('Error fetching from CoinGecko:', error);
      
      // Final fallback - return basic network info
      return {
        message: "Network statistics temporarily unavailable. Please try again later.",
        statistics: {
          totalVolumeUSD: "0.00",
          totalValueLockedUSD: "0.00",
          totalTransactions: "N/A",
          totalPairs: "N/A",
          topTokens: [],
          note: "Unable to fetch network data from available sources."
        }
      };
    }
  }

  // Get liquidity pool analytics
  async getPoolAnalytics(poolAddress, network = 'ethereum') {
    try {
      const query = `
        query GetPoolAnalytics($pool: String!) {
          pool(id: $pool) {
            id
            token0 {
              symbol
              name
            }
            token1 {
              symbol
              name
            }
            liquidity
            totalValueLockedUSD
            volumeUSD
            txCount
            feesUSD
            apr
          }
        }
      `;

      const variables = {
        pool: poolAddress.toLowerCase()
      };

      const data = await this.clients[network].request(query, variables);
      return this.formatPoolAnalytics(data.pool);
    } catch (error) {
      console.error('Error fetching pool analytics from The Graph:', error);
      
      // Fallback to alternative APIs
      try {
        return await this.getPoolAnalyticsFromAlternativeAPIs(poolAddress, network);
      } catch (fallbackError) {
        console.error('Error fetching from alternative APIs:', fallbackError);
        throw new Error('Failed to fetch pool analytics from all sources');
      }
    }
  }

  // Fallback method for pool analytics
  async getPoolAnalyticsFromAlternativeAPIs(poolAddress, network = 'ethereum') {
    try {
      // For now, return a basic response since pool analytics is complex
      return {
        message: "Pool analytics temporarily unavailable. Please try again later.",
        analytics: {
          pair: "Unknown/Unknown",
          liquidity: "0.00",
          totalValueLockedUSD: "0.00",
          volumeUSD: "0.00",
          txCount: "N/A",
          feesUSD: "0.00",
          apr: "0.00",
          note: "Pool analytics requires specialized data sources. Please try again later."
        }
      };
    } catch (error) {
      console.error('Error in pool analytics fallback:', error);
      throw error;
    }
  }

  // Format transaction history for WhatsApp response
  formatTransactionHistory(swaps) {
    if (!swaps || swaps.length === 0) {
      return {
        message: "No transactions found between these addresses.",
        count: 0,
        transactions: []
      };
    }

    const formattedTransactions = swaps.map(swap => {
      const timestamp = new Date(parseInt(swap.transaction.timestamp) * 1000);
      const isIncoming = swap.recipient === swap.sender; // Simplified logic
      
      return {
        id: swap.id,
        timestamp: timestamp.toISOString(),
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString(),
        type: isIncoming ? 'Received' : 'Sent',
        token0: {
          symbol: swap.token0.symbol,
          amount: swap.amount0,
          decimals: swap.token0.decimals
        },
        token1: {
          symbol: swap.token1.symbol,
          amount: swap.amount1,
          decimals: swap.token1.decimals
        },
        usdValue: swap.amountUSD,
        txHash: swap.transaction.id,
        blockNumber: swap.transaction.blockNumber
      };
    });

    const totalValue = swaps.reduce((sum, swap) => sum + parseFloat(swap.amountUSD || 0), 0);

    return {
      message: `Found ${swaps.length} transactions`,
      count: swaps.length,
      totalValueUSD: totalValue.toFixed(2),
      transactions: formattedTransactions
    };
  }

  // Format alternative transaction history from Etherscan
  formatAlternativeTransactionHistory(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {
        message: "No transactions found.",
        count: 0,
        transactions: []
      };
    }

    const formattedTransactions = transactions.map(tx => {
      const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
      const valueInETH = (parseInt(tx.value) / Math.pow(10, 18)).toFixed(6);
      
      return {
        id: tx.hash,
        timestamp: timestamp.toISOString(),
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString(),
        type: tx.from === tx.to ? 'Contract' : 'Transfer',
        token0: {
          symbol: 'ETH',
          amount: valueInETH,
          decimals: 18
        },
        token1: {
          symbol: 'ETH',
          amount: valueInETH,
          decimals: 18
        },
        usdValue: '0.00', // Etherscan doesn't provide USD values
        txHash: tx.hash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to
      };
    });

    return {
      message: `Found ${transactions.length} transactions`,
      count: transactions.length,
      totalValueUSD: '0.00',
      transactions: formattedTransactions,
      note: "USD values not available from Etherscan API"
    };
  }

  // Format token analytics for WhatsApp response
  formatTokenAnalytics(data) {
    const token = data.token;
    const swaps = data.swaps || [];
    
    if (!token) {
      return {
        message: "Token not found or no data available.",
        analytics: null
      };
    }

    const volume24h = swaps
      .filter(swap => {
        const swapTime = new Date(parseInt(swap.timestamp) * 1000);
        const now = new Date();
        const diffHours = (now - swapTime) / (1000 * 60 * 60);
        return diffHours <= 24;
      })
      .reduce((sum, swap) => sum + parseFloat(swap.amountUSD || 0), 0);

    const volume7d = swaps
      .filter(swap => {
        const swapTime = new Date(parseInt(swap.timestamp) * 1000);
        const now = new Date();
        const diffDays = (now - swapTime) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      })
      .reduce((sum, swap) => sum + parseFloat(swap.amountUSD || 0), 0);

    return {
      message: `Analytics for ${token.symbol} (${token.name})`,
      analytics: {
        symbol: token.symbol,
        name: token.name,
        totalSupply: token.totalSupply,
        volumeUSD: parseFloat(token.volumeUSD || 0).toFixed(2),
        volume24h: volume24h.toFixed(2),
        volume7d: volume7d.toFixed(2),
        txCount: token.txCount,
        totalValueLockedUSD: parseFloat(token.totalValueLockedUSD || 0).toFixed(2),
        derivedETH: parseFloat(token.derivedETH || 0).toFixed(6),
        priceInETH: parseFloat(token.derivedETH || 0).toFixed(6)
      }
    };
  }

  // Format network statistics for WhatsApp response
  formatNetworkStatistics(data) {
    const factory = data.uniswapFactories[0];
    const topTokens = data.tokens || [];

    return {
      message: "Network Statistics",
      statistics: {
        totalVolumeUSD: parseFloat(factory?.totalVolumeUSD || 0).toFixed(2),
        totalValueLockedUSD: parseFloat(factory?.totalValueLockedUSD || 0).toFixed(2),
        totalTransactions: factory?.txCount || 0,
        totalPairs: factory?.pairCount || 0,
        topTokens: topTokens.map(token => ({
          symbol: token.symbol,
          name: token.name,
          volumeUSD: parseFloat(token.volumeUSD || 0).toFixed(2),
          tvl: parseFloat(token.totalValueLockedUSD || 0).toFixed(2)
        }))
      }
    };
  }

  // Format alternative network statistics from CoinGecko
  formatAlternativeNetworkStatistics(globalData, network) {
    return {
      message: "Network Statistics (Global Crypto Data)",
      statistics: {
        totalVolumeUSD: parseFloat(globalData.total_volume?.usd || 0).toFixed(2),
        totalValueLockedUSD: parseFloat(globalData.total_market_cap?.usd || 0).toFixed(2),
        totalTransactions: "N/A",
        totalPairs: "N/A",
        topTokens: [],
        note: "Data from global cryptocurrency market, not specific to " + network + " network"
      }
    };
  }

  // Format pool analytics for WhatsApp response
  formatPoolAnalytics(pool) {
    if (!pool) {
      return {
        message: "Pool not found or no data available.",
        analytics: null
      };
    }

    return {
      message: `Pool Analytics: ${pool.token0.symbol}/${pool.token1.symbol}`,
      analytics: {
        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        liquidity: parseFloat(pool.liquidity || 0).toFixed(2),
        totalValueLockedUSD: parseFloat(pool.totalValueLockedUSD || 0).toFixed(2),
        volumeUSD: parseFloat(pool.volumeUSD || 0).toFixed(2),
        txCount: pool.txCount,
        feesUSD: parseFloat(pool.feesUSD || 0).toFixed(2),
        apr: parseFloat(pool.apr || 0).toFixed(2)
      }
    };
  }

  // Validate Ethereum address
  isValidAddress(address) {
    try {
      // Check if address is a string and has proper length
      if (typeof address !== 'string' || address.length !== 42) {
        return false;
      }
      // Check if it starts with 0x
      if (!address.startsWith('0x')) {
        return false;
      }
      // Use ethers to validate
      return ethers.isAddress(address);
    } catch (error) {
      console.error('Address validation error:', error);
      return false;
    }
  }

  // Get network name from address (simplified)
  getNetworkFromAddress(address) {
    // This is a simplified implementation
    // In a real app, you'd have a mapping of addresses to networks
    return 'ethereum'; // Default to ethereum
  }
}

module.exports = GraphService;
