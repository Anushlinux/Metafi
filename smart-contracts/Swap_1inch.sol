// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/token/ERC20/IERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/token/ERC20/utils/SafeERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/utils/cryptography/ECDSA.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/access/Ownable.sol";

contract FusionPlusResolver is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // EIP-712 domain and typehash
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,address makerToken,address takerToken,uint256 makerAmount,uint256 minTakerAmount,uint256 expiry,uint256 nonce,uint256 srcChainId,uint256 dstChainId,address recipient)"
    );

    // replay protection
    mapping(address => mapping(uint256 => bool)) public usedNonce;

    // events
    event OrderExecuted(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed executor,
        uint256 makerAmount,
        uint256 minTakerAmount,
        uint256 nonce,
        address routerTarget,
        address settlementTarget
    );
    event RouterCallFailed(bytes returnData);
    event SettlementCallFailed(bytes returnData);
    event WithdrawERC20(address token, address to, uint256 amount);
    event WithdrawETH(address to, uint256 amount);

    struct Order {
        address maker;          // signer
        address makerToken;     // token/maker asset (address(0) for native ETH)
        address takerToken;     // expected token (for record-keeping)
        uint256 makerAmount;    // amount maker provides on source chain
        uint256 minTakerAmount; // minimum acceptable on destination
        uint256 expiry;         // expiry timestamp
        uint256 nonce;          // nonce for replay protection
        uint256 srcChainId;     // chain id for source
        uint256 dstChainId;     // chain id for destination
        address recipient;      // where final funds should end up (on destination/settlement)
    }

    constructor(string memory name, string memory version) {
        uint256 chainId;
        assembly { chainId := chainid() }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                address(this)
            )
        );
    }

    // ----------------- Owner rescue helpers -----------------
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(token, to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "insufficient");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit WithdrawETH(to, amount);
    }

    // ----------------- Internal helpers -----------------
    function _hashOrder(Order calldata o) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                ORDER_TYPEHASH,
                o.maker,
                o.makerToken,
                o.takerToken,
                o.makerAmount,
                o.minTakerAmount,
                o.expiry,
                o.nonce,
                o.srcChainId,
                o.dstChainId,
                o.recipient
            )
        );
    }

    function _recoverSigner(Order calldata o, bytes calldata signature) internal view returns (address) {
        bytes32 structHash = _hashOrder(o);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        return ECDSA.recover(digest, signature);
    }

    // ----------------- Public view functions -----------------
    function getOrderHash(Order calldata order) external pure returns (bytes32) {
        return _hashOrder(order);
    }

    function verifySignature(Order calldata order, bytes calldata signature) external view returns (address) {
        return _recoverSigner(order, signature);
    }

    // ----------------- Core Execution -----------------
    function executeOrder(
        Order calldata order,
        bytes calldata signature,
        address routerTarget,
        uint256 routerValue,
        bytes calldata routerCallData,
        address settlementTarget,
        uint256 settlementValue,
        bytes calldata settlementCallData
    ) external payable nonReentrant {
        // basic checks
        require(block.timestamp <= order.expiry, "expired");
        require(!usedNonce[order.maker][order.nonce], "nonce used");

        // signature verification
        address signer = _recoverSigner(order, signature);
        require(signer == order.maker, "invalid sig");

        // mark nonce early
        usedNonce[order.maker][order.nonce] = true;

        // receive funds
        if (order.makerToken == address(0)) {
            require(msg.value >= order.makerAmount, "insufficient ETH");
        } else {
            IERC20(order.makerToken).safeTransferFrom(order.maker, address(this), order.makerAmount);
            IERC20(order.makerToken).safeApprove(routerTarget, 0);
            IERC20(order.makerToken).safeApprove(routerTarget, order.makerAmount);
        }

        // execute router swap
        (bool routerOk, bytes memory rret) = routerTarget.call{value: routerValue}(routerCallData);
        if (!routerOk) {
            emit RouterCallFailed(rret);
            revert("router failed");
        }

        // clean approval
        if (order.makerToken != address(0)) {
            IERC20(order.makerToken).safeApprove(routerTarget, 0);
        }

        // execute settlement/bridge call
        (bool settOk, bytes memory sret) = settlementTarget.call{value: settlementValue}(settlementCallData);
        if (!settOk) {
            emit SettlementCallFailed(sret);
            revert("settlement failed");
        }

        // emit success event
        bytes32 orderHash = _hashOrder(order);
        emit OrderExecuted(orderHash, order.maker, msg.sender, order.makerAmount, order.minTakerAmount, order.nonce, routerTarget, settlementTarget);

        // refund leftover ETH
        uint256 leftover = address(this).balance;
        if (leftover > 0) {
            (bool sent, ) = msg.sender.call{value: leftover}("");
            if (sent) { /* refunded */ }
        }
    }

    receive() external payable {}
    fallback() external payable {}
}