"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Pill } from "@/components/pill"
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react"

const GL = dynamic(() => import("@/components/gl").then(mod => ({ default: mod.GL })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30D")
  const [profitData, setProfitData] = useState<number[]>(Array(12).fill(0))
  const [gasData, setGasData] = useState<number[]>(Array(24).fill(0))

  useEffect(() => {
    const interval = setInterval(() => {
      setProfitData(
        Array(12)
          .fill(0)
          .map(() => Math.random() * 100 + 40),
      )
      setGasData(
        Array(24)
          .fill(0)
          .map(() => Math.random() * 80 + 20),
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <GL hovering={false} />
      <div className="min-h-screen pt-16 pb-24 md:pb-4 pl-0 md:pl-20 pr-2 md:pr-4 relative">
        <div className="container max-w-7xl mx-auto px-2 md:px-4">
          <div className="mb-3">
            <Pill className="mb-2 text-[9px] px-2 py-0.5">ANALYTICS</Pill>
            <h1 className="text-lg md:text-xl font-sentient mb-1">
              Performance <i className="font-light">insights</i>
            </h1>
            <p className="font-mono text-[10px] text-foreground/60">Comprehensive analytics and performance metrics</p>
          </div>

          <div className="flex gap-1.5 mb-3 overflow-x-auto">
            {["24H", "7D", "30D", "90D", "ALL"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] transition-colors whitespace-nowrap ${
                  selectedPeriod === period
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 hover:border-primary/50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-2 mb-3">
            {/* Profit/Loss Chart */}
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-sentient">Profit / Loss</h2>
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              </div>
              <div className="h-32 flex items-end justify-between gap-0.5">
                {profitData.map((height, i) => (
                  <div key={i} className="flex-1 relative group">
                    <div
                      className="absolute bottom-0 w-full bg-primary/20 border-t-2 border-primary hover:bg-primary/30 transition-all duration-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[8px] whitespace-nowrap bg-background/80 px-1.5 py-0.5 border border-border rounded">
                      ${(height * 100).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 font-mono text-[8px] text-foreground/40">
                <span>Jan</span>
                <span>Dec</span>
              </div>
              <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-3 gap-1.5">
                <div className="rounded bg-background/60 p-1.5">
                  <div className="font-mono text-[7px] text-foreground/60 mb-0.5">TOTAL</div>
                  <div className="font-sentient text-xs text-green-500">$45,678</div>
                </div>
                <div className="rounded bg-background/60 p-1.5">
                  <div className="font-mono text-[7px] text-foreground/60 mb-0.5">AVERAGE</div>
                  <div className="font-sentient text-xs">$3,806</div>
                </div>
                <div className="rounded bg-background/60 p-1.5">
                  <div className="font-mono text-[7px] text-foreground/60 mb-0.5">BEST DAY</div>
                  <div className="font-sentient text-xs text-primary">$9,800</div>
                </div>
              </div>
            </div>

            {/* DEX Performance */}
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-sentient">DEX Performance</h2>
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="space-y-1.5">
                {[
                  { name: "Uniswap V3", volume: 45678, trades: 234, success: 96.5 },
                  { name: "Curve", volume: 38912, trades: 189, success: 94.2 },
                  { name: "SushiSwap", volume: 29456, trades: 156, success: 92.8 },
                  { name: "Balancer", volume: 23789, trades: 134, success: 91.3 },
                  { name: "1inch", volume: 18234, trades: 98, success: 89.7 },
                ].map((dex, i) => (
                  <div
                    key={i}
                    className="rounded border border-border/50 bg-background/60 p-1.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[10px]">{dex.name}</span>
                      <span className="font-mono text-[9px] text-green-500">{dex.success}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[8px] text-foreground/60 mb-0.5">
                      <span>${dex.volume.toLocaleString()}</span>
                      <span>•</span>
                      <span>{dex.trades} trades</span>
                    </div>
                    <div className="h-1 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${dex.success}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gas Usage Over Time */}
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-sentient">Gas Usage (24h)</h2>
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="h-24 flex items-end justify-between gap-0.5 mb-2">
                {gasData.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 border-t border-primary/50 hover:bg-primary/30 transition-all duration-500 rounded-t"
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="rounded bg-background/60 p-1.5 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-foreground/60">Average Gas Cost</span>
                  <span className="text-xs font-sentient">0.15 ETH</span>
                </div>
                <div className="rounded bg-background/60 p-1.5 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-foreground/60">Total Gas Spent</span>
                  <span className="text-xs font-sentient">23.45 ETH</span>
                </div>
                <div className="rounded bg-background/60 p-1.5 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-foreground/60">Efficiency</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-sentient">94.2%</span>
                    <TrendingDown className="w-2.5 h-2.5 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mempool Activity */}
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-sentient">Mempool Activity</h2>
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <div className="rounded border border-border/50 bg-background/60 p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[8px] text-foreground/60">Transactions Monitored</span>
                    <span className="text-sm font-sentient">12,456</span>
                  </div>
                  <div className="h-1 bg-border/50 rounded-full mt-1.5">
                    <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-background/60 p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[8px] text-foreground/60">MEV Opportunities</span>
                    <span className="text-sm font-sentient">234</span>
                  </div>
                  <div className="flex items-center gap-0.5 font-mono text-[8px] text-green-500 mt-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>+8.7% from last period</span>
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-background/60 p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[8px] text-foreground/60">Protected Transactions</span>
                    <span className="text-sm font-sentient">189</span>
                  </div>
                  <div className="font-mono text-[8px] text-foreground/50 mt-1">80.8% protection rate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="font-mono text-[7px] text-foreground/60 mb-0.5">WIN RATE</div>
              <div className="text-base font-sentient mb-1">94.5%</div>
              <div className="h-1 bg-border/50 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "94.5%" }} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="font-mono text-[7px] text-foreground/60 mb-0.5">AVG PROFIT/TRADE</div>
              <div className="text-base font-sentient text-green-500">$195.21</div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                <span className="font-mono text-[8px] text-green-500">+15.3%</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="font-mono text-[7px] text-foreground/60 mb-0.5">TOTAL TRADES</div>
              <div className="text-base font-sentient">1,234</div>
              <div className="font-mono text-[8px] text-foreground/50 mt-0.5">This period</div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="font-mono text-[7px] text-foreground/60 mb-0.5">BEST PAIR</div>
              <div className="text-xs font-sentient">WETH/USDC</div>
              <div className="font-mono text-[8px] text-primary mt-0.5">$12,456 profit</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
