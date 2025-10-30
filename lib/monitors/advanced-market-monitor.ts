import { ethers } from 'ethers'
import { Subject, BehaviorSubject } from 'rxjs'
import { exponentialMovingAverage, standardDeviation } from '../utils/statistical'

export interface ProtocolHealth {
  tvl: string
  dailyVolume: string
  fees24h: string
  utilizationRate: number
  healthFactor: number
}

export interface TokenMetrics {
  price: string
  priceChange24h: number
  volatility24h: number
  liquidity: string
  volume24h: string
}

export interface GasMetrics {
  currentPrice: string
  baseFeeTrend: number[]
  priorityFeeTrend: number[]
  blockUtilization: number
  nextBlockPrediction: string
}

export interface MarketMetrics {
  protocols: Record<string, ProtocolHealth>
  tokens: Record<string, TokenMetrics>
  gas: GasMetrics
}

export class AdvancedMarketMonitor {
  // Observable streams
  public marketMetrics$ = new BehaviorSubject<MarketMetrics | null>(null)
  public alerts$ = new Subject<{
    type: 'warning' | 'opportunity' | 'risk'
    message: string
    severity: number
  }>()

  // Historical data
  private gasPriceHistory: number[] = []
  private tokenPriceHistory: Record<string, number[]> = {}
  private liquidityHistory: Record<string, number[]> = {}

  // Moving averages
  private gasPriceEMA: number = 0
  private volatilityEMAs: Record<string, number> = {}

  constructor(
    private provider: ethers.providers.Provider,
    private trackedTokens: string[],
    private trackedProtocols: string[]
  ) {}

  async start() {
    // Initialize monitoring
    await this.initializeMonitoring()

    // Start update cycles
    this.startGasMonitoring()
    this.startTokenMonitoring()
    this.startProtocolMonitoring()
    this.startRiskAnalysis()
  }

  private async initializeMonitoring() {
    // Initialize historical data
    const blockNumber = await this.provider.getBlockNumber()
    const blocks = await Promise.all(
      Array.from({ length: 100 }, (_, i) => 
        this.provider.getBlock(blockNumber - i)
      )
    )

    // Initialize gas price history
    this.gasPriceHistory = blocks
      .map(block => block.baseFeePerGas?.toNumber() || 0)
      .filter(fee => fee > 0)

    // Initialize token price history
    for (const token of this.trackedTokens) {
      this.tokenPriceHistory[token] = []
      this.liquidityHistory[token] = []
    }
  }

  private startGasMonitoring() {
    const updateInterval = 15000 // 15 seconds

    const updateGasMetrics = async () => {
      try {
        const block = await this.provider.getBlock('latest')
        if (!block.baseFeePerGas) return

        // Update history
        this.gasPriceHistory.push(block.baseFeePerGas.toNumber())
        if (this.gasPriceHistory.length > 200) {
          this.gasPriceHistory.shift()
        }

        // Calculate EMA
        this.gasPriceEMA = exponentialMovingAverage(
          this.gasPriceHistory,
          this.gasPriceEMA,
          0.1
        )

        // Predict next block gas price
        const nextBlockPrediction = this.predictNextBlockGas()

        // Update metrics
        const currentMetrics = this.marketMetrics$.getValue() || this.getEmptyMetrics()
        this.marketMetrics$.next({
          ...currentMetrics,
          gas: {
            currentPrice: block.baseFeePerGas.toString(),
            baseFeeTrend: this.gasPriceHistory.slice(-20),
            priorityFeeTrend: [], // TODO: Implement priority fee tracking
            blockUtilization: block.gasUsed.mul(100).div(block.gasLimit).toNumber(),
            nextBlockPrediction
          }
        })

        // Check for gas price anomalies
        this.detectGasAnomalies()

      } catch (error) {
        console.error('Error updating gas metrics:', error)
      }
    }

    // Initial update
    updateGasMetrics()

    // Schedule regular updates
    setInterval(updateGasMetrics, updateInterval)
  }

