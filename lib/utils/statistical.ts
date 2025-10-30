/**
 * Statistical and mathematical utility functions
 */

export function exponentialMovingAverage(
  values: number[],
  prevEMA: number | null = null,
  alpha: number = 0.2
): number {
  if (values.length === 0) return prevEMA || 0
  
  if (prevEMA === null) {
    // First EMA is simple average
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  return values.reduce((ema, value) => {
    return alpha * value + (1 - alpha) * ema
  }, prevEMA)
}

export function standardDeviation(values: number[]): number {
  const n = values.length
  if (n < 2) return 0

  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1)
  
  return Math.sqrt(variance)
}

export function movingAverage(
  values: number[],
  window: number = 20
): number[] {
  const result: number[] = []
  
  for (let i = 0; i <= values.length - window; i++) {
    const windowValues = values.slice(i, i + window)
    const average = windowValues.reduce((a, b) => a + b, 0) / window
    result.push(average)
  }
  
  return result
}

export function calculatePercentileRank(
  value: number,
  distribution: number[]
): number {
  if (distribution.length === 0) return 0
  
  const sorted = [...distribution].sort((a, b) => a - b)
  const position = sorted.findIndex(v => v >= value)
  
  if (position === -1) return 100
  return (position / sorted.length) * 100
}

export function linearRegression(
  x: number[],
  y: number[]
): {
  slope: number
  intercept: number
  rSquared: number
} {
  const n = x.length
  if (n !== y.length || n === 0) {
    throw new Error('Input arrays must have same length and not be empty')
  }

  // Calculate means
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  // Calculate coefficients
  let xxSum = 0
  let xySum = 0
  let yySum = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX
    const yDiff = y[i] - meanY
    xxSum += xDiff * xDiff
    xySum += xDiff * yDiff
    yySum += yDiff * yDiff
  }

  const slope = xySum / xxSum
  const intercept = meanY - slope * meanX

  // Calculate R-squared
  const rSquared = Math.pow(xySum, 2) / (xxSum * yySum)

  return { slope, intercept, rSquared }
}

export function exponentialWeightedMovingAverage(
  values: number[],
  span: number = 10
): number[] {
  const alpha = 2 / (span + 1)
  const result: number[] = []
  let ewma = values[0]
  
  result.push(ewma)
  
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma
    result.push(ewma)
  }
  
  return result
}

export function bollingerBands(
  values: number[],
  period: number = 20,
  stdDev: number = 2
): {
  middle: number[]
  upper: number[]
  lower: number[]
} {
  const ma = movingAverage(values, period)
  const bands: {
    middle: number[];
    upper: number[];
    lower: number[];
  } = {
    middle: ma,
    upper: [],
    lower: []
  }

  for (let i = 0; i <= values.length - period; i++) {
    const slice = values.slice(i, i + period)
    const std = standardDeviation(slice)
    
    bands.upper.push(ma[i] + stdDev * std)
    bands.lower.push(ma[i] - stdDev * std)
  }

  return bands
}

export function calculateVolatility(
  prices: number[],
  period: number = 30
): number {
  if (prices.length < 2) return 0

  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]))
  }

  const std = standardDeviation(returns)
  return std * Math.sqrt(period)
}

export function sharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.02
): number {
  if (returns.length === 0) return 0

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const std = standardDeviation(returns)

  if (std === 0) return 0
  return (meanReturn - riskFreeRate) / std
}

export function correlationCoefficient(
  x: number[],
  y: number[]
): number {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Arrays must have same length and not be empty')
  }

  const meanX = x.reduce((a, b) => a + b, 0) / x.length
  const meanY = y.reduce((a, b) => a + b, 0) / y.length

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - meanX;
    const yDiff = y[i] - meanY;
    numerator += xDiff * yDiff;
    denominatorX += xDiff * xDiff;
    denominatorY += yDiff * yDiff;
  }

  return numerator / Math.sqrt(denominatorX * denominatorY)
}

export function calculateDrawdown(values: number[]): {
  maxDrawdown: number
  drawdownStart: number
  drawdownEnd: number
} {
  let maxValue = values[0]
  let maxDrawdown = 0
  let drawdownStart = 0
  let drawdownEnd = 0
  let tempStart = 0

  for (let i = 1; i < values.length; i++) {
    if (values[i] > maxValue) {
      maxValue = values[i]
      tempStart = i
    }

    const drawdown = (maxValue - values[i]) / maxValue
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      drawdownStart = tempStart
      drawdownEnd = i
    }
  }

  return { maxDrawdown, drawdownStart, drawdownEnd }
}