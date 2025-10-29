"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Pill } from "@/components/pill"
import { Button } from "@/components/ui/button"
import { Shield, Pause, Play, AlertTriangle, Settings, TrendingUp, Activity } from "lucide-react"

const GL = dynamic(() => import("@/components/gl").then(mod => ({ default: mod.GL })), {
  ssr: false,
  loading: function Loading() { return <div className="w-full h-full bg-black" />; }
});

export default function Admin() {
  const [systemStatus, setSystemStatus] = useState<"active" | "paused">("active");

  return (
    <>
      <GL hovering={false} />
      <div className="min-h-screen pt-20 pb-20 md:pb-16 pl-0 md:pl-20 pr-4 md:pr-8 relative">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-6">
            <Pill className="mb-4">ADMIN PANEL</Pill>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-sentient mb-2">
              System <i className="font-light">configuration</i>
            </h1>
            <p className="font-mono text-xs md:text-sm text-foreground/60">
              Manage contracts, tokens, and system parameters
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] text-foreground/60">SYSTEM STATUS</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${systemStatus === "active" ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-base font-sentient capitalize">{systemStatus}</span>
              </div>
              <div className="font-mono text-[10px] text-green-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                99.9% uptime
              </div>
            </div>

            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] text-foreground/60">ACTIVE CONTRACTS</span>
              </div>
              <div className="text-base font-sentient mb-1">3/3</div>
              <div className="font-mono text-[10px] text-foreground/60">All systems operational</div>
            </div>

            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] text-foreground/60">WHITELISTED TOKENS</span>
              </div>
              <div className="text-base font-sentient mb-1">24</div>
              <div className="font-mono text-[10px] text-primary flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +3 this week
              </div>
            </div>

            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] text-foreground/60">CIRCUIT BREAKERS</span>
              </div>
              <div className="text-base font-sentient mb-1">3/3</div>
              <div className="font-mono text-[10px] text-green-500">All active</div>
            </div>
          </div>

          <div className="backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-sentient text-base mb-0.5">Emergency Controls</h3>
                <p className="font-mono text-[10px] text-foreground/60">Pause or stop system operations</p>
              </div>
              <div className="flex gap-2">
                {systemStatus === "active" ? (
                  <Button
                    variant="outline"
                    onClick={() => setSystemStatus("paused")}
                    className="rounded-xl text-xs h-8"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Pause System
                  </Button>
                ) : (
                  <Button onClick={() => setSystemStatus("active")} className="rounded-xl text-xs h-8">
                    <Play className="w-3 h-3 mr-1" />
                    Resume System
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-red-500 border-red-500 hover:bg-red-500/10 bg-transparent rounded-xl text-xs h-8"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Emergency Stop
                </Button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Contract Controls */}
            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-primary" />
                <h2 className="text-base font-sentient">Contract Controls</h2>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Arbitrage Contract", address: "0x1234...5678", status: "Active" },
                  { name: "Flash Loan Contract", address: "0xabcd...efgh", status: "Active" },
                  { name: "MEV Protection", address: "0x9876...5432", status: "Active" },
                ].map((contract, i) => (
                  <div key={i} className="bg-background/60 border border-border/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs">{contract.name}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-mono text-[10px] text-green-500">{contract.status}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-foreground/60 mb-2">{contract.address}</div>
                    <Button size="sm" variant="outline" className="w-full bg-transparent rounded-lg text-[10px] h-7">
                      Pause Contract
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Management */}
            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <h2 className="text-base font-sentient mb-4">Token Management</h2>
              <div className="space-y-2 mb-4">
                {[
                  { symbol: "ETH", name: "Ethereum", price: "$2,847.32" },
                  { symbol: "USDC", name: "USD Coin", price: "$1.00" },
                  { symbol: "DAI", name: "Dai Stablecoin", price: "$0.999" },
                ].map((token, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-background/60 border border-border/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-mono text-[10px]">
                        {token.symbol}
                      </div>
                      <div>
                        <div className="font-mono text-xs">{token.name}</div>
                        <div className="font-mono text-[10px] text-foreground/60">{token.price}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg bg-transparent text-[10px] h-7">
                      Whitelisted
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="w-full rounded-xl text-xs h-9">Add Token</Button>
            </div>

            {/* Threshold Configuration */}
            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <h2 className="text-base font-sentient mb-4">Threshold Configuration</h2>
              <div className="space-y-3">
                {[
                  { label: "MIN PROFIT THRESHOLD ($)", value: "50" },
                  { label: "MAX SLIPPAGE (%)", value: "2.5" },
                  { label: "MAX GAS PRICE (GWEI)", value: "100" },
                  { label: "DAILY VOLUME CAP ($)", value: "100000" },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="font-mono text-[10px] text-foreground/60 mb-1 block" htmlFor={`admin-input-${i}`}>{field.label}</label>
                    <input
                      type="text"
                      defaultValue={field.value}
                      id={`admin-input-${i}`}
                      aria-label={field.label}
                      className="w-full bg-background/60 border border-border/50 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ))}
                <Button className="w-full mt-3 rounded-xl text-xs h-9">Save Configuration</Button>
              </div>
            </div>

            {/* Circuit Breakers */}
            <div className="backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <h2 className="text-base font-sentient mb-4">Circuit Breakers</h2>
              <div className="space-y-2">
                {[
                  { name: "Volatility Breaker", desc: "Triggers at 10% price deviation" },
                  { name: "Price Impact Breaker", desc: "Triggers at 5% price impact" },
                  { name: "Gas Price Breaker", desc: "Triggers at 150 gwei" },
                ].map((breaker, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-background/60 border border-border/50 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-mono text-xs mb-0.5">{breaker.name}</div>
                      <div className="font-mono text-[10px] text-foreground/60">{breaker.desc}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="font-mono text-[10px] text-green-500">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