  private startTokenMonitoring() {
    const updateInterval = 30000 // 30 seconds

    const updateTokenMetrics = async () => {
      try {
        for (const token of this.trackedTokens) {
          // Get price and liquidity data (implement price oracle integration)
          const [price, liquidity] = await Promise.all([
            this.getTokenPrice(token),
            this.getTokenLiquidity(token)
          ])

          // Update history
          this.tokenPriceHistory[token].push(price)
          this.liquidityHistory[token].push(liquidity)

          if (this.tokenPriceHistory[token].length > 288) { // 24h at 5min intervals
            this.tokenPriceHistory[token].shift()
            this.liquidityHistory[token].shift()
          }

          // Calculate metrics
          const priceChange24h = this.calculatePriceChange(token)
          const volatility24h = this.calculateVolatility(token)

          // Update metrics
          const currentMetrics = this.marketMetrics$.getValue() || this.getEmptyMetrics()
          currentMetrics.tokens[token] = {
            price: ethers.utils.parseEther(price.toString()).toString(),
            priceChange24h,
            volatility24h,
            liquidity: ethers.utils.parseEther(liquidity.toString()).toString(),
            volume24h: '0' // TODO: Implement volume tracking
          }

          this.marketMetrics$.next(currentMetrics)

          // Check for volatility alerts
          this.detectVolatilityAnomalies(token, volatility24h)
        }
      } catch (error) {
        console.error('Error updating token metrics:', error)
      }
    }

    // Initial update
    updateTokenMetrics()

    // Schedule regular updates
    setInterval(updateTokenMetrics, updateInterval)
  }

  private startProtocolMonitoring() {
    const updateInterval = 60000 // 1 minute

    const updateProtocolMetrics = async () => {
      try {
        for (const protocol of this.trackedProtocols) {
          // Get protocol data
          const health = await this.getProtocolHealth(protocol)

          // Update metrics
          const currentMetrics = this.marketMetrics$.getValue() || this.getEmptyMetrics()
          currentMetrics.protocols[protocol] = health

          this.marketMetrics$.next(currentMetrics)

          // Check for protocol health issues
          this.detectProtocolIssues(protocol, health)
        }
      } catch (error) {
        console.error('Error updating protocol metrics:', error)
      }
    }

    // Initial update
    updateProtocolMetrics()

    // Schedule regular updates
    setInterval(updateProtocolMetrics, updateInterval)
  }

  private startRiskAnalysis() {
    const analysisInterval = 60000 // 1 minute

    const performRiskAnalysis = () => {
      try {
        const metrics = this.marketMetrics$.getValue()
        if (!metrics) return

        // Analyze gas market conditions
        const gasRisk = this.analyzeGasRisk(metrics.gas)
        if (gasRisk > 0.7) {
          this.alerts$.next({
            type: 'risk',
            message: 'High gas price volatility detected',
            severity: gasRisk
          })
        }

        // Analyze token risks
        for (const [token, tokenMetrics] of Object.entries(metrics.tokens)) {
          const tokenRisk = this.analyzeTokenRisk(token, tokenMetrics)
          if (tokenRisk > 0.8) {
            this.alerts$.next({
              type: 'warning',
              message: `High risk detected for token ${token}`,
              severity: tokenRisk
            })
          }
        }

        // Analyze protocol risks
        for (const [protocol, health] of Object.entries(metrics.protocols)) {
          const protocolRisk = this.analyzeProtocolRisk(protocol, health)
          if (protocolRisk > 0.75) {
            this.alerts$.next({
              type: 'warning',
              message: `Health issues detected for protocol ${protocol}`,
              severity: protocolRisk
            })
          }
        }

      } catch (error) {
        console.error('Error in risk analysis:', error)
      }
    }

    // Start analysis loop
    setInterval(performRiskAnalysis, analysisInterval)
  }

  // Helper methods for calculations and predictions
  private predictNextBlockGas(): string {
    const recentPrices = this.gasPriceHistory.slice(-5)
    const trend = recentPrices[recentPrices.length - 1] - recentPrices[0]
    const prediction = this.gasPriceEMA + (trend / 5)
    return ethers.utils.parseUnits(
      Math.max(prediction, 1).toString(),
      'gwei'
    ).toString()
  }

