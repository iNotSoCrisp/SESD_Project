import { useEffect, useState, useRef } from 'react'
import { STOCKS, CRYPTO } from '../data/watchlist'
import { getQuote } from '../services/finnhub'

interface TickerItem {
  symbol: string
  displaySymbol: string
  price: number
  changePct: number
}

export default function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>([])
  const prevPrices = useRef<Record<string, number>>({})

  useEffect(() => {
    let active = true
    const allSymbols = [
      ...STOCKS.map(s => ({ symbol: s.symbol, displaySymbol: s.symbol })),
      ...CRYPTO.map(s => ({ symbol: s.symbol, displaySymbol: s.ticker || s.name })),
    ]

    const fetchAll = async () => {
      const results: TickerItem[] = []
      for (const s of allSymbols) {
        try {
          const q = await getQuote(s.symbol)
          const change = q.pc !== 0 ? ((q.c - q.pc) / q.pc) * 100 : 0
          results.push({ symbol: s.symbol, displaySymbol: s.displaySymbol, price: q.c, changePct: change })
        } catch { /* skip */ }
      }
      if (active) {
        // Store prev prices for flash
        const newPrev: Record<string, number> = {}
        for (const r of results) newPrev[r.symbol] = r.price
        prevPrices.current = newPrev
        setItems(results)
      }
    }

    fetchAll()
    const intv = setInterval(fetchAll, 30000)
    return () => { active = false; clearInterval(intv) }
  }, [])

  if (items.length === 0) return null

  // Duplicate items so the loop is seamless
  const doubled = [...items, ...items]

  return (
    <div className="ticker-tape" style={{ zIndex: 20 }}>
      <div className="ticker-inner" style={{ alignItems: 'center', height: '100%' }}>
        {doubled.map((item, i) => {
          const pos = item.changePct >= 0
          return (
            <span key={`${item.symbol}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 16px', height: '100%' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {item.displaySymbol}
              </span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: pos ? '#26A69A' : '#EF5350' }}>
                ${item.price.toFixed(2)}
              </span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: pos ? '#26A69A' : '#EF5350' }}>
                {pos ? '▲' : '▼'} {pos ? '+' : ''}{item.changePct.toFixed(2)}%
              </span>
              <span style={{ width: 1, height: 12, background: '#1E2230', marginLeft: 8 }} />
            </span>
          )
        })}
      </div>
    </div>
  )
}
