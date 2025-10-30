import { ethers } from 'ethers'
import { Subject, BehaviorSubject } from 'rxjs'
import DenExecutorABI from '../../contracts/DenExecutor.abi'
import { ContractMonitor } from '../monitors/contract-monitor'
import { AdvancedPathFinder } from '../pathfinder/advanced-pathfinder'
import { AdvancedSimulator } from '../simulator/advanced-simulator'
import { DexRegistryImpl } from '../dexRegistry'

// Enhanced opportunity types
export interface FlashLoanProvider {
  name: string
  address: string
  fee: number
  maxLoan: string
  token: string
}

export interface EnhancedArbitrageStrategy {
  type: 'triangular' | 'cross-dex' | 'flash-loan' | 'multi-hop'
  expectedProfit: string
  riskLevel: number
  complexityScore: number
  gasOptimized: boolean
}

export class EnhancedTradingService {
  private contract: ethers.Contract;
  
  private readonly flashLoanProviders: FlashLoanProvider[] = [
    {
      name: 'Aave V3',
      address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
      fee: 0.09,
      maxLoan: ethers.utils.parseEther('1000000').toString(),
      token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
    },
    {
      name: 'dYdX',
      address: '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e',
      fee: 0.08,
      maxLoan: ethers.utils.parseEther('500000').toString(),
      token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    },
    {
      name: 'Balancer',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      fee: 0.1,
      maxLoan: ethers.utils.parseEther('250000').toString(),
      token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    }
  ]

  // Enhanced monitoring streams
  public opportunities$ = new Subject<EnhancedArbitrageStrategy>()
  public flashLoanState$ = new BehaviorSubject<{
    availableLiquidity: Record<string, string>
    activeLoanCount: number
    totalBorrowed: string
  } | null>(null)
  
