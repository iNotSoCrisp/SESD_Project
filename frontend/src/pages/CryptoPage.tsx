import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bitcoin, Activity } from 'lucide-react'
import Layout from '../components/Layout'
import TradeChart from '../components/TradeChart'
import { useQuotes } from '../hooks/useQuotes'
import type { QuoteExtended } from '../services/finnhub'

export default function CryptoPage() {
  const { crypto, loadingCrypto } = useQuotes()
  const navigate = useNavigate()
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BINANCE:BTCUSDT')

  useEffect(() => {
    if (crypto.length > 0 && !crypto.find(c => c.symbol === selectedCrypto)) {
      setSelectedCrypto(crypto[0].symbol)
    }
  }, [crypto, selectedCrypto])

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 bg-base flex flex-col h-full">
         <div className="mb-6 shrink-0 border-b border-border-subtle pb-4 flex items-center gap-3">
           <Bitcoin className="w-8 h-8 text-[#F7931A]" />
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Crypto Markets</h1>
             <p className="text-sm text-text-secondary">Track highest cap cryptocurrency pairings against the US Dollar.</p>
           </div>
         </div>

         {/* TOP HERO CARDS */}
         <div className="flex gap-4 mb-8 overflow-x-auto shrink-0 pb-2 no-scrollbar">
            {loadingCrypto && crypto.length === 0 ? (
               [...Array(5)].map((_, i) => (
                 <div key={i} className="min-w-[200px] h-[100px] bg-surface-elevated animate-pulse rounded-lg border border-border-subtle" />
               ))
            ) : crypto.map((c: QuoteExtended) => {
               const isPos = c.change >= 0
               const isSel = selectedCrypto === c.symbol
               return (
                 <div 
                   key={c.symbol}
                   onClick={() => setSelectedCrypto(c.symbol)}
                   className={`min-w-[220px] p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                     isSel ? 'bg-surface-elevated border-accent shadow-accent-glow' : 'bg-surface border-border-subtle hover:border-border-active hover:bg-surface-elevated'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1C2030] flex items-center justify-center text-[10px] font-bold text-white border border-[#2A2E39]">
                             {c.ticker?.charAt(0) || 'C'}
                          </div>
                          <span className="text-white font-mono font-bold text-sm">{c.name}</span>
                       </div>
                       <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${isPos ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                         {isPos ? '+' : ''}{c.changePercent.toFixed(2)}%
                       </span>
                    </div>
                    <div>
                       <span className="text-xl font-mono font-bold text-white block mb-0.5">${c.currentPrice.toFixed(2)}</span>
                       <span className="text-[10px] uppercase tracking-wider text-text-disabled">H: {c.high.toFixed(2)} L: {c.low.toFixed(2)}</span>
                    </div>
                 </div>
               )
            })}
         </div>

         {/* CHART & TRADE SPLIT */}
         <div className="flex-1 flex gap-6 min-h-[400px]">
             {/* LEFT: CHART */}
             <div className="flex-[3] flex flex-col bg-surface border border-border-subtle rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-base/50">
                   <div className="flex flex-col">
                     <span className="text-lg font-mono font-bold text-white">{selectedCrypto}</span>
                     <span className="text-xs text-text-secondary uppercase">24H Live Trading Chart</span>
                   </div>
                   <button 
                     onClick={() => navigate(`/stock/${selectedCrypto}`)}
                     className="px-4 py-1.5 bg-accent text-white font-semibold rounded text-[13px] hover:bg-[#427AEE] transition-colors flex items-center gap-2"
                   >
                     <Activity className="w-4 h-4" /> Open Trading Panel
                   </button>
                </div>
                <div className="flex-1 relative">
                   <TradeChart symbol={selectedCrypto} />
                </div>
             </div>

             {/* RIGHT: INFO PANEL */}
             <div className="flex-[1] flex flex-col gap-4">
                 {/* Current Crypto Full Data Dump */}
                 {crypto.find(c => c.symbol === selectedCrypto) && (
                    <div className="bg-surface border border-border-subtle rounded-lg p-6">
                       <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider border-b border-border-subtle pb-2">Market Data</h3>
                       
                       <div className="space-y-4">
                          {[
                            { l: 'Price', v: `$${crypto.find(c => c.symbol === selectedCrypto)!.currentPrice.toFixed(2)}` },
                            { l: '24h High', v: `$${crypto.find(c => c.symbol === selectedCrypto)!.high.toFixed(2)}` },
                            { l: '24h Low', v: `$${crypto.find(c => c.symbol === selectedCrypto)!.low.toFixed(2)}` },
                            { l: 'Open', v: `$${crypto.find(c => c.symbol === selectedCrypto)!.open.toFixed(2)}` },
                          ].map(s => (
                             <div key={s.l} className="flex justify-between items-center border-b border-border-subtle/50 pb-2">
                               <span className="text-xs text-text-secondary uppercase">{s.l}</span>
                               <span className="font-mono text-sm font-medium text-white">{s.v}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
             </div>
         </div>
      </div>
    </Layout>
  )
}
