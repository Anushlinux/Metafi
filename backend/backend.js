// hybrid-wallet-backend.js
import express from "express";
import { ethers } from "ethers";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(express.json());

// ---------------- CONFIGURATION ----------------
const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const BUNDLER_RPC = "https://api.candide.dev/public/v3/11155111";
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/JHn0j_5TaODxIe1J1EKCVP3MYifcZAAB";
const CHAIN_ID = parseInt("11155111");
const FUNDING_PRIVATE_KEY = import.meta.env.FUNDING_PRIVATE_KEY;
const FUNDING_AMOUNT = "0.02";

// Simple storage (use database in production)
const userDatabase = new Map();

const WALLET_ABI = [
  "function getNonce() view returns (uint256)",
  "function execute(address to, uint256 value, bytes data) external returns (bytes)",
  "function addSessionKey(address key) external",
  "function removeSessionKey(address key) external",
  "function sessionKeys(address) view returns (bool)",
  "function owner() view returns (address)"
];

// ---------------- CORE FUNCTIONS (Shared by both APIs) ----------------

function getUserOpHash(userOp, entryPoint, chainId) {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    [
      "address", "uint256", "bytes32", "bytes32",
      "uint256", "uint256", "uint256", "uint256",
      "uint256", "bytes32"
    ],
    [
      userOp.sender,
      ethers.BigNumber.from(userOp.nonce),
      ethers.utils.keccak256(userOp.initCode || "0x"),
      ethers.utils.keccak256(userOp.callData || "0x"),
      ethers.BigNumber.from(userOp.callGasLimit),
      ethers.BigNumber.from(userOp.verificationGasLimit),
      ethers.BigNumber.from(userOp.preVerificationGas),
      ethers.BigNumber.from(userOp.maxFeePerGas),
      ethers.BigNumber.from(userOp.maxPriorityFeePerGas),
      ethers.utils.keccak256(userOp.paymasterAndData || "0x")
    ]
  );

  const userOpHash = ethers.utils.keccak256(encoded);
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address", "uint256"],
      [userOpHash, entryPoint, chainId]
    )
  );
}

