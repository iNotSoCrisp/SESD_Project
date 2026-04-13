import type { Trade, EmotionLog } from '../types'

interface TradeCardProps {
  trade: Trade
  pnl?: number
  emotions?: { pre: EmotionLog | null; post: EmotionLog | null }
  onClose: (id: string) => void
  onCancel: (id: string) => void
  onLogEmotion: (trade: Trade) => void
}

export default function TradeCard({ trade, pnl, emotions, onClose, onCancel, onLogEmotion }: TradeCardProps) {
  const isLong = trade.direction === 'LONG'
  const statusColor = trade.status === 'OPEN' ? 'bg-green-900 text-green-300'
    : trade.status === 'CLOSED' ? 'bg-gray-700 text-gray-300'
    : trade.status === 'CANCELLED' ? 'bg-red-900 text-red-300'
    : 'bg-yellow-900 text-yellow-300'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{trade.symbol}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isLong ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {trade.direction}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColor}`}>
            {trade.status}
          </span>
        </div>
        <span className="text-gray-400 text-sm">{trade.orderType}</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-300">
        <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
        <span>Qty: {trade.quantity}</span>
        {pnl !== undefined && (
          <span className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            P&L: {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {trade.status === 'OPEN' && (
          <>
            <button onClick={() => onClose(trade.id)} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors">
              Close
            </button>
            <button onClick={() => onLogEmotion(trade)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
              {emotions?.pre ? 'Log POST Emotion' : 'Log PRE Emotion'}
            </button>
          </>
        )}
        {trade.status === 'PENDING' && (
          <>
            <button onClick={() => onCancel(trade.id)} className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={() => onLogEmotion(trade)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
              Log PRE Emotion
            </button>
          </>
        )}
        {trade.status === 'CLOSED' && !emotions?.post && (
          <button onClick={() => onLogEmotion(trade)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
            Log POST Emotion
          </button>
        )}
      </div>
    </div>
  )
}
