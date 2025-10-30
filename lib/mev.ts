/**
 * MEV / private relay helpers
 * 
 * Enhanced version with support for complex trading paths and Flashbots protection
 */

import { ethers } from 'ethers'
import { FlashbotsBundleProvider, FlashbotsBundleTransaction, FlashbotsBundleRawTransaction } from '@flashbots/ethers-provider-bundle'

export interface TradePath {
  dex: string
  tokenIn: string
  tokenOut: string
  fee: number
}

export interface Bundle {
  path: TradePath[]
  expectedReturn: string
  maxGas: string
}

export async function sendBundleViaFlashbots(
  provider: ethers.providers.Provider,
  bundles: Bundle[]
) {
  try {
    // Dynamically import Flashbots provider
    const { FlashbotsBundleProvider } = await import('@flashbots/ethers-provider-bundle')
    
    // Create auth signer for Flashbots
    const authSigner = ethers.Wallet.createRandom()
    
    // Create Flashbots provider
    const flashbotsProvider = await FlashbotsBundleProvider.create(
      provider,
      authSigner,
      'https://relay.flashbots.net'
    )

    // Get current block
    const block = await provider.getBlock('latest')
    const targetBlock = block.number + 1

    // Convert bundles to transactions (create unsigned tx objects)
    const transactions = await Promise.all(
      bundles.map(async bundle => {
        // Create transaction data
        const encodedPath = encodeTradingPath(bundle.path)
        const tx: FlashbotsBundleTransaction = {
          transaction: {
            to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
            data: encodedPath,
            gasLimit: bundle.maxGas,
            maxFeePerGas: block.baseFeePerGas!.mul(2),
            maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei')
          },
          signer: new ethers.Wallet(authSigner.privateKey)
        }
        return tx
      })
    )

    // First sign the transactions into raw signed transaction strings for simulation
    const signedTxStrings = await Promise.all(
      transactions.map(async tx => {
        if ('signer' in tx && tx.signer) {
          return await tx.signer.signTransaction(tx.transaction as any)
        }
        throw new Error('Transaction signer missing')
      })
    )

    // Use the signed strings for simulation
    const simulation = await flashbotsProvider.simulate(
      signedTxStrings,
      targetBlock
    )

    // Send bundle to Flashbots using the original transactions which have the correct type
    const bundleResponse = await flashbotsProvider.sendBundle(
      transactions,
      targetBlock
    )

    if ('error' in bundleResponse) {
      throw new Error(`Bundle submission failed: ${bundleResponse.error.message}`)
    }

    // Wait for bundle to be included
    const waitResponse = await bundleResponse.wait()
    if (waitResponse === 0) {
      throw new Error('Bundle not included in target block')
    }

    return bundleResponse

  } catch (error) {
    if (error instanceof Error && error.message.includes('@flashbots/ethers-provider-bundle')) {
      throw new Error(
        'Flashbots support not enabled. Install @flashbots/ethers-provider-bundle first.'
      )
    }
    throw error
  }
}

function encodeTradingPath(path: TradePath[]): string {
  // Encode the trading path according to the contract's ABI
  const types = ['address[]', 'address[]', 'uint24[]']
  const params = [
    path.map(p => p.dex),
    path.map(p => p.tokenIn),
    path.map(p => p.fee)
  ]
  
  return ethers.utils.defaultAbiCoder.encode(types, params)
}

export default { sendBundleViaFlashbots }