  constructor(
    public readonly provider: ethers.providers.Provider,
    public readonly contractMonitor: ContractMonitor,
    public readonly pathFinder: AdvancedPathFinder,
    public readonly simulator: AdvancedSimulator,
    public readonly dexRegistry: DexRegistryImpl
  ) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (!contractAddress) throw new Error('Contract address not set')
    this.contract = new ethers.Contract(contractAddress, DenExecutorABI, provider)
  }

  public getContract(): ethers.Contract {
    return this.contract
  }

  public async findAndSimulateOpportunities(tokenAddress: string, amount: string) {
    return this.simulator.simulateArbitrage(tokenAddress, amount, {
      maxSlippage: 0.5,
      minNetProfit: ethers.utils.parseEther('0.1').toString()
    })
  }

  async initialize() {
    // Initialize base services
    await this.dexRegistry.initialize()
    await this.contractMonitor.start()

    // Start flash loan monitoring
    await this.monitorFlashLoanProviders()

    // Start enhanced opportunity detection
    this.startEnhancedOpportunityDetection()
  }

  private async monitorFlashLoanProviders() {
    const updateInterval = 30000 // 30 seconds

    const updateLiquidity = async () => {
      const availableLiquidity: Record<string, string> = {}
      let totalBorrowed = ethers.BigNumber.from(0)
      let activeLoanCount = 0

      for (const provider of this.flashLoanProviders) {
        try {
          const contract = new ethers.Contract(
            provider.address,
            ['function getReserveData(address) view returns (tuple(uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt))'],
            this.provider
          )

          const data = await contract.getReserveData(provider.token)
          availableLiquidity[provider.name] = data.availableLiquidity.toString()
          totalBorrowed = totalBorrowed.add(
            data.totalStableDebt.add(data.totalVariableDebt)
          )
          activeLoanCount += 1
        } catch (error) {
          console.warn(`Failed to get data for ${provider.name}:`, error)
        }
      }

      this.flashLoanState$.next({
        availableLiquidity,
        activeLoanCount,
        totalBorrowed: totalBorrowed.toString()
      })
    }

    // Initial update
    await updateLiquidity()

    // Schedule regular updates
    setInterval(updateLiquidity, updateInterval)
  }

  private startEnhancedOpportunityDetection() {
    const checkInterval = 5000 // 5 seconds

    const detectOpportunities = async () => {
      try {
        // 1. Check traditional arbitrage opportunities
        const traditionalPaths = await this.pathFinder.findOptimalPaths(
          this.flashLoanProviders[0].token, // WETH
          ethers.utils.parseEther('1').toString()
        )

        // 2. Check flash loan opportunities
        for (const provider of this.flashLoanProviders) {
          const flashLoanPaths = await this.pathFinder.findOptimalPaths(
            provider.token,
            provider.maxLoan,
            {
              maxPaths: 10,
              preferredDexes: ['UNISWAP_V3', 'SUSHISWAP', 'BALANCER']
            }
          )

          // 3. Simulate with flash loans
          for (const path of flashLoanPaths) {
            const simulation = await this.simulator.simulateArbitrage(
              provider.token,
              provider.maxLoan,
              {
                maxSlippage: 0.5,
                minNetProfit: ethers.utils.parseEther('0.1').toString()
              }
            )

            // 4. Calculate strategy type and metrics
            if (simulation.length > 0) {
              const bestSim = simulation[0]
              const strategy: EnhancedArbitrageStrategy = {
                type: path.nodes.length <= 3 ? 'triangular' : 'multi-hop',
                expectedProfit: bestSim.netProfit,
                riskLevel: bestSim.riskAnalysis.compositeScore,
                complexityScore: path.nodes.length / 8, // Normalize to 0-1
                gasOptimized: true
              }

              // Emit opportunity
              this.opportunities$.next(strategy)
            }
          }
        }
      } catch (error) {
        console.error('Error in opportunity detection:', error)
      }
    }

    // Start detection loop
    setInterval(detectOpportunities, checkInterval)
  }

  // Get optimal flash loan provider for a given opportunity
  async getOptimalFlashLoanProvider(
    amount: string,
    expectedProfit: string
  ): Promise<FlashLoanProvider | null> {
    let bestProvider: FlashLoanProvider | null = null
    let maxNet = ethers.BigNumber.from(0)

    for (const provider of this.flashLoanProviders) {
      if (ethers.BigNumber.from(amount).gt(provider.maxLoan)) {
        continue
      }

      const fee = ethers.BigNumber.from(amount)
        .mul(Math.floor(provider.fee * 100))
        .div(10000)

      const net = ethers.BigNumber.from(expectedProfit).sub(fee)

      if (net.gt(maxNet)) {
        maxNet = net
        bestProvider = provider
      }
    }

    return bestProvider
  }

  // Execute arbitrage with flash loan
  async executeArbitrageWithFlashLoan(
    strategy: EnhancedArbitrageStrategy,
    amount: string,
    path: any[],
    options: {
      maxSlippage?: number
      deadline?: number
      gasPrice?: string
      useMEVProtection?: boolean
    } = {}
  ) {
    const provider = await this.getOptimalFlashLoanProvider(
      amount,
      strategy.expectedProfit
    )

    if (!provider) {
      throw new Error('No suitable flash loan provider found')
    }

    // Prepare execution data
    const data = {
      flashLoanProvider: provider.address,
      amount,
      path,
      deadline: options.deadline || Math.floor(Date.now() / 1000) + 300, // 5 minutes
      maxSlippage: options.maxSlippage || 0.5,
      expectedProfit: strategy.expectedProfit
    }

    // Execute with MEV protection if requested
    if (options.useMEVProtection) {
      const { sendBundleViaFlashbots } = await import('../mev')
      return sendBundleViaFlashbots(this.provider, [{
        path,
        expectedReturn: strategy.expectedProfit,
        maxGas: options.gasPrice || ethers.utils.parseUnits('500000', 'wei').toString()
      }])
    }

    // Normal execution
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
      ['function executeArbitrageWithFlashLoan(address,uint256,tuple(address,address,uint24)[],uint256,uint256) payable returns (uint256)'],
      this.provider
    )

    return contract.executeArbitrageWithFlashLoan(
      provider.address,
      amount,
      path.map(p => [p.dex, p.tokenIn, p.fee]),
      ethers.BigNumber.from(strategy.expectedProfit),
      data.deadline,
      {
        gasPrice: options.gasPrice ? ethers.BigNumber.from(options.gasPrice) : undefined,
        gasLimit: ethers.BigNumber.from('500000')
      }
    )
  }
}