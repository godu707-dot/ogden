import { ethers } from 'ethers'
import { ContractMonitor } from '../monitors/contract-monitor'
import { AdvancedPathFinder } from '../pathfinder/advanced-pathfinder'
import { AdvancedSimulator } from '../simulator/advanced-simulator'
import { DexRegistry } from '../dexRegistry'
import DenExecutorABI from '../../contracts/DenExecutor.abi'

export class TradingService {
  private contractMonitor!: ContractMonitor;
  private pathFinder!: AdvancedPathFinder;
  private simulator!: AdvancedSimulator;
  private isInitialized = false;

  constructor(
    private readonly provider: ethers.providers.Provider,
    private readonly contractAddress: string,
    private readonly dexRegistry: DexRegistry
  ) {}

  async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize contract monitor
      this.contractMonitor = new ContractMonitor(
        this.provider,
        this.contractAddress,
        DenExecutorABI
      )

      // Initialize pathfinder
      this.pathFinder = new AdvancedPathFinder(
        this.provider,
        this.dexRegistry,
        {
          maxHops: 4,
          minLiquidity: ethers.utils.parseEther('10').toString(),
          maxPriceImpact: 0.5
        }
      )

      // Initialize simulator with real-time price feeds
      this.simulator = new AdvancedSimulator(
        this.provider,
        this.pathFinder,
        this.contractMonitor,
        {
          updateInterval: 1000, // Update prices every second
          staleThreshold: 120, // Mark prices as stale after 2 minutes
          twapInterval: 300 // 5 minutes TWAP interval
        }
      )

      // Start contract monitoring
      await this.contractMonitor.start()

      this.isInitialized = true
      console.log('Trading service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize trading service:', error)
      throw error
    }
  }

  async findAndSimulateOpportunities(
    tokenAddress: string,
    amount: string,
    options: {
      maxSlippage?: number
      minNetProfit?: string
      riskTolerance?: number
      minProbability?: number
    } = {}
  ) {
    if (!this.isInitialized) {
      throw new Error('Trading service not initialized')
    }

    try {
      const results = await this.simulator.simulateArbitrage(
        tokenAddress,
        amount,
        {
          maxSlippage: options.maxSlippage || 0.5,
          minNetProfit: options.minNetProfit || ethers.utils.parseEther('0.1').toString(),
          riskTolerance: options.riskTolerance || 0.7,
          minProbability: options.minProbability || 0.8
        }
      )

      return results
    } catch (error) {
      console.error('Error simulating arbitrage opportunities:', error)
      throw error
    }
  }

  getContractMonitor() {
    return this.contractMonitor
  }

  getPathFinder() {
    return this.pathFinder
  }

  getSimulator() {
    return this.simulator
  }

  async stop() {
    if (this.isInitialized) {
      this.contractMonitor.stop()
      this.isInitialized = false
    }
  }
}