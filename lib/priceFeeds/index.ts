import { ethers } from 'ethers'

export interface PriceFeed {
  getPrice(tokenAddress: string): Promise<ethers.BigNumber>
  isStale(tokenAddress: string): boolean
  update(): Promise<void>
}

const CHAINLINK_FEED_REGISTRY = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
const CHAINLINK_FEED_ABI = [
  'function latestRoundData(address base, address quote) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals(address base, address quote) external view returns (uint8)'
]

const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)'
]

export class ChainlinkPriceFeed implements PriceFeed {
  private prices: Map<string, { price: ethers.BigNumber; timestamp: number }> = new Map()
  private registry: ethers.Contract

  constructor(
    private provider: ethers.providers.Provider,
    private updateInterval: number = 30000,
    private staleThreshold: number = 120000
  ) {
    this.registry = new ethers.Contract(CHAINLINK_FEED_REGISTRY, CHAINLINK_FEED_ABI, provider)
  }

  async getPrice(tokenAddress: string): Promise<ethers.BigNumber> {
    const cached = this.prices.get(tokenAddress)
    if (cached && Date.now() - cached.timestamp < this.updateInterval) {
      return cached.price
    }
    return this.updatePrice(tokenAddress)
  }

  isStale(tokenAddress: string): boolean {
    const cached = this.prices.get(tokenAddress)
    return !cached || Date.now() - cached.timestamp > this.staleThreshold
  }

  async update(): Promise<void> {
    const updates = Array.from(this.prices.keys()).map(token => this.updatePrice(token))
    await Promise.all(updates)
  }

  private async updatePrice(tokenAddress: string): Promise<ethers.BigNumber> {
    try {
      const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      const [roundData, decimals] = await Promise.all([
        this.registry.latestRoundData(tokenAddress, USDC),
        this.registry.decimals(tokenAddress, USDC)
      ])

      const price = ethers.BigNumber.from(roundData.answer)
        .mul(ethers.BigNumber.from(10).pow(18 - decimals))

      this.prices.set(tokenAddress, {
        price,
        timestamp: Date.now()
      })

      return price
    } catch (err) {
      console.warn(`Failed to update Chainlink price for ${tokenAddress}:`, err)
      throw err
    }
  }
}

export class UniswapV3TWAPFeed implements PriceFeed {
  private prices: Map<string, { price: ethers.BigNumber; timestamp: number }> = new Map()
  private factory: ethers.Contract
  private pools: Map<string, ethers.Contract> = new Map()

  constructor(
    private provider: ethers.providers.Provider,
    private updateInterval: number = 30000,
    private staleThreshold: number = 120000,
    private twapInterval: number = 1800 // 30 minutes
  ) {
    this.factory = new ethers.Contract(UNISWAP_V3_FACTORY, ['function getPool(address,address,uint24) view returns (address)'], provider)
  }

  async getPrice(tokenAddress: string): Promise<ethers.BigNumber> {
    const cached = this.prices.get(tokenAddress)
    if (cached && Date.now() - cached.timestamp < this.updateInterval) {
      return cached.price
    }
    return this.updatePrice(tokenAddress)
  }

  isStale(tokenAddress: string): boolean {
    const cached = this.prices.get(tokenAddress)
    return !cached || Date.now() - cached.timestamp > this.staleThreshold
  }

  async update(): Promise<void> {
    const updates = Array.from(this.prices.keys()).map(token => this.updatePrice(token))
    await Promise.all(updates)
  }

  private async updatePrice(tokenAddress: string): Promise<ethers.BigNumber> {
    try {
      const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      const FEE_TIERS = [500, 3000, 10000]

      // Find the most liquid pool
      let bestPool: ethers.Contract | null = null
      let maxLiquidity = ethers.BigNumber.from(0)

      for (const feeTier of FEE_TIERS) {
        const poolAddress = await this.factory.getPool(tokenAddress, USDC, feeTier)
        if (poolAddress === ethers.constants.AddressZero) continue

        const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, this.provider)
        const slot0 = await pool.slot0()
        
        if (slot0.sqrtPriceX96.gt(maxLiquidity)) {
          maxLiquidity = slot0.sqrtPriceX96
          bestPool = pool
        }
      }

      if (!bestPool) {
        throw new Error(`No liquid Uniswap V3 pool found for ${tokenAddress}`)
      }

      // Get TWAP
      const [tickCumulatives] = await bestPool.observe([this.twapInterval, 0])
      const tickDiff = tickCumulatives[1].sub(tickCumulatives[0])
      const twapTick = tickDiff.div(this.twapInterval)
      
      // Convert tick to price
      const price = ethers.BigNumber.from(2).pow(twapTick.div(2).toNumber())
        .mul(ethers.BigNumber.from(10).pow(18))

      this.prices.set(tokenAddress, {
        price,
        timestamp: Date.now()
      })

      return price
    } catch (err) {
      console.warn(`Failed to update Uniswap V3 TWAP for ${tokenAddress}:`, err)
      throw err
    }
  }
}

export class CompositePriceFeed implements PriceFeed {
  private feeds: PriceFeed[]
  
  constructor(
    provider: ethers.providers.Provider,
    options: {
      updateInterval?: number
      staleThreshold?: number
      twapInterval?: number
    } = {}
  ) {
    this.feeds = [
      new ChainlinkPriceFeed(provider, options.updateInterval, options.staleThreshold),
      new UniswapV3TWAPFeed(provider, options.updateInterval, options.staleThreshold, options.twapInterval)
    ]
  }

  async getPrice(tokenAddress: string): Promise<ethers.BigNumber> {
    const prices: ethers.BigNumber[] = []

    for (const feed of this.feeds) {
      try {
        if (!feed.isStale(tokenAddress)) {
          const price = await feed.getPrice(tokenAddress)
          prices.push(price)
        }
      } catch (err) {
        console.warn(`Price feed failed for ${tokenAddress}:`, err)
      }
    }

    if (prices.length === 0) {
      throw new Error(`No valid price found for ${tokenAddress}`)
    }

    // Use median price
    prices.sort((a, b) => a.lt(b) ? -1 : a.gt(b) ? 1 : 0)
    const mid = Math.floor(prices.length / 2)
    return prices.length % 2 ? prices[mid] : prices[mid - 1].add(prices[mid]).div(2)
  }

  isStale(tokenAddress: string): boolean {
    return this.feeds.every(feed => feed.isStale(tokenAddress))
  }

  async update(): Promise<void> {
    await Promise.all(this.feeds.map(feed => feed.update()))
  }
}