import { ethers } from 'ethers'

const THEGRAPH_ENDPOINTS = {
  'uniswap-v3': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  'sushiswap': 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
  'curve': 'https://api.thegraph.com/subgraphs/name/curvefi/curve',
  'balancer': 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2'
}

const DEX_VOLUME_QUERIES = {
  'uniswap-v3': `{
    uniswapDayDatas(first: 1, orderBy: date, orderDirection: desc) {
      volumeUSD
    }
  }`,
  'sushiswap': `{
    dayData(first: 1, orderBy: date, orderDirection: desc) {
      volumeUSD
    }
  }`,
  'curve': `{
    poolDayData(first: 1, orderBy: timestamp, orderDirection: desc) {
      volume
    }
  }`,
  'balancer': `{
    balancerSnapshots(first: 1, orderBy: timestamp, orderDirection: desc) {
      totalSwapVolume
    }
  }`
}

const DEX_TRADES_QUERIES = {
  'uniswap-v3': `{
    uniswapDayDatas(first: 1, orderBy: date, orderDirection: desc) {
      txCount
    }
  }`,
  'sushiswap': `{
    dayData(first: 1, orderBy: date, orderDirection: desc) {
      txCount
    }
  }`,
  'curve': `{
    poolDayData(first: 1, orderBy: timestamp, orderDirection: desc) {
      swaps
    }
  }`,
  'balancer': `{
    balancerSnapshots(first: 1, orderBy: timestamp, orderDirection: desc) {
      swapCount
    }
  }`
}

async function querySubgraph(endpoint: string, query: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  return response.json()
}

export async function fetchDexVolume(dex: keyof typeof THEGRAPH_ENDPOINTS): Promise<number> {
  try {
    const endpoint = THEGRAPH_ENDPOINTS[dex]
    const query = DEX_VOLUME_QUERIES[dex]
    const data = await querySubgraph(endpoint, query)

    switch (dex) {
      case 'uniswap-v3':
        return Number(data.data.uniswapDayDatas[0].volumeUSD)
      case 'sushiswap':
        return Number(data.data.dayData[0].volumeUSD)
      case 'curve':
        return Number(data.data.poolDayData[0].volume)
      case 'balancer':
        return Number(data.data.balancerSnapshots[0].totalSwapVolume)
      default:
        return 0
    }
  } catch (err) {
    console.warn(`Failed to fetch volume for ${dex}:`, err)
    return 0
  }
}

export async function fetchDexTrades(dex: keyof typeof THEGRAPH_ENDPOINTS): Promise<number> {
  try {
    const endpoint = THEGRAPH_ENDPOINTS[dex]
    const query = DEX_TRADES_QUERIES[dex]
    const data = await querySubgraph(endpoint, query)

    switch (dex) {
      case 'uniswap-v3':
        return Number(data.data.uniswapDayDatas[0].txCount)
      case 'sushiswap':
        return Number(data.data.dayData[0].txCount)
      case 'curve':
        return Number(data.data.poolDayData[0].swaps)
      case 'balancer':
        return Number(data.data.balancerSnapshots[0].swapCount)
      default:
        return 0
    }
  } catch (err) {
    console.warn(`Failed to fetch trades for ${dex}:`, err)
    return 0
  }
}