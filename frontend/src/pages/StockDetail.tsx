import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/accounts'
import { getTrades, openTrade } from '../api/trades'
import { getQuote } from '../services/finnhub'
import type { QuoteExtended } from '../services/finnhub'
import type { TradingAccount, Trade } from '../types'

import Layout from '../components/Layout'
import TradeChart from '../components/TradeChart'
import EmotionSelector from '../components/EmotionSelector'
import RightSidebar from '../components/RightSidebar'
import TradeToast from '../components/TradeToast'

export default function StockDetail() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Data State
  const [quote, setQuote] = useState<QuoteExtended | null>(null)
  
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
  const [buyError, setBuyError] = useState<string | null>(null)
  const [sellError, setSellError] = useState<string | null>(null)
  const [emotionError, setEmotionError] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'buy' | 'sell' } | null>(null)

  // Price flash
  const prevPrice = useRef<number>(0)
  const [priceFlash, setPriceFlash] = useState('')

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
    setQuote(null)
    setTradeLoading(false)
    
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
        }
      } catch (_e) {
        // silently ignore
      }
    }

    fetchQuote()
    intv = window.setInterval(fetchQuote, 15000)
    return () => { active = false; clearInterval(intv) }
  }, [symbol])

  // Price flash effect
  useEffect(() => {
    if (!quote) return
    if (prevPrice.current !== 0 && quote.currentPrice !== prevPrice.current) {
      setPriceFlash(quote.currentPrice > prevPrice.current ? 'price-flash-up' : 'price-flash-down')
      const t = setTimeout(() => setPriceFlash(''), 650)
      prevPrice.current = quote.currentPrice
      return () => clearTimeout(t)
    }
    prevPrice.current = quote.currentPrice
  }, [quote?.currentPrice])

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

  const handleBuy = async () => {
    setBuyError(null); setEmotionError(false)
    if (!selectedAccountId || !quote) return
    if (numQty <= 0 || isNaN(numQty)) { setBuyError('Enter a valid quantity greater than 0'); return }
    if (!activeAccount || estCost > activeAccount.balance) { setBuyError('Insufficient balance'); return }
    if (!emotion) { setEmotionError(true); setBuyError('Please select how you\'re feeling'); return }

    setTradeLoading(true)
    try {
      const payload: any = { accountId: selectedAccountId, symbol: quote.symbol, direction: 'LONG', orderType, quantity: numQty, emotion }
      if (orderType === 'LIMIT') payload.limitPrice = parseFloat(limit)
      await openTrade(payload)
      const th = await getTrades(selectedAccountId); setTrades(th.data.data)
      const ah = await getAccounts(); setAccounts(ah.data.data)
      setEmotion(null); setQty('1')
      setToast({ message: `Bought ${numQty} shares of ${symbol} at $${actPrice.toFixed(2)}`, type: 'buy' })
    } catch (e: any) {
      setBuyError(e?.response?.data?.error || 'Failed to execute trade')
    } finally {
      setTradeLoading(false)
    }
  }

  const handleSell = async () => {
    setSellError(null); setEmotionError(false)
    if (!selectedAccountId || !quote) return
    if (numQty <= 0 || isNaN(numQty)) { setSellError('Enter a valid quantity'); return }
    if (numQty > currentHoldings) { setSellError("You don't hold enough shares"); return }
    if (!emotion) { setEmotionError(true); setSellError('Please select how you\'re feeling'); return }

    setTradeLoading(true)
    try {
       await (await import('../api/trades')).sellTrade({ accountId: selectedAccountId, symbol: quote.symbol, quantity: numQty, emotion })
       const th = await getTrades(selectedAccountId); setTrades(th.data.data)
       const ah = await getAccounts(); setAccounts(ah.data.data)
       setEmotion(null); setQty('1')
       setToast({ message: `Sold ${numQty} shares of ${symbol} at $${actPrice.toFixed(2)}`, type: 'sell' })
    } catch (e: any) {
       setSellError(e?.response?.data?.error || 'Failed to close position')
    } finally {
       setTradeLoading(false)
    }
  }

  const prevClose = quote ? quote.currentPrice - quote.change : 0

  return (
    <Layout accounts={accounts} selectedAccountId={selectedAccountId}>
       <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle bg-base">
         
         {/* TOP BAR — TradingView-style terminal layout */}
         <div className="border-b border-border-subtle flex items-center px-4 shrink-0 justify-between" style={{ minHeight: 72 }}>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 text-text-secondary hover:text-white rounded-md hover:bg-surface transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                 <div className="flex items-center gap-2 mb-0.5">
                   <h1 className="text-lg font-mono font-bold text-white tracking-tight">{symbol?.toUpperCase()}</h1>
                   <button className="text-text-disabled hover:text-accent disabled:opacity-50"><Star className="w-4 h-4" /></button>
                 </div>
              </div>
            </div>
            
            {quote && (
              <div className="flex flex-col items-end">
                {/* Large price */}
                <span className={`font-mono font-bold tracking-tighter text-white ${priceFlash}`} style={{ fontSize: 36, lineHeight: 1 }}>
                  ${quote.currentPrice.toFixed(2)}
                </span>
                {/* Change line */}
                <div className={`flex items-center gap-1 font-semibold text-sm mt-0.5 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                   {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                   <span className="font-mono">{quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)}  ({quote.changePercent.toFixed(2)}%)</span>
                </div>
                {/* OHLC line */}
                <span className="text-[11px] text-text-disabled font-mono mt-0.5">
                  O ${quote.open.toFixed(2)}  ·  H ${quote.high.toFixed(2)}  ·  L ${quote.low.toFixed(2)}  ·  PC ${prevClose.toFixed(2)}
                </span>
              </div>
            )}
         </div>

         {/* CHART AREA — fills remaining space */}
         <div className="relative flex-1 min-h-[250px]">
            {symbol ? <TradeChart symbol={symbol} /> : null}
            <div className="chart-gradient-bleed" />
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
                 <div className="flex flex-col">
                   <span className="text-xs text-text-secondary">Est. Cost: <span className="text-white font-mono ml-1">${estCost.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span></span>
                   {buyError && <span className="text-[11px] text-red-400 mt-1">{buyError}</span>}
                 </div>
                 <button disabled={tradeLoading || !quote || numQty <= 0 || isNaN(numQty) || (activeAccount && estCost > activeAccount.balance)} onClick={handleBuy} className="btn-buy-glow bg-bullish hover:brightness-110 disabled:opacity-50 disabled:grayscale text-black font-bold text-[13px] px-8 py-2 rounded transition-all">BUY</button>
               </div>
            </div>

            <EmotionSelector selectedEmotion={emotion} onSelect={(e) => { setEmotion(e); setEmotionError(false) }} error={emotionError} />

            {/* SELL ZONE */}
            <div className="flex-1 flex flex-col p-4 relative before:absolute before:inset-0 before:bg-bearish/5 before:pointer-events-none">
               <div className="flex justify-between items-center mb-4 relative z-10">
                 <span className="text-[11px] font-semibold tracking-[0.1em] text-text-secondary uppercase">Close Position</span>
               </div>
               
               <div className="mb-auto relative z-10 flex">
                 <div className="bg-base border border-border-subtle rounded flex flex-col items-center justify-center px-6 py-2 flex-1">
                   <span className="text-xs text-text-secondary mb-1">You hold</span>
                   <span className="font-mono text-xl text-white font-bold">{currentHoldings > 0 ? currentHoldings : `No position in ${symbol}`}</span>
                 </div>
               </div>

               <div className="mt-4 flex items-center justify-between relative z-10">
                 <div className="flex flex-col">
                   <span className="text-xs text-text-secondary">Est. Return: <span className="text-white font-mono ml-1">${(actPrice * numQty).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span></span>
                   {sellError && <span className="text-[11px] text-red-400 mt-1">{sellError}</span>}
                 </div>
                 <button disabled={tradeLoading || !quote || currentHoldings <= 0 || numQty <= 0 || isNaN(numQty) || numQty > currentHoldings} onClick={handleSell} className="btn-sell-glow bg-bearish hover:brightness-110 disabled:opacity-50 disabled:grayscale text-white font-bold text-[13px] px-8 py-2 rounded transition-all">SELL</button>
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

       {/* Toast */}
       {toast && <TradeToast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </Layout>
  )
}
