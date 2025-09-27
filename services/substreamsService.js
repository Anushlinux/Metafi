const axios = require('axios');
const { ethers } = require('ethers');
const config = require('../config.js');

class SubstreamsService {
  constructor() {
    // Substreams endpoints for different networks
    this.endpoints = {
      ethereum: 'https://api.streamingfast.io/substreams/v1/ethereum-mainnet',
      polygon: 'https://api.streamingfast.io/substreams/v1/polygon-mainnet',
      arbitrum: 'https://api.streamingfast.io/substreams/v1/arbitrum-mainnet',
      optimism: 'https://api.streamingfast.io/substreams/v1/optimism-mainnet'
    };
    
    // API key for Substreams (you'll need to get this from StreamingFast)
    this.apiKey = config.SUBSTREAMS_API_KEY;
    
    // Default substream modules for different use cases
    this.modules = {
      eth_transfers: 'eth_transfers',
      erc20_transfers: 'erc20_transfers',
      nft_transfers: 'nft_transfers',
      contract_calls: 'contract_calls',
      block_analytics: 'block_analytics'
    };
  }

  // Get real-time transaction data for a specific address
  async getRealtimeTransactions(address, network = 'ethereum', limit = 50) {
    try {
      const query = `
        query GetRealtimeTransactions($address: String!, $limit: Int!) {
          transactions(
            where: {
              or: [
                { from: $address },
                { to: $address }
              ]
            }
            first: $limit
            orderBy: blockNumber
            orderDirection: desc
          ) {
            id
            hash
            from
            to
            value
            gasUsed
            gasPrice
            blockNumber
            timestamp
            status
            method
            input
          }
        }
      `;

      const response = await this.makeSubstreamsRequest(network, {
        query,
        variables: {
          address: address.toLowerCase(),
          limit
        }
      });

      return this.formatRealtimeTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching realtime transactions:', error);
      throw new Error('Failed to fetch realtime transactions');
    }
  }

  // Get real-time token transfers for a specific address
  async getRealtimeTokenTransfers(address, network = 'ethereum', limit = 50) {
    try {
      const query = `
        query GetRealtimeTokenTransfers($address: String!, $limit: Int!) {
          tokenTransfers(
            where: {
              or: [
                { from: $address },
                { to: $address }
              ]
            }
            first: $limit
            orderBy: blockNumber
            orderDirection: desc
          ) {
            id
            transactionHash
            from
            to
            value
            token {
              address
              symbol
              name
              decimals
            }
            blockNumber
            timestamp
          }
        }
      `;

      const response = await this.makeSubstreamsRequest(network, {
        query,
        variables: {
          address: address.toLowerCase(),
          limit
        }
      });

      return this.formatTokenTransfers(response.data.tokenTransfers);
    } catch (error) {
      console.error('Error fetching realtime token transfers:', error);
      throw new Error('Failed to fetch realtime token transfers');
    }
  }

  // Get real-time analytics for a specific token
  async getRealtimeTokenAnalytics(tokenAddress, network = 'ethereum', hours = 24) {
    try {
      const query = `
        query GetRealtimeTokenAnalytics($token: String!, $hours: Int!) {
          tokenAnalytics(
            where: {
              token: $token
            }
            first: 1
          ) {
            token {
              address
              symbol
              name
              decimals
              totalSupply
            }
            volume24h
            volume7d
            volume30d
            priceChange24h
            priceChange7d
            marketCap
            holders
            transfers24h
            transfers7d
            lastUpdated
          }
        }
      `;

      const response = await this.makeSubstreamsRequest(network, {
        query,
        variables: {
          token: tokenAddress.toLowerCase(),
          hours
        }
      });

      return this.formatTokenAnalytics(response.data.tokenAnalytics[0]);
    } catch (error) {
      console.error('Error fetching realtime token analytics:', error);
      throw new Error('Failed to fetch realtime token analytics');
    }
  }

  // Get real-time network statistics
  async getRealtimeNetworkStats(network = 'ethereum') {
    try {
      const query = `
        query GetRealtimeNetworkStats {
          networkStats(first: 1) {
            totalTransactions
            totalValueTransferred
            averageGasPrice
            averageBlockTime
            activeAddresses
            newAddresses
            totalContracts
            lastUpdated
          }
        }
      `;

      const response = await this.makeSubstreamsRequest(network, { query });
      return this.formatNetworkStats(response.data.networkStats[0]);
    } catch (error) {
      console.error('Error fetching realtime network stats:', error);
      throw new Error('Failed to fetch realtime network stats');
    }
  }

