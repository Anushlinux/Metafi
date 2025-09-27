import { ethers } from 'ethers';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();


class FusionPlusIntegrator {
    constructor(apiKey, contractAddress, provider, signer) {
        this.apiKey = process.env.FUSION_API_KEY;  // 🔑 YOUR 1INCH API KEY GOES HERE
        this.contractAddress = contractAddress;
        this.provider = provider;
        this.signer = signer;
        this.baseURL = 'https://api.1inch.dev';
        
        // Contract ABI (minimal for our needs)
        this.contractABI = [
            "function executeOrder((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,address),bytes,address,uint256,bytes,address,uint256,bytes) external payable",
            "function getOrderHash((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,address)) external pure returns (bytes32)",
            "function verifySignature((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,address),bytes) external view returns (address)",
            "function usedNonce(address,uint256) external view returns (bool)",
            "event OrderExecuted(bytes32 indexed,address indexed,address indexed,uint256,uint256,uint256,address,address)"
        ];
        
        this.contract = new ethers.Contract(contractAddress, this.contractABI, signer);
    }

    // 1inch API call helper
    async call1inchAPI(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`1inch API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    // Get Fusion+ quote
    async getFusionQuote(fromTokenAddress, toTokenAddress, amount, fromChainId, toChainId) {
        return await this.call1inchAPI('/fusion/quoter/v1.0/quote', {
            fromTokenAddress,
            toTokenAddress,
            amount,
            fromChainId,
            toChainId
        });
    }

    // Get router calldata from 1inch
    async getRouterCalldata(fromTokenAddress, toTokenAddress, amount, fromAddress, slippage = 1) {
        const chainId = await this.provider.getNetwork().then(n => n.chainId);
        
        return await this.call1inchAPI(`/swap/v5.2/${chainId}/swap`, {
            fromTokenAddress,
            toTokenAddress,
            amount,
            fromAddress,
            slippage
        });
    }

    // Get settlement/bridge calldata (this would depend on the specific bridge)
    async getSettlementCalldata(tokenAddress, amount, toChainId, recipient) {
        // This is a placeholder - you'd replace with actual bridge API calls
        // Examples: Stargate, LayerZero, Across, etc.
        return await this.call1inchAPI('/bridge/v1.0/build-tx', {
            tokenAddress,
            amount,
            toChainId,
            recipient
        });
    }

    // Sign order with EIP-712
    async signOrder(order) {
        const domain = {
            name: "FusionPlusResolver",
            version: "1",
            chainId: await this.provider.getNetwork().then(n => n.chainId),
            verifyingContract: this.contractAddress
        };

        const types = {
            Order: [
                { name: "maker", type: "address" },
                { name: "makerToken", type: "address" },
                { name: "takerToken", type: "address" },
                { name: "makerAmount", type: "uint256" },
                { name: "minTakerAmount", type: "uint256" },
                { name: "expiry", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "srcChainId", type: "uint256" },
                { name: "dstChainId", type: "uint256" },
                { name: "recipient", type: "address" }
            ]
        };

        return await this.signer._signTypedData(domain, types, order);
    }

    // Complete cross-chain swap execution
    async executeCrossChainSwap({
        fromToken,
        toToken,
        amount,
        fromChainId,
        toChainId,
        recipient,
        slippage = 1,
        expiry = Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }) {
        try {
            console.log("🚀 Starting cross-chain swap...");
            
            // 1. Get quote from Fusion+
            const quote = await this.getFusionQuote(fromToken, toToken, amount, fromChainId, toChainId);
            console.log("📊 Got Fusion+ quote:", quote);

            // 2. Get router calldata for source chain swap
            const routerData = await this.getRouterCalldata(
                fromToken, 
                quote.bridgeToken || toToken, 
                amount, 
                this.contractAddress,
                slippage
            );
            console.log("🔄 Got router calldata");

            // 3. Get settlement calldata for bridge
            const settlementData = await getSettlementCalldata(
                quote.bridgeToken || toToken,
                quote.bridgeAmount || amount,
                toChainId,
                recipient
            );
            console.log("🌉 Got settlement calldata");

            // 4. Create and sign order
            const nonce = Date.now();
            const order = {
                maker: await this.signer.getAddress(),
                makerToken: fromToken,
                takerToken: toToken,
                makerAmount: amount,
                minTakerAmount: quote.toTokenAmount || quote.minReturnAmount,
                expiry: expiry,
                nonce: nonce,
                srcChainId: fromChainId,
                dstChainId: toChainId,
                recipient: recipient
            };

            const signature = await this.signOrder(order);
            console.log("✍️ Order signed");

            // 5. Execute the order
            const tx = await this.contract.executeOrder(
                order,
                signature,
                routerData.tx.to,
                routerData.tx.value || 0,
                routerData.tx.data,
                settlementData.tx.to,
                settlementData.tx.value || 0,
                settlementData.tx.data,
                {
                    value: fromToken === '0x0000000000000000000000000000000000000000' ? amount : 0,
                    gasLimit: 500000
                }
            );

            console.log("📤 Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Cross-chain swap completed!", receipt.transactionHash);

            return {
                success: true,
                txHash: receipt.transactionHash,
                order,
                quote
            };

        } catch (error) {
            console.error("❌ Cross-chain swap failed:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper: Check if nonce is used
    async isNonceUsed(maker, nonce) {
        return await this.contract.usedNonce(maker, nonce);
    }

    // Helper: Get order hash
    async getOrderHash(order) {
        return await this.contract.getOrderHash(order);
    }
}

// Usage Example:
async function main() {
    // 🔑 PLUG IN YOUR API KEY HERE:
    const API_KEY = process.env.FUSION_API_KEY;
    
    // Setup ethers
    const provider = new ethers.providers.JsonRpcProvider("YOUR_RPC_URL");
    const signer = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
    
    // Contract address (deploy the Solidity contract first)
    const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
    
    // Initialize integrator
    const integrator = new FusionPlusIntegrator(API_KEY, CONTRACT_ADDRESS, provider, signer);
    
    // Execute cross-chain swap
    const result = await integrator.executeCrossChainSwap({
        fromToken: "0xA0b86a33E6441234567890123456789012345678", // USDC on source chain
        toToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",   // USDT on dest chain  
        amount: "1000000", // 1 USDC (6 decimals)
        fromChainId: 1,    // Ethereum
        toChainId: 137,    // Polygon
        recipient: "0x742d35Cc6634C0532925a3b8D322A7D1C3ec6c6B", // Your address
        slippage: 1        // 1%
    });
    
    console.log("Result:", result);
}

// Export for use
export { FusionPlusIntegrator };
