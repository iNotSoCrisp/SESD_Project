import React from 'react'
import Sidebar from './Sidebar'
import type { TradingAccount } from '../types'

interface LayoutProps {
  children: React.ReactNode
  accounts?: TradingAccount[]
  selectedAccountId?: string | null
}

export default function Layout({ children, accounts = [], selectedAccountId }: LayoutProps) {
  return (
    <div className="min-h-screen bg-base text-text-primary font-inter flex flex-col md:flex-row overflow-hidden h-screen">
      <Sidebar accounts={accounts} selectedAccountId={selectedAccountId} />
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  )
}
