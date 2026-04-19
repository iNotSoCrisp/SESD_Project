import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TickerTape from './TickerTape'
import StatusBar from './StatusBar'
import type { TradingAccount } from '../types'
import type { QuoteExtended } from '../services/finnhub'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  accounts?: TradingAccount[]
  selectedAccountId?: string | null
  quotes?: QuoteExtended[]
}

export default function Layout({ children, title = 'ShadowTrade', accounts = [], selectedAccountId, quotes = [] }: LayoutProps) {
  return (
    <>
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      <div style={{ height: '100vh', background: '#0B0D13', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Ticker Tape — above everything */}
        <TickerTape />
        
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <Sidebar accounts={accounts} selectedAccountId={selectedAccountId} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <TopBar title={title} quotes={quotes} />
            <StatusBar />
            <main style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }} className="page-enter">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