  // Get real-time DeFi protocol analytics
  async getRealtimeDeFiAnalytics(protocolAddress, network = 'ethereum') {
    try {
      const query = `
        query GetRealtimeDeFiAnalytics($protocol: String!) {
          defiProtocol(
            where: {
              address: $protocol
            }
            first: 1
          ) {
            address
            name
            type
            totalValueLocked
            volume24h
            volume7d
            users24h
            users7d
            transactions24h
            transactions7d
            fees24h
            fees7d
            lastUpdated
          }
        }
      `;

      const response = await this.makeSubstreamsRequest(network, {
        query,
        variables: {
          protocol: protocolAddress.toLowerCase()
        }
      });

      return this.formatDeFiAnalytics(response.data.defiProtocol[0]);
    } catch (error) {
      console.error('Error fetching realtime DeFi analytics:', error);
      throw new Error('Failed to fetch realtime DeFi analytics');
    }
  }

  // Get real-time transaction between two specific addresses
  async getRealtimeTransactionsBetween(fromAddress, toAddress, network = 'ethereum', limit = 50) {
    try {
      const query = `
        query GetTransactionsBetween($from: String!, $to: String!, $limit: Int!) {
          transactions(
            where: {
              and: [
                { from: $from },
                { to: $to }
              ]
            }
            first: $limit
            orderBy: blockNumber
            orderDirection: desc
          ) {
            id
            hash
            from
            to
            value
            gasUsed
            gasPrice
            blockNumber
            timestamp
            status
            method
          }
        }
      `;

      const response = await this.makeSubstreamsRequest(network, {
        query,
        variables: {
          from: fromAddress.toLowerCase(),
          to: toAddress.toLowerCase(),
          limit
        }
      });

      return this.formatTransactionsBetween(response.data.transactions, fromAddress, toAddress);
    } catch (error) {
      console.error('Error fetching transactions between addresses:', error);
      throw new Error('Failed to fetch transactions between addresses');
    }
  }

  // Make a request to Substreams API
  async makeSubstreamsRequest(network, payload) {
    const endpoint = this.endpoints[network];
    if (!endpoint) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const config = {
      method: 'POST',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      data: payload
    };

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      console.error('Substreams API error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Format realtime transactions for WhatsApp response
  formatRealtimeTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        message: "No recent transactions found for this address.",
        count: 0,
        transactions: []
      };
    }

