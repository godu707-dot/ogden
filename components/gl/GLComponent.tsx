import { useContext, useEffect, useState } from 'react'
import { Effects } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Particles } from "@/components/gl/particles"
import { createVignetteShader } from "@/components/gl/shaders/vignetteShader"
import { ThreeContext } from '@/components/gl/ThreeContext'
import type { GLComponentProps } from '@/components/gl/types'

const GLComponent = ({ hovering }: GLComponentProps) => {
  const { THREE } = useContext(ThreeContext)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render if THREE is not available or if we're not on client side
  if (!THREE || !isClient) {
    return <div id="webgl" />
  }

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
  const vignetteDarkness = 1.5
  const vignetteOffset = 0.4
  const useManualTime = false
  const manualTime = 0

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
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[createVignetteShader(THREE)]}
            uniforms-darkness-value={vignetteDarkness}
            uniforms-offset-value={vignetteOffset}
          />
        </Effects>
      </Canvas>
    </div>
  )
}

export default GLComponent