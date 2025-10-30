import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ThreeCanvas = dynamic(
  () => 
    import('./GLComponent').then((mod) => mod.default), 
  { ssr: false }
)

export function GL({ hovering }: { hovering: boolean }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div id="webgl" />
  }

  return <ThreeCanvas hovering={hovering} />
}