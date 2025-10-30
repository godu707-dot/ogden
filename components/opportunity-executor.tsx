"use client"
import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useMetaMask } from './ui/metamask-connect'
import { useTradingService } from '../lib/hooks/useTradingService'
import { DexRegistryImpl } from '../lib/dexRegistry'
import { SimulationResult } from '../lib/simulator/advanced-simulator'
import { ContractError } from '../lib/errors'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

interface OpportunityExecutorProps {
  opportunity?: {
    tokenAAmount: ethers.BigNumber;
    path: string[];
    data: any[];
    value: string;
  };
}

export default function OpportunityExecutor({ opportunity }: OpportunityExecutorProps) {
  const { account, connect, error, connecting, provider } = useMetaMask()
  const [lastOpportunity, setLastOpportunity] = useState<SimulationResult | null>(
    opportunity ? {
      path: {
        nodes: opportunity.path.map(p => ({
          dex: '',
          tokenIn: p,
          tokenOut: '',
          fee: 0,
          liquidity: '',
          priceImpact: 0
        }))
      },
      expectedReturn: opportunity.value,
      expectedGas: '0',
      priceImpact: 0,
      slippage: 0,
      flashLoanFee: '0',
      netProfit: opportunity.value,
      executionProbability: 1,
      riskAnalysis: {
        marketRisk: 0,
        technicalRisk: 0,
        liquidityRisk: 0,
        compositeScore: 0
      }
    } as SimulationResult : null
  )
  const [status, setStatus] = useState<string>('idle')
  const [mevProtect, setMevProtect] = useState<boolean>(false)

  // Initialize DexRegistry
  const dexRegistry = new DexRegistryImpl(
    provider as ethers.providers.Provider,
    CONTRACT_ADDRESS
  )

  // Initialize Trading Service
  const {
    isInitialized,
    findOpportunities,
    error: tradingError,
    contractState
  } = useTradingService({
    provider: provider as ethers.providers.Provider,
    contractAddress: CONTRACT_ADDRESS,
    dexRegistry
  })

  // Monitor for opportunities
  useEffect(() => {
    if (!isInitialized || !account) return

    const searchInterval = setInterval(async () => {
      try {
        // Example: Look for opportunities in WETH
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        const amount = ethers.utils.parseEther('1').toString()

        const opportunities = await findOpportunities(
          WETH,
          amount,
          {
            maxSlippage: 0.5,
            minNetProfit: ethers.utils.parseEther('0.1').toString(),
            riskTolerance: 0.7,
            minProbability: 0.8
          }
        )

        if (opportunities.length > 0) {
          setLastOpportunity(opportunities[0]) // Take the best opportunity
        }
      } catch (err) {
        console.error('Error finding opportunities:', err)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(searchInterval)
  }, [isInitialized, account, findOpportunities])

  const execute = async () => {
    if (!window.ethereum || !provider) return alert('Connect wallet first')
    if (!lastOpportunity) return alert('No opportunity found')
    setStatus('sending')
    
    try {
      const { executeOnChain } = await import('../lib/contract')
      const { executeWithRetry, safeExecuteTransaction } = await import('../lib/errors')
      
      if (mevProtect) {
        try {
          const { sendBundleViaFlashbots } = await import('../lib/mev')
          await executeWithRetry(async () => {
            // Convert path to transaction data
            const path = lastOpportunity.path.nodes.map(node => ({
              dex: node.dex,
              tokenIn: node.tokenIn,
              tokenOut: node.tokenOut,
              fee: node.fee
            }))

            await sendBundleViaFlashbots(provider, [
              {
                path,
                expectedReturn: lastOpportunity.expectedReturn,
                maxGas: lastOpportunity.expectedGas
              }
            ])
            setStatus('submitted (flashbots)')
            return undefined as any
          })
        } catch (err: any) {
          console.warn('flashbots failed, falling back to normal execution', err)
          // Fall through to normal execution
        }
      }
      
      // Normal wallet execution (happens if MEV protection fails or is disabled)
      const tx = await executeWithRetry(async () => {
        const path = lastOpportunity.path.nodes.map(node => ({
          dex: node.dex,
          tokenIn: node.tokenIn,
          tokenOut: node.tokenOut,
          fee: node.fee
        }))

        return executeOnChain(window.ethereum, 'executeArbitrage', [
          lastOpportunity.path.nodes[0].tokenIn, // Initial token
          lastOpportunity.expectedReturn, // Minimum expected return
          path // Trading path
        ])
      })
      
      setStatus('submitted')
      await safeExecuteTransaction(Promise.resolve(tx))
      setStatus('confirmed')
      
    } catch (err: any) {
      console.error(err)
      const errorMessage = err instanceof ContractError 
        ? ContractError.formatError(err)
        : err?.message || 'Unknown error'
      setStatus('error: ' + errorMessage)
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold">Advanced Arbitrage Executor</h3>
      <div className="mt-2">
        {account ? (
          <span className="text-green-600 font-mono">Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
        ) : (
          <button onClick={connect} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md" disabled={connecting}>
            {connecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        )}
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        {tradingError && <div className="text-red-500 text-xs mt-1">{tradingError.message}</div>}
      </div>

      <div className="mt-4">
        <div>Service status: {isInitialized ? 'running' : 'initializing'}</div>
        {contractState && (
          <div className="text-xs mt-2">
            <div>Profit Threshold: {ethers.utils.formatEther(contractState.profitThreshold)} ETH</div>
            <div>Max Borrow: {ethers.utils.formatEther(contractState.maxBorrowAmount)} ETH</div>
            <div>Price Impact Limit: {contractState.priceImpactLimit}%</div>
            <div>Total Profit: {ethers.utils.formatEther(contractState.totalProfit)} ETH</div>
          </div>
        )}
      </div>

      {lastOpportunity && (
        <div className="mt-4 p-2 bg-green-50 rounded text-xs">
          <div className="font-semibold">Latest Opportunity:</div>
          <div>Expected Return: {ethers.utils.formatEther(lastOpportunity.expectedReturn)} ETH</div>
          <div>Gas Cost: ~{ethers.utils.formatEther(lastOpportunity.expectedGas)} ETH</div>
          <div>Net Profit: {ethers.utils.formatEther(lastOpportunity.netProfit)} ETH</div>
          <div>Success Probability: {(lastOpportunity.executionProbability * 100).toFixed(1)}%</div>
          <div className="mt-1">
            <div>Risk Analysis:</div>
            <div className="pl-2">
              <div>Market Risk: {(lastOpportunity.riskAnalysis.marketRisk * 100).toFixed(1)}%</div>
              <div>Technical Risk: {(lastOpportunity.riskAnalysis.technicalRisk * 100).toFixed(1)}%</div>
              <div>Liquidity Risk: {(lastOpportunity.riskAnalysis.liquidityRisk * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={mevProtect} onChange={(e) => setMevProtect(e.target.checked)} />
          <span className="text-xs">Use MEV protection (Flashbots)</span>
        </label>

        <button 
          onClick={execute} 
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md w-full mt-2" 
          disabled={!lastOpportunity || !account || !isInitialized}
        >
          Execute Trade
        </button>
        <div className="mt-2 text-sm">Status: {status}</div>
      </div>
    </div>
  )
}
