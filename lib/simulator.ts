import { calculateExpectedProfit, estimateGasCost } from './contract'
import { ethers } from 'ethers'

export async function getEthPriceUSD(): Promise<number> {
  try {
    // Use multiple price feeds for redundancy
    const [coingeckoRes, chainlinkRes] = await Promise.allSettled([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'),
      fetch('https://api.chain.link/feeds/ETH-USD')
    ]);

    let prices: number[] = [];

    if (coingeckoRes.status === 'fulfilled') {
      const json = await coingeckoRes.value.json();
      if (json?.ethereum?.usd) prices.push(json.ethereum.usd);
    }

    if (chainlinkRes.status === 'fulfilled') {
      const json = await chainlinkRes.value.json();
      if (json?.answer) prices.push(Number(json.answer) / 1e8);
    }

    if (prices.length === 0) throw new Error('No valid price feeds available');

    // Use median price to avoid outliers
    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  } catch (err) {
    console.error('ETH price fetch error:', err);
    throw err; // Re-throw to handle at caller level
  }
}

export async function simulateOpportunity(tokenA: string, tokenB: string, amount: string, dexPath: string[]) {
  // ask contract for expected profit and estimated gas
  const expectedProfit = await calculateExpectedProfit(tokenA, tokenB, amount, dexPath)
  const gas = await estimateGasCost(dexPath, [])
  const ethPrice = await getEthPriceUSD()
  const profitEth = Number(ethers.utils.formatEther(expectedProfit))
  const profitUsd = profitEth * ethPrice
  return { expectedProfit, gas, profitEth, profitUsd }
}

export default simulateOpportunity
