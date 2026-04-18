import { TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { QuoteExtended } from '../services/finnhub'

interface StockCardProps {
  quote: QuoteExtended
  isSelected?: boolean
}

export default function StockCard({ quote, isSelected }: StockCardProps) {
  const navigate = useNavigate()
  const isPositive = quote.change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  // Calculate position of current price within High/Low range
  const range = quote.high - quote.low
  const position = range === 0 ? 50 : ((quote.currentPrice - quote.low) / range) * 100

  // Optional: clamp position between 0 and 100 to be safe
  const fillPos = Math.max(0, Math.min(100, position))

  return (
    <div 
      onClick={() => navigate(`/stock/${quote.symbol}`)}
      className={`relative p-4 rounded-lg border transition-all cursor-pointer group flex flex-col justify-between 
        ${isSelected ? 'bg-surface-elevated border-accent shadow-accent-glow' : 'bg-surface border-border-subtle hover:bg-surface-elevated hover:border-border-active'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
         <div>
            <h3 className="text-xl font-mono font-bold text-white tracking-tight">{quote.symbol}</h3>
            <span className="text-xs text-text-secondary truncate block max-w-[120px]">{quote.name || quote.ticker}</span>
         </div>
         <TrendIcon className={`w-5 h-5 ${isPositive ? 'text-bullish' : 'text-bearish'}`} />
      </div>

      <div>
         <div className="flex items-baseline gap-2 mb-1">
           <span className="text-xl font-mono font-bold text-white">${quote.currentPrice.toFixed(2)}</span>
         </div>
         <span className={`text-xs font-mono font-medium block ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
           {isPositive ? '+' : ''}${quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
         </span>
      </div>

      <div className="mt-4">
         <div className="flex justify-between text-[10px] text-text-disabled font-mono mb-1">
            <span>{quote.low.toFixed(2)}</span>
            <span>{quote.high.toFixed(2)}</span>
         </div>
         <div className="relative h-1 bg-border-subtle rounded-full w-full">
            <div 
              className={`absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r ${isPositive ? 'from-bullish/20 to-bullish' : 'from-bearish/20 to-bearish'}`} 
              style={{ width: `${fillPos}%` }}
            />
            {/* Market current explicit dot marker */}
            <div 
               className="absolute top-1/2 -mt-1 w-2 h-2 bg-white rounded-full shadow border border-base"
               style={{ left: `calc(${fillPos}% - 4px)` }}
            />
         </div>
      </div>
    </div>
  )
}
