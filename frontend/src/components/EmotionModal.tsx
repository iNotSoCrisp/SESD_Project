import { useState, useEffect } from 'react'
import type { Trade, EmotionType, EmotionPhase } from '../types'
import { logEmotion } from '../api/emotions'
import { getEmotions } from '../api/emotions'

const POSITIVE_EMOTIONS: EmotionType[] = ['CONFIDENT', 'NEUTRAL']
const NEGATIVE_EMOTIONS: EmotionType[] = ['FOMO', 'GREEDY', 'FEARFUL', 'ANXIOUS']
const ALL_EMOTIONS: EmotionType[] = [...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS]

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="text-lg font-bold text-white">Log {phase} Emotion</h3>
          <p className="text-sm text-[#9ca3af] mt-1">{trade.symbol} · {trade.direction} · {trade.status}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ALL_EMOTIONS.map(e => {
            const isSelected = selected === e
            const isPos = POSITIVE_EMOTIONS.includes(e)
            return (
              <button
                key={e}
                onClick={() => setSelected(e)}
                className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  isSelected
                    ? isPos
                      ? 'bg-[#10b981]/20 border-[#10b981] text-[#34d399]'
                      : 'bg-[#ef4444]/20 border-[#ef4444] text-[#f87171]'
                    : 'bg-[#1f2937] border-[#374151] text-[#9ca3af] hover:bg-[#374151]'
                }`}
              >
                {e}
              </button>
            )
          })}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#6b7280] uppercase tracking-wider">Intensity</label>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${intensity >= 4 ? 'bg-[#ef4444]/20 text-[#f87171]' : intensity <= 2 ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-[#374151] text-[#9ca3af]'}`}>
              {intensity}
            </span>
          </div>
          <input type="range" min={1} max={5} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-[#10b981]" />
          <div className="flex justify-between text-[10px] text-[#4b5563] mt-0.5"><span>Low</span><span>High</span></div>
        </div>

        <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)}
          rows={2} className="w-full px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#6b7280] text-sm focus:outline-none focus:border-[#10b981] resize-none" />

        {error && <p className="text-[#f87171] text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#1f2937] hover:bg-[#374151] rounded-lg text-[#9ca3af] transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-[#10b981] hover:bg-[#34d399] disabled:opacity-50 rounded-lg font-medium text-black transition-colors">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
