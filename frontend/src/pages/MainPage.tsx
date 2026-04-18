import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/accounts'
import { getTrades, openTrade, closeTrade } from '../api/trades'
import { getEmotions } from '../api/emotions'
import { getPrice } from '../api/market'
import type { Trade, TradingAccount, MarketQuote, EmotionLog } from '../types'

import Layout from '../components/Layout'
import ChartArea from '../components/ChartArea'
import TradeExecutionPanel from '../components/TradeExecutionPanel'
import RightSidebar from '../components/RightSidebar'

export default function MainPage() {
  const { user } = useAuth()
  
  // App State
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradeEmotions, setTradeEmotions] = useState<Record<string, { pre: EmotionLog | null; post: EmotionLog | null }>>({})

  // Terminal State
  const [symbol, setSymbol] = useState('')
  const [quote, setQuote] = useState<MarketQuote | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [tradeLoading, setTradeLoading] = useState(false)

  // Initialization
  const loadAccounts = useCallback(async () => {
    if (!user) return
    try {
      const res = await getAccounts()
      setAccounts(res.data.data)
      if (res.data.data.length > 0 && !selectedAccountId) setSelectedAccountId(res.data.data[0].id)
    } catch {}
  }, [selectedAccountId, user])

  const loadTrades = useCallback(async () => {
    if (!user || !selectedAccountId) return
    try {
      const res = await getTrades(selectedAccountId)
      const loaded = res.data.data as Trade[]
      setTrades(loaded)

      const emotions: Record<string, { pre: EmotionLog | null; post: EmotionLog | null }> = {}
      for (const t of loaded) {
        if (t.status === 'CLOSED') {
          try {
            const emRes = await getEmotions(t.id)
            emotions[t.id] = emRes.data.data
          } catch { emotions[t.id] = { pre: null, post: null } }
        }
      }
      setTradeEmotions(emotions)
    } catch {}
  }, [selectedAccountId, user])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => { loadTrades() }, [loadTrades])

  // Handlers
  const handleFetchPrice = async () => {
    if (!symbol) return
    setPriceLoading(true)
    setPriceError('')
    try {
      const res = await getPrice(symbol)
      setQuote(res.data.data)
    } catch { 
      setQuote(null)
      setPriceError('Symbol not found') 
    } finally { 
      setPriceLoading(false) 
    }
  }

  const handleExecuteTrade = async (direction: 'LONG' | 'SHORT', qty: number, type: 'MARKET' | 'LIMIT', limitPrice?: number) => {
    if (!selectedAccountId || !symbol || !quote) return
    setTradeLoading(true)
    
    // Close Position Logic (Sell if we hold LONG)
    if (direction === 'SHORT' && currentHoldings > 0) {
      const openPositionTrade = trades.find(t => (t.status === 'OPEN' || t.status === 'PENDING') && t.symbol === quote.symbol)
      if (openPositionTrade) {
         try {
           await closeTrade(openPositionTrade.id)
           await loadAccounts()
           await loadTrades()
         } catch { alert('Failed to close position') }
      }
    } else if (direction === 'LONG') {
      // Open Position Logic
      try {
        const payload: any = { accountId: selectedAccountId, symbol: quote.symbol, direction, orderType: type, quantity: qty }
        if (type === 'LIMIT' && limitPrice) payload.limitPrice = limitPrice
        await openTrade(payload)
        await loadAccounts()
        await loadTrades()
      } catch { alert('Failed to execute trade') } 
    }
    setTradeLoading(false)
  }

  // Derived State for UI Panels
  const activeAccount = accounts.find(a => a.id === selectedAccountId)
  const totalValue = activeAccount?.balance || 0

  const pnlTotal = useMemo(() => {
    return trades.reduce((acc, t) => acc + (t.position?.realizedPnl || 0), 0)
  }, [trades])

  const winRate = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED')
    if (closed.length === 0) return 0
    const winners = closed.filter(t => (t.position?.realizedPnl || 0) > 0).length
    return Math.round((winners / closed.length) * 100)
  }, [trades])

  const holdings = useMemo(() => {
    return trades.filter(t => t.status === 'OPEN' || t.status === 'PENDING').map(t => ({
      symbol: t.symbol,
      shares: t.quantity,
      avgPrice: t.entryPrice || 0,
      current: quote && quote.symbol === t.symbol ? quote.currentPrice : (t.entryPrice || 0),
      pnl: quote && quote.symbol === t.symbol ? (quote.currentPrice - (t.entryPrice||0)) * t.quantity * (t.direction === 'LONG' ? 1 : -1) : 0
    }))
  }, [trades, quote])

  const recentHistory = useMemo(() => {
    return trades.filter(t => t.status === 'CLOSED').slice(0, 7).map(t => ({
      id: t.id,
      symbol: t.symbol,
      emotionTag: tradeEmotions[t.id]?.post?.emotionType || tradeEmotions[t.id]?.pre?.emotionType || 'Neutral',
      pnl: t.position?.realizedPnl || 0
    }))
  }, [trades, tradeEmotions])
  
  const currentHoldings = useMemo(() => {
    return holdings.find(h => h.symbol === quote?.symbol)?.shares || 0
  }, [holdings, quote])

  return (
    <Layout accounts={accounts} selectedAccountId={selectedAccountId}>
      
      {/* Center Panel (Chart + Trading Options) */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChartArea 
          symbol={symbol}
          onSymbolChange={setSymbol}
          onSearch={handleFetchPrice}
          loading={priceLoading}
          quote={quote}
          error={priceError}
        />
        <TradeExecutionPanel 
          quotePrice={quote?.currentPrice || null}
          currentHoldings={currentHoldings}
          onExecuteTrade={handleExecuteTrade}
          loading={tradeLoading}
        />
      </div>

      {/* Right Sidebar (Portfolio) */}
      {user && (
        <RightSidebar 
          totalValue={totalValue}
          pnlTotal={pnlTotal}
          winRate={winRate}
          holdings={holdings}
          recentTrades={recentHistory}
        />
      )}
      
    </Layout>
  )
}
