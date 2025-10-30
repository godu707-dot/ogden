import { ethers } from 'ethers'
import { BehaviorSubject, Subject } from 'rxjs'

class ContractError extends Error {
  public original?: any
  constructor(original?: any) {
    super(original && original.message ? original.message : String(original))
    this.name = 'ContractError'
    this.original = original
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContractError)
    }
  }
}

export interface ContractEvent {
  type: 'arbitrage' | 'profit' | 'priceImpact' | 'ownership' | 'error'
  timestamp: number
  data: any
}

export interface ContractState {
  isActive: boolean
  lastUpdate: number
  profitThreshold: string
  maxBorrowAmount: string
  priceImpactLimit: string
  tradeCooldown: number
  totalProfit: string
  authorizedCallers: string[]
  blacklistedTokens: string[]
}

export class ContractMonitor {
  private provider: ethers.providers.Provider
  private contract: ethers.Contract
  private lastBlockProcessed?: number
  private isMonitoring = false
  private updateInterval?: NodeJS.Timeout
  
  // Observable streams
  public events$ = new Subject<ContractEvent>()
  public state$ = new BehaviorSubject<ContractState | null>(null)
  
  constructor(
    provider: ethers.providers.Provider,
    contractAddress: string,
    abi: any[]
  ) {
    this.provider = provider
    this.contract = new ethers.Contract(contractAddress, abi, provider)
  }

  async start() {
    if (this.isMonitoring) return
    this.isMonitoring = true

    // Initialize state
    await this.updateState()

    // Subscribe to events
    this.subscribeToEvents()

    // Set up periodic state updates
    this.updateInterval = setInterval(() => this.updateState(), 30000) // 30s

    // Monitor new blocks
    this.provider.on('block', this.onNewBlock.bind(this))
  }

  stop() {
    if (!this.isMonitoring) return
    this.isMonitoring = false
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    this.provider.removeAllListeners('block')
    this.contract.removeAllListeners()
  }

  private async updateState() {
    try {
      const [
        isPaused,
        minProfit,
        maxBorrow,
        priceImpact,
        cooldown,
        authorized,
        blacklisted
      ] = await Promise.all([
        this.contract.isPaused(),
        this.contract.minProfitThreshold(),
        this.contract.maxBorrowAmount(),
        this.contract.maxPriceImpact(),
        this.contract.tradeCooldown(),
        this.getAuthorizedCallers(),
        this.getBlacklistedTokens()
      ])

      this.state$.next({
        isActive: !isPaused,
        lastUpdate: Date.now(),
        profitThreshold: minProfit.toString(),
        maxBorrowAmount: maxBorrow.toString(),
        priceImpactLimit: priceImpact.toString(),
        tradeCooldown: cooldown.toNumber(),
        totalProfit: await this.calculateTotalProfit(),
        authorizedCallers: authorized,
        blacklistedTokens: blacklisted
      })
    } catch (error) {
      this.events$.next({
        type: 'error',
        timestamp: Date.now(),
        data: new ContractError(error)
      })
    }
  }

  private subscribeToEvents() {
    // Arbitrage events
    this.contract.on('ArbitrageExecuted', 
      (tokenBorrow, amount, profit, dexPath, event) => {
        this.events$.next({
          type: 'arbitrage',
          timestamp: Date.now(),
          data: {
            tokenBorrow,
            amount: amount.toString(),
            profit: profit.toString(),
            dexPath,
            transactionHash: event.transactionHash
          }
        })
      }
    )

    // Profit events
    this.contract.on('ProfitGenerated',
      (profit, timestamp, event) => {
        this.events$.next({
          type: 'profit',
          timestamp: Date.now(),
          data: {
            profit: profit.toString(),
            timestamp: timestamp.toNumber(),
            transactionHash: event.transactionHash
          }
        })
      }
    )

    // Price impact events
    this.contract.on('PriceImpactExceeded',
      (expected, actual, impact, event) => {
        this.events$.next({
          type: 'priceImpact',
          timestamp: Date.now(),
          data: {
            expected: expected.toString(),
            actual: actual.toString(),
            impact: impact.toString(),
            transactionHash: event.transactionHash
          }
        })
      }
    )

    // Ownership events
    this.contract.on('OwnershipTransferred',
      (previous, newOwner, event) => {
        this.events$.next({
          type: 'ownership',
          timestamp: Date.now(),
          data: {
            previousOwner: previous,
            newOwner,
            transactionHash: event.transactionHash
          }
        })
      }
    )
  }

  private async onNewBlock(blockNumber: number) {
    if (this.lastBlockProcessed === blockNumber) return
    this.lastBlockProcessed = blockNumber

    // Update state on new blocks
    await this.updateState()
  }

  private async getAuthorizedCallers(): Promise<string[]> {
    // Implementation depends on contract design
    // This is a placeholder that assumes we can query all past AddAuthorizedCaller events
    const filter = this.contract.filters.AddAuthorizedCaller()
    const events = await this.contract.queryFilter(filter)
    return events.map(e => e.args!.caller)
  }

  private async getBlacklistedTokens(): Promise<string[]> {
    // Implementation depends on contract design
    // This is a placeholder that assumes we can query all past SetTokenBlacklist events
    const filter = this.contract.filters.SetTokenBlacklist()
    const events = await this.contract.queryFilter(filter)
    return events
      .filter(e => e.args!.blacklisted)
      .map(e => e.args!.token)
  }

  private async calculateTotalProfit(): Promise<string> {
    // Sum up all ProfitGenerated events
    const filter = this.contract.filters.ProfitGenerated()
    const events = await this.contract.queryFilter(filter)
    return events
      .reduce((sum, event) => sum.add(event.args!.profit), ethers.BigNumber.from(0))
      .toString()
  }
}