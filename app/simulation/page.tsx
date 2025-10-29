"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Pill } from "@/components/pill"
import { Button } from "@/components/ui/button"
import { Play, RotateCcw, Settings, ArrowRight } from "lucide-react"

const GL = dynamic(() => import("@/components/gl").then(mod => ({ default: mod.GL })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

export default function Simulation() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [simulationSteps, setSimulationSteps] = useState<string[]>([])

  useEffect(() => {
    if (isSimulating) {
      const steps = [
        "Fetching current prices...",
        "Analyzing liquidity pools...",
        "Calculating optimal paths...",
        "Validating slippage...",
        "Estimating gas costs...",
        "Running risk assessment...",
        "Simulation complete!",
      ]

      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setSimulationSteps((prev) => [...prev, steps[currentStep]])
          setProgress(((currentStep + 1) / steps.length) * 100)
          currentStep++
        } else {
          clearInterval(interval)
          setTimeout(() => setIsSimulating(false), 500)
        }
      }, 400)

      return () => clearInterval(interval)
    }
  }, [isSimulating])

  const handleSimulate = () => {
    setIsSimulating(true)
    setProgress(0)
    setSimulationSteps([])
  }

  const handleReset = () => {
    setIsSimulating(false)
    setProgress(0)
    setSimulationSteps([])
  }

  return (
    <>
      <GL hovering={false} />
      <div className="min-h-screen pt-16 pb-24 md:pb-4 pl-0 md:pl-20 pr-2 md:pr-4 relative">
        <div className="container max-w-7xl mx-auto px-2 md:px-4">
          <div className="mb-3">
            <Pill className="mb-2 text-[9px] px-2 py-0.5">SIMULATION ENGINE</Pill>
            <h1 className="text-lg md:text-xl font-sentient mb-1">
              Strategy <i className="font-light">testing</i> & validation
            </h1>
            <p className="font-mono text-[10px] text-foreground/60">
              Test arbitrage strategies with off-chain validation
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5 lg:sticky lg:top-20">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <h2 className="text-sm font-sentient">Configuration</h2>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="font-mono text-[8px] text-foreground/60 mb-0.5 block" htmlFor="sim-start-token">START TOKEN</label>
                    <select id="sim-start-token" aria-label="Start token" className="w-full rounded-lg bg-background border border-border px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-primary/50">
                      <option>USDC</option>
                      <option>WETH</option>
                      <option>DAI</option>
                      <option>WBTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[8px] text-foreground/60 mb-0.5 block">AMOUNT</label>
                    <input
                      type="text"
                      placeholder="1000"
                      className="w-full rounded-lg bg-background border border-border px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[8px] text-foreground/60 mb-0.5 block" htmlFor="sim-max-hops">MAX HOPS</label>
                    <select id="sim-max-hops" aria-label="Max hops" className="w-full rounded-lg bg-background border border-border px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-primary/50">
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[8px] text-foreground/60 mb-0.5 block">SLIPPAGE TOLERANCE</label>
                    <input
                      type="text"
                      placeholder="0.5"
                      className="w-full rounded-lg bg-background border border-border px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[8px] text-foreground/60 mb-0.5 block">GAS PRICE (GWEI)</label>
                    <input
                      type="text"
                      placeholder="30"
                      className="w-full rounded-lg bg-background border border-border px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="pt-2 space-y-1.5">
                    <Button
                      className="w-full rounded-lg text-[10px] h-8"
                      onClick={handleSimulate}
                      disabled={isSimulating}
                    >
                      <Play className="w-3 h-3 mr-1.5" />
                      {isSimulating ? "Simulating..." : "Run Simulation"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg bg-transparent text-[10px] h-8"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {isSimulating && (
                <div className="rounded-lg border border-primary bg-background/40 backdrop-blur-sm p-2.5">
                  <h2 className="text-sm font-sentient mb-2">Simulation Progress</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-[8px] text-foreground/60">PROGRESS</span>
                        <span className="font-mono text-[8px] text-primary">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/60 p-2 space-y-1 max-h-48 overflow-y-auto">
                      {simulationSteps.map((step, i) => (
                        <div key={i} className="font-mono text-[8px] text-foreground/60 flex items-center gap-1.5">
                          <span className="text-primary">→</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5">
                <h2 className="text-sm font-sentient mb-2">Simulation Results</h2>

                {!isSimulating && simulationSteps.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border border-dashed border-border/50">
                    <Play className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                    <p className="font-mono text-[10px] text-foreground/40">Configure parameters and run simulation</p>
                  </div>
                ) : !isSimulating && simulationSteps.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <div className="font-mono text-[8px] text-foreground/60 mb-0.5">EXPECTED PROFIT</div>
                        <div className="text-lg font-sentient text-green-500">$234.56</div>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <div className="font-mono text-[8px] text-foreground/60 mb-0.5">ROI</div>
                        <div className="text-lg font-sentient">3.2%</div>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <div className="font-mono text-[8px] text-foreground/60 mb-0.5">GAS COST</div>
                        <div className="text-lg font-sentient">0.12 ETH</div>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <div className="font-mono text-[8px] text-foreground/60 mb-0.5">SUCCESS PROBABILITY</div>
                        <div className="text-lg font-sentient">92.5%</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-mono text-[10px] text-foreground/60 mb-2">OPTIMAL PATH</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["USDC", "WETH", "DAI", "USDC"].map((token, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="rounded-lg border-2 border-primary/50 bg-primary/10 px-3 py-1.5 font-mono text-xs">
                              {token}
                            </div>
                            {i < 3 && <ArrowRight className="w-3 h-3 text-primary" />}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {["Uniswap V3", "SushiSwap", "Curve"].map((dex, i) => (
                          <span
                            key={i}
                            className="rounded-lg font-mono text-[8px] text-foreground/50 border border-border/50 px-1.5 py-0.5"
                          >
                            {dex}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-mono text-[10px] text-foreground/60 mb-2">RISK ASSESSMENT</h3>
                      <div className="space-y-3">
                        {[
                          { label: "Liquidity Risk", value: 85, status: "Low", color: "green" },
                          { label: "Slippage Risk", value: 45, status: "Medium", color: "yellow" },
                          { label: "MEV Risk", value: 75, status: "Low", color: "green" },
                        ].map((risk, i) => (
                          <div key={i} className="rounded-lg border border-border/50 bg-background/60 p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[8px]">{risk.label}</span>
                              <span className={`font-mono text-[8px] text-${risk.color}-500`}>{risk.status}</span>
                            </div>
                            <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-${risk.color}-500 transition-all duration-500`}
                                style={{ width: `${risk.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-primary/50 bg-primary/5 p-2">
                      <div className="font-mono text-[8px] text-primary mb-1">RECOMMENDATION</div>
                      <p className="font-mono text-sm text-foreground/80">
                        This arbitrage opportunity shows strong potential with low risk factors. Consider executing with
                        MEV protection enabled.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-border bg-background/40 backdrop-blur-sm p-2.5">
                <h2 className="text-sm font-sentient mb-2">Backtesting Results</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                    <div className="font-mono text-[8px] text-foreground/60 mb-0.5">TOTAL SIMULATIONS</div>
                    <div className="text-lg font-sentient">1,234</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                    <div className="font-mono text-[8px] text-foreground/60 mb-0.5">SUCCESSFUL</div>
                    <div className="text-lg font-sentient text-green-500">1,167</div>
                    <div className="font-mono text-[8px] text-foreground/50 mt-0.5">94.5% success rate</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                    <div className="font-mono text-[8px] text-foreground/60 mb-0.5">AVERAGE PROFIT</div>
                    <div className="text-lg font-sentient">$456.78</div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                    <div className="font-mono text-[8px] text-foreground/60 mb-0.5">TOTAL PROFIT</div>
                    <div className="text-lg font-sentient text-green-500">$563,214</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
