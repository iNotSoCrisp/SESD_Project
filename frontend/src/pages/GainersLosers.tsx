import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useQuotes } from '../hooks/useQuotes'
import { SkeletonMoverRow } from '../components/Skeleton'
import type { QuoteExtended } from '../services/finnhub'

export default function GainersLosers() {
  const { stocks, loadingStocks } = useQuotes()
  const navigate = useNavigate()

  const { gainers, losers, volatile } = useMemo(() => {
    if (stocks.length === 0) return { gainers: [], losers: [], volatile: [] }
    const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent)
    const active = [...stocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    return { gainers: sorted.slice(0, 8), losers: sorted.reverse().slice(0, 8), volatile: active.slice(0, 5) }
  }, [stocks])

  const renderRow = (s: QuoteExtended, index: number, isWinner: boolean) => (
    <div
      key={s.symbol}
      onClick={() => navigate(`/stock/${s.symbol}`)}
      style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', borderBottom: '1px solid #1A1E2E', cursor: 'pointer', transition: 'background 100ms' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0F1117'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#434651', width: 20, textAlign: 'right', flexShrink: 0 }}>{index + 1}</span>
      <div style={{ width: 4, height: 32, borderRadius: 2, background: isWinner ? '#26A69A' : '#EF5350', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14, color: '#fff' }}>{s.symbol}</div>
        <div style={{ fontSize: 11, color: '#787B86', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#D1D4DC' }}>${s.currentPrice.toFixed(2)}</span>
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: 11, padding: '1px 6px', borderRadius: 3,
          background: isWinner ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)',
          color: isWinner ? '#26A69A' : '#EF5350',
          border: `1px solid ${isWinner ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)'}`,
        }}>
          {isWinner ? '▲' : '▼'} {isWinner ? '+' : ''}{s.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  )

  return (
    <Layout title="Gainers & Losers" quotes={stocks}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#0B0D13' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1E2230', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Gainers & Losers</h1>
            <p style={{ fontSize: 12, color: '#787B86' }}>Today's top momentum stocks across your watchlist</p>
          </div>
          {stocks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#434651' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#26A69A', animation: 'pulse 2s infinite' }} />
              Live Updating
            </div>
          )}
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          {/* Gainers */}
          <div>
            <div style={{ borderLeft: '3px solid #26A69A', paddingLeft: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#787B86' }}>Top Gainers</span>
            </div>
            {loadingStocks
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonMoverRow key={i} />)
              : gainers.length === 0
                ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#434651', fontSize: 12 }}>Awaiting market data…</div>
                : gainers.map((g, i) => renderRow(g, i, true))
            }
          </div>

          {/* Losers */}
          <div>
            <div style={{ borderLeft: '3px solid #EF5350', paddingLeft: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#787B86' }}>Top Losers</span>
            </div>
            {loadingStocks
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonMoverRow key={i} />)
              : losers.length === 0
                ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#434651', fontSize: 12 }}>Awaiting market data…</div>
                : losers.map((l, i) => renderRow(l, i, false))
            }
          </div>
        </div>

        {/* Most Volatile */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Activity size={14} style={{ color: '#2962FF' }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#787B86' }}>Most Volatile</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {volatile.map(v => {
              return (
                <div
                  key={v.symbol}
                  onClick={() => navigate(`/stock/${v.symbol}`)}
                  style={{ background: '#131722', border: '1px solid #1E2230', borderRadius: 6, padding: '12px 14px', cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', transition: 'border-color 150ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#FF9800'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1E2230'}
                >
                  <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 4 }}>{v.symbol}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#FF9800', fontWeight: 600 }}>±{Math.abs(v.changePercent).toFixed(2)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
