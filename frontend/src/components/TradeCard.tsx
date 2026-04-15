import { useState, useEffect } from 'react'
import type { Trade, EmotionLog, MarketQuote } from '../types'
import { getPrice } from '../api/market'

interface TradeCardProps {
  trade: Trade
  pnl?: { pnl: number; pnlPercent: number }
  emotions?: { pre: EmotionLog | null; post: EmotionLog | null }
  onClose: (id: string) => void
  onCancel: (id: string) => void
  onLogEmotion: (trade: Trade) => void
}

export default function TradeCard({ trade, pnl, emotions, onClose, onCancel, onLogEmotion }: TradeCardProps) {
  const isLong = trade.direction === 'LONG'
  const [quote, setQuote] = useState<MarketQuote | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  useEffect(() => {
    if (trade.status !== 'OPEN') return
    setLoadingPrice(true)
    getPrice(trade.symbol).then(res => setQuote(res.data.data)).catch(() => {}).finally(() => setLoadingPrice(false))
    const interval = setInterval(() => {
      getPrice(trade.symbol).then(res => setQuote(res.data.data)).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [trade.symbol, trade.status])

  const unrealizedPnl = quote
    ? isLong
      ? (quote.price - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - quote.price) * trade.quantity
    : 0
  const unrealizedPnlPct = quote && trade.entryPrice > 0
    ? ((unrealizedPnl / (trade.entryPrice * trade.quantity)) * 100)
    : 0

  const statusColor = trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400'
    : trade.status === 'CLOSED' ? 'bg-[#374151] text-[#9ca3af]'
    : trade.status === 'CANCELLED' ? 'bg-[#374151] text-[#6b7280]'
    : 'bg-yellow-500/20 text-yellow-400'

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-white tracking-wide">{trade.symbol}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${isLong ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-[#ef4444]/20 text-[#f87171]'}`}>
            {trade.direction}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${statusColor}`}>
            {trade.status}
          </span>
        </div>
        <span className="text-[#6b7280] text-xs font-mono">{trade.orderType}</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-[#9ca3af] font-mono mb-3">
        <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
        <span>Qty: {trade.quantity}</span>
        {quote && (
          <span className="text-[#34d399]">
            Now: ${quote.price.toFixed(2)}
          </span>
        )}
      </div>

      {/* P&L Display */}
      {trade.status === 'OPEN' && quote && (
        <div className={`mb-3 p-2 rounded bg-[#1f2937] ${unrealizedPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
          <span className="text-sm font-mono font-semibold">
            Unrealized P&L: {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} ({unrealizedPnlPct >= 0 ? '+' : ''}{unrealizedPnlPct.toFixed(2)}%)
          </span>
          {loadingPrice && <span className="ml-2 text-xs text-[#6b7280]">refreshing...</span>}
        </div>
      )}

      {trade.status === 'CLOSED' && pnl !== undefined && (
        <div className={`mb-3 p-2 rounded bg-[#1f2937] ${pnl.pnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
          <span className="text-sm font-mono font-semibold">
            Realized P&L: {pnl.pnl >= 0 ? '+' : ''}${pnl.pnl.toFixed(2)}
            {' '}({pnl.pnlPercent >= 0 ? '+' : ''}{pnl.pnlPercent.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        {trade.status === 'OPEN' && (
          <>
            <button onClick={() => onClose(trade.id)} className="text-xs px-3 py-1.5 rounded-lg border border-[#059669] text-[#34d399] hover:bg-[#10b981]/10 transition-colors">
              Close
            </button>
            <button onClick={() => onLogEmotion(trade)} className="text-xs px-3 py-1.5 rounded-lg border border-[#9333ea] text-[#c084fc] hover:bg-[#9333ea]/10 transition-colors">
              {emotions?.pre ? 'Log POST Emotion' : 'Log PRE Emotion'}
            </button>
          </>
        )}
        {trade.status === 'PENDING' && (
          <>
            <button onClick={() => onCancel(trade.id)} className="text-xs px-3 py-1.5 rounded-lg border border-[#4b5563] text-[#9ca3af] hover:bg-[#1f2937] transition-colors">
              Cancel
            </button>
            <button onClick={() => onLogEmotion(trade)} className="text-xs px-3 py-1.5 rounded-lg border border-[#9333ea] text-[#c084fc] hover:bg-[#9333ea]/10 transition-colors">
              Log PRE Emotion
            </button>
          </>
        )}
        {trade.status === 'CLOSED' && !emotions?.post && (
          <button onClick={() => onLogEmotion(trade)} className="text-xs px-3 py-1.5 rounded-lg border border-[#9333ea] text-[#c084fc] hover:bg-[#9333ea]/10 transition-colors">
            Log POST Emotion
          </button>
        )}
      </div>
    </div>
  )
}
