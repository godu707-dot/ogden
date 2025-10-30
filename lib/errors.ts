import { ethers } from 'ethers'

export class ContractError extends Error {
  public code?: string
  public reason?: string
  public transactionHash?: string
  
  constructor(error: any) {
    super(error.message)
    this.name = 'ContractError'
    this.code = error.code
    this.reason = error.reason
    if (error.transactionHash) {
      this.transactionHash = error.transactionHash
    }
  }

  static isUserRejection(error: any): boolean {
    return error.code === 4001 || error.code === 'ACTION_REJECTED'
  }

  static isInsufficientFunds(error: any): boolean {
    return error.code === -32000 || 
           error.code === 'INSUFFICIENT_FUNDS' ||
           (error.reason && error.reason.includes('insufficient funds'))
  }

  static isSlippageError(error: any): boolean {
    return error.reason && (
      error.reason.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
      error.reason.includes('price impact too high')
    )
  }

  static isPriceMovedError(error: any): boolean {
    return error.reason && error.reason.includes('PriceImpactExceeded')
  }

  static formatError(error: any): string {
    if (this.isUserRejection(error)) {
      return 'Transaction was rejected by user'
    }
    if (this.isInsufficientFunds(error)) {
      return 'Insufficient funds for transaction'
    }
    if (this.isSlippageError(error)) {
      return 'Price slippage too high, try again'
    }
    if (this.isPriceMovedError(error)) {
      return 'Price moved unfavorably, try again'
    }
    return error.reason || error.message || 'Transaction failed'
  }
}

export async function executeWithRetry(
  fn: () => Promise<ethers.ContractTransaction>,
  maxAttempts: number = 3
): Promise<ethers.ContractTransaction> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const tx = await fn()
      return tx
    } catch (error: any) {
      lastError = error
      
      // Don't retry on these errors
      if (ContractError.isUserRejection(error) ||
          ContractError.isInsufficientFunds(error)) {
        throw new ContractError(error)
      }
      
      // Retry on other errors if attempts remain
      if (attempt === maxAttempts) {
        throw new ContractError(error)
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw new ContractError(lastError)
}

export async function safeExecuteTransaction(
  txPromise: Promise<ethers.ContractTransaction>,
  waitConfirmations: number = 1
): Promise<ethers.ContractReceipt> {
  try {
    const tx = await txPromise
    const receipt = await tx.wait(waitConfirmations)
    return receipt
  } catch (error: any) {
    throw new ContractError(error)
  }
}