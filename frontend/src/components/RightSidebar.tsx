interface RightSidebarProps {
  totalValue: number
  pnlTotal: number
  winRate: number
  holdings: { symbol: string, shares: number, avgPrice: number, current: number, pnl: number }[]
  recentTrades: { id: string, symbol: string, emotionTag: string, pnl: number }[]
}

const EMOTION_COLORS: Record<string, string> = {
  Fear: 'bg-emo-fear/20 text-emo-fear border-emo-fear/30',
  Greed: 'bg-emo-greed/20 text-emo-greed border-emo-greed/30',
  FOMO: 'bg-emo-fomo/20 text-emo-fomo border-emo-fomo/30',
  Confidence: 'bg-emo-conf/20 text-emo-conf border-emo-conf/30',
  Uncertainty: 'bg-emo-uncert/20 text-emo-uncert border-emo-uncert/30',
  Neutral: 'bg-emo-neutral/20 text-emo-neutral border-emo-neutral/30'
}

export default function RightSidebar({ totalValue, pnlTotal, winRate, holdings, recentTrades }: RightSidebarProps) {
  return (
    <div className="w-[300px] bg-surface flex flex-col shrink-0 overflow-y-auto">
      
      {/* Portfolio Summary */}
      <div className="p-4 border-b border-border-subtle">
         <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary mb-4">My Portfolio</h3>
         
         <div className="mb-4">
           <span className="text-[10px] text-text-secondary block mb-1">Total Value</span>
           <span className="text-3xl font-mono font-bold text-white tracking-tight">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
         </div>
         
         <div className="flex items-center gap-4">
           <div>
             <span className="text-[10px] text-text-secondary block mb-1">P&L Today</span>
             <span className={`text-[13px] font-mono font-medium ${pnlTotal >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {pnlTotal >= 0 ? '▲' : '▼'} ${Math.abs(pnlTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
             </span>
           </div>
           <div>
             <span className="text-[10px] text-text-secondary block mb-1">Win Rate</span>
             <span className="text-[12px] font-semibold text-text-primary px-2 py-0.5 bg-surface-elevated rounded border border-border-subtle">
               {winRate}%
             </span>
           </div>
         </div>
      </div>

      {/* Holdings List */}
      <div className="p-4 border-b border-border-subtle flex-1 min-h-[200px]">
         <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary mb-4">Holdings</h3>
         {holdings.length === 0 ? (
           <p className="text-xs text-text-disabled text-center py-4">No open positions</p>
         ) : (
           <div className="space-y-3">
             {holdings.map((h, i) => (
               <div key={i} className="flex items-center justify-between text-[13px]">
                 <div>
                   <span className="font-semibold text-white block">{h.symbol}</span>
                   <span className="text-[11px] text-text-secondary">{h.shares} shrs @ {h.avgPrice.toFixed(2)}</span>
                 </div>
                 <div className="text-right">
                   <span className="font-mono text-white block">{h.current.toFixed(2)}</span>
                   <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${h.pnl >= 0 ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                     {h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Recent Trade History */}
      <div className="p-4 min-h-[200px]">
         <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary mb-4">Recent History</h3>
         {recentTrades.length === 0 ? (
           <p className="text-xs text-text-disabled text-center py-4">No recent trades</p>
         ) : (
           <div className="space-y-3">
             {recentTrades.map((t, i) => {
                const badgeStyle = EMOTION_COLORS[t.emotionTag] || EMOTION_COLORS['Neutral']
                return (
                 <div key={i} className="flex items-center justify-between py-1 bg-base p-2 rounded border border-border-subtle">
                   <div className="flex flex-col gap-1">
                     <span className="text-[12px] font-bold text-white">{t.symbol}</span>
                     <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded border inline-block w-max ${badgeStyle}`}>
                       {t.emotionTag}
                     </span>
                   </div>
                   <div className={`font-mono text-[13px] font-semibold ${t.pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                     {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                   </div>
                 </div>
               )
             })}
           </div>
         )}
      </div>

    </div>
  )
}
