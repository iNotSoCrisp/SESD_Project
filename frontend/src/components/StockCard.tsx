import { useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import type { QuoteExtended } from '../services/finnhub'

interface StockCardProps {
  quote: QuoteExtended
  index?: number
}

export default function StockCard({ quote, index = 0 }: StockCardProps) {
  const navigate = useNavigate()
  const isPositive = quote.changePercent >= 0
  const barRange = quote.high - quote.low
  const markerPct = barRange > 0
    ? Math.max(0, Math.min(100, ((quote.currentPrice - quote.low) / barRange) * 100))
    : 50

  // Price flash
  const prevPrice = useRef(quote.currentPrice)
  const [flashClass, setFlashClass] = useState('')
  useEffect(() => {
    if (quote.currentPrice !== prevPrice.current) {
      setFlashClass(quote.currentPrice > prevPrice.current ? 'price-flash-up' : 'price-flash-down')
      prevPrice.current = quote.currentPrice
      const t = setTimeout(() => setFlashClass(''), 650)
      return () => clearTimeout(t)
    }
  }, [quote.currentPrice])

  const delay = Math.min(index * 30, 300)

  return (
    <div
      onClick={() => navigate(`/stock/${quote.symbol}`)}
      className={`cursor-pointer card-stagger ${isPositive ? 'card-glow-up' : 'card-glow-down'}`}
      style={{
        background: '#131722',
        border: '1px solid #1E2230',
        borderRadius: 6,
        padding: 16,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.background = '#171B2D'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.background = '#131722'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Row 1: Ticker + Sector */}
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 700, color: '#fff' }}>
          {quote.symbol}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#434651' }}>
          {quote.sector || ''}
        </span>
      </div>

      {/* Row 2: Price + Change Pill */}
      <div className="flex items-center justify-between mb-1">
        <span className={flashClass} style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: '#D1D4DC', lineHeight: 1.2 }}>
          ${quote.currentPrice.toFixed(2)}
        </span>
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600,
          borderRadius: 4, padding: '2px 8px',
          background: isPositive ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)',
          color: isPositive ? '#26A69A' : '#EF5350',
          border: `1px solid ${isPositive ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)'}`,
        }}>
          {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
        </span>
      </div>

      {/* Row 3: Company Name */}
      <div style={{ fontSize: 12, color: '#787B86', fontFamily: 'Inter, sans-serif', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {quote.name || quote.symbol}
      </div>

      {/* Row 4: High/Low Bar */}
      <div style={{ position: 'relative', height: 4, background: '#1C2030', borderRadius: 2, marginBottom: 6 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 2,
          background: 'linear-gradient(to right, #EF5350, #26A69A)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', width: 8, height: 8,
          background: '#fff', borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          left: `${markerPct}%`,
          boxShadow: '0 0 4px rgba(0,0,0,0.8)',
        }} />
      </div>
      <div className="flex justify-between">
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#EF5350' }}>L ${quote.low.toFixed(2)}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#26A69A' }}>H ${quote.high.toFixed(2)}</span>
      </div>
    </div>
  )
}
