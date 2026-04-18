import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/accounts'
import { getTrades, openTrade, closeTrade } from '../api/trades'
import { getQuote, QuoteExtended } from '../services/finnhub'
import type { TradingAccount, Trade } from '../types'

import Layout from '../components/Layout'
import TradeChart from '../components/TradeChart'
import EmotionSelector from '../components/EmotionSelector'
import RightSidebar from '../components/RightSidebar'

export default function StockDetail() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Data State
  const [quote, setQuote] = useState<QuoteExtended | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Terminal Logic
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  
  // Trade Forms
  const [qty, setQty] = useState('1')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [limit, setLimit] = useState('')
  const [emotion, setEmotion] = useState<string | null>(null)
  const [tradeLoading, setTradeLoading] = useState(false)

  // Load backend basics
  useEffect(() => {
    if (!user) return
    getAccounts().then(res => {
      setAccounts(res.data.data)
      if (res.data.data.length > 0) setSelectedAccountId(res.data.data[0].id)
    }).catch(console.warn)
  }, [user])

  useEffect(() => {
    if (!user || !selectedAccountId) return
    getTrades(selectedAccountId).then(res => setTrades(res.data.data)).catch(console.warn)
  }, [selectedAccountId, user])

  // Polling Quote every 15 seconds
  useEffect(() => {
    let active = true
    let intv: number

    const fetchQuote = async () => {
      if (!symbol) return
      try {
        const q = await getQuote(symbol)
        if (active) {
          setQuote({
            symbol,
            price: q.c, currentPrice: q.c, 
            high: q.h, low: q.l, open: q.o, change: q.c - q.pc,
            changePercent: q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0,
            timestamp: new Date().toISOString(), bidPrice: 0, askPrice: 0, volume: 0
          })
          setLoading(false)
        }
      } catch (e) {
        if (active) setLoading(false)
      }
    }

    fetchQuote()
    intv = window.setInterval(fetchQuote, 15000)
    return () => { active = false; clearInterval(intv) }
  }, [symbol])

  // Derived state
  const isPositive = quote ? quote.change >= 0 : true
  const numQty = parseFloat(qty) || 0
  const actPrice = orderType === 'LIMIT' ? (parseFloat(limit) || 0) : (quote?.currentPrice || 0)
  const estCost = numQty * actPrice

  // Right sidebar metrics
  const activeAccount = accounts.find(a => a.id === selectedAccountId)
  const holdings = trades.filter(t => t.status === 'OPEN').map(t => ({
    symbol: t.symbol, shares: t.quantity, avgPrice: t.entryPrice,
    current: quote && quote.symbol === t.symbol ? quote.currentPrice : t.entryPrice,
    pnl: quote && quote.symbol === t.symbol ? (quote.currentPrice - t.entryPrice) * t.quantity * (t.direction === 'LONG' ? 1 : -1) : 0
  }))
  const currentHoldings = holdings.find(h => h.symbol === symbol)?.shares || 0

  const handleExecuteTrade = async (direction: 'LONG' | 'SHORT') => {
    if (!selectedAccountId || !quote || numQty <= 0) return
    setTradeLoading(true)
    
    try {
       if (direction === 'SHORT' && currentHoldings > 0) {
          const openEntry = trades.find(t => t.status === 'OPEN' && t.symbol === symbol)
          if (openEntry) await closeTrade(openEntry.id)
       } else if (direction === 'LONG') {
          const payload: any = { accountId: selectedAccountId, symbol: quote.symbol, direction, orderType, quantity: numQty, emotion }
          if (orderType === 'LIMIT') payload.limitPrice = parseFloat(limit)
          await openTrade(payload)
       }
       // Quick refresh
       const th = await getTrades(selectedAccountId)
       setTrades(th.data.data)
    } catch {
       alert('Trade configuration error.')
    } finally {
       setTradeLoading(false)
    }
  }

  // Calculate visual marker
  const barRange = quote ? quote.high - quote.low : 0
  const markerPos = quote && barRange > 0 ? ((quote.currentPrice - quote.low) / barRange) * 100 : 50

  return (
    <Layout accounts={accounts} selectedAccountId={selectedAccountId}>
       <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle bg-base">
         
         {/* TOP BAR */}
         <div className="h-16 border-b border-border-subtle flex items-center px-4 shrink-0 justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 text-text-secondary hover:text-white rounded-md hover:bg-surface transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-lg font-mono font-bold text-white tracking-tight">{symbol?.toUpperCase()}</h1>
                   <button className="text-text-disabled hover:text-accent disabled:opacity-50"><Star className="w-4 h-4" /></button>
                 </div>
              </div>
            </div>
            
            {quote && (
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                   <span className="text-2xl font-mono font-bold tracking-tighter text-white">${quote.currentPrice.toFixed(2)}</span>
                </div>
                <div className={`flex items-center gap-1 font-semibold text-xs px-2 py-1 rounded border ${isPositive ? 'bg-bullish/10 text-bullish border-bullish/20' : 'bg-bearish/10 text-bearish border-bearish/20'}`}>
                   {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                   <span className="font-mono">{quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            )}
         </div>

         {/* STATS ROW */}
         {quote && (
           <div className="p-4 bg-surface flex flex-col shrink-0 gap-4 border-b border-border-subtle">
             <div className="flex gap-4">
                {[
                  { l: "TODAY'S HIGH", v: quote.high },
                  { l: "TODAY'S LOW", v: quote.low },
                  { l: "OPEN", v: quote.open },
                  { l: "PREV. CLOSE", v: quote.currentPrice - quote.change } // fallback calc
                ].map(s => (
                  <div key={s.l} className="flex-1 bg-surface-elevated rounded border border-border-subtle p-3 flex flex-col items-center">
                    <span className="text-[11px] text-text-secondary uppercase tracking-[0.1em] mb-1">{s.l}</span>
                    <span className="text-sm font-mono font-bold text-white">${s.v.toFixed(2)}</span>
                  </div>
                ))}
             </div>
             
             {/* High / Low Visualizer */}
             <div className="flex items-center gap-3 w-full px-2">
                <span className="text-xs font-mono text-text-secondary w-16 text-right">${quote.low.toFixed(2)}</span>
                <div className="flex-1 relative h-2 rounded-full overflow-hidden shrink-0" style={{ background: 'linear-gradient(to right, #EF5350, #26A69A)' }}>
                   <div 
                     className="absolute top-0 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_black] border-2 border-base -mt-0.5"
                     style={{ left: `calc(${markerPos}% - 6px)` }}
                   />
                </div>
                <span className="text-xs font-mono text-text-secondary w-16">${quote.high.toFixed(2)}</span>
             </div>
           </div>
         )}
         
         {/* CHART AREA */}
         <div className="flex-1 relative min-h-[300px]">
            {symbol ? <TradeChart symbol={symbol} /> : null}
         </div>

         {/* EXECUTION PANEL */}
         <div className="h-[200px] border-t border-border-subtle shrink-0 bg-surface flex overflow-hidden">
            {/* BUY ZONE */}
            <div className="flex-1 flex flex-col p-4 relative before:absolute before:inset-0 before:bg-bullish/5 before:pointer-events-none border-r border-border-subtle">
               <div className="flex justify-between items-center mb-4 relative z-10">
                 <span className="text-[11px] font-semibold tracking-[0.1em] text-text-secondary uppercase">Order Details</span>
                 <div className="flex bg-base rounded border border-border-subtle p-0.5">
                   <button onClick={() => setOrderType('MARKET')} className={`px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors ${orderType === 'MARKET' ? 'bg-surface-elevated text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>Market</button>
                   <button onClick={() => setOrderType('LIMIT')} className={`px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors ${orderType === 'LIMIT' ? 'bg-surface-elevated text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>Limit</button>
                 </div>
               </div>

               <div className="flex gap-4 mb-auto relative z-10">
                 <div className="flex-1">
                   <label className="block text-[11px] text-text-secondary mb-1">Quantity</label>
                   <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="0.01" step="0.01" className="w-full bg-base border border-border-subtle rounded py-1.5 px-3 text-sm text-white focus:outline-none focus:border-accent font-mono" />
                 </div>
                 {orderType === 'LIMIT' && (
                   <div className="flex-1">
                     <label className="block text-[11px] text-text-secondary mb-1">Limit Price</label>
                     <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className="w-full bg-base border border-border-subtle rounded py-1.5 px-3 text-sm text-white focus:outline-none focus:border-accent font-mono" placeholder={quote?.currentPrice.toFixed(2) || '0.00'} />
                   </div>
                 )}
               </div>

               <div className="mt-4 flex items-center justify-between relative z-10">
                 <span className="text-xs text-text-secondary">Est. Cost: <span className="text-white font-mono ml-1">${estCost.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span></span>
                 <button disabled={tradeLoading || !quote || numQty <= 0} onClick={() => handleExecuteTrade('LONG')} className="bg-bullish hover:brightness-110 disabled:opacity-50 text-black font-bold text-[13px] px-8 py-2 rounded transition-all">BUY</button>
               </div>
            </div>

            <EmotionSelector selectedEmotion={emotion} onSelect={setEmotion} />

            {/* SELL ZONE */}
            <div className="flex-1 flex flex-col p-4 relative before:absolute before:inset-0 before:bg-bearish/5 before:pointer-events-none">
               <div className="flex justify-between items-center mb-4 relative z-10">
                 <span className="text-[11px] font-semibold tracking-[0.1em] text-text-secondary uppercase">Close Position</span>
               </div>
               
               <div className="mb-auto relative z-10 flex">
                 <div className="bg-base border border-border-subtle rounded flex flex-col items-center justify-center px-6 py-2 flex-1">
                   <span className="text-xs text-text-secondary mb-1">You hold</span>
                   <span className="font-mono text-xl text-white font-bold">{currentHoldings}</span>
                 </div>
               </div>

               <div className="mt-4 flex items-center justify-between relative z-10">
                 <span className="text-xs text-text-secondary">Est. Return: <span className="text-white font-mono ml-1">${(actPrice * currentHoldings).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span></span>
                 <button disabled={tradeLoading || !quote || currentHoldings <= 0} onClick={() => handleExecuteTrade('SHORT')} className="bg-bearish hover:brightness-110 disabled:opacity-50 text-white font-bold text-[13px] px-8 py-2 rounded transition-all">SELL</button>
               </div>
            </div>
         </div>
       </div>

       {/* RIGHT SIDEBAR */}
       {user && (
         <RightSidebar 
            totalValue={activeAccount?.balance || 0}
            pnlTotal={trades.reduce((sum, t) => sum + (t.position?.realizedPnl || 0), 0)}
            winRate={trades.length > 0 ? Math.round((trades.filter(t => (t.position?.realizedPnl||0)>0).length / trades.filter(t => t.status === 'CLOSED').length) * 100) : 0}
            holdings={holdings}
            recentTrades={trades.filter(t => t.status === 'CLOSED').slice(0,5).map(t => ({
              id: t.id, symbol: t.symbol, emotionTag: 'Neutral', pnl: t.position?.realizedPnl || 0
            }))}
         />
       )}
    </Layout>
  )
}
