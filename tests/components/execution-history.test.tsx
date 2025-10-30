import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ExecutionHistory from '../../components/execution-history'
import { ethers } from 'ethers'

vi.mock('../../lib/contract', () => ({
  listenToContractEvents: vi.fn(() => () => {}) // Return a cleanup function
}))

describe('ExecutionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state', () => {
    render(<ExecutionHistory />)
    expect(screen.getByText('No executions yet')).toBeDefined()
  })

  it('displays arbitrage executions', () => {
    const mockEvent = {
      tokenBorrow: '0xTokenA',
      amount: ethers.utils.parseEther('1').toString(),
      profit: ethers.utils.parseEther('0.1').toString(),
      dexPath: ['UniswapV2', 'SushiSwap'],
      timestamp: Date.now()
    }

    render(<ExecutionHistory initialEvents={[mockEvent]} />)
    
    expect(screen.getByText(/Profit: /)).toBeDefined()
    expect(screen.getByText(/Token: /)).toBeDefined()
    expect(screen.getByText(/Dex path: /)).toBeDefined()
  })

  it('limits history to 50 items', () => {
    const events = Array(60).fill(null).map((_, i) => ({
      tokenBorrow: `0xToken${i}`,
      amount: ethers.utils.parseEther('1').toString(),
      profit: ethers.utils.parseEther(`${i * 0.1}`).toString(),
      dexPath: ['UniswapV2', 'SushiSwap'],
      timestamp: Date.now() + i
    }))

    render(<ExecutionHistory initialEvents={events} />)
    
    // Should show most recent 50 events (last 50 indices)
    const items = screen.getAllByTestId('history-item')
    expect(items).toHaveLength(50)
    
    // Verify it shows the most recent events (higher indices)
    const lastProfit = ethers.utils.formatEther(events[59].profit)
    expect(screen.getByText(`Profit: ${lastProfit}`)).toBeInTheDocument()
  })
})