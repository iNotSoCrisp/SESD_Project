import { Search, Info, Activity } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { MarketQuote } from '../types'

interface ChartAreaProps {
  symbol: string
  onSymbolChange: (sym: string) => void
  onSearch: () => void
  loading: boolean
  quote: MarketQuote | null
  error: string
}

const DUMMY_CHART_DATA = [
  { time: '09:30', price: 185.50 },
  { time: '10:00', price: 186.20 },
  { time: '10:30', price: 185.80 },
  { time: '11:00', price: 187.10 },
  { time: '11:30', price: 188.05 },
  { time: '12:00', price: 187.90 },
  { time: '12:30', price: 189.10 },
  { time: '13:00', price: 189.42 },
]

export default function ChartArea({ symbol, onSymbolChange, onSearch, loading, quote, error }: ChartAreaProps) {
  
  // Handlers for search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch()
  }

  const isBullish = quote && quote.change >= 0

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-base border-r border-border-subtle h-full">
      
      {/* Top Bar (Search + Quote) */}
      <div className="h-14 flex items-center px-4 gap-4 border-b border-border-subtle shrink-0">
        
        {/* Search Input */}
        <div className="relative flex items-center w-64">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search stocks, crypto..." 
            className="w-full bg-surface border border-border-subtle rounded text-[13px] text-text-primary pl-9 pr-3 py-1.5 focus:outline-none focus:border-accent focus:shadow-accent-glow uppercase placeholder:normal-case transition-colors"
            value={symbol}
            onChange={e => onSymbolChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Action / Load State */}
        <button 
          onClick={onSearch}
          disabled={loading || !symbol}
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-white disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading...' : 'Quote'}
        </button>

        {/* Current Quote Badge */}
        {error && <span className="text-[13px] text-bearish ml-auto">{error}</span>}
        {quote && !error && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[13px] font-semibold text-text-primary px-2 py-0.5 bg-surface rounded border border-border-subtle">
              {quote.symbol.toUpperCase()}
            </span>
            <div className={`flex items-baseline gap-2 ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
              <span className="text-xl font-mono font-bold tracking-tighter">${quote.currentPrice.toFixed(2)}</span>
              <span className="text-xs font-mono font-medium">
                {isBullish ? '▲' : '▼'} {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 flex flex-col p-4 relative">
        
        {/* Timeframe & Chart Type Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
              <button 
                key={tf}
                className={`text-[12px] font-medium px-2 py-1 rounded transition-colors ${tf === '1D' ? 'text-accent bg-accent-glow' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary hover:text-white flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Line
            </button>
          </div>
        </div>

        {/* Actual Chart Visuals */}
        <div className="flex-1 relative bg-surface border border-border-subtle rounded overflow-hidden p-2">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={quote ? [...DUMMY_CHART_DATA.slice(0,-1), { time: 'Now', price: quote.currentPrice }] : DUMMY_CHART_DATA}>
               <defs>
                 <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={quote ? (isBullish ? 'var(--color-bullish)' : 'var(--color-bearish)') : 'var(--color-accent)'} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={quote ? (isBullish ? 'var(--color-bullish)' : 'var(--color-bearish)') : 'var(--color-accent)'} stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
               <XAxis 
                 dataKey="time" 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                 dy={10}
               />
               <YAxis 
                 domain={['dataMin - 1', 'dataMax + 1']} 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                 orientation="right"
                 dx={10}
                 tickFormatter={(v) => v.toFixed(2)}
               />
               <Tooltip 
                 contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                 itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                 labelStyle={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginBottom: '4px' }}
               />
               <Area 
                 type="monotone" 
                 dataKey="price" 
                 stroke={quote ? (isBullish ? 'var(--color-bullish)' : 'var(--color-bearish)') : 'var(--color-accent)'} 
                 strokeWidth={2}
                 fillOpacity={1} 
                 fill="url(#colorPrice)" 
               />
             </AreaChart>
           </ResponsiveContainer>

           {/* Live Price Tag on Y-Axis representation */}
           {quote && (
              <div 
                className={`absolute right-0 translate-x-[2px] z-10 text-[10px] font-mono font-bold text-white px-1 py-0.5 rounded-l ${isBullish ? 'bg-bullish' : 'bg-bearish'}`}
                style={{ top: '50%' }} // Simulated position for visual cue
              >
                {quote.currentPrice.toFixed(2)}
              </div>
           )}
           
           {/* Placeholder Overlay if no quote */}
           {!quote && !loading && (
             <div className="absolute inset-0 bg-surface/80 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
               <div className="flex flex-col items-center gap-2 text-text-secondary">
                 <Info className="w-6 h-6 opacity-50" />
                 <p className="text-sm">Search for a symbol to load chart.</p>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
