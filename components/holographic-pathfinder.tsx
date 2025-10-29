"use client"

import { useEffect, useState } from "react"

export function HolographicPathfinder() {
  // Avoid SSR rendering to prevent hydration mismatches
  const [mounted, setMounted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [discoveredPaths, setDiscoveredPaths] = useState<number[]>([])
  const [pulseNodes, setPulseNodes] = useState<Set<number>>(new Set())
  const [profitPct, setProfitPct] = useState<string>('0.00')
  const [latencyMs, setLatencyMs] = useState<string>('0ms')

  const dexNodes = [
    { name: "Uniswap", angle: 0, radius: 35, color: "#FF007A" },
    { name: "SushiSwap", angle: 72, radius: 35, color: "#00A3FF" },
    { name: "Curve", angle: 144, radius: 35, color: "#FFC700" },
    { name: "Balancer", angle: 216, radius: 35, color: "#8A2BE2" },
    { name: "PancakeSwap", angle: 288, radius: 35, color: "#FF8C00" },
  ]

  const paths = [
    [0, 1, 2], // Path 1
    [0, 3, 4, 2], // Path 2
    [1, 3, 0], // Path 3
  ]

  const getNodePosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad),
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((prev) => (prev + 1) % 360)
    }, 20)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % paths.length
        setDiscoveredPaths([])
        return next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Client-only dynamic stats (no SSR randomness)
  useEffect(() => {
    if (!mounted) return
    const update = () => {
      const p = (1 + Math.random() * 2).toFixed(2) + '%'
      const l = (150 + Math.random() * 50).toFixed(0) + 'ms'
      setProfitPct(p)
      setLatencyMs(l)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [mounted])

  useEffect(() => {
    const pathNodes = paths[activeStep]
    let index = 0
    const interval = setInterval(() => {
      if (index < pathNodes.length) {
        setDiscoveredPaths((prev) => [...prev, pathNodes[index]])
        setPulseNodes((prev) => new Set([...prev, pathNodes[index]]))
        setTimeout(() => {
          setPulseNodes((prev) => {
            const newSet = new Set(prev)
            newSet.delete(pathNodes[index])
            return newSet
          })
        }, 500)
        index++
      }
    }, 600)
    return () => clearInterval(interval)
  }, [activeStep])

  if (!mounted) {
    return (
      <div className="rounded-3xl border border-border bg-background/40 backdrop-blur-sm p-6 h-[360px] relative overflow-hidden flex flex-col" />
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-background/40 backdrop-blur-sm p-6 h-[360px] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full">
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              cx="50%"
              cy="50%"
              r={`${(i + 1) * 10}%`}
              fill="none"
              stroke="rgb(255, 199, 0)"
              strokeWidth="1"
            />
          ))}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            return (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${50 + 45 * Math.cos(angle)}%`}
                y2={`${50 + 45 * Math.sin(angle)}%`}
                stroke="rgb(255, 199, 0)"
                strokeWidth="1"
              />
            )
          })}
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-3 flex-shrink-0">
        <h3 className="text-lg font-sentient mb-1">Advanced Path Finding</h3>
        <p className="font-mono text-xs text-foreground/60">Multi-algorithm route discovery across 10+ DEXs</p>
      </div>

      <div className="relative flex-1 min-h-0">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(255, 199, 0)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="rgb(255, 199, 0)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(255, 199, 0)" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line
            x1="50%"
            y1="50%"
            x2={`${50 + 45 * Math.cos((scanProgress * Math.PI) / 180)}%`}
            y2={`${50 + 45 * Math.sin((scanProgress * Math.PI) / 180)}%`}
            stroke="rgb(255, 199, 0)"
            strokeWidth="2"
            opacity="0.3"
            filter="url(#glow)"
          />

          {dexNodes.map((node, i) => {
            const pos1 = getNodePosition(node.angle, node.radius)
            return dexNodes.slice(i + 1).map((otherNode, j) => {
              const pos2 = getNodePosition(otherNode.angle, otherNode.radius)
              return (
                <line
                  key={`bg-${i}-${j}`}
                  x1={`${pos1.x}%`}
                  y1={`${pos1.y}%`}
                  x2={`${pos2.x}%`}
                  y2={`${pos2.y}%`}
                  stroke="rgb(255, 199, 0)"
                  strokeWidth="1"
                  opacity="0.08"
                />
              )
            })
          })}

          {discoveredPaths.map((nodeIdx, i) => {
            if (i === discoveredPaths.length - 1) return null
            const start = dexNodes[nodeIdx]
            const end = dexNodes[discoveredPaths[i + 1]]

            if (!start || !end) return null

            const pos1 = getNodePosition(start.angle, start.radius)
            const pos2 = getNodePosition(end.angle, end.radius)
            return (
              <g key={`path-${i}`}>
                <line
                  x1={`${pos1.x}%`}
                  y1={`${pos1.y}%`}
                  x2={`${pos2.x}%`}
                  y2={`${pos2.y}%`}
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
                <circle r="2" fill="rgb(255, 199, 0)" filter="url(#glow)">
                  <animateMotion dur="1.5s" repeatCount="indefinite">
                    <mpath href={`#path-${i}`} />
                  </animateMotion>
                </circle>
                <path
                  id={`path-${i}`}
                  d={`M ${pos1.x} ${pos1.y} L ${pos2.x} ${pos2.y}`}
                  fill="none"
                  className="hidden"
                />
              </g>
            )
          })}
        </svg>

        {dexNodes.map((node, i) => {
          const pos = getNodePosition(node.angle, node.radius)
          const isDiscovered = discoveredPaths.includes(i)
          const isPulsing = pulseNodes.has(i)
          return (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="relative">
                <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                  <polygon
                    points="24,2 42,14 42,34 24,46 6,34 6,14"
                    fill={isDiscovered ? "rgba(255, 199, 0, 0.2)" : "rgba(0, 0, 0, 0.6)"}
                    stroke="rgb(255, 199, 0)"
                    strokeWidth={isDiscovered ? "2" : "1"}
                    className={isDiscovered ? "animate-pulse" : ""}
                  />
                  <text
                    x="24"
                    y="28"
                    textAnchor="middle"
                    fill="rgb(255, 199, 0)"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.name.slice(0, 3).toUpperCase()}
                  </text>
                </svg>
                {isPulsing && (
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"
                  >
                    <polygon
                      points="28,4 48,16 48,40 28,52 8,40 8,16"
                      fill="none"
                      stroke="rgb(255, 199, 0)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  </svg>
                )}
              </div>
            </div>
          )
        })}

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-xs text-primary font-bold">{["Dijkstra", "A*", "MMBF"][activeStep]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 mt-3 grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="text-center">
          <div className="font-mono text-lg text-primary mb-0.5">{discoveredPaths.length}</div>
          <div className="font-mono text-xs text-foreground/60">Hops</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg text-primary mb-0.5">{profitPct}</div>
          <div className="font-mono text-xs text-foreground/60">Profit</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg text-primary mb-0.5">{latencyMs}</div>
          <div className="font-mono text-xs text-foreground/60">Latency</div>
        </div>
      </div>
    </div>
  )
}
