import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useQuotes } from '../hooks/useQuotes'
import type { QuoteExtended } from '../services/finnhub'

export default function GainersLosers() {
  const { stocks } = useQuotes()
  const navigate = useNavigate()

  const { gainers, losers, volatile } = useMemo(() => {
    if (stocks.length === 0) return { gainers: [], losers: [], volatile: [] }
    
    const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent)
    const active = [...stocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))

    return {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice().reverse().slice(0, 5),
      volatile: active.slice(0, 5)
    }
  }, [stocks])

  const renderRow = (s: QuoteExtended, index: number, isWinner: boolean) => (
    <div 
      key={s.symbol} 
      onClick={() => navigate(`/stock/${s.symbol}`)}
      className={`flex items-center justify-between p-3 rounded-lg border border-transparent transition-all cursor-pointer ${isWinner ? 'hover:bg-bullish/5 hover:border-bullish/20' : 'hover:bg-bearish/5 hover:border-bearish/20'}`}
    >
       <div className="flex items-center gap-4">
         <span className="text-text-disabled font-mono text-sm w-4">{index + 1}</span>
         <div>
            <h3 className="text-white font-mono font-bold text-[15px]">{s.symbol}</h3>
            <p className="text-xs text-text-secondary w-32 truncate">{s.name}</p>
         </div>
       </div>
       <div className="text-right">
         <span className="text-white font-mono block text-sm">${s.currentPrice.toFixed(2)}</span>
         <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded inline-block mt-1 ${isWinner ? 'bg-bullish text-black' : 'bg-bearish text-white'}`}>
           {isWinner ? '+' : ''}{s.changePercent.toFixed(2)}%
         </span>
       </div>
    </div>
  )

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 bg-base">
         <div className="mb-8 flex items-end justify-between border-b border-border-subtle pb-4">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Gainers & Losers</h1>
             <p className="text-sm text-text-secondary">Tracking today's highest momentum assets across your watchlist.</p>
           </div>
           {stocks.length > 0 && (
             <span className="text-xs text-text-disabled flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" /> Live Updating
             </span>
           )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* GAINERS */}
            <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <span className="w-2 h-2 rounded-full bg-bullish" />
                 <h2 className="text-xs font-bold text-text-secondary uppercase tracking-[0.1em]">Top Gainers Today</h2>
               </div>
               <div className="space-y-1">
                 {gainers.map((g, i) => renderRow(g, i, true))}
                 {gainers.length === 0 && <div className="text-center text-sm py-8 text-text-disabled">Awaiting market data...</div>}
               </div>
            </div>

            {/* LOSERS */}
            <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <span className="w-2 h-2 rounded-full bg-bearish" />
                 <h2 className="text-xs font-bold text-text-secondary uppercase tracking-[0.1em]">Top Losers Today</h2>
               </div>
               <div className="space-y-1">
                 {losers.map((l, i) => renderRow(l, i, false))}
                 {losers.length === 0 && <div className="text-center text-sm py-8 text-text-disabled">Awaiting market data...</div>}
               </div>
            </div>
         </div>

         {/* VOLATILITY ROW */}
         <div>
             <div className="flex items-center gap-2 mb-6">
               <Activity className="w-4 h-4 text-accent" />
               <h2 className="text-xs font-bold text-text-secondary uppercase tracking-[0.1em]">Most Volatile Today</h2>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {volatile.map(v => {
                   const isPos = v.change >= 0
                   return (
                     <div key={v.symbol} onClick={() => navigate(`/stock/${v.symbol}`)} className="bg-surface rounded-lg p-4 border border-border-subtle hover:border-accent hover:shadow-accent-glow cursor-pointer transition-all">
                       <span className="text-sm font-mono font-bold text-white block mb-1">{v.symbol}</span>
                       <span className={`text-[13px] font-mono font-bold ${isPos ? 'text-bullish' : 'text-bearish'}`}>
                         {isPos ? '+' : ''}{v.changePercent.toFixed(2)}%
                       </span>
                     </div>
                   )
                })}
             </div>
         </div>
      </div>
    </Layout>
  )
}