    const formattedTransactions = transactions.map(tx => {
      const timestamp = new Date(parseInt(tx.timestamp) * 1000);
      const valueInEth = ethers.formatEther(tx.value || '0');
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueInEth,
        valueUSD: this.estimateUSDValue(valueInEth), // You'd need a price feed for this
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: tx.blockNumber,
        timestamp: timestamp.toISOString(),
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString(),
        status: tx.status,
        method: tx.method
      };
    });

    const totalValue = transactions.reduce((sum, tx) => {
      return sum + parseFloat(ethers.formatEther(tx.value || '0'));
    }, 0);

    return {
      message: `Found ${transactions.length} recent transactions`,
      count: transactions.length,
      totalValueETH: totalValue.toFixed(6),
      transactions: formattedTransactions
    };
  }

  // Format token transfers for WhatsApp response
  formatTokenTransfers(transfers) {
    if (!transfers || transfers.length === 0) {
      return {
        message: "No recent token transfers found for this address.",
        count: 0,
        transfers: []
      };
    }

    const formattedTransfers = transfers.map(transfer => {
      const timestamp = new Date(parseInt(transfer.timestamp) * 1000);
      const value = this.formatTokenValue(transfer.value, transfer.token.decimals);
      
      return {
        id: transfer.id,
        txHash: transfer.transactionHash,
        from: transfer.from,
        to: transfer.to,
        value: value,
        token: {
          address: transfer.token.address,
          symbol: transfer.token.symbol,
          name: transfer.token.name
        },
        blockNumber: transfer.blockNumber,
        timestamp: timestamp.toISOString(),
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString()
      };
    });

    return {
      message: `Found ${transfers.length} recent token transfers`,
      count: transfers.length,
      transfers: formattedTransfers
    };
  }

  // Format token analytics for WhatsApp response
  formatTokenAnalytics(analytics) {
    if (!analytics) {
      return {
        message: "No analytics data available for this token.",
        analytics: null
      };
    }

    return {
      message: `Real-time Analytics for ${analytics.token.symbol}`,
      analytics: {
        symbol: analytics.token.symbol,
        name: analytics.token.name,
        totalSupply: analytics.token.totalSupply,
        volume24h: parseFloat(analytics.volume24h || 0).toFixed(2),
        volume7d: parseFloat(analytics.volume7d || 0).toFixed(2),
        volume30d: parseFloat(analytics.volume30d || 0).toFixed(2),
        priceChange24h: parseFloat(analytics.priceChange24h || 0).toFixed(2),
        priceChange7d: parseFloat(analytics.priceChange7d || 0).toFixed(2),
        marketCap: parseFloat(analytics.marketCap || 0).toFixed(2),
        holders: analytics.holders,
        transfers24h: analytics.transfers24h,
        transfers7d: analytics.transfers7d,
        lastUpdated: new Date(parseInt(analytics.lastUpdated) * 1000).toLocaleString()
      }
    };
  }

  // Format network stats for WhatsApp response
  formatNetworkStats(stats) {
    if (!stats) {
      return {
        message: "No network statistics available.",
        stats: null
      };
    }

    return {
      message: "Real-time Network Statistics",
      stats: {
        totalTransactions: stats.totalTransactions,
        totalValueTransferred: parseFloat(stats.totalValueTransferred || 0).toFixed(2),
        averageGasPrice: parseFloat(stats.averageGasPrice || 0).toFixed(2),
        averageBlockTime: parseFloat(stats.averageBlockTime || 0).toFixed(2),
        activeAddresses: stats.activeAddresses,
        newAddresses: stats.newAddresses,
        totalContracts: stats.totalContracts,
        lastUpdated: new Date(parseInt(stats.lastUpdated) * 1000).toLocaleString()
      }
    };
  }

  // Format DeFi analytics for WhatsApp response
  formatDeFiAnalytics(analytics) {
    if (!analytics) {
      return {
        message: "No DeFi analytics available for this protocol.",
        analytics: null
      };
    }

    return {
      message: `Real-time DeFi Analytics for ${analytics.name}`,
      analytics: {
        name: analytics.name,
        type: analytics.type,
        totalValueLocked: parseFloat(analytics.totalValueLocked || 0).toFixed(2),
        volume24h: parseFloat(analytics.volume24h || 0).toFixed(2),
        volume7d: parseFloat(analytics.volume7d || 0).toFixed(2),
        users24h: analytics.users24h,
        users7d: analytics.users7d,
        transactions24h: analytics.transactions24h,
        transactions7d: analytics.transactions7d,
        fees24h: parseFloat(analytics.fees24h || 0).toFixed(2),
        fees7d: parseFloat(analytics.fees7d || 0).toFixed(2),
        lastUpdated: new Date(parseInt(analytics.lastUpdated) * 1000).toLocaleString()
      }
    };
  }

  // Format transactions between addresses for WhatsApp response
  formatTransactionsBetween(transactions, fromAddress, toAddress) {
    if (!transactions || transactions.length === 0) {
      return {
        message: `No transactions found between ${fromAddress} and ${toAddress}.`,
        count: 0,
        transactions: []
      };
    }

    const formattedTransactions = transactions.map(tx => {
      const timestamp = new Date(parseInt(tx.timestamp) * 1000);
      const valueInEth = ethers.formatEther(tx.value || '0');
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueInEth,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: tx.blockNumber,
        timestamp: timestamp.toISOString(),
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString(),
        status: tx.status,
        method: tx.method
      };
    });

    const totalValue = transactions.reduce((sum, tx) => {
      return sum + parseFloat(ethers.formatEther(tx.value || '0'));
    }, 0);

    return {
      message: `Found ${transactions.length} transactions between ${fromAddress} and ${toAddress}`,
      count: transactions.length,
      totalValueETH: totalValue.toFixed(6),
      transactions: formattedTransactions
    };
  }

  // Helper function to format token value based on decimals
  formatTokenValue(value, decimals) {
    try {
      const divisor = Math.pow(10, parseInt(decimals));
      return (parseFloat(value) / divisor).toFixed(6);
    } catch {
      return value;
    }
  }

  // Helper function to estimate USD value (simplified)
  estimateUSDValue(ethValue) {
    // This is a simplified implementation
    // In a real app, you'd use a price feed API
    const ethPrice = 2000; // Example ETH price
    return (parseFloat(ethValue) * ethPrice).toFixed(2);
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
}

module.exports = SubstreamsService;
