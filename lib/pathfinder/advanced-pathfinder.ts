import { ethers } from 'ethers'
import { DexRegistry } from '../dexRegistry'

export interface PathNode {
  dex: string
  tokenIn: string
  tokenOut: string
  fee: number
  liquidity: string
  priceImpact: number
}

export interface TradePath {
  nodes: PathNode[]
  expectedProfit: string
  gasEstimate: string
  confidence: number
  riskScore: number
}

export class AdvancedPathFinder {
  private provider: ethers.providers.Provider
  private dexRegistry: DexRegistry
  private maxPathLength: number
  private minLiquidity: string
  private maxPriceImpact: number

  constructor(
    provider: ethers.providers.Provider,
    dexRegistry: DexRegistry,
    config: {
      maxHops?: number
      minLiquidity?: string
      maxPriceImpact?: number
    } = {}
  ) {
    this.provider = provider
    this.dexRegistry = dexRegistry
    this.maxPathLength = config.maxHops || 4 // Default to 4 hops
    this.minLiquidity = config.minLiquidity || ethers.utils.parseEther('10').toString()
    this.maxPriceImpact = config.maxPriceImpact || 0.5 // 0.5%
  }

  async findOptimalPaths(
    tokenIn: string,
    amount: string,
    options: {
      maxPaths?: number
      maxHops?: number
      minProfit?: string
      maxGas?: string
      excludedDexes?: string[]
      preferredDexes?: string[]
    } = {}
  ): Promise<TradePath[]> {
    const paths: TradePath[] = []
    const visited = new Set<string>()
    const currentPath: PathNode[] = []

    const maxPaths = options.maxPaths || 5
    const minProfit = options.minProfit || '0'
    const maxGas = options.maxGas || ethers.utils.parseUnits('500000', 'wei').toString()

    await this.explorePathsDFS(
      tokenIn,
      tokenIn, // Target token (complete the cycle)
      amount,
      paths,
      visited,
      currentPath,
      maxPaths,
      minProfit,
      maxGas,
      options
    )

    // Sort paths by expected profit and filter by constraints
    return paths
      .sort((a, b) => 
        ethers.BigNumber.from(b.expectedProfit)
          .sub(ethers.BigNumber.from(a.expectedProfit))
          .toNumber()
      )
      .filter(path => 
        ethers.BigNumber.from(path.gasEstimate).lte(ethers.BigNumber.from(maxGas)) &&
        ethers.BigNumber.from(path.expectedProfit).gte(ethers.BigNumber.from(minProfit))
      )
  }

  private async explorePathsDFS(
    currentToken: string,
    targetToken: string,
    remainingAmount: string,
    paths: TradePath[],
    visited: Set<string>,
    currentPath: PathNode[],
    maxPaths: number,
    minProfit: string,
    maxGas: string,
    options: {
      maxHops?: number
      excludedDexes?: string[]
      preferredDexes?: string[]
    }
  ): Promise<void> {
    if (paths.length >= maxPaths) return
    // Use provided maxHops if specified, otherwise use default maxPathLength
    const maxHops = options.maxHops || this.maxPathLength
    if (currentPath.length >= maxHops) return

    // Get all possible trading pairs for current token
    const pairs = await this.dexRegistry.getTradingPairs(currentToken)

    for (const pair of pairs) {
      if (options.excludedDexes?.includes(pair.dex)) continue

      const pairKey = `${pair.dex}-${currentToken}-${pair.tokenOut}`
      if (visited.has(pairKey)) continue

      // Check liquidity
      const liquidity = await this.dexRegistry.getLiquidity(
        pair.dex,
        currentToken,
        pair.tokenOut
      )
      if (ethers.BigNumber.from(liquidity).lt(this.minLiquidity)) continue

      // Simulate trade and check price impact
      const { outputAmount, priceImpact } = await this.simulateTrade(
        pair.dex,
        currentToken,
        pair.tokenOut,
        remainingAmount
      )
      if (priceImpact > this.maxPriceImpact) continue

      // Add node to current path
      const node: PathNode = {
        dex: pair.dex,
        tokenIn: currentToken,
        tokenOut: pair.tokenOut,
        fee: pair.fee,
        liquidity,
        priceImpact
      }
      
      currentPath.push(node)
      visited.add(pairKey)

      // Check if we've found a complete path
      if (pair.tokenOut === targetToken && currentPath.length > 1) {
        // Calculate path metrics
        const pathMetrics = await this.calculatePathMetrics(currentPath, remainingAmount)
        if (ethers.BigNumber.from(pathMetrics.expectedProfit).gt(0)) {
          paths.push({
            nodes: [...currentPath],
            ...pathMetrics
          })
        }
      } else {
        // Continue exploring
        await this.explorePathsDFS(
          pair.tokenOut,
          targetToken,
          outputAmount,
          paths,
          visited,
          currentPath,
          maxPaths,
          minProfit,
          maxGas,
          options
        )
      }

      // Backtrack
      currentPath.pop()
      visited.delete(pairKey)
    }
  }

