import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ThreeProvider } from './ThreeContext'
import type { GLComponentProps } from '@/components/gl/types'

// Dynamically import the GL component with no SSR
const GLComponent = dynamic<GLComponentProps>(() => import('@/components/gl/GLComponent').then(mod => mod.default), { 
  ssr: false 
})

export const GL = ({ hovering }: { hovering: boolean }) => {
  return (
    <ThreeProvider>
      <Suspense fallback={<div id="webgl" />}>
        <GLComponent hovering={hovering} />
      </Suspense>
    </ThreeProvider>
  )
}
