import { ethers } from "ethers";
import ABI from "../contracts/DenExecutor.abi";

export interface TradingPair {
  dex: string;
  tokenOut: string;
  fee: number;
}

export interface DexRegistry {
  getTradingPairs(tokenAddress: string): Promise<TradingPair[]>;
  getLiquidity(
    dex: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<string>;
  simulateSwap(
    dex: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    outputAmount: string;
    priceImpact: number;
  }>;
  estimateGas(
    dex: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<ethers.BigNumber>;
}

export interface DexMetricsData {
  volume: number
  trades: number
}

export interface DexMetricsRegistry {
  uniswap: DexMetricsData
  sushiswap: DexMetricsData
  curve: DexMetricsData
  balancer: DexMetricsData
}

export class DexRegistryImpl implements DexRegistry {
  private dexAddresses: Record<string, string> = {};

  constructor(
    private provider: ethers.providers.Provider,
    private contractAddress: string
  ) {}

  // Add metrics methods
  async getDexMetrics(): Promise<DexMetricsRegistry> {
    // This would fetch real metrics from subgraphs
    return {
      uniswap: { volume: 100000, trades: 50 },
      sushiswap: { volume: 75000, trades: 35 },
      curve: { volume: 125000, trades: 45 },
      balancer: { volume: 50000, trades: 25 }
    }
  }

  getBaseTokenAddress(): string {
    return "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" // WETH
  }

  async initialize() {
    const network = await this.provider.getNetwork();
    const providerUrl = this.provider instanceof ethers.providers.JsonRpcProvider
      ? (this.provider as ethers.providers.JsonRpcProvider).connection.url
      : `https://${network.name}.infura.io/v3/YOUR-PROJECT-ID`;
    this.dexAddresses = await fetchDexRegistry(
      providerUrl,
      this.contractAddress
    );
  }

  async getTradingPairs(tokenAddress: string): Promise<TradingPair[]> {
    const pairs: TradingPair[] = [];
    
    // Query each DEX for available pairs
    for (const [dexName, dexAddress] of Object.entries(this.dexAddresses)) {
      try {
        const pairsForDex = await this.queryDexPairs(
          dexName,
          dexAddress,
          tokenAddress
        );
        pairs.push(...pairsForDex);
      } catch (err) {
        console.warn(`Failed to get pairs from ${dexName}:`, err);
      }
    }

    return pairs;
  }

  async getLiquidity(
    dex: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<string> {
    const dexAddress = this.dexAddresses[dex];
    if (!dexAddress) throw new Error(`DEX ${dex} not found`);

    return this.queryDexLiquidity(dex, dexAddress, tokenIn, tokenOut);
  }

  async simulateSwap(
    dex: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    outputAmount: string;
    priceImpact: number;
  }> {
    const dexAddress = this.dexAddresses[dex];
    if (!dexAddress) throw new Error(`DEX ${dex} not found`);

    return this.simulateDexSwap(dex, dexAddress, tokenIn, tokenOut, amountIn);
  }

  async estimateGas(
    dex: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<ethers.BigNumber> {
    const dexAddress = this.dexAddresses[dex];
    if (!dexAddress) throw new Error(`DEX ${dex} not found`);

    return this.estimateDexGas(dex, dexAddress, tokenIn, tokenOut);
  }

  private async queryDexPairs(
    dexName: string,
    dexAddress: string,
    tokenAddress: string
  ): Promise<TradingPair[]> {
    // Implementation would depend on the specific DEX
    // This is a placeholder that needs to be implemented per DEX type
    switch (dexName) {
      case "UNISWAP_V3_ROUTER":
        return this.queryUniswapV3Pairs(dexAddress, tokenAddress);
      case "SUSHISWAP_ROUTER":
        return this.querySushiswapPairs(dexAddress, tokenAddress);
      // Add more DEX-specific implementations
      default:
        return [];
    }
  }

  private async queryDexLiquidity(
    dex: string,
    dexAddress: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<string> {
    // Implementation would depend on the specific DEX
    // This is a placeholder that needs to be implemented per DEX type
    switch (dex) {
      case "UNISWAP_V3_ROUTER":
        return this.getUniswapV3Liquidity(dexAddress, tokenIn, tokenOut);
      case "SUSHISWAP_ROUTER":
        return this.getSushiswapLiquidity(dexAddress, tokenIn, tokenOut);
      // Add more DEX-specific implementations
      default:
        return ethers.utils.parseEther("100").toString(); // Default placeholder
    }
  }

  private async simulateDexSwap(
    dex: string,
    dexAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    outputAmount: string;
    priceImpact: number;
  }> {
    // Implementation would depend on the specific DEX
    // This is a placeholder that needs to be implemented per DEX type
    switch (dex) {
      case "UNISWAP_V3_ROUTER":
        return this.simulateUniswapV3Swap(dexAddress, tokenIn, tokenOut, amountIn);
      case "SUSHISWAP_ROUTER":
        return this.simulateSushiswapSwap(dexAddress, tokenIn, tokenOut, amountIn);
      // Add more DEX-specific implementations
      default:
        return {
          outputAmount: ethers.utils.parseEther("1").toString(),
          priceImpact: 0.1
        };
    }
  }

  private async estimateDexGas(
    dex: string,
    dexAddress: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<ethers.BigNumber> {
    // Implementation would depend on the specific DEX
    // This is a placeholder that needs to be implemented per DEX type
    switch (dex) {
      case "UNISWAP_V3_ROUTER":
        return this.estimateUniswapV3Gas(dexAddress, tokenIn, tokenOut);
      case "SUSHISWAP_ROUTER":
        return this.estimateSushiswapGas(dexAddress, tokenIn, tokenOut);
      // Add more DEX-specific implementations
      default:
        return ethers.utils.parseUnits("100000", "wei");
    }
  }

  // DEX-specific implementations (to be completed based on each DEX's interface)
  private async queryUniswapV3Pairs(
    dexAddress: string,
    tokenAddress: string
  ): Promise<TradingPair[]> {
    // Implement Uniswap V3 specific logic
    return [];
  }

  private async querySushiswapPairs(
    dexAddress: string,
    tokenAddress: string
  ): Promise<TradingPair[]> {
    // Implement Sushiswap specific logic
    return [];
  }

  private async getUniswapV3Liquidity(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<string> {
    // Implement Uniswap V3 specific logic
    return ethers.utils.parseEther("100").toString();
  }

  private async getSushiswapLiquidity(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<string> {
    // Implement Sushiswap specific logic
    return ethers.utils.parseEther("100").toString();
  }

  private async simulateUniswapV3Swap(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    outputAmount: string;
    priceImpact: number;
  }> {
    // Implement Uniswap V3 specific logic
    return {
      outputAmount: ethers.utils.parseEther("1").toString(),
      priceImpact: 0.1
    };
  }

  private async simulateSushiswapSwap(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    outputAmount: string;
    priceImpact: number;
  }> {
    // Implement Sushiswap specific logic
    return {
      outputAmount: ethers.utils.parseEther("1").toString(),
      priceImpact: 0.1
    };
  }

  private async estimateUniswapV3Gas(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<ethers.BigNumber> {
    // Implement Uniswap V3 specific logic
    return ethers.utils.parseUnits("100000", "wei");
  }

  private async estimateSushiswapGas(
    dexAddress: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<ethers.BigNumber> {
    // Implement Sushiswap specific logic
    return ethers.utils.parseUnits("100000", "wei");
  }
}

/**
 * Fetches all supported DEX router addresses from the deployed contract.
 * Returns a registry object: { name: string, address: string }
 */
export async function fetchDexRegistry(rpcUrl: string, contractAddress: string) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  const dexNames = [
    "UNISWAP_V2_ROUTER",
    "UNISWAP_V3_ROUTER",
    "UNISWAP_V3_QUOTER",
    "SUSHISWAP_ROUTER",
    "CURVE_ROUTER",
    "BALANCER_VAULT",
    "DODO_V2_ROUTER",
    "PANCAKESWAP_ROUTER"
  ];

  const registry: Record<string, string> = {};
  // Add 1inch aggregator (static mainnet address)
  // 1inch v5 router: https://etherscan.io/address/0x1111111254EEB25477B68fb85Ed929f73A960582 
  registry["ONEINCH_ROUTER"] = "0x1111111254EEB25477B68fb85Ed929f73A960582";
  for (const name of dexNames) {
    try {
      const addr = await contract[name]();
      registry[name] = addr;
    } catch (err) {
      // skip if not present
    }
  }
  return registry;
}