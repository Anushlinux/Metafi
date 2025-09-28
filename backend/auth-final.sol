// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Define UserOperation struct (ERC-4337)
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

// IAccount interface for ERC-4337
interface IAccount {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
    
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title ERC-4337 Smart Wallet with Session Keys + validateUserOp
contract ERC4337SmartWallet is IAccount {
    address public owner;
    mapping(address => bool) public sessionKeys;
    uint256 public nonce;

    event EthTransferred(address indexed to, uint256 amount);
    event ERC20Transferred(address indexed token, address indexed to, uint256 amount);
    event SessionKeyAdded(address indexed key);
    event SessionKeyRemoved(address indexed key);
    event NonceUsed(uint256 nonce);

    modifier onlyOwnerOrSession() {
        require(msg.sender == owner || sessionKeys[msg.sender], "Not authorized");
        _;
    }

    constructor(address _owner) payable {
        require(_owner != address(0), "Owner cannot be zero address");
        owner = _owner;
    }

    // -------- Session Keys --------
    function addSessionKey(address key) external {
        require(msg.sender == owner, "Only owner can add session key");
        require(key != address(0), "Invalid key");
        sessionKeys[key] = true;
        emit SessionKeyAdded(key);
    }

    function removeSessionKey(address key) external {
        require(msg.sender == owner, "Only owner can remove session key");
        sessionKeys[key] = false;
        emit SessionKeyRemoved(key);
    }

    // -------- Transfers --------
    function transferETH(address payable to, uint256 amount) external onlyOwnerOrSession {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success,) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit EthTransferred(to, amount);
    }

    function transferERC20(address token, address to, uint256 amount) external onlyOwnerOrSession {
        require(IERC20(token).transfer(to, amount), "ERC20 transfer failed");
        emit ERC20Transferred(token, to, amount);
    }

    // -------- Nonce --------
    function getNonce() external view returns (uint256) {
        return nonce;
    }
    
    function useNonce() external onlyOwnerOrSession returns (uint256 current) {
        current = nonce;
        nonce += 1;
        emit NonceUsed(current);
    }

    // -------- Signature Verification --------
    function isValidSignature(bytes32 hash, bytes memory signature) public view returns (bool) {
        address signer = recoverSigner(hash, signature);
        return signer == owner || sessionKeys[signer];
    }

    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(hash, v, r, s);
    }

    // -------- ERC-4337 validateUserOp --------
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    )
        external
        override
        returns (uint256 validationData)
    {
        // Pay for the transaction if needed
        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "Failed to pay for transaction");
        }

        if (!isValidSignature(userOpHash, userOp.signature)) {
            return 1; // signature failure
        }

        require(userOp.nonce == nonce, "Invalid nonce");
        nonce++;

        return 0; // success
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IAccount).interfaceId;
    }


    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
