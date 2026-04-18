interface EmotionSelectorProps {
  selectedEmotion: string | null
  onSelect: (emotion: string) => void
}

export const EMOTIONS = [
  { id: 'Greed', color: 'bg-emo-greed', border: 'border-emo-greed' },
  { id: 'FOMO', color: 'bg-emo-fomo', border: 'border-emo-fomo' },
  { id: 'Fear', color: 'bg-emo-fear', border: 'border-emo-fear' },
  { id: 'Confidence', color: 'bg-emo-conf', border: 'border-emo-conf' },
  { id: 'Uncertainty', color: 'bg-emo-uncert', border: 'border-emo-uncert' },
  { id: 'Neutral', color: 'bg-emo-neutral', border: 'border-emo-neutral' }
]

export default function EmotionSelector({ selectedEmotion, onSelect }: EmotionSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 border-r border-border-subtle bg-base w-[280px]">
      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.1em] mb-4 text-center">
        How are you feeling<br/>right now?
      </label>
      <div className="flex flex-wrap justify-center gap-2">
        {EMOTIONS.map(e => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={`px-3 py-1 text-[11px] font-semibold rounded-[4px] border border-transparent transition-all hover:brightness-125 ${
              selectedEmotion === e.id 
                ? `ring-2 ring-offset-2 ring-offset-base ${e.border} text-white ${e.color}` 
                : `bg-surface-elevated text-text-secondary border-border-subtle`
            }`}
          >
            {e.id}
          </button>
        ))}
      </div>
    </div>
  )
}
