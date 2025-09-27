const { GraphQLClient } = require('graphql-request');
const { ethers } = require('ethers');
const config = require('../config.js');

class GraphService {
  constructor() {
    this.endpoints = {
      ethereum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      polygon: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
      arbitrum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum',
      optimism: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism'
    };
    
    this.clients = {};
    Object.keys(this.endpoints).forEach(network => {
      this.clients[network] = new GraphQLClient(this.endpoints[network]);
    });
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
      console.error('Error fetching transaction history:', error);
      throw new Error('Failed to fetch transaction history');
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
      console.error('Error fetching user transaction history:', error);
      throw new Error('Failed to fetch user transaction history');
    }
  }

  // Get token statistics and analytics
  async getTokenAnalytics(tokenAddress, network = 'ethereum', days = 7) {
    try {
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
      console.error('Error fetching token analytics:', error);
      throw new Error('Failed to fetch token analytics');
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
      console.error('Error fetching network statistics:', error);
      throw new Error('Failed to fetch network statistics');
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
      console.error('Error fetching pool analytics:', error);
      throw new Error('Failed to fetch pool analytics');
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
