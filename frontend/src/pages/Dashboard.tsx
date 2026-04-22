import { useState, useEffect, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import StockCard from '../components/StockCard'
import { SkeletonStockCard } from '../components/Skeleton'
import { useQuotes } from '../hooks/useQuotes'
import { useUser } from '@clerk/clerk-react'
import { getAccounts } from '../api/accounts'
import type { TradingAccount } from '../types'

const SECTORS = ['All', 'Technology', 'Finance', 'Healthcare', 'Energy', 'Automotive', 'Entertainment', 'Crypto']

export default function Dashboard() {
  const { stocks, crypto, loadingStocks, rateLimitActive, rateLimitTimer } = useQuotes()
  const [activeTab, setActiveTab] = useState('All')
  const { user } = useUser()
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getAccounts().then(res => {
      setAccounts(res.data.data)
      if (res.data.data.length > 0) setSelectedAccountId(res.data.data[0].id)
    }).catch(console.warn)
  }, [user])

  const metrics = useMemo(() => {
    if (stocks.length === 0) return { mood: null, gainer: null, loser: null, volatile: null, advances: 0, declines: 0 }
    const advances = stocks.filter(s => s.change >= 0).length
    const declines = stocks.length - advances
    const mood = advances / stocks.length >= 0.5 ? 'Bullish' : 'Bearish'
    let gainer = stocks[0], loser = stocks[0], volatile = stocks[0]
    for (const s of stocks) {
      if (s.changePercent > gainer.changePercent) gainer = s
      if (s.changePercent < loser.changePercent) loser = s
      if (Math.abs(s.changePercent) > Math.abs(volatile.changePercent)) volatile = s
    }
    return { mood, gainer, loser, volatile, advances, declines }
  }, [stocks])

  const displayItems = useMemo(() => {
    if (activeTab === 'Crypto') return crypto
    if (activeTab === 'All') return stocks
    return stocks.filter(s => s.sector === activeTab)
  }, [activeTab, stocks, crypto])

  const moodColor = metrics.mood === 'Bullish' ? '#26A69A' : metrics.mood === 'Bearish' ? '#EF5350' : '#787B86'

  const statChips = [
    { label: 'Market Mood', value: metrics.mood ?? '—', color: moodColor },
    { label: 'Advances', value: metrics.advances > 0 ? `${metrics.advances}` : '—', color: '#26A69A' },
    { label: 'Declines', value: metrics.declines > 0 ? `${metrics.declines}` : '—', color: '#EF5350' },
    { label: 'Top Gainer', value: metrics.gainer ? `${metrics.gainer.symbol} +${metrics.gainer.changePercent.toFixed(2)}%` : '—', color: '#26A69A' },
    { label: 'Top Loser', value: metrics.loser ? `${metrics.loser.symbol} ${metrics.loser.changePercent.toFixed(2)}%` : '—', color: '#EF5350' },
  ]

  return (
    <Layout title="Market Overview" quotes={[...stocks, ...crypto]} accounts={accounts} selectedAccountId={selectedAccountId}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0B0D13', overflow: 'hidden' }}>

        {/* Rate Limit Banner */}
        {rateLimitActive && (
          <div style={{ background: 'rgba(255,152,0,0.08)', color: '#FF9800', padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,152,0,0.2)', flexShrink: 0 }}>
            <AlertCircle size={13} /> Rate limit reached. Resuming in {rateLimitTimer}s…
          </div>
        )}

        {/* Compact Stat Strip */}
        <div style={{ padding: '10px 20px', flexShrink: 0 }}>
          <div style={{ height: 44, background: '#131722', border: '1px solid #1E2230', borderRadius: 6, display: 'flex', alignItems: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            {statChips.map((chip, i) => (
              <div key={chip.label} style={{ flex: 1, padding: '0 20px', borderRight: i < statChips.length - 1 ? '1px solid #1E2230' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#434651', marginBottom: 2 }}>{chip.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: chip.color, fontFamily: 'DM Mono, monospace' }}>{chip.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid #1E2230', display: 'flex', gap: 0, overflowX: 'auto', flexShrink: 0 }} className="no-scrollbar">
          {SECTORS.map(sec => (
            <button key={sec} onClick={() => setActiveTab(sec)} style={{
              padding: '0 16px', height: 40, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', whiteSpace: 'nowrap',
              color: activeTab === sec ? '#fff' : '#787B86',
              borderBottom: activeTab === sec ? '2px solid #2962FF' : '2px solid transparent',
              transition: 'all 150ms',
            }}>
              {sec}
            </button>
          ))}
        </div>

        {/* Stock Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {loadingStocks && displayItems.length === 0
              ? Array.from({ length: 25 }).map((_, i) => <SkeletonStockCard key={i} />)
              : displayItems.length === 0
                ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#434651', fontSize: 13 }}>No data available</div>
                : displayItems.map((q, i) => (
                    <StockCard key={q.symbol} quote={q} index={i} />
                  ))
            }
          </div>
        </div>
      </div>
    </Layout>
  )
}
