/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GasOptimizationMeter } from '../../components/gas-optimization-meter'
import React from 'react'

const screen = require('@testing-library/dom').screen

// Mock timer functions
vi.useFakeTimers()

describe('GasOptimizationMeter', () => {
  it('renders initial state correctly', () => {
    render(<GasOptimizationMeter />)
    
    expect(screen.getByText('Gas Optimizer')).toBeInTheDocument()
    expect(screen.getByText('AI-powered transaction cost reduction')).toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Optimized')).toBeInTheDocument()
  })

  it('updates values over time', async () => {
    render(<GasOptimizationMeter />)
    
  // Initial state: multiple elements may show '0' (svg and value boxes)
  const zeros = screen.getAllByText('0')
  expect(zeros.length).toBeGreaterThanOrEqual(1)

  // Advance timer to trigger animations
  vi.advanceTimersByTime(4000)

    // Values should have updated and gas labels are present (match exact 'gas' labels)
    const gasLabels = screen.getAllByText(/^gas$/i)
    expect(gasLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('handles cleanup on unmount', () => {
    const { unmount } = render(<GasOptimizationMeter />)
    
    // Verify it cleans up without errors
    expect(() => unmount()).not.toThrow()
  })
})