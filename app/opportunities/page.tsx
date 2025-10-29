"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Pill } from "@/components/pill"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowRight, TrendingUp } from "lucide-react"

const GL = dynamic(() => import("@/components/gl").then(mod => ({ default: mod.GL })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

const allOpportunities = [
  {
    id: 1,
    path: ["USDC", "WETH", "DAI", "USDC"],
    dexs: ["Uniswap V3", "SushiSwap", "Curve"],
    profit: 234.56,
    roi: 3.2,
    risk: "Low",
    liquidity: "High",
    gasEstimate: 0.12,
    slippage: 0.5,
  },
  {
    id: 2,
    path: ["WETH", "USDT", "WBTC", "WETH"],
    dexs: ["Uniswap V2", "Balancer", "1inch"],
    profit: 567.89,
    roi: 5.8,
    risk: "Medium",
    liquidity: "Medium",
    gasEstimate: 0.18,
    slippage: 1.2,
  },
  {
    id: 3,
    path: ["DAI", "USDC", "WETH", "DAI"],
    dexs: ["Curve", "PancakeSwap", "DODO"],
    profit: 123.45,
    roi: 2.1,
    risk: "Low",
    liquidity: "High",
    gasEstimate: 0.09,
    slippage: 0.3,
  },
  {
    id: 4,
    path: ["WBTC", "WETH", "USDC", "WBTC"],
    dexs: ["Uniswap V3", "Balancer", "Curve"],
    profit: 789.12,
    roi: 6.5,
    risk: "High",
    liquidity: "Medium",
    gasEstimate: 0.22,
    slippage: 2.1,
  },
  {
    id: 5,
    path: ["USDT", "DAI", "USDC", "USDT"],
    dexs: ["Curve", "1inch", "SushiSwap"],
    profit: 89.34,
    roi: 1.5,
    risk: "Low",
    liquidity: "High",
    gasEstimate: 0.08,
    slippage: 0.2,
  },
]

function PathVisualization({ path, dexs }: { path: string[]; dexs: string[] }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {path.map((token, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="relative group">
              <div className="w-8 h-8 rounded-lg border border-primary/50 bg-background/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:bg-primary/10">
                <span className="font-mono text-[9px] font-bold text-primary">{token.slice(0, 3)}</span>
              </div>
              {i < path.length - 1 && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="font-mono text-[7px] text-foreground/40">{dexs[i]}</span>
                </div>
              )}
            </div>
            {i < path.length - 1 && (
              <div className="flex items-center">
                <div className="w-4 h-[1px] bg-gradient-to-r from-primary/50 to-primary/20" />
                <ArrowRight className="w-2.5 h-2.5 text-primary/50" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Opportunities() {
  const [selectedOpp, setSelectedOpp] = useState<number | null>(null)

  return (
    <>
      <GL hovering={false} />
      <div className="min-h-screen pt-20 md:pt-24 pb-24 md:pb-4 pl-0 md:pl-20 pr-2 md:pr-4 relative z-20">
        <div className="container max-w-7xl mx-auto px-2 md:px-4">
          <div className="mb-4 bg-background/90 backdrop-blur-md rounded-xl p-4 border border-primary/20 shadow-lg">
            <Pill className="mb-2 text-[10px] px-3 py-1">ARBITRAGE OPPORTUNITIES</Pill>
            <h1 className="text-2xl md:text-3xl font-sentient mb-2 text-foreground">
              Real-time <i className="font-light text-primary">opportunity</i> discovery
            </h1>
            <p className="font-mono text-xs text-foreground/70">
              Multi-hop arbitrage paths with profit calculations and risk assessment
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/40" />
              <input
                type="text"
                placeholder="Search by token or DEX..."
                className="w-full rounded-lg bg-background/60 backdrop-blur-sm border border-border pl-8 pr-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg bg-background/60 backdrop-blur-sm text-[10px] h-7 px-2"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </Button>
              <select aria-label="Risk filter" className="rounded-lg bg-background/60 backdrop-blur-sm border border-border px-2 py-1 font-mono text-[10px] focus:outline-none focus:border-primary/50">
                <option>All Risk Levels</option>
                <option>Low Risk</option>
                <option>Medium Risk</option>
                <option>High Risk</option>
              </select>
            </div>
          </div>

          {/* Opportunities List */}
          <div className="space-y-2">
            {allOpportunities.map((opp) => (
              <div
                key={opp.id}
                className={`rounded-lg border bg-background/60 backdrop-blur-sm p-2 transition-all duration-300 cursor-pointer ${
                  selectedOpp === opp.id
                    ? "border-primary shadow-[0_0_15px_rgba(255,199,0,0.1)]"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedOpp(selectedOpp === opp.id ? null : opp.id)}
              >
                <div className="flex flex-col gap-2">
                  {/* Path Visualization */}
                  <div>
                    <div className="font-mono text-[8px] text-foreground/60 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5" />
                      ARBITRAGE PATH
                    </div>
                    <PathVisualization path={opp.path} dexs={opp.dexs} />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-border/50">
                    <div className="rounded bg-background/60 p-1.5">
                      <div className="font-mono text-[7px] text-foreground/60 mb-0.5">PROFIT</div>
                      <div className="text-xs font-sentient text-green-500">${opp.profit}</div>
                    </div>
                    <div className="rounded bg-background/60 p-1.5">
                      <div className="font-mono text-[7px] text-foreground/60 mb-0.5">ROI</div>
                      <div className="text-xs font-sentient text-primary">{opp.roi}%</div>
                    </div>
                    <div className="rounded bg-background/60 p-1.5">
                      <div className="font-mono text-[7px] text-foreground/60 mb-0.5">RISK</div>
                      <div
                        className={`text-[9px] font-mono ${
                          opp.risk === "Low"
                            ? "text-green-500"
                            : opp.risk === "Medium"
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {opp.risk}
                      </div>
                    </div>
                    <div className="rounded bg-background/60 p-1.5">
                      <div className="font-mono text-[7px] text-foreground/60 mb-0.5">LIQUIDITY</div>
                      <div className="text-[9px] font-mono">{opp.liquidity}</div>
                    </div>
                    <div className="rounded bg-background/60 p-1.5">
                      <div className="font-mono text-[7px] text-foreground/60 mb-0.5">GAS</div>
                      <div className="text-[9px] font-mono">{opp.gasEstimate} ETH</div>
                    </div>
                    <div className="rounded bg-background/60 p-1.5">
                      <div className="font-mono text-[7px] text-foreground/60 mb-0.5">SLIP</div>
                      <div className="text-[9px] font-mono">{opp.slippage}%</div>
                    </div>
                  </div>

                  {selectedOpp === opp.id && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                          <div className="font-mono text-[8px] text-foreground/60 mb-1.5">PRICE IMPACT</div>
                          <div className="space-y-1">
                            {opp.path.slice(0, -1).map((token, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <span className="font-mono text-[8px]">
                                  {token} → {opp.path[i + 1]}
                                </span>
                                <span className="font-mono text-[8px] text-green-500">
                                  -{(Math.random() * 0.5).toFixed(2)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                          <div className="font-mono text-[8px] text-foreground/60 mb-1.5">EXECUTION DETAILS</div>
                          <div className="space-y-1 font-mono text-[8px]">
                            <div className="flex justify-between">
                              <span className="text-foreground/60">Time:</span>
                              <span>~15s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">Confidence:</span>
                              <span className="text-green-500">High</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">MEV:</span>
                              <span className="text-primary">On</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <div className="flex gap-1.5">
                    <Button className="flex-1 sm:flex-none rounded-lg text-[10px] h-7 px-3">Execute</Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none rounded-lg bg-transparent text-[10px] h-7 px-3"
                    >
                      Simulate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
