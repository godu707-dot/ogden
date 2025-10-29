"use client"

import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Particles } from "./particles"

export const GL = ({ hovering }: { hovering: boolean }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const speed = 1.0
  const focus = 3.8
  const aperture = 1.79
  const size = 512
  const noiseScale = 0.6
  const noiseIntensity = 0.52
  const timeScale = 1
  const pointSize = 10.0
  const opacity = 0.8
  const planeScale = 10.0
  // Effects removed to avoid reconciler issues with certain bundles
  const useManualTime = false
  const manualTime = 0

  // Don't render Canvas during SSR - it requires browser APIs
  if (!mounted) {
    return <div id="webgl" className="w-full h-full bg-black" />
  }

  return (
    <div id="webgl">
      <Canvas
        camera={{
          position: [1.2629783123314589, 2.664606471394044, -1.8178993743288914],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
      >
        {/* <Perf position="top-left" /> */}
        <color attach="background" args={["#000"]} />
        <Particles
          speed={speed}
          aperture={aperture}
          focus={focus}
          size={size}
          noiseScale={noiseScale}
          noiseIntensity={noiseIntensity}
          timeScale={timeScale}
          pointSize={pointSize}
          opacity={opacity}
          planeScale={planeScale}
          useManualTime={useManualTime}
          manualTime={manualTime}
          introspect={hovering}
        />
      </Canvas>
    </div>
  )
}
