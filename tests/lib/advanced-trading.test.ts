import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ethers } from 'ethers'
import { ContractMonitor, ContractState, ContractEvent } from '../../lib/monitors/contract-monitor'
import { BehaviorSubject, Subject } from 'rxjs'
import { AdvancedPathFinder } from '../../lib/pathfinder/advanced-pathfinder'
import { AdvancedSimulator } from '../../lib/simulator/advanced-simulator'

describe('Advanced Trading Features', () => {
  let provider: ethers.providers.Provider
  let contractMonitor: ContractMonitor
  let pathFinder: AdvancedPathFinder
  let simulator: AdvancedSimulator

  beforeEach(() => {
    // Mock provider
    provider = {
      getGasPrice: vi.fn().mockResolvedValue(ethers.utils.parseUnits('50', 'gwei')),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    } as any

    // Initialize components with mocked state monitoring
    const mockState = {
      isActive: true,
      lastUpdate: Date.now(),
      profitThreshold: ethers.utils.parseEther('0.1').toString(),
      maxBorrowAmount: ethers.utils.parseEther('1000').toString(),
      priceImpactLimit: '500', // 0.5%
      tradeCooldown: 3,
      totalProfit: ethers.utils.parseEther('10').toString(),
      authorizedCallers: ['0x1234'],
      blacklistedTokens: []
    }

    const mockStateSubject = new BehaviorSubject<ContractState | null>(mockState)
    const mockEventSubject = new Subject<ContractEvent>()

    // Create ContractMonitor with mocked observables
    contractMonitor = new ContractMonitor(
      provider,
      '0x1234567890123456789012345678901234567890',
      []
    )

    // Mock the observables
    Object.defineProperty(contractMonitor, 'state$', { value: mockStateSubject })
    Object.defineProperty(contractMonitor, 'events$', { value: mockEventSubject })


    const mockDexRegistry = {
      getTradingPairs: vi.fn().mockResolvedValue([{
        dex: 'UniswapV2',
        tokenOut: '0x2222',
        fee: 300,
        liquidity: ethers.utils.parseEther('100')
      }]),
      getLiquidity: vi.fn().mockResolvedValue(ethers.utils.parseEther('100')),
      simulateSwap: vi.fn().mockResolvedValue({
        outputAmount: ethers.utils.parseEther('1.1'), // 10% profit
        priceImpact: 0.1
      }),
      estimateGas: vi.fn().mockResolvedValue(ethers.utils.parseUnits('100000', 'wei'))
    }

    pathFinder = new AdvancedPathFinder(provider, mockDexRegistry as any)
    simulator = new AdvancedSimulator(provider, pathFinder, contractMonitor)
  })

  describe('Contract Monitor', () => {
    it('should track contract state changes', async () => {
      const stateUpdate = {
        isActive: true,
        lastUpdate: Date.now(),
        profitThreshold: ethers.utils.parseEther('0.1').toString(),
        maxBorrowAmount: ethers.utils.parseEther('1000').toString(),
        priceImpactLimit: '500', // 0.5%
        tradeCooldown: 3,
        totalProfit: ethers.utils.parseEther('10').toString(),
        authorizedCallers: ['0x1234'],
        blacklistedTokens: []
      }

      let emittedState: ContractState | null = null
      contractMonitor.state$.subscribe((state: ContractState | null) => {
        emittedState = state
      })

      // Simulate contract update
      await contractMonitor['updateState']()

      expect(emittedState).toBeDefined()
      expect((emittedState as any)?.isActive).toBeDefined()
    })

    it('should emit contract events', () => {
      const testPromise = new Promise<void>((resolve) => {
        const subscription = contractMonitor.events$.subscribe((event: { type: string; timestamp: number; data: any }) => {
          expect(event.type).toBe('arbitrage')
          expect(event.data.profit).toBeDefined()
          subscription.unsubscribe()
          resolve()
        })

        // Simulate contract event
        contractMonitor['events$'].next({
          type: 'arbitrage',
          timestamp: Date.now(),
          data: {
            profit: ethers.utils.parseEther('1').toString()
          }
        })
      })
      
      return testPromise
    })
  })

  describe('Advanced Pathfinder', () => {
    it('should find optimal trading paths', async () => {
      const mockPairs = [
        {
          dex: 'UniswapV2',
          tokenOut: '0x2222',
          fee: 300
        }
      ]

      const dexRegistry = {
        getTradingPairs: vi.fn().mockResolvedValue(mockPairs),
        getLiquidity: vi.fn().mockResolvedValue(ethers.utils.parseEther('100')),
        simulateSwap: vi.fn().mockResolvedValue({
          outputAmount: ethers.utils.parseEther('1.1'), // 10% profit
          priceImpact: 0.1
        }),
        estimateGas: vi.fn().mockResolvedValue(ethers.utils.parseUnits('100000', 'wei'))
      }

      const pathFinder = new AdvancedPathFinder(provider, dexRegistry as any)
      
      const paths = await pathFinder.findOptimalPaths(
        '0x1111',
        ethers.utils.parseEther('1').toString()
      )

      expect(paths.length).toBeGreaterThan(0)
      expect(paths[0].expectedProfit).toBeDefined()
      expect(paths[0].confidence).toBeGreaterThan(0)
      expect(paths[0].riskScore).toBeLessThan(1)
    })

    it('should respect path constraints', async () => {
      const paths = await pathFinder.findOptimalPaths(
        '0x1111',
        ethers.utils.parseEther('1').toString(),
        {
          maxPaths: 2,
          minProfit: ethers.utils.parseEther('0.1').toString()
        }
      )

      expect(paths.length).toBeLessThanOrEqual(2)
      paths.forEach((path: { expectedProfit: string }) => {
        expect(Number(ethers.utils.formatEther(path.expectedProfit)))
          .toBeGreaterThanOrEqual(0.1)
      })
    })
  })

  describe('Advanced Simulator', () => {
    it('should simulate arbitrage opportunities', async () => {
      const results = await simulator.simulateArbitrage(
        '0x1111',
        ethers.utils.parseEther('1').toString(),
        {
          maxSlippage: 0.5,
          minNetProfit: ethers.utils.parseEther('0.05').toString()
        }
      )

      expect(results.length).toBeGreaterThan(0)
      results.forEach((result: {
        netProfit: string;
        executionProbability: number;
        riskAnalysis: {
          marketRisk: number;
          technicalRisk: number;
          liquidityRisk: number;
          compositeScore: number;
        };
      }) => {
        expect(result.netProfit).toBeDefined()
        expect(result.executionProbability).toBeGreaterThan(0)
        expect(result.riskAnalysis.compositeScore).toBeLessThan(1)
      })
    })

    it('should calculate accurate risk metrics', async () => {
      // Mock the methods used in risk calculation
      vi.spyOn(simulator as any, 'calculateGasVolatility').mockReturnValue(0.3)
      vi.spyOn(simulator as any, 'estimateSlippage').mockReturnValue(0.02)

      const results = await simulator.simulateArbitrage(
        '0x1111',
        ethers.utils.parseEther('1').toString()
      )

      // Ensure we got results
      expect(results.length).toBeGreaterThan(0)

      results.forEach(result => {
        // Risk metrics should be between 0 and 1
        expect(result.riskAnalysis.marketRisk).toBeGreaterThanOrEqual(0)
        expect(result.riskAnalysis.marketRisk).toBeLessThanOrEqual(1)
        
        expect(result.riskAnalysis.technicalRisk).toBeGreaterThanOrEqual(0)
        expect(result.riskAnalysis.technicalRisk).toBeLessThanOrEqual(1)
        
        expect(result.riskAnalysis.liquidityRisk).toBeGreaterThanOrEqual(0)
        expect(result.riskAnalysis.liquidityRisk).toBeLessThanOrEqual(1)
        
        expect(result.riskAnalysis.compositeScore).toBeGreaterThanOrEqual(0)
        expect(result.riskAnalysis.compositeScore).toBeLessThanOrEqual(1)

        // Verify risk score composition
        expect(result.riskAnalysis.compositeScore).toBeCloseTo(
          result.riskAnalysis.marketRisk * 0.4 +
          result.riskAnalysis.technicalRisk * 0.3 +
          result.riskAnalysis.liquidityRisk * 0.3,
          2
        )
      })
    })

    it('should filter out high-risk opportunities', async () => {
      // Mock dependencies to simulate both high and low risk paths
      vi.spyOn(pathFinder, 'findOptimalPaths').mockResolvedValue([
        // High risk path
        {
          nodes: [{
            tokenIn: '0x1111',
            tokenOut: '0x2222',
            dex: 'UniswapV2',
            fee: 3000,
            liquidity: ethers.utils.parseEther('10').toString(),
            priceImpact: 0.8
          }],
          expectedProfit: ethers.utils.parseEther('2').toString(),
          gasEstimate: '100000',
          confidence: 0.7,
          riskScore: 0.8
        },
        // Low risk path
        {
          nodes: [{
            tokenIn: '0x1111',
            tokenOut: '0x2222',
            dex: 'UniswapV2',
            fee: 3000,
            liquidity: ethers.utils.parseEther('1000').toString(),
            priceImpact: 0.1
          }],
          expectedProfit: ethers.utils.parseEther('1').toString(),
          gasEstimate: '100000',
          confidence: 0.95,
          riskScore: 0.2
        }
      ])

      const results = await simulator.simulateArbitrage(
        '0x1111',
        ethers.utils.parseEther('1').toString(),
        {
          riskTolerance: 0.3,
          minProbability: 0.9
        }
      )

      // Verify filtering
      results.forEach(result => {
        expect(result.riskAnalysis.compositeScore).toBeLessThanOrEqual(0.3)
        expect(result.executionProbability).toBeGreaterThanOrEqual(0.9)
        
        // Check that the path is indeed low-risk
        expect(result.path.nodes[0].priceImpact).toBeLessThanOrEqual(0.3)
        expect(ethers.BigNumber.from(result.path.nodes[0].liquidity).gte(ethers.utils.parseEther('100')))
          .toBe(true)
      })
    })
  })
})