  private async simulateTrade(
    dex: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    outputAmount: string
    priceImpact: number
  }> {
    // Implement DEX-specific simulation logic
    return this.dexRegistry.simulateSwap(dex, tokenIn, tokenOut, amountIn)
  }

  private async calculatePathMetrics(
    path: PathNode[],
    initialAmount: string
  ): Promise<{
    expectedProfit: string
    gasEstimate: string
    confidence: number
    riskScore: number
  }> {
    let amount = initialAmount
    let totalGas = ethers.BigNumber.from(0)
    let worstPriceImpact = 0
    let lowestLiquidity = ethers.constants.MaxUint256

    // Simulate entire path
    for (const node of path) {
      const { outputAmount } = await this.simulateTrade(
        node.dex,
        node.tokenIn,
        node.tokenOut,
        amount
      )
      
      amount = outputAmount
      totalGas = totalGas.add(await this.estimateGas(node))
      worstPriceImpact = Math.max(worstPriceImpact, node.priceImpact)
      lowestLiquidity = ethers.BigNumber.from(
        Math.min(
          ethers.BigNumber.from(lowestLiquidity).toNumber(),
          ethers.BigNumber.from(node.liquidity).toNumber()
        )
      )
    }

    const profit = ethers.BigNumber.from(amount).sub(initialAmount)
    
    // Calculate confidence based on liquidity and price impact
    const confidence = this.calculateConfidence(
      lowestLiquidity,
      worstPriceImpact,
      totalGas
    )

    // Calculate risk score based on multiple factors
    const riskScore = this.calculateRiskScore(
      path,
      profit.toString(),
      totalGas.toString(),
      confidence
    )

    return {
      expectedProfit: profit.toString(),
      gasEstimate: totalGas.toString(),
      confidence,
      riskScore
    }
  }

  private async estimateGas(node: PathNode): Promise<ethers.BigNumber> {
    // Implement DEX-specific gas estimation
    return this.dexRegistry.estimateGas(
      node.dex,
      node.tokenIn,
      node.tokenOut
    )
  }

  private calculateConfidence(
    liquidity: ethers.BigNumber,
    priceImpact: number,
    gasEstimate: ethers.BigNumber
  ): number {
    // Higher liquidity, lower price impact, and reasonable gas = higher confidence
    const liquidityScore = Math.min(
      Number(ethers.utils.formatEther(liquidity)) / 1000, // Normalize to 0-1
      1
    )
    const priceImpactScore = Math.max(0, 1 - priceImpact * 2)
    const gasScore = Math.max(
      0,
      1 - Number(ethers.utils.formatUnits(gasEstimate, 'gwei')) / 1000000
    )

    return (liquidityScore * 0.4 + priceImpactScore * 0.4 + gasScore * 0.2)
  }

  private calculateRiskScore(
    path: PathNode[],
    profit: string,
    gasEstimate: string,
    confidence: number
  ): number {
    const profitInEth = Number(ethers.utils.formatEther(profit))
    const gasInEth = Number(ethers.utils.formatEther(gasEstimate))

    // Factors that increase risk:
    // 1. Longer paths - consider target max hops
    const effectiveMaxLength = Math.min(this.maxPathLength, 4) // Cap max length at 4 for risk calculation
    const lengthRisk = path.length / effectiveMaxLength

    // 2. Low profit margin relative to gas
    const profitRatio = profitInEth / gasInEth
    const profitRisk = Math.max(0, 1 - profitRatio / 3)

    // 3. Low confidence
    const confidenceRisk = 1 - confidence

    // 4. DEX diversity (more unique DEXes = slightly higher risk)
    const uniqueDexes = new Set(path.map(n => n.dex)).size
    const dexRisk = uniqueDexes / path.length

    // Weighted risk calculation
    return (
      lengthRisk * 0.3 +
      profitRisk * 0.3 +
      confidenceRisk * 0.25 +
      dexRisk * 0.15
    )
  }
}