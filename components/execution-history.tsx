"use client"
import React, { useEffect, useState } from 'react'
import { listenToContractEvents } from '@/lib/contract'

type ExecEvent = {
  tokenBorrow?: string
  amount?: string
  profit?: string
  dexPath?: string[]
  timestamp?: number
}

interface ExecutionHistoryProps {
  initialEvents?: ExecEvent[];
}

export default function ExecutionHistory({ initialEvents = [] }: ExecutionHistoryProps) {
  const [events, setEvents] = useState<ExecEvent[]>(initialEvents)

  useEffect(() => {
    const onArbitrageExecuted = (tokenBorrow: string, amount: any, profit: any, dexPath: string[]) => {
      setEvents(prev => [{ tokenBorrow, amount: amount.toString(), profit: profit.toString(), dexPath, timestamp: Date.now() }, ...prev].slice(0, 50))
    }
    const onProfitGenerated = (profit: any, timestamp: any) => {
      setEvents(prev => [{ profit: profit.toString(), timestamp: Number(timestamp) }, ...prev].slice(0, 50))
    }
    const off = listenToContractEvents(onArbitrageExecuted, onProfitGenerated)
    return () => off()
  }, [])

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold">Execution History</h3>
      <div className="mt-2 space-y-2 max-h-64 overflow-auto">
        {events.length === 0 && <div className="text-sm text-muted-foreground">No executions yet</div>}
        {events.map((e, i) => (
          <div key={i} className="p-2 bg-surface-50 rounded">
            <div className="text-sm">Profit: {e.profit ? e.profit : '—'}</div>
            <div className="text-xs text-muted-foreground">Token: {e.tokenBorrow ?? '—'}</div>
            <div className="text-xs text-muted-foreground">Dex path: {e.dexPath ? e.dexPath.join(' → ') : '—'}</div>
            <div className="text-xs text-muted-foreground">When: {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
