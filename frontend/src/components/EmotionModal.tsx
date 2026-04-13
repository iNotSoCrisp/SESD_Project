import { useState, useEffect } from 'react'
import type { Trade, EmotionType, EmotionPhase } from '../types'
import { logEmotion } from '../api/emotions'
import { getEmotions } from '../api/emotions'

const EMOTIONS: EmotionType[] = ['FOMO', 'CONFIDENT', 'FEARFUL', 'GREEDY', 'ANXIOUS', 'NEUTRAL']

interface Props {
  trade: Trade
  onClose: () => void
  onSuccess: () => void
}

export default function EmotionModal({ trade, onClose, onSuccess }: Props) {
  const phase: EmotionPhase = (trade.status === 'OPEN' || trade.status === 'PENDING') ? 'PRE' : 'POST'
  const [selected, setSelected] = useState<EmotionType | null>(null)
  const [intensity, setIntensity] = useState(3)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getEmotions(trade.id).then(res => {
      const existing = phase === 'PRE' ? res.data.data.pre : res.data.data.post
      if (existing) {
        setSelected(existing.emotionType)
        setIntensity(existing.intensity)
        setNotes(existing.notes ?? '')
      }
    }).catch(() => {})
  }, [trade.id, phase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) { setError('Select an emotion'); return }
    setError('')
    setLoading(true)
    try {
      await logEmotion({ tradeId: trade.id, phase, emotionType: selected, intensity, notes: notes || undefined })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log emotion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold">Log {phase} Emotion</h3>
        <p className="text-sm text-gray-400">{trade.symbol} · {trade.direction} · {trade.status}</p>

        <div className="grid grid-cols-3 gap-2">
          {EMOTIONS.map(e => (
            <button
              key={e}
              onClick={() => setSelected(e)}
              className={`py-2 rounded-lg text-sm font-semibold transition-colors ${selected === e ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {e}
            </button>
          ))}
        </div>

        <div>
          <label className="text-sm text-gray-400">Intensity: {intensity}</label>
          <input type="range" min={1} max={5} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-blue-500" />
          <div className="flex justify-between text-xs text-gray-500"><span>1</span><span>5</span></div>
        </div>

        <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)}
          rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
