// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title UnichainSwapper
 * @notice Optimized Uniswap V3 swapper contract specifically configured for Unichain
 * @dev This contract uses Unichain's deployed Uniswap V3 contracts for token swapping
 * Network: Unichain Mainnet (Chain ID: 130)
 */

// For Remix, we need to use the GitHub imports
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/token/ERC20/utils/SafeERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.8.0/contracts/security/ReentrancyGuard.sol";

/// @notice Minimal WETH interface
interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
}

/// @notice Uniswap V3 Router interface
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    function exactInput(ExactInputParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/// @notice Uniswap V3 Quoter interface for price quotes
interface IQuoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
}

contract UnichainSwapper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Unichain Mainnet Contract Addresses (Chain ID: 130)
    address private constant UNICHAIN_SWAP_ROUTER = 0x73855d06de49d0fe4a9c42636ba96c62da12ff9c;
    address private constant UNICHAIN_QUOTER_V2 = 0x385a5cf5f83e99f7bb2852b6a19c3538b9fa7658;
    address private constant UNICHAIN_WETH = 0x4200000000000000000000000000000000000006;

    ISwapRouter public immutable swapRouter;
    IQuoter public immutable quoter;
    IWETH public immutable WETH;
    
    // Default deadline offset (5 minutes)
    uint256 public defaultDeadlineOffset = 300;
    
    // Events
    event TokenSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient,
        uint24 fee
    );
    
    event ETHSwapped(
        address indexed tokenOut,
        uint256 ethAmountIn,
        uint256 amountOut,
        address indexed recipient,
        uint24 fee
    );
    
    event TokenToETHSwapped(
        address indexed tokenIn,
        uint256 amountIn,
        uint256 ethAmountOut,
        address indexed recipient,
        uint24 fee
    );

    event MultiHopSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient
    );

    /**
     * @notice Constructor initializes the contract with Unichain's Uniswap V3 contracts
     * @dev Pass address(0) for any parameter to use Unichain defaults
     * @param _swapRouter SwapRouter address (use address(0) for Unichain default)
     * @param _quoter Quoter address (use address(0) for Unichain default)
     * @param _weth WETH address (use address(0) for Unichain default)
     */
    constructor(
        address _swapRouter,
        address _quoter,
        address _weth
    ) {
        // Use Unichain defaults if address(0) is passed, otherwise use provided addresses
        address routerAddr = _swapRouter == address(0) ? UNICHAIN_SWAP_ROUTER : _swapRouter;
        address quoterAddr = _quoter == address(0) ? UNICHAIN_QUOTER_V2 : _quoter;
        address wethAddr = _weth == address(0) ? UNICHAIN_WETH : _weth;
        
        require(routerAddr != address(0), "Invalid router address");
        require(quoterAddr != address(0), "Invalid quoter address");
        require(wethAddr != address(0), "Invalid WETH address");
        
        swapRouter = ISwapRouter(routerAddr);
        quoter = IQuoter(quoterAddr);
        WETH = IWETH(wethAddr);
    }

    /**
     * @notice Get quote for token swap on Unichain
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param fee Pool fee tier (500=0.05%, 3000=0.3%, 10000=1%)
     * @param amountIn Amount of input token
     * @return amountOut Estimated output amount
     */
    function getQuote(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(tokenIn != tokenOut, "Cannot swap same token");
        require(amountIn > 0, "Amount must be greater than 0");
        require(fee == 500 || fee == 3000 || fee == 10000, "Invalid fee tier");
        
        return quoter.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            0
        );
    }

    /**
     * @notice Get network information
     * @return chainId Current chain ID (should be 130 for Unichain Mainnet)
     * @return wethAddress WETH contract address on Unichain
     * @return routerAddress SwapRouter contract address on Unichain
     * @return quoterAddress Quoter contract address on Unichain
     */
    function getNetworkInfo() external view returns (
        uint256 chainId,
        address wethAddress,
        address routerAddress,
        address quoterAddress
    ) {
        return (
            block.chainid,
            address(WETH),
            address(swapRouter),
            address(quoter)
        );
    }

    /**
     * @notice Swap ERC20 → ERC20
     * @param tokenIn Address of token you are swapping from
     * @param tokenOut Address of token you want to receive
     * @param fee Uniswap V3 pool fee (500=0.05%, 3000=0.3%, 10000=1%)
     * @param amountIn Exact amount of tokenIn to swap
     * @param amountOutMin Minimum acceptable tokenOut
     * @param deadline Transaction deadline (0 = use default)
     */
    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(tokenIn != tokenOut, "Cannot swap same token");
        require(amountIn > 0, "Amount must be greater than 0");
        require(fee == 500 || fee == 3000 || fee == 10000, "Invalid fee tier");
        
        uint256 swapDeadline = deadline == 0 ? block.timestamp + defaultDeadlineOffset : deadline;
        require(swapDeadline > block.timestamp, "Deadline already passed");

        // Check user balance
        require(IERC20(tokenIn).balanceOf(msg.sender) >= amountIn, "Insufficient balance");
        
        // Check allowance
        require(IERC20(tokenIn).allowance(msg.sender, address(this)) >= amountIn, "Insufficient allowance");

        // Pull tokenIn from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).safeApprove(address(swapRouter), 0);
        IERC20(tokenIn).safeApprove(address(swapRouter), amountIn);

        // Swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: msg.sender,
            deadline: swapDeadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        // Execute swap
        amountOut = swapRouter.exactInputSingle(params);
        
        emit TokenSwapped(tokenIn, tokenOut, amountIn, amountOut, msg.sender, fee);
    }

    /**
     * @notice Swap ETH → ERC20 on Unichain (auto-wraps ETH into WETH)
     * @param tokenOut Token you want to receive
     * @param fee Uniswap V3 pool fee (500=0.05%, 3000=0.3%, 10000=1%)
     * @param amountOutMin Minimum acceptable tokenOut
     * @param deadline Transaction deadline (0 = use default)
     */
    function swapExactETHForToken(
        address tokenOut,
        uint24 fee,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable nonReentrant returns (uint256 amountOut) {
        require(msg.value > 0, "No ETH sent");
        require(tokenOut != address(0), "Invalid token address");
        require(tokenOut != address(WETH), "Use WETH address for ETH to WETH");
        require(fee == 500 || fee == 3000 || fee == 10000, "Invalid fee tier");
        
        uint256 swapDeadline = deadline == 0 ? block.timestamp + defaultDeadlineOffset : deadline;
        require(swapDeadline > block.timestamp, "Deadline already passed");

        // Wrap ETH into WETH
        WETH.deposit{value: msg.value}();

        // Approve router
        WETH.approve(address(swapRouter), msg.value);

        // Swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(WETH),
            tokenOut: tokenOut,
            fee: fee,
            recipient: msg.sender,
            deadline: swapDeadline,
            amountIn: msg.value,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        // Execute swap
        amountOut = swapRouter.exactInputSingle(params);
        
        emit ETHSwapped(tokenOut, msg.value, amountOut, msg.sender, fee);
    }

    /**
     * @notice Swap ERC20 → ETH on Unichain (unwraps WETH to ETH)
     * @param tokenIn Token you are swapping from
     * @param fee Uniswap V3 pool fee (500=0.05%, 3000=0.3%, 10000=1%)
     * @param amountIn Exact amount of tokenIn to swap
     * @param amountOutMin Minimum acceptable ETH amount
     * @param deadline Transaction deadline (0 = use default)
     */
    function swapExactTokenForETH(
        address tokenIn,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn != address(0), "Invalid token address");
        require(tokenIn != address(WETH), "Use WETH address for WETH to ETH");
        require(amountIn > 0, "Amount must be greater than 0");
        require(fee == 500 || fee == 3000 || fee == 10000, "Invalid fee tier");
        
        uint256 swapDeadline = deadline == 0 ? block.timestamp + defaultDeadlineOffset : deadline;
        require(swapDeadline > block.timestamp, "Deadline already passed");

        // Check user balance and allowance
        require(IERC20(tokenIn).balanceOf(msg.sender) >= amountIn, "Insufficient balance");
        require(IERC20(tokenIn).allowance(msg.sender, address(this)) >= amountIn, "Insufficient allowance");

        // Pull tokenIn from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).safeApprove(address(swapRouter), 0);
        IERC20(tokenIn).safeApprove(address(swapRouter), amountIn);

        // Swap parameters - recipient is this contract to unwrap WETH
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: address(WETH),
            fee: fee,
            recipient: address(this),
            deadline: swapDeadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        // Execute swap to get WETH
        amountOut = swapRouter.exactInputSingle(params);
        
        // Unwrap WETH to ETH
        WETH.withdraw(amountOut);
        
        // Send ETH to user
        (bool success, ) = payable(msg.sender).call{value: amountOut}("");
        require(success, "ETH transfer failed");
        
        emit TokenToETHSwapped(tokenIn, amountIn, amountOut, msg.sender, fee);
    }

    /**
     * @notice Multi-hop swap using encoded path on Unichain
     * @dev Path format: tokenA + fee + tokenB + fee + tokenC...
     * @param path Encoded path for multi-hop swap
     * @param amountIn Exact amount of input token
     * @param amountOutMin Minimum acceptable output amount
     * @param deadline Transaction deadline (0 = use default)
     */
    function swapExactInputMultiHop(
        bytes calldata path,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(path.length >= 43, "Invalid path length"); // At least tokenA + fee + tokenB
        require(amountIn > 0, "Amount must be greater than 0");
        
        uint256 swapDeadline = deadline == 0 ? block.timestamp + defaultDeadlineOffset : deadline;
        require(swapDeadline > block.timestamp, "Deadline already passed");

        // Extract first token from path
        address tokenIn = address(uint160(bytes20(path[0:20])));
        
        // Check user balance and allowance
        require(IERC20(tokenIn).balanceOf(msg.sender) >= amountIn, "Insufficient balance");
        require(IERC20(tokenIn).allowance(msg.sender, address(this)) >= amountIn, "Insufficient allowance");

        // Pull tokenIn from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).safeApprove(address(swapRouter), 0);
        IERC20(tokenIn).safeApprove(address(swapRouter), amountIn);

        // Multi-hop swap parameters
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: msg.sender,
            deadline: swapDeadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin
        });

        // Execute multi-hop swap
        amountOut = swapRouter.exactInput(params);

        // Extract output token from path (last 20 bytes)
        address tokenOut = address(uint160(bytes20(path[path.length-20:path.length])));
        
        emit MultiHopSwapped(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }

    /**
     * @notice Set default deadline offset
     * @param _deadlineOffset New deadline offset in seconds
     */
    function setDefaultDeadlineOffset(uint256 _deadlineOffset) external onlyOwner {
        require(_deadlineOffset >= 60 && _deadlineOffset <= 3600, "Deadline offset must be between 1 minute and 1 hour");
        defaultDeadlineOffset = _deadlineOffset;
    }

    /**
     * @notice Emergency function to rescue stuck tokens
     * @param token Token address to rescue
     * @param amount Amount to rescue (0 = rescue all)
     */
    function rescueToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to rescue");
        
        uint256 rescueAmount = amount == 0 ? balance : amount;
        require(rescueAmount <= balance, "Amount exceeds balance");
        
        IERC20(token).safeTransfer(owner(), rescueAmount);
    }

    /**
     * @notice Emergency function to rescue stuck ETH
     */
    function rescueETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to rescue");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH rescue failed");
    }

    /**
     * @notice Check if a specific pool exists and has liquidity on Unichain
     * @param tokenA First token address
     * @param tokenB Second token address  
     * @param fee Pool fee tier
     * @param testAmount Amount to test quote with
     * @return exists Whether pool exists and has sufficient liquidity
     */
    function checkPool(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 testAmount
    ) external returns (bool exists) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        require(tokenA != tokenB, "Cannot check same token");
        require(fee == 500 || fee == 3000 || fee == 10000, "Invalid fee tier");
        require(testAmount > 0, "Test amount must be greater than 0");
        
        try quoter.quoteExactInputSingle(
            tokenA,
            tokenB,
            fee,
            testAmount,
            0
        ) returns (uint256) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Check if we're on Unichain Mainnet
     * @return isUnichain True if chain ID is 130 (Unichain Mainnet)
     */
    function isUnichainMainnet() external view returns (bool isUnichain) {
        return block.chainid == 130;
    }

    /**
     * @notice Get recommended fee tier for a token pair
     * @dev Returns 3000 (0.3%) as default, which is most common
     * @return fee Recommended fee tier
     */
    function getRecommendedFee() external pure returns (uint24 fee) {
        return 3000; // 0.3% - most liquid pools
    }

    /**
     * @notice Get all supported fee tiers
     * @return fees Array of supported fee tiers
     */
    function getSupportedFees() external pure returns (uint24[3] memory fees) {
        return [uint24(500), uint24(3000), uint24(10000)]; // 0.05%, 0.3%, 1%
    }

    // Allow contract to receive ETH when WETH withdraws or for direct ETH deposits
    receive() external payable {
        // Only accept ETH from WETH contract or during swaps
        require(msg.sender == address(WETH) || msg.sender == address(swapRouter), "Direct ETH not accepted");
    }

    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}

