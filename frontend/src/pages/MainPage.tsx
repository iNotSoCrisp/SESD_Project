import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Trade, TradingAccount, EmotionLog, MarketQuote } from '../types'
import { getAccounts, createAccount } from '../api/accounts'
import { getTrades, openTrade, closeTrade, cancelTrade } from '../api/trades'
import { getEmotions } from '../api/emotions'
import { getPrice } from '../api/market'
import { getEmotionPerformance, getTimeOfDay, getWinRate } from '../api/analytics'
import TradeCard from '../components/TradeCard'
import EmotionModal from '../components/EmotionModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

type Tab = 'trades' | 'analytics'

const QUICK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTC', 'ETH']

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
  const [tradePnls, setTradePnls] = useState<Record<string, { pnl: number; pnlPercent: number }>>({})
  const [tradeEmotions, setTradeEmotions] = useState<Record<string, { pre: EmotionLog | null; post: EmotionLog | null }>>({})

  // Open trade form
  const [symbol, setSymbol] = useState('')
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET')
  const [quantity, setQuantity] = useState(1)
  const [limitPrice, setLimitPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [fetchedPrice, setFetchedPrice] = useState<MarketQuote | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState('')
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
    if (!user) return
    try {
      const res = await getAccounts()
      setAccounts(res.data.data)
      if (res.data.data.length > 0 && !selectedAccountId) setSelectedAccountId(res.data.data[0]!.id)
    } catch {}
  }, [selectedAccountId, user])

  const loadTrades = useCallback(async () => {
    if (!user || !selectedAccountId) return
    try {
      const res = await getTrades(selectedAccountId)
      const loaded = res.data.data as Trade[]
      setTrades(loaded)

      // Populate P&L from position data already embedded in the trade list
      const pnlMap: Record<string, { pnl: number; pnlPercent: number }> = {}
      for (const t of loaded) {
        if (t.status === 'CLOSED' && t.position?.realizedPnl != null) {
          pnlMap[t.id] = {
            pnl: t.position.realizedPnl,
            pnlPercent: t.position.returnPct ?? 0,
          }
        }
      }
      setTradePnls(pnlMap)

      const emotions: Record<string, { pre: EmotionLog | null; post: EmotionLog | null }> = {}
      for (const t of loaded) {
        if (t.status === 'CLOSED') {
          try {
            const emRes = await getEmotions(t.id)
            emotions[t.id] = emRes.data.data
          } catch { emotions[t.id] = { pre: null, post: null } }
        }
      }
      setTradeEmotions(emotions)
    } catch {}
  }, [selectedAccountId, user])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => { loadTrades() }, [loadTrades])

  const handleFetchPrice = async () => {
    if (!symbol) return
    setPriceLoading(true)
    setPriceError('')
    try {
      const res = await getPrice(symbol)
      setFetchedPrice(res.data.data)
    } catch { setFetchedPrice(null); setPriceError('Symbol not found') } finally { setPriceLoading(false) }
  }

  const handleQuickSymbol = async (sym: string) => {
    setSymbol(sym)
    setPriceLoading(true)
    setPriceError('')
    try {
      const res = await getPrice(sym)
      setFetchedPrice(res.data.data)
    } catch { setFetchedPrice(null); setPriceError('Symbol not found') } finally { setPriceLoading(false) }
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
      setSymbol(''); setLimitPrice(''); setStopPrice(''); setFetchedPrice(null); setPriceError('')
      loadTrades()
    } catch { alert('Failed to open trade') } finally { setTradeLoading(false) }
  }

  const handleCloseTrade = async (id: string) => {
    try {
      const res = await closeTrade(id)
      const pnl: number = (res.data as any).data?.pnl ?? 0
      const trade = (res.data as any).data?.trade
      const cost = trade ? (trade.entryPrice ?? 0) * (trade.quantity ?? 0) : 0
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0
      setTradePnls(prev => ({ ...prev, [id]: { pnl, pnlPercent } }))
      await loadTrades()
    } catch { alert('Failed to close trade') }
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

  useEffect(() => { if (tab === 'analytics' && user) loadAnalytics() }, [tab, user])

  const openTrades = trades.filter(t => t.status === 'OPEN' || t.status === 'PENDING')
  const closedTrades = trades.filter(t => t.status === 'CLOSED').slice(0, 10)

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Top Bar */}
      <header className="bg-[#111827] border-b border-[#1f2937] px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white">ShadowTrade</h1>
          <span className="text-[10px] font-semibold text-[#34d399] bg-[#10b981]/10 border border-[#10b981]/30 px-1.5 py-0.5 rounded">BETA</span>
        </div>

        {user ? (
          <>
            <select value={selectedAccountId ?? ''} onChange={e => setSelectedAccountId(e.target.value)}
              className="px-3 py-1.5 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] focus:outline-none focus:border-[#10b981]">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>)}
            </select>

            <button onClick={() => setShowNewAccount(!showNewAccount)}
              className="px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-lg text-sm text-[#9ca3af] transition-colors">
              + New Account
            </button>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-[#6b7280]">{user?.email}</span>
              <button onClick={() => { logout(); navigate('/login') }}
                className="text-sm text-[#9ca3af] hover:text-[#f87171] transition-colors">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm text-[#6b7280] ml-auto">Guest mode — sign in for full access</span>
            <button onClick={() => navigate('/login')}
              className="px-3 py-1.5 bg-[#10b981] hover:bg-[#34d399] rounded-lg text-sm font-semibold text-black transition-colors">
              Sign In
            </button>
          </>
        )}
      </header>

      {/* Guest Banner */}
      {!user && (
        <div className="bg-yellow-900/20 border-b border-yellow-800/40 px-6 py-2.5 text-center text-sm text-yellow-400">
          You are exploring as a guest. <button onClick={() => navigate('/login')} className="underline font-semibold hover:text-yellow-300">Sign in</button> to create accounts, open trades, and track emotions.
        </div>
      )}

      {/* New Account Form */}
      {user && showNewAccount && <NewAccountForm onSubmit={handleCreateAccount} onCancel={() => setShowNewAccount(false)} />}

      {/* Tab Bar */}
      <div className="flex border-b border-[#1f2937] px-6">
        {(['trades', 'analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-white border-b-2 border-[#10b981]' : 'text-[#6b7280] hover:text-[#d1d5db]'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {tab === 'trades' ? (
          <div className="space-y-6">
            {/* Open Trade Form */}
            {user ? (
              <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
                <h2 className="text-sm font-medium text-[#6b7280] uppercase tracking-wider mb-3">Open Trade</h2>

                {/* Quick-pick symbols */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {QUICK_SYMBOLS.map(s => (
                    <button key={s} onClick={() => handleQuickSymbol(s)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${symbol === s ? 'bg-[#10b981]/20 border-[#10b981] text-[#34d399]' : 'bg-[#1f2937] border-[#374151] text-[#9ca3af] hover:bg-[#374151]'}`}>
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                  {/* Symbol + Price */}
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Symbol</label>
                    <div className="flex items-center gap-1">
                      <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL"
                        className="w-20 px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#10b981]" />
                      <button onClick={handleFetchPrice} disabled={priceLoading}
                        className="px-3 py-2 bg-[#374151] hover:bg-[#4b5563] rounded-lg text-xs text-[#d1d5db] transition-colors disabled:opacity-50">
                        {priceLoading ? (
                          <span className="inline-block w-3 h-3 border border-[#6b7280] border-t-transparent rounded-full animate-spin" />
                        ) : 'Price'}
                      </button>
                    </div>
                    {fetchedPrice && <span className="text-[#34d399] font-mono text-xs mt-1 block">${fetchedPrice.price.toFixed(2)}</span>}
                    {priceError && <span className="text-[#f87171] text-xs mt-1 block">{priceError}</span>}
                  </div>

                  {/* Direction */}
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Direction</label>
                    <div className="flex gap-1">
                      {(['LONG', 'SHORT'] as const).map(d => (
                        <button key={d} onClick={() => setDirection(d)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${direction === d ? (d === 'LONG' ? 'bg-[#10b981] text-black' : 'bg-[#ef4444] text-white') : 'bg-[#1f2937] text-[#6b7280]'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Order Type</label>
                    <select value={orderType} onChange={e => setOrderType(e.target.value as any)}
                      className="px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] focus:outline-none focus:border-[#10b981]">
                      <option value="MARKET">MARKET</option><option value="LIMIT">LIMIT</option><option value="STOP">STOP</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Quantity</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={0.01} step={0.01}
                      className="w-20 px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] focus:outline-none focus:border-[#10b981]" placeholder="Qty" />
                  </div>

                  {/* Limit Price */}
                  {orderType === 'LIMIT' && (
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Limit Price</label>
                      <input value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder="0.00"
                        className="w-24 px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] placeholder-[#6b7280] focus:outline-none focus:border-[#10b981]" />
                    </div>
                  )}
                  {orderType === 'STOP' && (
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Stop Price</label>
                      <input value={stopPrice} onChange={e => setStopPrice(e.target.value)} placeholder="0.00"
                        className="w-24 px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] placeholder-[#6b7280] focus:outline-none focus:border-[#10b981]" />
                    </div>
                  )}

                  {/* Open Trade Button */}
                  <button onClick={handleOpenTrade} disabled={tradeLoading || !selectedAccountId || !symbol}
                    className="px-6 py-2 bg-[#10b981] hover:bg-[#34d399] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-black transition-colors">
                    {tradeLoading ? 'Opening...' : 'Open Trade'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-8 text-center">
                <p className="text-[#6b7280] mb-3">Sign in to open trades and track your portfolio.</p>
                <button onClick={() => navigate('/login')} className="px-4 py-2 bg-[#10b981] hover:bg-[#34d399] rounded-lg text-sm font-semibold text-black transition-colors">
                  Sign In
                </button>
              </div>
            )}

            {/* Open & Pending Trades */}
            {openTrades.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Open & Pending ({openTrades.length})</h3>
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
                <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Closed ({closedTrades.length})</h3>
                <div className="space-y-3">
                  {closedTrades.map(t => (
                    <TradeCard key={t.id} trade={t} pnl={tradePnls[t.id]} emotions={tradeEmotions[t.id]} onClose={() => {}} onCancel={() => {}} onLogEmotion={setEmotionTrade} />
                  ))}
                </div>
              </div>
            )}

            {user && trades.length === 0 && <p className="text-[#4b5563] text-center py-8">No trades yet. Open your first trade above.</p>}
            {!user && <p className="text-[#4b5563] text-center py-8">Sign in to view and manage trades.</p>}
          </div>
        ) : (
          /* Analytics Tab */
          <div className="space-y-6">
            {!user ? (
              <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-8 text-center">
                <p className="text-[#6b7280] mb-3">Sign in to view analytics and performance insights.</p>
                <button onClick={() => navigate('/login')} className="px-4 py-2 bg-[#10b981] hover:bg-[#34d399] rounded-lg text-sm font-semibold text-black transition-colors">
                  Sign In
                </button>
              </div>
            ) : (
              <>
                <AnalyticsSection title="Emotion vs Performance" data={emotionData} insights={emotionInsights} loading={analyticsLoading} />
                <AnalyticsSection title="Time of Day" data={timeData} insights={timeInsights} loading={analyticsLoading} />
                <AnalyticsSection title="Win Rate by Symbol" data={winData} insights={winInsights} loading={analyticsLoading} />
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
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg mx-6 mt-2 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Main Account"
            className="px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] placeholder-[#6b7280] focus:outline-none focus:border-[#10b981]" />
        </div>
        <div>
          <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] focus:outline-none focus:border-[#10b981]">
            <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-1">Balance</label>
          <input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))} min={0}
            className="w-28 px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#f3f4f6] focus:outline-none focus:border-[#10b981]" />
        </div>
        <button onClick={() => name && onSubmit(name, currency, balance)}
          className="px-4 py-2 bg-[#10b981] hover:bg-[#34d399] rounded-lg text-sm font-semibold text-black transition-colors">
          Create
        </button>
        <button onClick={onCancel} className="px-3 py-2 text-[#6b7280] hover:text-[#9ca3af] text-sm transition-colors">Cancel</button>
      </div>
    </div>
  )
}

const chartTooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f3f4f6',
}

const gridStroke = '#1f2937'
const axisStroke = '#374151'
const tickFill = '#9ca3af'

function AnalyticsSection({ title, data, insights, loading }: { title: string; data: { key: string; value: number }[]; insights: string[]; loading?: boolean }) {
  if (loading) return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-5">
      <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-2">
        {[60, 80, 45].map((w, i) => (
          <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
  if (data.length === 0) return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6">
      <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">{title}</h3>
      <p className="text-gray-500 text-sm">
        No data yet — open and close at least 3 trades to see insights here.
      </p>
    </div>
  )
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-5">
      <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="key" tick={{ fill: tickFill, fontSize: 12 }} axisLine={{ stroke: axisStroke }} />
          <YAxis tick={{ fill: tickFill, fontSize: 12 }} axisLine={{ stroke: axisStroke }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? '#34d399' : '#f87171'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {insights.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {insights.map((s: string, i: number) => {
            const isPositive = s.includes('+') || s.includes('positive')
            const isNegative = s.includes('-') || s.includes('negative') || s.includes('avoid')
            return (
              <li key={i} className="text-sm text-[#9ca3af] flex gap-2">
                <span className="text-[#10b981]">•</span>
                <span className={isPositive ? 'text-[#34d399]' : isNegative ? 'text-[#f87171]' : ''}>{s}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
