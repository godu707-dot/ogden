"use client"

import dynamic from "next/dynamic"
import { Pill } from "@/components/pill"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"

const GL = dynamic(() => import("@/components/gl").then(mod => ({ default: mod.GL })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

const walletBalances = [
  { token: "ETH", balance: "12.456", value: "$23,456.78", change: "+5.2%" },
  { token: "USDC", balance: "45,678.90", value: "$45,678.90", change: "+0.1%" },
  { token: "WBTC", balance: "0.567", value: "$28,934.56", change: "+3.8%" },
  { token: "DAI", balance: "12,345.67", value: "$12,345.67", change: "-0.2%" },
]

const executionHistory = [
  {
    id: 1,
    path: "USDC → WETH → DAI → USDC",
    profit: 234.56,
    status: "success",
    timestamp: "2 hours ago",
    txHash: "0x1234...5678",
  },
  {
    id: 2,
    path: "WETH → USDT → WBTC → WETH",
    profit: 567.89,
    status: "success",
    timestamp: "5 hours ago",
    txHash: "0xabcd...efgh",
  },
  {
    id: 3,
    path: "DAI → USDC → WETH → DAI",
    profit: -45.23,
    status: "failed",
    timestamp: "8 hours ago",
    txHash: "0x9876...5432",
  },
  {
    id: 4,
    path: "WBTC → WETH → USDC → WBTC",
    profit: 789.12,
    status: "success",
    timestamp: "12 hours ago",
    txHash: "0xfedc...ba98",
  },
]

export default function Portfolio() {
  return (
    <>
      <GL hovering={false} />
      <div className="min-h-screen pt-16 pb-24 md:pb-4 pl-0 md:pl-20 pr-2 md:pr-4 relative">
        <div className="container max-w-7xl mx-auto px-2 md:px-4">
          <div className="mb-3">
            <Pill className="mb-2 text-[9px] px-2 py-0.5">PORTFOLIO</Pill>
            <h1 className="text-lg md:text-xl font-sentient mb-1">
              Wallet & <i className="font-light">execution</i> history
            </h1>
            <p className="font-mono text-[10px] text-foreground/60">
              Track your balances and review past arbitrage executions
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5 mb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-mono text-[8px] text-foreground/60 mb-0.5">CONNECTED WALLET</div>
                  <div className="font-mono text-xs">0x1234...5678</div>
                </div>
              </div>
              <Button variant="outline" className="rounded-lg bg-transparent text-[10px] h-7 px-3">
                Disconnect
              </Button>
            </div>
          </div>

          {/* Wallet Balances */}
          <div className="mb-3">
            <h2 className="text-sm font-sentient mb-2">Token Balances</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {walletBalances.map((token, i) => (
                <div key={i} className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
                  <div className="font-mono text-[8px] text-foreground/60 mb-0.5">{token.token}</div>
                  <div className="text-sm font-sentient mb-0.5">{token.balance}</div>
                  <div className="font-mono text-[9px] text-foreground/60 mb-0.5">{token.value}</div>
                  <div
                    className={`font-mono text-[8px] ${token.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                  >
                    {token.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[8px] text-foreground/60">TOTAL EXECUTIONS</span>
                <TrendingUp className="w-2.5 h-2.5 text-primary" />
              </div>
              <div className="text-base font-sentient">1,234</div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[8px] text-foreground/60">SUCCESS RATE</span>
                <CheckCircle className="w-2.5 h-2.5 text-green-500" />
              </div>
              <div className="text-base font-sentient">94.5%</div>
            </div>
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[8px] text-foreground/60">AVG PROFIT</span>
                <TrendingUp className="w-2.5 h-2.5 text-primary" />
              </div>
              <div className="text-base font-sentient">$456.78</div>
            </div>
          </div>

          {/* Execution History */}
          <div>
            <h2 className="text-sm font-sentient mb-2">Execution History</h2>
            <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-mono text-[8px] text-foreground/60">PATH</th>
                      <th className="text-left p-2 font-mono text-[8px] text-foreground/60">PROFIT</th>
                      <th className="text-left p-2 font-mono text-[8px] text-foreground/60">STATUS</th>
                      <th className="text-left p-2 font-mono text-[8px] text-foreground/60">TIME</th>
                      <th className="text-left p-2 font-mono text-[8px] text-foreground/60">TX HASH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionHistory.map((exec) => (
                      <tr key={exec.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="p-2 font-mono text-[10px]">{exec.path}</td>
                        <td
                          className={`p-2 font-mono text-[10px] ${exec.profit > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {exec.profit > 0 ? "+" : ""}${exec.profit.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-0.5">
                            {exec.status === "success" ? (
                              <>
                                <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                                <span className="font-mono text-[8px] text-green-500">Success</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-2.5 h-2.5 text-red-500" />
                                <span className="font-mono text-[8px] text-red-500">Failed</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-2 font-mono text-[8px] text-foreground/60">
                          <div className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {exec.timestamp}
                          </div>
                        </td>
                        <td className="p-2 font-mono text-[8px] text-primary hover:underline cursor-pointer">
                          {exec.txHash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
