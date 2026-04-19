import { useState, useEffect } from 'react'

export default function StatusBar() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  // Simple market hours check (NYSE: Mon-Fri 9:30-16:00 ET)
  const now = new Date()
  const utcH = now.getUTCHours()
  const utcM = now.getUTCMinutes()
  const day = now.getUTCDay()
  const etMinutes = (utcH * 60 + utcM) - 240 // rough ET offset
  const isWeekday = day >= 1 && day <= 5
  const isOpen = isWeekday && etMinutes >= 570 && etMinutes < 960

  return (
    <div className="status-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOpen ? '#26A69A' : '#EF5350' }} />
        <span style={{ color: isOpen ? '#26A69A' : '#EF5350' }}>{isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}</span>
      </div>
      <span>25 STOCKS · 5 CRYPTO</span>
      <span>Last updated {elapsed}s ago</span>
    </div>
  )
}
