"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { EnhancedTradingService } from "@/lib/services/enhancedTradingService"
import { Button } from "@/components/ui/button"
import { GL } from "@/components/gl"
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import ExecutionHistory from '@/components/execution-history'
import OpportunityExecutor from '@/components/opportunity-executor'
import { 
  Metrics, 
  Opportunity, 
  DexMetric, 
  CryptoMetric, 
  FlashLoanState 
} from '@/types/dashboard'

interface SimulationResult {
  netProfit: string
  inputAmount: string
  path: { dex: string }[]
  riskLevel: number
}

export default function Dashboard() {
  const [tradingService, setTradingService] = useState<EnhancedTradingService | null>(null)
  
  const [metrics, setMetrics] = useState<Metrics>({
    totalProfit: 0,
    activeOpportunities: 0,
    successRate: 0,
    gasUsed: 0,
  })

  // Initialize trading service and data
  useEffect(() => {
    async function initTradingService() {
      try {
        const { getProvider } = await import('@/lib/contract')
        const provider = await getProvider()
        const { ContractMonitor } = await import('@/lib/monitors/contract-monitor')
        const { AdvancedPathFinder } = await import('@/lib/pathfinder/advanced-pathfinder')
        const { AdvancedSimulator } = await import('@/lib/simulator/advanced-simulator')
        const { DexRegistryImpl } = await import('@/lib/dexRegistry')
        
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
        if (!contractAddress) throw new Error('Contract address not set')

        // Initialize services with flash loan support
        const monitor = new ContractMonitor(
          provider, 
          contractAddress, 
          []  // Empty ABI array, will be populated by the service
        )
        const dexRegistry = new DexRegistryImpl(provider, contractAddress)
        const pathFinder = new AdvancedPathFinder(provider, dexRegistry)
        const simulator = new AdvancedSimulator(provider, pathFinder, monitor)
        
        const service = new EnhancedTradingService(
          provider,
          monitor,
          pathFinder,
          simulator,
          dexRegistry
        )
        
        // Start monitoring services
        monitor.start()
        
        // Subscribe to opportunity updates
        service.opportunities$.subscribe(strategy => {
          if (strategy) {
            setOpportunities(prev => {
              const updatedOpportunities = [...prev]
              // Update or add new opportunity
              const opportunity: Opportunity = {
                id: updatedOpportunities.length + 1,
                type: 'triangular',
                profit: ethers.utils.formatEther(strategy.expectedProfit),
                roi: '0', // Calculate based on amount when available
                dexs: ['UNI', 'SUSHI'], // Will be populated from path
                risk: strategy.riskLevel < 0.3 ? "Low" :
                      strategy.riskLevel < 0.7 ? "Medium" : "High",
                complexityScore: strategy.complexityScore || 0,
                gasOptimized: Boolean(strategy.gasOptimized)
              }
              
              // Add new or update existing
              const existingIndex = updatedOpportunities.findIndex(
                opp => opp.profit === opportunity.profit && 
                      opp.type === opportunity.type
              )
              
              if (existingIndex >= 0) {
                updatedOpportunities[existingIndex] = opportunity
              } else {
                updatedOpportunities.push(opportunity)
              }
              
              return updatedOpportunities.slice(0, 10) // Keep latest 10
            })
          }
        })

        // Subscribe to flash loan monitoring
        service.flashLoanState$.subscribe(state => {
          if (state) {
            const totalLiquidity = Object.values(state.availableLiquidity)
              .reduce((sum, val) => sum.add(ethers.BigNumber.from(val)), 
                      ethers.BigNumber.from(0))
            
            setDexPerformance([
              { 
                name: "AAVE V3", 
                volume: Number(ethers.utils.formatEther(state.availableLiquidity['Aave V3'] || '0')),
                trades: state.activeLoanCount
              },
              { 
                name: "dYdX", 
                volume: Number(ethers.utils.formatEther(state.availableLiquidity['dYdX'] || '0')),
                trades: state.activeLoanCount
              },
              {
                name: "BALANCER",
                volume: Number(ethers.utils.formatEther(state.availableLiquidity['Balancer'] || '0')),
                trades: state.activeLoanCount
              },
              {
                name: "Total",
                volume: Number(ethers.utils.formatEther(totalLiquidity)),
                trades: state.activeLoanCount * 3
              }
            ])
          }
        })
        
        setTradingService(service)
      } catch (error) {
        console.error('Error initializing trading service:', error)
      }
    }

    initTradingService()
  }, [])

  // State for data visualization
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [chartData, setChartData] = useState<number[]>(Array(24).fill(0))
  const [dexPerformance, setDexPerformance] = useState([
    { name: "Uniswap V3", volume: 0, trades: 0 },
    { name: "SushiSwap", volume: 0, trades: 0 },
    { name: "Curve", volume: 0, trades: 0 },
    { name: "Balancer", volume: 0, trades: 0 },
  ])

  // Wallet & performance metrics
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletChange, setWalletChange] = useState(0)
  const [revenueThisWeek, setRevenueThisWeek] = useState(0)
  const [miniChartData, setMiniChartData] = useState<number[]>(Array(30).fill(0))
  const [cryptoPerformance, setCryptoPerformance] = useState([
    { symbol: "BTC", change: 0 },
    { symbol: "BNB", change: 0 },
    { symbol: "ETH", change: 0 },
    { symbol: "KOP", change: 0 },
  ])

  // Update metrics periodically
  useEffect(() => {
    if (!tradingService) return

    const abortController = new AbortController()
    const signal = abortController.signal

    async function updateMetrics() {
      if (!tradingService || signal.aborted) return

      try {
        // Get main services
        const svc = tradingService
        const provider = svc.provider
        const contract = svc.getContract()
        
        // Fetch chain and DEX data
        const [latestBlock, dexMetrics] = await Promise.all([
          provider.getBlock('latest'),
          svc.dexRegistry.getDexMetrics()
        ])

        // Update DEX metrics
        setDexPerformance([
          { name: 'UNISWAP', volume: dexMetrics.uniswap?.volume || 0, trades: dexMetrics.uniswap?.trades || 0 },
          { name: 'SUSHISWAP', volume: dexMetrics.sushiswap?.volume || 0, trades: dexMetrics.sushiswap?.trades || 0 },
          { name: 'CURVE', volume: dexMetrics.curve?.volume || 0, trades: dexMetrics.curve?.trades || 0 },
          { name: 'BALANCER', volume: dexMetrics.balancer?.volume || 0, trades: dexMetrics.balancer?.trades || 0 }
        ])

        // Get core contract metrics
        const baseFee = latestBlock.baseFeePerGas || ethers.BigNumber.from(0)
        const [profits, activeOps, successCount, totalCount] = await Promise.all([
          contract.functions.getTotalProfits(),
          contract.functions.getActiveOpportunityCount(),
          contract.functions.getSuccessCount(),
          contract.functions.getTotalCount(),
        ]).then(([profits, activeOps, successCount, totalCount]) => [
          profits[0], activeOps[0], successCount[0], totalCount[0]
        ])
        
        // Calculate metrics
        const successRate = totalCount.gt(0) 
          ? successCount.mul(100).div(totalCount).toNumber() 
          : 0

        // Update metrics
        setMetrics({
          totalProfit: Number(ethers.utils.formatEther(profits)),
          activeOpportunities: activeOps.toNumber(),
          successRate,
          gasUsed: Number(ethers.utils.formatEther(baseFee.mul(activeOps))),
        })

        // Find and simulate opportunities
        const simResults = await svc.findAndSimulateOpportunities(
          svc.dexRegistry.getBaseTokenAddress(),
          ethers.utils.parseEther('1').toString()
        )

        if (simResults && simResults.length > 0) {
          const newOpportunities = simResults.map((sim, index) => ({
            id: index + 1,
            type: 'triangular',
            profit: ethers.utils.formatEther(sim.netProfit || '0'),
            roi: ((Number(ethers.utils.formatEther(sim.netProfit || '0')) /
              Number(ethers.utils.parseEther('1'))) * 100).toFixed(2),
            dexs: Array.isArray(sim.path) ? sim.path.map(p => p.dex) : ['UNKNOWN'],
            risk: Number(sim.netProfit) < Number(ethers.utils.parseEther('0.1')) ? 'Low' :
                  Number(sim.netProfit) < Number(ethers.utils.parseEther('0.5')) ? 'Medium' : 'High',
            complexityScore: Array.isArray(sim.path) ? sim.path.filter(Boolean).length / 8 : 0.125,
            gasOptimized: Number(sim.netProfit) < Number(ethers.utils.parseEther('0.1'))
          } as Opportunity))
          
          setOpportunities(newOpportunities.slice(0, 3))
        }

        // Check if wallet is connected and get address
        const addresses = await window.ethereum?.request({ 
          method: 'eth_accounts'
        }) as string[]
        const currentAddress = addresses?.[0]
        
        if (!currentAddress || !tradingService) return
          
        // Update wallet metrics
        const walletBalance = await provider.getBalance(currentAddress)
        const formattedBalance = Number(ethers.utils.formatEther(walletBalance))
        
        setWalletBalance(formattedBalance)
        
        // Calculate wallet change from previous balance
        const blockNumber = await provider.getBlockNumber()
        const prevBalance = await provider.getBalance(
          currentAddress, 
          blockNumber - 6000 // ~24h ago
        )
        const prevFormatted = Number(ethers.utils.formatEther(prevBalance))
        const change = ((formattedBalance - prevFormatted) / prevFormatted) * 100
        setWalletChange(change)
        
        // Get weekly revenue from contract monitor
        if (tradingService) {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
          const weeklyProfits = walletChange > 0 ? walletChange : 0
          setRevenueThisWeek(weeklyProfits)
        }
      } catch (error) {
        console.error('Error updating metrics:', error)
      }
    }

    // Set up update interval
    const updateInterval = setInterval(updateMetrics, 10000)
    updateMetrics() // Initial update

    return () => {
      clearInterval(updateInterval)
      abortController.abort()
    }
  }, [])

  const maxChartValue = Math.max(...chartData, 1)
  const maxMiniChartValue = Math.max(...miniChartData, 1)
  const minMiniChartValue = Math.min(...miniChartData, 1)

  return (
    <>
      <GL hovering={false} />
      <div className="min-h-screen lg:pl-20 pb-20 lg:pb-6 pt-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-sentient mb-1">Dashboard</h1>
            <p className="text-xs text-foreground/60 font-mono">Welcome back to DENWEN</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
            {/* Total Profit Card */}
            <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
              <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-1">Total profit</div>
              <div className="text-lg md:text-2xl font-sentient mb-1">${metrics.totalProfit.toFixed(2)}</div>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" />
                <span className="font-mono text-[9px] md:text-[10px] text-green-500">27.93%</span>
              </div>
            </div>

            {/* Best Profit Token Card */}
            <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
              <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-2">Best-profit token</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] md:text-xs truncate">Chain</div>
                  <div className="font-mono text-[9px] md:text-[10px] text-foreground/60">LNK</div>
                </div>
                <div className="flex items-center gap-0.5">
                  <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" />
                  <span className="font-mono text-[9px] md:text-[10px] text-green-500">9.97%</span>
                </div>
              </div>
            </div>

            {/* Unprofitable Token Card */}
            <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
              <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-2">Unprofitable token</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-foreground/30 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] md:text-xs truncate">Stellar</div>
                  <div className="font-mono text-[9px] md:text-[10px] text-foreground/60">XLM</div>
                </div>
                <div className="flex items-center gap-0.5">
                  <ArrowDownRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-500" />
                  <span className="font-mono text-[9px] md:text-[10px] text-red-500">3.37%</span>
                </div>
              </div>
            </div>

            {/* Portfolio Score Card */}
            <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
              <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-2">Portfolio score</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-background">S</span>
                </div>
                <div>
                  <div className="text-base md:text-lg font-sentient">{metrics.successRate.toFixed(0)}/100</div>
                  <div className="font-mono text-[9px] md:text-[10px] text-foreground/60">Excellent</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
            {/* Exchange Card */}
            <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-sentient">Exchange</h3>
                <Button size="sm" variant="ghost" className="w-7 h-7 p-0 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex gap-2 mb-3 md:mb-4">
                <Button className="flex-1 bg-foreground/10 hover:bg-foreground/20 border-0 rounded-lg text-xs">
                  Swap
                </Button>
                <Button variant="ghost" className="flex-1 rounded-lg text-foreground/60 text-xs">
                  Limit
                </Button>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between p-2 md:p-3 bg-foreground/5 rounded-lg md:rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20" />
                    <div>
                      <div className="font-mono text-[10px] md:text-xs">INJ</div>
                      <div className="font-mono text-[9px] md:text-[10px] text-foreground/40">Sell Injective</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] md:text-xs">276.55</div>
                    <div className="font-mono text-[9px] md:text-[10px] text-red-500">-$88.31</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 md:p-3 bg-foreground/5 rounded-lg md:rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground/20" />
                    <div>
                      <div className="font-mono text-[10px] md:text-xs">ZRX</div>
                      <div className="font-mono text-[9px] md:text-[10px] text-foreground/40">Buy 0x Protocol</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] md:text-xs">28,582.67</div>
                    <div className="font-mono text-[9px] md:text-[10px] text-red-500">-$88.27 ↓0.04%</div>
                  </div>
                </div>

                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 font-mono text-[9px] md:text-[10px] text-primary">
                    <span>💱</span>
                    <span className="truncate">1 INJ = 105.594 ZRX</span>
                    <span className="text-foreground/40 whitespace-nowrap">-$0.3286</span>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-3 md:mt-4 bg-primary hover:bg-primary/90 text-background rounded-lg h-9 md:h-10 text-xs md:text-sm">
                Swap ⚡
              </Button>
            </div>

            {/* Wallet Card */}
            <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-sentient">Wallet</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] md:text-[10px] text-foreground/40">10 sec ago</span>
                  <Button size="sm" variant="ghost" className="w-7 h-7 p-0 rounded-full">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mb-2 md:mb-3">
                <Button variant="ghost" className="text-[10px] md:text-xs font-mono text-foreground/60 h-6 md:h-7">
                  USDT ▼
                </Button>
              </div>

              <div className="mb-2">
                <div className="text-xl md:text-2xl font-sentient">${walletBalance.toFixed(2)}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-mono text-[9px] md:text-[10px] text-foreground/60">Your revenue is</span>
                  <span className="font-mono text-[9px] md:text-[10px] text-primary">
                    ${revenueThisWeek.toFixed(2)}
                  </span>
                  <span className="font-mono text-[9px] md:text-[10px] text-foreground/60">this week ▼</span>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-20 md:h-24 flex items-end justify-between gap-[2px] my-3 md:my-4 relative">
                {miniChartData.map((value, i) => {
                  const height = ((value - minMiniChartValue) / (maxMiniChartValue - minMiniChartValue)) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div
                        className="w-full bg-foreground/20 transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    )
                  })}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-foreground/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <span className="font-mono text-[9px] md:text-[10px] text-background">
                      ${(maxMiniChartValue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Crypto Performance */}
              <div className="grid grid-cols-4 gap-2">
                {cryptoPerformance.map((crypto, i) => (
                  <div key={i} className="text-center">
                    <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-1">{crypto.symbol}</div>
                    <div className="flex items-center justify-center gap-0.5">
                      <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" />
                      <span className="font-mono text-[9px] md:text-[10px] text-green-500">{crypto.change}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights Card */}
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-primary/20 relative overflow-hidden">
              <div className="relative z-10">
                <div className="mb-2 md:mb-3">
                  <Button variant="ghost" className="text-[10px] md:text-xs font-mono text-foreground/80 h-6 md:h-7">
                    Wallet ▼
                  </Button>
                </div>

                <h3 className="text-sm md:text-lg font-sentient mb-3 md:mb-4 leading-tight">
                  Since yesterday, your assets have grown by{" "}
                  <span className="text-primary">${(walletBalance * 0.025).toFixed(2)}</span>
                </h3>

                <Button className="bg-foreground/10 hover:bg-foreground/20 border-0 rounded-lg text-xs">
                  Insights - Get details →
                </Button>

                <div className="flex gap-2 mt-4 md:mt-6">
                  <div className="h-1 flex-1 bg-primary rounded-full" />
                  <div className="h-1 flex-1 bg-foreground/20 rounded-full" />
                  <div className="h-1 flex-1 bg-foreground/20 rounded-full" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="lg:col-span-2">
              {/* Live Opportunities Section (existing) */}
            </div>
            <div>
              <OpportunityExecutor />
              <div className="mt-3">
                <ExecutionHistory />
              </div>
            </div>
          </div>
          {/* Live Opportunities Section */}
          <div className="bg-foreground/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-foreground/10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-sentient">Live Opportunities</h2>
              <Link href="/opportunities">
                <Button size="sm" className="rounded-lg text-[10px] md:text-xs h-7 md:h-8">
                  View All →
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-foreground/5 rounded-lg md:rounded-xl p-3 md:p-4 border border-foreground/10 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-col gap-2 md:gap-3">
                    <div className="flex-1">
                      <div className="font-mono text-[10px] md:text-xs mb-2">{opp.type}</div>
                      <div className="flex flex-wrap gap-1">
                        {opp.dexs.map((dex: string, i: number) => (
                          <span
                            key={i}
                            className="font-mono text-[9px] md:text-[10px] text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded"
                          >
                            {dex}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 md:gap-4">
                      <div className="flex-1">
                        <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-0.5">PROFIT</div>
                        <div className="text-sm md:text-base font-sentient text-green-500">${opp.profit}</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-0.5">ROI</div>
                        <div className="text-sm md:text-base font-sentient">{opp.roi}%</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-mono text-[9px] md:text-[10px] text-foreground/60 mb-0.5">RISK</div>
                        <div
                          className={`text-[10px] md:text-xs font-mono ${opp.risk === "Low" ? "text-green-500" : "text-yellow-500"}`}
                        >
                          {opp.risk}
                        </div>
                      </div>
                      <Button size="sm" className="rounded-lg text-[10px] md:text-xs h-7 md:h-8">
                        Execute
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
