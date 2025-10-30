// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IUniswapV3Router {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMin;
    }
    
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

contract EnhancedDenExecutor is Ownable, ReentrancyGuard, FlashLoanSimpleReceiverBase {
    // Constants
    uint256 public constant MAX_SLIPPAGE = 50; // 0.5%
    uint256 public constant MIN_PROFIT_THRESHOLD = 0.1 ether;
    uint256 public constant MAX_PATH_LENGTH = 5;
    
    // State variables
    mapping(address => bool) public authorizedCallers;
    mapping(address => bool) public blacklistedTokens;
    mapping(string => address) public dexRouters;
    
    // Trading stats
    uint256 public totalTrades;
    uint256 public totalProfit;
    uint256 public lastExecutionTime;
    uint256 public tradeCooldown = 3; // blocks
    
    // Events
    event ArbitrageExecuted(
        address tokenBorrow,
        uint256 amount,
        uint256 profit,
        address[] path
    );
    
    event ProfitGenerated(
        uint256 profit,
        uint256 timestamp
    );
    
    event PriceImpactExceeded(
        uint256 expected,
        uint256 actual,
        uint256 impact
    );

    constructor(address _addressProvider) 
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) 
    {
        authorizedCallers[msg.sender] = true;
    }

    // Core functions
    function executeArbitrageWithFlashLoan(
        address flashLoanProvider,
        uint256 amount,
        TradeStep[] calldata path,
        uint256 expectedProfit,
        uint256 deadline
    ) external payable nonReentrant returns (uint256) {
        require(authorizedCallers[msg.sender], "Caller not authorized");
        require(path.length <= MAX_PATH_LENGTH, "Path too long");
        require(block.timestamp <= deadline, "Deadline expired");
        require(
            block.number >= lastExecutionTime + tradeCooldown,
            "Cooldown active"
        );

        // Request flash loan
        bytes memory params = abi.encode(
            path,
            expectedProfit,
            deadline
        );
        
        POOL.flashLoanSimple(
            address(this),
            path[0].tokenIn,
            amount,
            params,
            0
        );

        return totalProfit;
    }

    // Flash loan callback
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        (
            TradeStep[] memory path,
            uint256 expectedProfit,
            uint256 deadline
        ) = abi.decode(params, (TradeStep[], uint256, uint256));

        // Execute arbitrage path
        uint256 startBalance = IERC20(path[0].tokenIn).balanceOf(address(this));
        uint256 profit = executeArbitragePath(path, deadline);
        
        require(
            profit >= expectedProfit,
            "Insufficient profit"
        );

        // Repay flash loan
        uint256 amountToRepay = amount + premium;
        require(
            IERC20(asset).approve(address(POOL), amountToRepay),
            "Approve failed"
        );

        // Update stats
        totalTrades++;
        totalProfit += profit;
        lastExecutionTime = block.number;

        emit ProfitGenerated(profit, block.timestamp);
        
        return true;
    }

    // Internal functions
    function executeArbitragePath(
        TradeStep[] memory path,
        uint256 deadline
    ) internal returns (uint256) {
        uint256 currentAmount = IERC20(path[0].tokenIn).balanceOf(address(this));
        
        for (uint i = 0; i < path.length; i++) {
            TradeStep memory step = path[i];
            require(!blacklistedTokens[step.tokenIn], "Token blacklisted");
            
            // Approve DEX
            IERC20(step.tokenIn).approve(step.dex, currentAmount);
            
            // Execute swap based on DEX type
            if (isDexV3(step.dex)) {
                currentAmount = executeV3Swap(step, currentAmount, deadline);
            } else {
                currentAmount = executeV2Swap(step, currentAmount, deadline);
            }
        }
        
        return currentAmount;
    }

    function executeV3Swap(
        TradeStep memory step,
        uint256 amountIn,
        uint256 deadline
    ) internal returns (uint256) {
        // Encode path for V3
        bytes memory encodedPath = encodeV3Path(
            step.tokenIn,
            step.tokenOut,
            step.fee
        );
        
        // Calculate minimum output
        uint256 minOut = calculateMinOutput(amountIn, step.expectedOutput);
        
        // Execute swap
        IUniswapV3Router router = IUniswapV3Router(step.dex);
        return router.exactInput(
            IUniswapV3Router.ExactInputParams({
                path: encodedPath,
                recipient: address(this),
                deadline: deadline,
                amountIn: amountIn,
                amountOutMin: minOut
            })
        );
    }

    function executeV2Swap(
        TradeStep memory step,
        uint256 amountIn,
        uint256 deadline
    ) internal returns (uint256) {
        // Prepare path
        address[] memory path = new address[](2);
        path[0] = step.tokenIn;
        path[1] = step.tokenOut;
        
        // Calculate minimum output
        uint256 minOut = calculateMinOutput(amountIn, step.expectedOutput);
        
        // Execute swap
        IUniswapV2Router router = IUniswapV2Router(step.dex);
        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            address(this),
            deadline
        );
        
        return amounts[amounts.length - 1];
    }

    // Helper functions
    function calculateMinOutput(
        uint256 amountIn,
        uint256 expectedOut
    ) internal pure returns (uint256) {
        return expectedOut * (10000 - MAX_SLIPPAGE) / 10000;
    }

    function isDexV3(address dex) internal view returns (bool) {
        return dex == dexRouters["UNISWAP_V3_ROUTER"] ||
               dex == dexRouters["SUSHISWAP_V3_ROUTER"];
    }

    function encodeV3Path(
        address tokenIn,
        address tokenOut,
        uint24 fee
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(tokenIn, fee, tokenOut);
    }

    // Admin functions
    function setDexRouter(string calldata name, address router) external onlyOwner {
        dexRouters[name] = router;
    }
    
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
    }
    
    function setBlacklistedToken(address token, bool blacklisted) external onlyOwner {
        blacklistedTokens[token] = blacklisted;
    }
    
    function setTradeCooldown(uint256 blocks) external onlyOwner {
        tradeCooldown = blocks;
    }

    // Emergency functions
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}

// Helper structs
struct TradeStep {
    address dex;
    address tokenIn;
    address tokenOut;
    uint24 fee;
    uint256 expectedOutput;
}