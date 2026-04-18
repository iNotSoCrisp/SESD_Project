import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import StockCard from '../components/StockCard'
import { useQuotes } from '../hooks/useQuotes'

const SECTORS = ['All', 'Technology', 'Finance', 'Healthcare', 'Energy', 'Automotive', 'Entertainment', 'Crypto']

export default function Dashboard() {
  const { stocks, crypto, loadingStocks, rateLimitActive, rateLimitTimer } = useQuotes()
  const [activeTab, setActiveTab] = useState('All')
  

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (stocks.length === 0) return { mood: 'Neutral', gainer: null, loser: null, volatile: null }

    const advances = stocks.filter(s => s.change >= 0).length
    const mood = advances / stocks.length >= 0.5 ? 'Bullish' : 'Bearish'
    
    let gainer = stocks[0]
    let loser = stocks[0]
    let volatile = stocks[0]

    for (const s of stocks) {
      if (s.changePercent > (gainer?.changePercent || -Infinity)) gainer = s
      if (s.changePercent < (loser?.changePercent || Infinity)) loser = s
      if (Math.abs(s.changePercent) > Math.abs(volatile?.changePercent || 0)) volatile = s
    }

    return { mood, gainer, loser, volatile }
  }, [stocks])

  // Filter Grid
  const displayItems = useMemo(() => {
    if (activeTab === 'Crypto') return crypto
    if (activeTab === 'All') return stocks
    return stocks.filter(s => s.sector === activeTab)
  }, [activeTab, stocks, crypto])

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-base overflow-y-auto">
        
        {/* Rate Limit Banner */}
        {rateLimitActive && (
          <div className="bg-[#FF9800]/10 text-[#FF9800] px-4 py-2 text-xs flex items-center justify-center gap-2 border-b border-[#FF9800]/20 shrink-0">
            <AlertCircle className="w-4 h-4" />
            <span>Rate limit reached. Resuming in {rateLimitTimer}s...</span>
          </div>
        )}

        {/* Top Header & Metrics */}
        <div className="p-6 shrink-0">
          <h1 className="text-xl font-bold text-white tracking-tight mb-6">Market Overview</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Mood Chip */}
             <div className="bg-surface rounded-lg border border-border-subtle p-3 flex flex-col">
               <span className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Market Mood</span>
               <div className="flex items-center gap-2">
                 <span className={`text-[15px] font-bold ${metrics.mood === 'Bullish' ? 'text-bullish' : 'text-bearish'}`}>
                   {metrics.mood}
                 </span>
               </div>
             </div>
             
             {/* Biggest Gainer */}
             <div className="bg-surface rounded-lg border border-border-subtle p-3 flex flex-col">
               <span className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Biggest Gainer</span>
               {metrics.gainer ? (
                 <div className="flex items-baseline gap-2">
                   <span className="text-[15px] font-bold text-white">{metrics.gainer.symbol}</span>
                   <span className="text-xs font-mono text-bullish">+{metrics.gainer.changePercent.toFixed(2)}%</span>
                 </div>
               ) : <span className="text-[15px] text-text-disabled">-</span>}
             </div>

             {/* Biggest Loser */}
             <div className="bg-surface rounded-lg border border-border-subtle p-3 flex flex-col">
               <span className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Biggest Loser</span>
               {metrics.loser ? (
                 <div className="flex items-baseline gap-2">
                   <span className="text-[15px] font-bold text-white">{metrics.loser.symbol}</span>
                   <span className="text-xs font-mono text-bearish">{metrics.loser.changePercent.toFixed(2)}%</span>
                 </div>
               ) : <span className="text-[15px] text-text-disabled">-</span>}
             </div>

             {/* Most Volatile */}
             <div className="bg-surface rounded-lg border border-border-subtle p-3 flex flex-col">
               <span className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Most Volatile</span>
               {metrics.volatile ? (
                 <div className="flex items-baseline gap-2">
                   <span className="text-[15px] font-bold text-white">{metrics.volatile.symbol}</span>
                 </div>
               ) : <span className="text-[15px] text-text-disabled">-</span>}
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 border-b border-border-subtle flex gap-6 overflow-x-auto shrink-0 no-scrollbar">
          {SECTORS.map(sec => (
             <button 
               key={sec}
               onClick={() => setActiveTab(sec)}
               className={`py-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${activeTab === sec ? 'text-white border-b-2 border-accent' : 'text-text-secondary hover:text-white border-b-2 border-transparent'}`}
             >
               {sec}
             </button>
          ))}
        </div>

        {/* Grid */}
        <div className="p-6 flex-1">
           {loadingStocks && displayItems.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 {[...Array(10)].map((_, i) => (
                   <div key={i} className="h-[120px] bg-surface-elevated rounded-lg animate-pulse border border-border-subtle" />
                 ))}
              </div>
           ) : displayItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-disabled text-sm">
                No data available
              </div>
           ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 {displayItems.map(quote => (
                   <StockCard key={quote.symbol} quote={quote} />
                 ))}
              </div>
           )}
        </div>

      </div>
    </Layout>
  )
}
