import { useState } from 'react'

interface TradeExecutionPanelProps {
  quotePrice: number | null
  currentHoldings: number
  onExecuteTrade: (direction: 'LONG' | 'SHORT', qty: number, type: 'MARKET' | 'LIMIT', limit?: number) => void
  loading: boolean
}

const EMOTIONS = [
  { id: 'Greed', color: 'bg-emo-greed', border: 'border-emo-greed' },
  { id: 'FOMO', color: 'bg-emo-fomo', border: 'border-emo-fomo' },
  { id: 'Fear', color: 'bg-emo-fear', border: 'border-emo-fear' },
  { id: 'Confidence', color: 'bg-emo-conf', border: 'border-emo-conf' },
  { id: 'Uncertain', color: 'bg-emo-uncert', border: 'border-emo-uncert' },
  { id: 'Neutral', color: 'bg-emo-neutral', border: 'border-emo-neutral' }
]

export default function TradeExecutionPanel({ quotePrice, currentHoldings, onExecuteTrade, loading }: TradeExecutionPanelProps) {
  const [qty, setQty] = useState<string>('1')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [limit, setLimit] = useState<string>('')
  const [emotion, setEmotion] = useState<string | null>(null)

  const numQty = parseFloat(qty) || 0
  const actPrice = orderType === 'LIMIT' ? (parseFloat(limit) || 0) : (quotePrice || 0)
  const estCost = numQty * actPrice

  // In a real app we'd pass emotion up to the trade execution payload!
  // Keeping it visual here per spec, tracking it locally.

  const handleBuy = () => onExecuteTrade('LONG', numQty, orderType, parseFloat(limit))
  const handleSell = () => onExecuteTrade('SHORT', numQty, orderType, parseFloat(limit))

  return (
    <div className="h-[200px] border-t border-border-subtle shrink-0 bg-surface flex overflow-hidden">
      
      {/* BUY ZONE (Left) */}
      <div className="flex-1 flex flex-col p-4 relative before:absolute before:inset-0 before:bg-bullish/5 before:pointer-events-none border-r border-border-subtle">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-text-secondary uppercase">Order Details</span>
          <div className="flex bg-base rounded border border-border-subtle p-0.5">
             <button 
               className={`px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors ${orderType === 'MARKET' ? 'bg-surface-elevated text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
               onClick={() => setOrderType('MARKET')}
             >
               Market
             </button>
             <button 
               className={`px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors ${orderType === 'LIMIT' ? 'bg-surface-elevated text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
               onClick={() => setOrderType('LIMIT')}
             >
               Limit
             </button>
          </div>
        </div>

        <div className="flex gap-4 mb-auto relative z-10">
          <div className="flex-1">
            <label className="block text-[11px] text-text-secondary mb-1">Quantity</label>
            <input 
              type="number" 
              value={qty} 
              onChange={e => setQty(e.target.value)} 
              min="0.01" step="0.01"
              className="w-full bg-base border border-border-subtle rounded py-1.5 px-3 text-sm text-white focus:outline-none focus:border-accent font-mono"
            />
          </div>
          {orderType === 'LIMIT' && (
            <div className="flex-1">
              <label className="block text-[11px] text-text-secondary mb-1">Limit Price</label>
              <input 
                type="number" 
                value={limit} 
                onChange={e => setLimit(e.target.value)} 
                className="w-full bg-base border border-border-subtle rounded py-1.5 px-3 text-sm text-white focus:outline-none focus:border-accent font-mono"
                placeholder={quotePrice?.toFixed(2) || '0.00'}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between relative z-10">
           <span className="text-xs text-text-secondary">
             Est. Cost: <span className="text-white font-mono ml-1">${estCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </span>
           <button 
             onClick={handleBuy}
             disabled={loading || !quotePrice || numQty <= 0}
             className="bg-bullish hover:brightness-110 hover:shadow-[0_0_12px_rgba(38,166,154,0.3)] disabled:opacity-50 disabled:shadow-none text-black font-bold text-[13px] px-8 py-2 rounded transition-all"
           >
             BUY
           </button>
        </div>
      </div>

      {/* EMOTION CENTER STRIP */}
      <div className="flex flex-col items-center justify-center px-6 border-r border-border-subtle bg-base w-[280px]">
        <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.1em] mb-4 text-center">
          How are you feeling<br/>right now?
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {EMOTIONS.map(e => (
            <button
              key={e.id}
              onClick={() => setEmotion(e.id)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-[4px] border border-transparent transition-all hover:brightness-125 ${emotion === e.id ? `ring-2 ring-offset-2 ring-offset-base ${e.border} text-white ${e.color}` : `bg-surface-elevated text-text-secondary border-border-subtle`}`}
            >
              {e.id}
            </button>
          ))}
        </div>
      </div>

      {/* SELL ZONE (Right) */}
      <div className="flex-1 flex flex-col p-4 relative before:absolute before:inset-0 before:bg-bearish/5 before:pointer-events-none">
         <div className="flex justify-between items-center mb-4 relative z-10">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-text-secondary uppercase">Close Position</span>
        </div>

        <div className="mb-auto relative z-10 flex">
           <div className="bg-base border border-border-subtle rounded flex flex-col items-center justify-center px-6 py-2 flex-1">
             <span className="text-xs text-text-secondary mb-1">You hold</span>
             <span className="font-mono text-xl text-white font-bold">{currentHoldings}</span>
           </div>
        </div>

        <div className="mt-4 flex items-center justify-between relative z-10">
           <span className="text-xs text-text-secondary">
             Est. Return: <span className="text-white font-mono ml-1">${(actPrice * (currentHoldings || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </span>
           <button 
             onClick={handleSell}
             disabled={loading || !quotePrice || currentHoldings <= 0}
             className="bg-bearish hover:brightness-110 hover:shadow-[0_0_12px_rgba(239,83,80,0.3)] disabled:opacity-50 disabled:shadow-none text-white font-bold text-[13px] px-8 py-2 rounded transition-all"
           >
             SELL
           </button>
        </div>
      </div>

    </div>
  )
}
