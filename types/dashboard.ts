import { EnhancedArbitrageStrategy } from '../lib/services/enhancedTradingService'

export interface Metrics {
  totalProfit: number
  activeOpportunities: number
  successRate: number
  gasUsed: number
}

export interface Opportunity {
  id: number
  type: string
  profit: string
  roi: string
  dexs: string[]
  risk: 'Low' | 'Medium' | 'High'
  complexityScore: number
  gasOptimized: boolean
}

export interface DexMetric {
  name: string
  volume: number
  trades: number
}

export interface CryptoMetric {
  symbol: string
  change: number
}

export interface TokenPrice {
  current: number
  prev24h: number
}

export interface FlashLoanState {
  availableLiquidity: Record<string, string>
  activeLoanCount: number
  totalBorrowed: string
}

export type OpportunityHandler = (strategy: EnhancedArbitrageStrategy) => void