async function sendUserOp(walletAddress, to, valueEther, signerPrivateKey, callDataOverride = null) {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(signerPrivateKey, provider);
  const walletContract = new ethers.Contract(walletAddress, WALLET_ABI, provider);

  try {
    const nonce = await walletContract.getNonce();
    const feeData = await provider.getFeeData();

    let callData;
    if (callDataOverride) {
      callData = callDataOverride;
    } else {
      const iface = new ethers.utils.Interface(WALLET_ABI);
      callData = iface.encodeFunctionData("execute", [
        to,
        ethers.utils.parseEther(valueEther.toString()),
        "0x"
      ]);
    }

    const userOp = {
      sender: walletAddress,
      nonce: "0x" + nonce.toHexString().slice(2),
      initCode: "0x",
      callData,
      callGasLimit: "0x" + (400000).toString(16),
      verificationGasLimit: "0x" + (400000).toString(16),
      preVerificationGas: "0x" + (60000).toString(16),
      maxFeePerGas: "0x" + (feeData.maxFeePerGas || ethers.utils.parseUnits("20", "gwei")).toHexString().slice(2),
      maxPriorityFeePerGas: "0x" + (feeData.maxPriorityFeePerGas || ethers.utils.parseUnits("2", "gwei")).toHexString().slice(2),
      paymasterAndData: "0x",
      signature: "0x"
    };

    const userOpHash = getUserOpHash(userOp, ENTRY_POINT, CHAIN_ID);
    const sig = await signer._signingKey().signDigest(userOpHash);
    userOp.signature = ethers.utils.joinSignature(sig);

    const response = await fetch(BUNDLER_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "eth_sendUserOperation",
        params: [userOp, ENTRY_POINT]
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Bundler error: ${JSON.stringify(data.error)}`);
    }

    return data.result;
  } catch (error) {
    throw error;
  }
}

async function addSessionKey(walletAddress, sessionKeyAddress, ownerPrivateKey) {
  const iface = new ethers.utils.Interface(WALLET_ABI);
  const callData = iface.encodeFunctionData("addSessionKey", [sessionKeyAddress]);
  
  return sendUserOp(walletAddress, walletAddress, 0, ownerPrivateKey, callData);
}

async function getUserOpReceipt(userOpHash) {
  const response = await fetch(BUNDLER_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "eth_getUserOperationReceipt",
      params: [userOpHash]
    })
  });
  
  const data = await response.json();
  return data.result;
}

// ---------------- GENERIC API (Original Backend) ----------------

// Transfer ETH (generic version)
app.post("/transfer-eth", async (req, res) => {
  try {
    const { walletAddress, to, amount, privateKey } = req.body;
    
    if (!walletAddress || !to || !amount || !privateKey) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["walletAddress", "to", "amount", "privateKey"] 
      });
    }

    const userOpHash = await sendUserOp(walletAddress, to, amount, privateKey);
    res.json({ success: true, userOpHash });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add session key (generic version)
app.post("/session/add", async (req, res) => {
  try {
    const { walletAddress, sessionKeyAddress, ownerPrivateKey } = req.body;
    
    if (!walletAddress || !sessionKeyAddress || !ownerPrivateKey) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["walletAddress", "sessionKeyAddress", "ownerPrivateKey"] 
      });
    }

    const userOpHash = await addSessionKey(walletAddress, sessionKeyAddress, ownerPrivateKey);
    res.json({ success: true, userOpHash, message: "Session key added" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate session key
app.get("/session/generate", (req, res) => {
  const wallet = ethers.Wallet.createRandom();
  res.json({
    success: true,
    sessionKey: {
      address: wallet.address,
      privateKey: wallet.privateKey
    }
  });
});

// Check session key
app.get("/session/check/:walletAddress/:address", async (req, res) => {
  try {
    const { walletAddress, address } = req.params;
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const walletContract = new ethers.Contract(walletAddress, WALLET_ABI, provider);
    
    const isSessionKey = await walletContract.sessionKeys(address);
    const owner = await walletContract.owner();
    const isOwner = address.toLowerCase() === owner.toLowerCase();
    
    res.json({ 
      success: true, 
      address,
      isOwner,
      isSessionKey,
      canSign: isOwner || isSessionKey
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get receipt
app.get("/receipt/:userOpHash", async (req, res) => {
  try {
    const { userOpHash } = req.params;
    const receipt = await getUserOpReceipt(userOpHash);
    
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    
    res.json({ success: true, receipt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wallet info
app.get("/wallet/info/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const walletContract = new ethers.Contract(walletAddress, WALLET_ABI, provider);
    
    const owner = await walletContract.owner();
    const nonce = await walletContract.getNonce();
    const balance = await provider.getBalance(walletAddress);
    
    res.json({ 
      success: true, 
      wallet: {
        address: walletAddress,
        owner,
        nonce: nonce.toString(),
        balance: ethers.utils.formatEther(balance)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- WHATSAPP API (User-Friendly Wrapper) ----------------

function getUserId(phoneNumber) {
  return crypto.createHash('sha256').update(phoneNumber).digest('hex').slice(0, 16);
}

function getUserData(phoneNumber) {
  const userId = getUserId(phoneNumber);
  return userDatabase.get(userId);
}

function saveUserData(phoneNumber, userData) {
  const userId = getUserId(phoneNumber);
  userDatabase.set(userId, userData);
  return userData;
}

// Create wallet for WhatsApp user
app.post("/whatsapp/create-wallet", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number required" });
    }
    
    // Check if user already exists
    const existingUser = getUserData(phoneNumber);
    if (existingUser) {
      return res.json({
        success: true,
        message: `✅ You already have a wallet! Address: ${existingUser.walletAddress.slice(0, 6)}...`,
        walletAddress: existingUser.walletAddress
      });
    }
    
    // Generate user's keys (USER IS OWNER)
    const userWallet = ethers.Wallet.createRandom();
    const sessionKeyWallet = ethers.Wallet.createRandom();
    
    // TODO: Deploy contract (simplified here)
    const walletAddress = "0x" + crypto.randomBytes(20).toString('hex'); // Simulated
    
    // Fund wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const fundingWallet = new ethers.Wallet(FUNDING_PRIVATE_KEY, provider);
    await fundingWallet.sendTransaction({
      to: walletAddress,
      value: ethers.utils.parseEther(FUNDING_AMOUNT)
    });
    
    // Add session key using the generic function
    await addSessionKey(walletAddress, sessionKeyWallet.address, userWallet.privateKey);
    
    // Save user data
    const userData = {
      phoneNumber,
      walletAddress,
      ownerPrivateKey: userWallet.privateKey,
      sessionKeyPrivateKey: sessionKeyWallet.privateKey,
      createdAt: new Date().toISOString()
    };
    
    saveUserData(phoneNumber, userData);
    
    res.json({
      success: true,
      message: `🎉 Wallet created! Address: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      walletAddress
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send ETH via WhatsApp
app.post("/whatsapp/send-eth", async (req, res) => {
  try {
    const { phoneNumber, to, amount } = req.body;
    
    const userData = getUserData(phoneNumber);
    if (!userData) {
      return res.status(404).json({ 
        error: "No wallet found. Create one first!" 
      });
    }
    
    // Use the generic sendUserOp function
    const userOpHash = await sendUserOp(
      userData.walletAddress, 
      to, 
      amount, 
      userData.sessionKeyPrivateKey  // Using session key
    );
    
    res.json({
      success: true,
      message: `✅ Sent ${amount} ETH to ${to.slice(0, 6)}...${to.slice(-4)}`,
      transactionHash: userOpHash
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet info for WhatsApp user
app.get("/whatsapp/wallet-info/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const userData = getUserData(phoneNumber);
    
    if (!userData) {
      return res.json({
        success: false,
        message: "❌ No wallet found. Send 'create wallet' to get started!"
      });
    }
    
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(userData.walletAddress);
    const balanceETH = ethers.utils.formatEther(balance);
    
    res.json({
      success: true,
      message: `💼 Your Wallet:
Address: ${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}
Balance: ${parseFloat(balanceETH).toFixed(4)} ETH`,
      walletAddress: userData.walletAddress,
      balance: balanceETH
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- API DOCUMENTATION ----------------
app.get("/", (req, res) => {
  res.json({
    name: "Hybrid ERC-4337 Wallet Backend",
    version: "2.0.0",
    apis: {
      generic: {
        description: "Direct wallet management API",
        endpoints: {
          "POST /transfer-eth": "Transfer ETH (requires wallet address)",
          "POST /session/add": "Add session key",
          "GET /session/generate": "Generate new session key",
          "GET /session/check/:wallet/:address": "Check authorization",
          "GET /receipt/:hash": "Get transaction receipt",
          "GET /wallet/info/:address": "Get wallet information"
        }
      },
      whatsapp: {
        description: "WhatsApp-optimized API",
        endpoints: {
          "POST /whatsapp/create-wallet": "Create wallet for phone number",
          "POST /whatsapp/send-eth": "Send ETH via phone number",
          "GET /whatsapp/wallet-info/:phone": "Get wallet info by phone"
        }
      }
    },
    note: "Both APIs use the same core functions internally"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    activeUsers: userDatabase.size,
    apis: ["generic", "whatsapp"]
  });
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Hybrid Wallet Backend running on port ${PORT}`);
  console.log(`📱 WhatsApp API: /whatsapp/*`);
  console.log(`🔧 Generic API: /transfer-eth, /session/*`);
});

export { sendUserOp, addSessionKey, getUserOpReceipt };