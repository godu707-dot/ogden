import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import OpportunityExecutor from '../../components/opportunity-executor'
import { ethers } from 'ethers'

// Mock the contract functions
vi.mock('../../lib/contract', () => ({
  executeOnChain: vi.fn(),
  checkArbitrageOpportunity: vi.fn(),
  calculateExpectedProfit: vi.fn()
}))

// Mock MetaMask hook
vi.mock('../../components/ui/metamask-connect', () => ({
  useMetaMask: () => ({
    account: '0x123...456',
    connect: vi.fn(),
    error: null,
    connecting: false
  })
}))

describe('OpportunityExecutor', () => {
  const mockOpportunity = {
    tokenAAmount: ethers.utils.parseEther('1'),
    path: ['0xTokenA', '0xTokenB'],
    data: [],
    value: '0'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock ethereum object
    global.window.ethereum = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn()
    }
  })

  it('renders without opportunities', () => {
    render(<OpportunityExecutor />)
    expect(screen.getByText('Watcher status: running')).toBeInTheDocument()
    expect(screen.getByText(/Last opportunity: none/)).toBeInTheDocument()
  })

  it('shows opportunity details when available', async () => {
    const { rerender } = render(<OpportunityExecutor />)
    // Simulate new opportunity found
    rerender(<OpportunityExecutor opportunity={mockOpportunity} />)
    expect(screen.getByText(/Last opportunity:/)).toHaveTextContent(JSON.stringify(mockOpportunity))
  })

  it('handles execution with MEV protection', async () => {
    render(<OpportunityExecutor opportunity={mockOpportunity} />)
    
    // Enable MEV protection
    const mevCheckbox = screen.getByLabelText(/Use MEV protection/)
    fireEvent.click(mevCheckbox)
    
    // Click execute
    const executeButton = screen.getByText('Execute on-chain')
    fireEvent.click(executeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Status: submitted/)).toBeInTheDocument()
    })
  })

  it('handles execution errors gracefully', async () => {
    vi.mock('../../lib/contract', () => ({
      executeOnChain: vi.fn().mockRejectedValue(new Error('Execution failed'))
    }))

    render(<OpportunityExecutor opportunity={mockOpportunity} />)
    
    const executeButton = screen.getByText('Execute on-chain')
    fireEvent.click(executeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Status: error/)).toBeInTheDocument()
    })
  })
})