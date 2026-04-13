import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Trade, TradingAccount, EmotionLog } from '../types'
import { getAccounts, createAccount } from '../api/accounts'
import { getTrades, openTrade, closeTrade, cancelTrade } from '../api/trades'
import { getEmotions } from '../api/emotions'
import { getPrice } from '../api/market'
import { getEmotionPerformance, getTimeOfDay, getWinRate } from '../api/analytics'
import TradeCard from '../components/TradeCard'
import EmotionModal from '../components/EmotionModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Tab = 'trades' | 'analytics'

export default function MainPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('trades')

  // Accounts
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [showNewAccount, setShowNewAccount] = useState(false)

  // Trades
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradePnls, setTradePnls] = useState<Record<string, number>>({})
  const [tradeEmotions, setTradeEmotions] = useState<Record<string, { pre: EmotionLog | null; post: EmotionLog | null }>>({})

  // Open trade form
  const [symbol, setSymbol] = useState('')
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET')
  const [quantity, setQuantity] = useState(1)
  const [limitPrice, setLimitPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [tradeLoading, setTradeLoading] = useState(false)

  // Emotion modal
  const [emotionTrade, setEmotionTrade] = useState<Trade | null>(null)

  // Analytics
  const [emotionData, setEmotionData] = useState<{ key: string; value: number }[]>([])
  const [emotionInsights, setEmotionInsights] = useState<string[]>([])
  const [timeData, setTimeData] = useState<{ key: string; value: number }[]>([])
  const [timeInsights, setTimeInsights] = useState<string[]>([])
  const [winData, setWinData] = useState<{ key: string; value: number }[]>([])
  const [winInsights, setWinInsights] = useState<string[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const loadAccounts = useCallback(async () => {
    try {
      const res = await getAccounts()
      setAccounts(res.data.data)
      if (res.data.data.length > 0 && !selectedAccountId) setSelectedAccountId(res.data.data[0]!.id)
    } catch {}
  }, [selectedAccountId])

  const loadTrades = useCallback(async () => {
    if (!selectedAccountId) return
    try {
      const res = await getTrades(selectedAccountId)
      setTrades(res.data.data as Trade[])
      // Load PnL for closed trades and emotions for open/closed
      const pnls: Record<string, number> = {}
      const emotions: Record<string, { pre: EmotionLog | null; post: EmotionLog | null }> = {}
      for (const t of res.data.data as Trade[]) {
        if (t.status === 'CLOSED') {
          try {
            const emRes = await getEmotions(t.id)
            emotions[t.id] = emRes.data.data
          } catch { emotions[t.id] = { pre: null, post: null } }
        }
      }
      setTradePnls(pnls)
      setTradeEmotions(emotions)
    } catch {}
  }, [selectedAccountId])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => { loadTrades() }, [loadTrades])

  const handleFetchPrice = async () => {
    if (!symbol) return
    setPriceLoading(true)
    try {
      const res = await getPrice(symbol)
      setFetchedPrice(res.data.data.currentPrice)
    } catch { setFetchedPrice(null) } finally { setPriceLoading(false) }
  }

  const handleOpenTrade = async () => {
    if (!selectedAccountId || !symbol) return
    setTradeLoading(true)
    try {
      const data: Record<string, unknown> = {
        accountId: selectedAccountId, symbol: symbol.toUpperCase(), direction, orderType, quantity,
      }
      if (orderType === 'LIMIT' && limitPrice) data.limitPrice = Number(limitPrice)
      if (orderType === 'STOP' && stopPrice) data.stopPrice = Number(stopPrice)
      await openTrade(data as any)
      setSymbol(''); setLimitPrice(''); setStopPrice(''); setFetchedPrice(null)
      loadTrades()
    } catch { alert('Failed to open trade') } finally { setTradeLoading(false) }
  }

  const handleCloseTrade = async (id: string) => {
    try { await closeTrade(id); loadTrades() } catch { alert('Failed to close trade') }
  }

  const handleCancelTrade = async (id: string) => {
    try { await cancelTrade(id); loadTrades() } catch { alert('Failed to cancel trade') }
  }

  const handleCreateAccount = async (name: string, currency: string, balance: number) => {
    try {
      const res = await createAccount(name, currency, balance)
      setAccounts(prev => [res.data.data, ...prev])
      setSelectedAccountId(res.data.data.id)
      setShowNewAccount(false)
    } catch { alert('Failed to create account') }
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const [ep, tod, wr] = await Promise.all([getEmotionPerformance(), getTimeOfDay(), getWinRate()])
      const labels: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' }

      const emotionMap = new Map<string, number>()
      for (const i of ep.data.data.insights ?? []) {
        const match = i.message.match(/(-?\d+\.?\d*)% P&L when trading with (\w+)/)
        if (match) emotionMap.set(match[2]!, parseFloat(match[1]!))
      }
      setEmotionData([...emotionMap.entries()].map(([k, v]) => ({ key: k, value: v })))
      setEmotionInsights((ep.data.data.insights ?? []).map((i: { message: string }) => i.message))

      const timeMap = new Map<string, number>()
      for (const i of tod.data.data.insights ?? []) {
        const match = i.message.match(/(\w+).*?(\d+)% win rate/)
        if (match) timeMap.set(labels[match[1]!.toLowerCase()] ?? match[1]!, parseFloat(match[2]!))
      }
      setTimeData([...timeMap.entries()].map(([k, v]) => ({ key: k, value: v })))
      setTimeInsights((tod.data.data.insights ?? []).map((i: { message: string }) => i.message))

      const winMap = new Map<string, number>()
      for (const i of wr.data.data.insights ?? []) {
        const match = i.message.match(/(\w+): (\d+)% win rate/)
        if (match) winMap.set(match[1]!, parseFloat(match[2]!))
      }
      setWinData([...winMap.entries()].map(([k, v]) => ({ key: k, value: v })))
      setWinInsights((wr.data.data.insights ?? []).map((i: { message: string }) => i.message))
    } catch {} finally { setAnalyticsLoading(false) }
  }

  useEffect(() => { if (tab === 'analytics') loadAnalytics() }, [tab])

  const openTrades = trades.filter(t => t.status === 'OPEN' || t.status === 'PENDING')
  const closedTrades = trades.filter(t => t.status === 'CLOSED').slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-blue-400">ShadowTrade</h1>

        <select value={selectedAccountId ?? ''} onChange={e => setSelectedAccountId(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>)}
        </select>

        <button onClick={() => setShowNewAccount(!showNewAccount)}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
          + New Account
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login') }}
            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-sm transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* New Account Form */}
      {showNewAccount && <NewAccountForm onSubmit={handleCreateAccount} onCancel={() => setShowNewAccount(false)} />}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4">
        {(['trades', 'analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {tab === 'trades' ? (
          <div className="space-y-6">
            {/* Open Trade Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-3">Open Trade</h2>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex items-center gap-1">
                  <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL"
                    className="w-20 px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none" />
                  <button onClick={handleFetchPrice} disabled={priceLoading}
                    className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors disabled:opacity-50">
                    {priceLoading ? '...' : 'Price'}
                  </button>
                  {fetchedPrice !== null && <span className="text-xs text-green-400">${fetchedPrice.toFixed(2)}</span>}
                </div>

                <div className="flex gap-1">
                  {(['LONG', 'SHORT'] as const).map(d => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={`px-3 py-2 rounded text-xs font-semibold ${direction === d ? (d === 'LONG' ? 'bg-green-700 text-white' : 'bg-red-700 text-white') : 'bg-gray-800 text-gray-400'}`}>
                      {d}
                    </button>
                  ))}
                </div>

                <select value={orderType} onChange={e => setOrderType(e.target.value as any)}
                  className="px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none">
                  <option value="MARKET">MARKET</option><option value="LIMIT">LIMIT</option><option value="STOP">STOP</option>
                </select>

                <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={0.01} step={0.01}
                  className="w-20 px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none" placeholder="Qty" />

                {orderType === 'LIMIT' && (
                  <input value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder="Limit price"
                    className="w-24 px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none" />
                )}
                {orderType === 'STOP' && (
                  <input value={stopPrice} onChange={e => setStopPrice(e.target.value)} placeholder="Stop price"
                    className="w-24 px-2 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none" />
                )}

                <button onClick={handleOpenTrade} disabled={tradeLoading || !selectedAccountId || !symbol}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm font-semibold transition-colors">
                  {tradeLoading ? 'Opening...' : 'Open Trade'}
                </button>
              </div>
            </div>

            {/* Open & Pending Trades */}
            {openTrades.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">OPEN & PENDING ({openTrades.length})</h3>
                <div className="space-y-3">
                  {openTrades.map(t => (
                    <TradeCard key={t.id} trade={t} emotions={tradeEmotions[t.id]} onClose={handleCloseTrade} onCancel={handleCancelTrade} onLogEmotion={setEmotionTrade} />
                  ))}
                </div>
              </div>
            )}

            {/* Closed Trades */}
            {closedTrades.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">CLOSED ({closedTrades.length})</h3>
                <div className="space-y-3">
                  {closedTrades.map(t => (
                    <TradeCard key={t.id} trade={t} pnl={tradePnls[t.id]} emotions={tradeEmotions[t.id]} onClose={() => {}} onCancel={() => {}} onLogEmotion={setEmotionTrade} />
                  ))}
                </div>
              </div>
            )}

            {trades.length === 0 && <p className="text-gray-500 text-center py-8">No trades yet. Open your first trade above.</p>}
          </div>
        ) : (
          /* Analytics Tab */
          <div className="space-y-8">
            {analyticsLoading ? <div className="text-center py-12 text-gray-500">Loading analytics...</div> : (
              <>
                <AnalyticsSection title="Emotion vs Performance" data={emotionData} insights={emotionInsights} valueLabel="Avg P&L %" />
                <AnalyticsSection title="Time of Day" data={timeData} insights={timeInsights} valueLabel="Win Rate %" />
                <AnalyticsSection title="Win Rate by Symbol" data={winData} insights={winInsights} valueLabel="Win Rate %" />
              </>
            )}
          </div>
        )}
      </div>

      {emotionTrade && (
        <EmotionModal trade={emotionTrade} onClose={() => setEmotionTrade(null)} onSuccess={() => { setEmotionTrade(null); loadTrades() }} />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NewAccountForm({ onSubmit, onCancel }: { onSubmit: (n: string, c: string, b: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [balance, setBalance] = useState(10000)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl mx-4 mt-2 p-4">
      <div className="flex flex-wrap gap-2 items-end">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Account name"
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none" />
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none">
          <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
        </select>
        <input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))} min={0}
          className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none" />
        <button onClick={() => name && onSubmit(name, currency, balance)}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-semibold transition-colors">
          Create
        </button>
        <button onClick={onCancel} className="px-3 py-2 text-gray-400 hover:text-gray-200 text-sm">Cancel</button>
      </div>
    </div>
  )
}

function AnalyticsSection({ title, data, insights, valueLabel }: { title: string; data: { key: string; value: number }[]; insights: string[]; valueLabel: string }) {
  if (data.length === 0) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
      No data yet — close some trades first.
    </div>
  )
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="key" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
          <Bar dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {insights.length > 0 && (
        <ul className="mt-4 space-y-1">
          {insights.map((s: string, i: number) => (
            <li key={i} className="text-sm text-gray-400 flex gap-2"><span className="text-blue-400">•</span>{s}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
