import { describe, it, expect } from 'vitest'
import { ContractError, executeWithRetry, safeExecuteTransaction } from '../../lib/errors'
import { ethers } from 'ethers'

describe('Contract Error Handling', () => {
  describe('ContractError', () => {
    it('identifies user rejection', () => {
      const error = { code: 4001, message: 'User denied transaction' }
      expect(ContractError.isUserRejection(error)).toBe(true)
    })

    it('identifies insufficient funds', () => {
      const error = { code: -32000, message: 'insufficient funds' }
      expect(ContractError.isInsufficientFunds(error)).toBe(true)
    })

    it('identifies slippage errors', () => {
      const error = { reason: 'INSUFFICIENT_OUTPUT_AMOUNT' }
      expect(ContractError.isSlippageError(error)).toBe(true)
    })

    it('formats error messages correctly', () => {
      const userRejection = { code: 4001 }
      expect(ContractError.formatError(userRejection))
        .toBe('Transaction was rejected by user')

      const slippage = { reason: 'INSUFFICIENT_OUTPUT_AMOUNT' }
      expect(ContractError.formatError(slippage))
        .toBe('Price slippage too high, try again')
    })
  })

  describe('executeWithRetry', () => {
    it('retries on temporary failures', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 2) throw new Error('Temporary error')
        return {} as ethers.ContractTransaction
      }

      await executeWithRetry(fn)
      expect(attempts).toBe(2)
    })

    it('does not retry on user rejection', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        throw { code: 4001 }
      }

      await expect(executeWithRetry(fn)).rejects.toThrow()
      expect(attempts).toBe(1)
    })
  })

  describe('safeExecuteTransaction', () => {
    it('waits for confirmations', async () => {
      const mockTx = {
        hash: '0x123',
        confirmations: 0,
        from: '0x456',
        wait: async (confirmations?: number) => ({
          to: '0x789',
          from: '0x456',
          contractAddress: '0x789',
          transactionIndex: 0,
          root: '0x999',
          gasUsed: ethers.BigNumber.from(21000),
          logsBloom: '0x',
          blockHash: '0x000',
          transactionHash: '0x123',
          logs: [],
          blockNumber: 1,
          confirmations: confirmations || 0,
          cumulativeGasUsed: ethers.BigNumber.from(21000),
          effectiveGasPrice: ethers.BigNumber.from(2000000000),
          byzantium: true,
          type: 2,
          status: 1
        }),
        nonce: 1,
        gasLimit: ethers.BigNumber.from(100000),
        data: '0x',
        value: ethers.BigNumber.from(0),
        chainId: 1
      } as ethers.ContractTransaction

      const receipt = await safeExecuteTransaction(Promise.resolve(mockTx), 2)
      expect(receipt.confirmations).toBe(2)
    })

    it('throws ContractError on failure', async () => {
      const mockTx = {
        hash: '0x123',
        confirmations: 0,
        from: '0x456',
        nonce: 1,
        gasLimit: ethers.BigNumber.from(100000),
        data: '0x',
        value: ethers.BigNumber.from(0),
        chainId: 1,
        wait: async () => { throw new Error('Transaction failed') }
      } as ethers.ContractTransaction

      await expect(safeExecuteTransaction(Promise.resolve(mockTx)))
        .rejects
        .toBeInstanceOf(ContractError)
    })
  })
})