  private calculatePriceChange(token: string): number {
    const history = this.tokenPriceHistory[token]
    if (history.length < 2) return 0
    const oldPrice = history[0]
    const newPrice = history[history.length - 1]
    return ((newPrice - oldPrice) / oldPrice) * 100
  }

  private calculateVolatility(token: string): number {
    const history = this.tokenPriceHistory[token]
    if (history.length < 2) return 0
    return standardDeviation(history)
  }

  private analyzeGasRisk(gasMetrics: GasMetrics): number {
    const volatility = standardDeviation(gasMetrics.baseFeeTrend)
    const utilizationRisk = gasMetrics.blockUtilization / 100
    return (volatility * 0.7 + utilizationRisk * 0.3)
  }

  private analyzeTokenRisk(token: string, metrics: TokenMetrics): number {
    const volatilityRisk = Math.min(Math.abs(metrics.volatility24h) / 100, 1)
    const liquidityRisk = 1 - Math.min(
      Number(ethers.utils.formatEther(metrics.liquidity)) / 1000000,
      1
    )
    return (volatilityRisk * 0.7 + liquidityRisk * 0.3)
  }

  private analyzeProtocolRisk(protocol: string, health: ProtocolHealth): number {
    const utilizationRisk = health.utilizationRate
    const healthRisk = 1 - health.healthFactor
    return (utilizationRisk * 0.4 + healthRisk * 0.6)
  }

  // Placeholder methods for external data fetching
  private async getTokenPrice(token: string): Promise<number> {
    // TODO: Implement price oracle integration
    return 1000
  }

  private async getTokenLiquidity(token: string): Promise<number> {
    // TODO: Implement liquidity data fetching
    return 1000000
  }

  private async getProtocolHealth(protocol: string): Promise<ProtocolHealth> {
    // TODO: Implement protocol health checking
    return {
      tvl: ethers.utils.parseEther('1000000').toString(),
      dailyVolume: ethers.utils.parseEther('100000').toString(),
      fees24h: ethers.utils.parseEther('1000').toString(),
      utilizationRate: 0.7,
      healthFactor: 0.9
    }
  }

  // Alert detection methods
  private detectGasAnomalies() {
    const recent = this.gasPriceHistory.slice(-5)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    const latest = recent[recent.length - 1]

    if (latest > avg * 1.5) {
      this.alerts$.next({
        type: 'warning',
        message: 'Sudden gas price spike detected',
        severity: 0.8
      })
    }
  }

  private detectVolatilityAnomalies(token: string, volatility: number) {
    if (!this.volatilityEMAs[token]) {
      this.volatilityEMAs[token] = volatility
      return
    }

    const normalizedVol = volatility / this.volatilityEMAs[token]
    if (normalizedVol > 2) {
      this.alerts$.next({
        type: 'warning',
        message: `High volatility detected for ${token}`,
        severity: Math.min(normalizedVol / 3, 1)
      })
    }

    // Update EMA
    this.volatilityEMAs[token] = exponentialMovingAverage(
      [volatility],
      this.volatilityEMAs[token],
      0.1
    )
  }

  private detectProtocolIssues(protocol: string, health: ProtocolHealth) {
    if (health.healthFactor < 0.8) {
      this.alerts$.next({
        type: 'warning',
        message: `Low health factor for ${protocol}`,
        severity: 1 - health.healthFactor
      })
    }

    if (health.utilizationRate > 0.9) {
      this.alerts$.next({
        type: 'warning',
        message: `High utilization for ${protocol}`,
        severity: health.utilizationRate
      })
    }
  }

  private getEmptyMetrics(): MarketMetrics {
    return {
      protocols: {},
      tokens: {},
      gas: {
        currentPrice: '0',
        baseFeeTrend: [],
        priorityFeeTrend: [],
        blockUtilization: 0,
        nextBlockPrediction: '0'
      }
    }
  }
}