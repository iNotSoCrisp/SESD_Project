import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { STOCKS, CRYPTO } from '../data/watchlist'
import type { QuoteExtended } from '../services/finnhub'

interface TopBarProps {
  title: string
  quotes?: QuoteExtended[]
}

const ALL_ITEMS = [...STOCKS, ...CRYPTO]

export default function TopBar({ title, quotes = [] }: TopBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<typeof ALL_ITEMS>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    try {
      const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
      const res = await fetch(`https://finnhub.io/api/v1/search?q=${q}&token=${FINNHUB_KEY}`)
      const data = await res.json()
      if (data && data.result) {
        setResults(data.result.slice(0, 8).map((r: any) => ({
          symbol: r.symbol,
          name: r.description,
          type: r.type,
        })))
      }
    } catch (e) {
      console.warn('Search failed', e)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 400)
  }

  const handleSelect = (symbol: string) => {
    setQuery('')
    setOpen(false)
    navigate(`/stock/${symbol}`)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getQuote = (symbol: string) => quotes.find(q => q.symbol === symbol)

  return (
    <div style={{
      height: 52, borderBottom: '1px solid #2A2E39',
      background: '#0D0E11', display: 'flex', alignItems: 'center',
      paddingLeft: 20, paddingRight: 20, gap: 16, flexShrink: 0, zIndex: 10,
    }}>
      {/* Page Title */}
      <span style={{ fontSize: 13, fontWeight: 600, color: '#D1D4DC', whiteSpace: 'nowrap', letterSpacing: '0.02em', minWidth: 140 }}>
        {title}
      </span>

      {/* Search */}
      <div ref={containerRef} style={{ flex: 1, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0D0E11', border: `1px solid ${open ? '#2962FF' : '#2A2E39'}`,
          borderRadius: 6, paddingLeft: 10, paddingRight: 10,
          boxShadow: open ? '0 0 0 3px rgba(41,98,255,0.1)' : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
          height: 34,
        }}>
          <Search size={14} color="#787B86" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onFocus={() => { setOpen(true); if (query) search(query) }}
            placeholder="Search stocks, crypto..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: '#D1D4DC', fontFamily: 'Inter, sans-serif',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              style={{ color: '#434651', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: '#1C2030', border: '1px solid #2A2E39', borderRadius: 6,
            maxHeight: 320, overflowY: 'auto', zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {results.map(item => {
              const q = getQuote(item.symbol)
              return (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  style={{
                    height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 14px', cursor: 'pointer', borderBottom: '1px solid rgba(42,46,57,0.5)',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(41,98,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.symbol}</span>
                    <span style={{ fontSize: 11, color: '#787B86' }}>{item.name}</span>
                  </div>
                  {q && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#D1D4DC' }}>${q.currentPrice.toFixed(2)}</span>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: 11,
                        color: (q.changePercent ?? 0) >= 0 ? '#26A69A' : '#EF5350',
                      }}>
                        {(q.changePercent ?? 0) >= 0 ? '+' : ''}{(q.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {open && query && results.length === 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: '#1C2030', border: '1px solid #2A2E39', borderRadius: 6,
            padding: '12px 14px', zIndex: 100, fontSize: 13, color: '#787B86',
          }}>
            No results for "{query}"
          </div>
        )}
      </div>

    </div>
  )
}
