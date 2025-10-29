"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { Pill } from "./pill"
import { Button } from "./ui/button"
import { useState } from "react"

const GL = dynamic(() => import("./gl").then(mod => ({ default: mod.GL })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

export function Hero() {
  const [hovering, setHovering] = useState(false)
  const enableGL = process.env.NEXT_PUBLIC_ENABLE_GL === '1'
  return (
    <div className="flex flex-col h-svh justify-between">
      {enableGL ? <GL hovering={hovering} /> : <div className="w-full h-full bg-black" />}

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">MEV PROTECTED</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Advanced DeFi <br />
          <i className="font-light">arbitrage</i> platform
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto">
          Real-time price monitoring, multi-hop path finding, and MEV protection across 10+ DEXs
        </p>

        <Link className="contents max-sm:hidden" href="/dashboard">
          <Button className="mt-14" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            [Launch Dashboard]
          </Button>
        </Link>
        <Link className="contents sm:hidden" href="/dashboard">
          <Button
            size="sm"
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            [Launch Dashboard]
          </Button>
        </Link>
      </div>
    </div>
  )
}
