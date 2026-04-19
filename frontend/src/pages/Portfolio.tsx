import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, BarChart2, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/accounts'
import { getTrades } from '../api/trades'
import { getQuote } from '../services/finnhub'
import type { TradingAccount, Trade } from '../types'
import Layout from '../components/Layout'

interface HoldingRow {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  pnl: number
  pnlPct: number
}

export default function Portfolio() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [loading, setLoading] = useState(true)

  // Load accounts & trades
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

  // Build holdings by aggregating open trades per symbol
  useEffect(() => {
    const open = trades.filter(t => t.status === 'OPEN')
    if (open.length === 0) { setHoldings([]); return }

    // Group by symbol
    const map: Record<string, { totalShares: number; totalCost: number }> = {}
    for (const t of open) {
      if (!map[t.symbol]) map[t.symbol] = { totalShares: 0, totalCost: 0 }
      map[t.symbol].totalShares += t.quantity
      map[t.symbol].totalCost += t.entryPrice * t.quantity
    }

    // Fetch live prices
    Promise.all(
      Object.entries(map).map(async ([sym, agg]) => {
        const q = await getQuote(sym)
        const avgPrice = agg.totalCost / agg.totalShares
        const currentPrice = q.c
        const marketValue = currentPrice * agg.totalShares
        const pnl = (currentPrice - avgPrice) * agg.totalShares
        const pnlPct = ((currentPrice - avgPrice) / avgPrice) * 100
        return { symbol: sym, shares: agg.totalShares, avgPrice, currentPrice, marketValue, pnl, pnlPct } as HoldingRow
      })
    ).then(setHoldings).catch(console.warn)
  }, [trades])

  const activeAccount = accounts.find(a => a.id === selectedAccountId)
  const openTrades = trades.filter(t => t.status === 'OPEN')
  const closedTrades = trades.filter(t => t.status === 'CLOSED')

  const totalMarketValue = holdings.reduce((s, h) => s + h.marketValue, 0)
  const totalPnL = holdings.reduce((s, h) => s + h.pnl, 0)
  const realizedPnL = closedTrades.reduce((s, t) => s + (t.position?.realizedPnl || 0), 0)
  const totalPortfolioValue = (activeAccount?.balance || 0) + totalMarketValue
  const winningTrades = closedTrades.filter(t => (t.position?.realizedPnl || 0) > 0)
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtSign = (n: number) => `${n >= 0 ? '+' : ''}${fmt(n)}`

  return (
    <Layout accounts={accounts} selectedAccountId={selectedAccountId}>
      <div className="flex-1 flex flex-col min-w-0 bg-base overflow-y-auto">
        {/* Header */}
        <div className="h-14 border-b border-border-subtle flex items-center px-6 shrink-0">
          <h1 className="text-sm font-semibold uppercase tracking-[0.1em] text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-accent" /> My Portfolio
          </h1>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Value', value: `$${fmt(totalPortfolioValue)}`, sub: 'Cash + Holdings', up: true },
              { label: 'Cash Balance', value: `$${fmt(activeAccount?.balance || 0)}`, sub: 'Available to trade', up: true },
              { label: 'Unrealized P&L', value: `$${fmtSign(totalPnL)}`, sub: `${holdings.length} open position${holdings.length !== 1 ? 's' : ''}`, up: totalPnL >= 0 },
              { label: 'Realized P&L', value: `$${fmtSign(realizedPnL)}`, sub: `${winRate}% win rate (${closedTrades.length} closed)`, up: realizedPnL >= 0 },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-border-subtle rounded-lg p-4">
                <p className="text-[11px] text-text-secondary uppercase tracking-[0.1em] mb-2">{s.label}</p>
                <p className={`text-xl font-mono font-bold ${s.label.includes('P&L') ? (s.up ? 'text-bullish' : 'text-bearish') : 'text-white'}`}>{s.value}</p>
                <p className="text-[11px] text-text-disabled mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Holdings Table */}
          <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">Open Positions</h2>
              <span className="ml-auto text-xs text-text-disabled">{openTrades.length} trade{openTrades.length !== 1 ? 's' : ''} · {holdings.length} symbol{holdings.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-text-disabled text-sm">Loading positions…</div>
            ) : holdings.length === 0 ? (
              <div className="p-8 text-center text-text-disabled text-sm flex flex-col items-center gap-2">
                <TrendingUp className="w-8 h-8 opacity-20" />
                <p>No open positions. Start trading from the dashboard.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] text-text-secondary uppercase tracking-[0.08em]">
                    <th className="text-left px-5 py-3">Symbol</th>
                    <th className="text-right px-5 py-3">Shares</th>
                    <th className="text-right px-5 py-3">Avg Cost</th>
                    <th className="text-right px-5 py-3">Current</th>
                    <th className="text-right px-5 py-3">Mkt Value</th>
                    <th className="text-right px-5 py-3">Unreal. P&L</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => {
                    const pos = h.pnl >= 0
                    return (
                      <tr key={h.symbol} className="border-b border-border-subtle last:border-0 hover:bg-surface-elevated transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-white text-sm">{h.symbol}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-text-secondary">{h.shares}</td>
                        <td className="px-5 py-3 text-right font-mono text-text-secondary">${fmt(h.avgPrice)}</td>
                        <td className="px-5 py-3 text-right font-mono text-white">${fmt(h.currentPrice)}</td>
                        <td className="px-5 py-3 text-right font-mono text-white">${fmt(h.marketValue)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className={`flex flex-col items-end ${pos ? 'text-bullish' : 'text-bearish'}`}>
                            <span className="font-mono font-semibold text-sm">{pos ? '+' : ''}${fmt(h.pnl)}</span>
                            <span className="text-[11px] flex items-center gap-0.5">
                              {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {h.pnlPct.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => navigate(`/stock/${h.symbol}`)}
                            className="text-accent hover:text-white transition-colors flex items-center gap-1 text-xs ml-auto"
                          >
                            Trade <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Closed Trade History */}
          <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-secondary" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">Recent Closed Trades</h2>
              <span className="ml-auto text-xs text-text-disabled">{closedTrades.length} trade{closedTrades.length !== 1 ? 's' : ''}</span>
            </div>

            {closedTrades.length === 0 ? (
              <div className="p-8 text-center text-text-disabled text-sm flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 opacity-20" />
                <p>No closed trades yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] text-text-secondary uppercase tracking-[0.08em]">
                    <th className="text-left px-5 py-3">Symbol</th>
                    <th className="text-left px-5 py-3">Direction</th>
                    <th className="text-right px-5 py-3">Qty</th>
                    <th className="text-right px-5 py-3">Entry</th>
                    <th className="text-right px-5 py-3">Closed</th>
                    <th className="text-right px-5 py-3">P&L</th>
                    <th className="text-left px-5 py-3">Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.slice(0, 20).map(t => {
                    const pnl = t.position?.realizedPnl || 0
                    const pos = pnl >= 0
                    return (
                      <tr key={t.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-elevated transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-white">{t.symbol}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${t.direction === 'LONG' ? 'text-bullish bg-bullish/10 border-bullish/20' : 'text-bearish bg-bearish/10 border-bearish/20'}`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-text-secondary">{t.quantity}</td>
                        <td className="px-5 py-3 text-right font-mono text-text-secondary">${fmt(t.entryPrice)}</td>
                        <td className="px-5 py-3 text-right font-mono text-text-secondary">
                          {t.closedAt ? new Date(t.closedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-mono font-semibold ${pos ? 'text-bullish' : 'text-bearish'}`}>
                            {pos ? '+' : ''}${fmt(pnl)}
                            {pos ? <CheckCircle className="inline w-3 h-3 ml-1 opacity-60" /> : <XCircle className="inline w-3 h-3 ml-1 opacity-60" />}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-disabled text-xs">
                          {t.enteredAt ? new Date(t.enteredAt).toLocaleDateString() : '—'}
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
