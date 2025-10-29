import { calculateExpectedProfit, estimateGasCost } from './contract'
import { ethers } from 'ethers'

export async function getEthPriceUSD(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const json = await res.json()
    return json.ethereum.usd || 0
  } catch (err) {
    console.warn('Could not fetch ETH price', err)
    return 0
  }
}

export async function simulateOpportunity(tokenA: string, tokenB: string, amount: string, dexPath: string[]) {
  // ask contract for expected profit and estimated gas
  const expectedProfit = await calculateExpectedProfit(tokenA, tokenB, amount, dexPath)
  const gas = await estimateGasCost(dexPath, [])
  const ethPrice = await getEthPriceUSD()
  const profitEth = Number(ethers.formatEther(expectedProfit))
  const profitUsd = profitEth * ethPrice
  return { expectedProfit, gas, profitEth, profitUsd }
}

export default simulateOpportunity