/**
 * @title UnichainSwapperFactory
 * @notice Factory contract to deploy UnichainSwapper instances
 * @dev Provides easy deployment with Unichain default addresses
 */
contract UnichainSwapperFactory {
    event SwapperDeployed(address indexed swapper, address indexed owner);

    /**
     * @notice Deploy a new UnichainSwapper with default Unichain addresses
     * @return swapper Address of the deployed UnichainSwapper contract
     */
    function deploySwapper() external returns (address swapper) {
        UnichainSwapper newSwapper = new UnichainSwapper(address(0), address(0), address(0));
        newSwapper.transferOwnership(msg.sender);
        
        emit SwapperDeployed(address(newSwapper), msg.sender);
        return address(newSwapper);
    }

    /**
     * @notice Deploy a new UnichainSwapper with custom addresses
     * @param _swapRouter Custom SwapRouter address
     * @param _quoter Custom Quoter address  
     * @param _weth Custom WETH address
     * @return swapper Address of the deployed UnichainSwapper contract
     */
    function deploySwapperCustom(
        address _swapRouter,
        address _quoter,
        address _weth
    ) external returns (address swapper) {
        UnichainSwapper newSwapper = new UnichainSwapper(_swapRouter, _quoter, _weth);
        newSwapper.transferOwnership(msg.sender);
        
        emit SwapperDeployed(address(newSwapper), msg.sender);
        return address(newSwapper);
    }
}