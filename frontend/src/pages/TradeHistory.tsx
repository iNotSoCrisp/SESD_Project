import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, ArrowUpRight } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { getAccounts } from '../api/accounts'
import { getTrades } from '../api/trades'
import type { TradingAccount, Trade } from '../types'
import Layout from '../components/Layout'

export default function TradeHistory() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'PENDING'>('ALL')

  useEffect(() => {
    if (!user) return
    getAccounts().then(res => {
      setAccounts(res.data.data)
      if (res.data.data.length > 0) setSelectedAccountId(res.data.data[0].id)
    }).catch(console.warn)
  }, [user])

  useEffect(() => {
    if (!selectedAccountId) return
    setLoading(true)
    getTrades(selectedAccountId)
      .then(res => setTrades(res.data.data))
      .catch(console.warn)
      .finally(() => setLoading(false))
  }, [selectedAccountId])

  const filtered = filter === 'ALL' ? trades : trades.filter(t => t.status === filter)
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <Layout accounts={accounts} selectedAccountId={selectedAccountId}>
      <div className="flex-1 flex flex-col min-w-0 bg-base overflow-y-auto page-enter">
        {/* Header */}
        <div className="h-14 border-b border-border-subtle flex items-center px-6 shrink-0 justify-between">
          <h1 className="text-sm font-semibold uppercase tracking-[0.1em] text-white flex items-center gap-2">
            <History className="w-4 h-4 text-accent" /> Trade History
          </h1>
          <span className="text-xs text-text-disabled">{trades.length} total trade{trades.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Filter tabs */}
        <div className="px-6 border-b border-border-subtle flex gap-0 shrink-0">
          {(['ALL', 'OPEN', 'CLOSED', 'PENDING'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0 16px', height: 40, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent',
              color: filter === f ? '#fff' : '#787B86',
              borderBottom: filter === f ? '2px solid #2962FF' : '2px solid transparent',
              transition: 'all 150ms',
            }}>
              {f} {f !== 'ALL' ? `(${trades.filter(t => t.status === f).length})` : `(${trades.length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="p-6">
          <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-text-disabled text-sm">Loading trades…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-text-disabled text-sm flex flex-col items-center gap-2">
                <History className="w-8 h-8 opacity-20" />
                <p>No trades found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] text-text-secondary uppercase tracking-[0.08em]">
                    <th className="text-left px-5 py-3">Symbol</th>
                    <th className="text-left px-5 py-3">Direction</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="text-right px-5 py-3">Qty</th>
                    <th className="text-right px-5 py-3">Entry Price</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">P&L</th>
                    <th className="text-left px-5 py-3">Opened</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => {
                    const pnl = t.position?.realizedPnl || 0
                    const pnlPos = pnl >= 0
                    const statusColors: Record<string, string> = {
                      OPEN: 'text-bullish bg-bullish/10 border-bullish/20',
                      CLOSED: 'text-text-secondary bg-surface-elevated border-border-subtle',
                      PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                      CANCELLED: 'text-text-disabled bg-surface-elevated border-border-subtle',
                    }
                    return (
                      <tr key={t.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-elevated transition-colors card-stagger" style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}>
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-white">{t.symbol}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${t.direction === 'LONG' ? 'text-bullish bg-bullish/10 border-bullish/20' : 'text-bearish bg-bearish/10 border-bearish/20'}`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-secondary text-xs">{t.orderType}</td>
                        <td className="px-5 py-3 text-right font-mono text-text-secondary">{t.quantity}</td>
                        <td className="px-5 py-3 text-right font-mono text-white">${fmt(t.entryPrice)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusColors[t.status] || ''}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {t.status === 'CLOSED' ? (
                            <span className={`font-mono font-semibold ${pnlPos ? 'text-bullish' : 'text-bearish'}`}>
                              {pnlPos ? '+' : ''}${fmt(pnl)}
                            </span>
                          ) : (
                            <span className="text-text-disabled">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-text-disabled text-xs">
                          {t.enteredAt ? new Date(t.enteredAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => navigate(`/stock/${t.symbol}`)} className="text-accent hover:text-white transition-colors flex items-center gap-1 text-xs ml-auto">
                            View <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
