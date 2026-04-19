import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'buy' | 'sell'
  onDone: () => void
}

export default function TradeToast({ message, type, onDone }: ToastProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2700)
    const t2 = setTimeout(onDone, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: '#1C2030',
        borderLeft: `3px solid ${type === 'buy' ? '#26A69A' : '#EF5350'}`,
        borderRadius: 6,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: 360,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: type === 'buy' ? '#26A69A' : '#EF5350',
      }} />
      <span style={{ fontSize: 13, color: '#D1D4DC', fontFamily: 'Inter, sans-serif' }}>
        {message}
      </span>
    </div>
  )
}
