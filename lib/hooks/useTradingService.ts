import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { TradingService } from '../services/tradingService'
import { DexRegistry } from '../dexRegistry'
import { SimulationResult } from '../simulator/advanced-simulator'

interface UseTradingServiceProps {
  provider: ethers.providers.Provider
  contractAddress: string
  dexRegistry: DexRegistry
}

interface UseTradingServiceReturn {
  isInitialized: boolean
  findOpportunities: (
    tokenAddress: string,
    amount: string,
    options?: {
      maxSlippage?: number
      minNetProfit?: string
      riskTolerance?: number
      minProbability?: number
    }
  ) => Promise<SimulationResult[]>
  error: Error | null
  contractState: any | null
}

export function useTradingService({
  provider,
  contractAddress,
  dexRegistry
}: UseTradingServiceProps): UseTradingServiceReturn {
  const [service, setService] = useState<TradingService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [contractState, setContractState] = useState<any | null>(null)

  useEffect(() => {
    const initService = async () => {
      try {
        const tradingService = new TradingService(
          provider,
          contractAddress,
          dexRegistry
        )
        
        await tradingService.initialize()
        setService(tradingService)
        setIsInitialized(true)

        // Subscribe to contract state updates
        const monitor = tradingService.getContractMonitor()
        monitor.state$.subscribe(
          state => setContractState(state),
          error => setError(error)
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize trading service'))
      }
    }

    initService()

    // Cleanup
    return () => {
      if (service) {
        service.stop()
      }
    }
  }, [provider, contractAddress, dexRegistry])

  const findOpportunities = async (
    tokenAddress: string,
    amount: string,
    options?: {
      maxSlippage?: number
      minNetProfit?: string
      riskTolerance?: number
      minProbability?: number
    }
  ) => {
    if (!service) {
      throw new Error('Trading service not initialized')
    }

    return service.findAndSimulateOpportunities(tokenAddress, amount, options)
  }

  return {
    isInitialized,
    findOpportunities,
    error,
    contractState
  }
}