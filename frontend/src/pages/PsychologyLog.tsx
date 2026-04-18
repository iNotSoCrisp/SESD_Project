import { useState, useEffect, useMemo } from 'react'
import { BrainCircuit } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/accounts'
import { getTrades } from '../api/trades'
import type { Trade } from '../types'
import Layout from '../components/Layout'

const EMO_META = {
  'Greed': { color: '#EAB308', bg: 'bg-emo-greed' },
  'FOMO': { color: '#EC4899', bg: 'bg-emo-fomo' },
  'Fear': { color: '#A855F7', bg: 'bg-emo-fear' },
  'Confidence': { color: '#22C55E', bg: 'bg-emo-conf' },
  'Uncertainty': { color: '#F97316', bg: 'bg-emo-uncert' },
  'Neutral': { color: '#9CA3AF', bg: 'bg-emo-neutral' }
}

export default function PsychologyLog() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    getAccounts().then(async res => {
      const accs = res.data.data
      if (accs.length > 0) {
        const trds = await getTrades(accs[0].id)
        if (active) {
          setTrades(trds.data.data)
          setLoading(false)
        }
      } else {
        if (active) setLoading(false)
      }
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [user])

  // Aggregate Stats
  const { summary, chartData } = useMemo(() => {
    const raw = {
      'Greed': Object.assign({ name: 'Greed', count: 0, pnl: 0, wins: 0, color: EMO_META['Greed'].color }),
      'FOMO': Object.assign({ name: 'FOMO', count: 0, pnl: 0, wins: 0, color: EMO_META['FOMO'].color }),
      'Fear': Object.assign({ name: 'Fear', count: 0, pnl: 0, wins: 0, color: EMO_META['Fear'].color }),
      'Confidence': Object.assign({ name: 'Confidence', count: 0, pnl: 0, wins: 0, color: EMO_META['Confidence'].color }),
      'Uncertainty': Object.assign({ name: 'Uncertainty', count: 0, pnl: 0, wins: 0, color: EMO_META['Uncertainty'].color }),
      'Neutral': Object.assign({ name: 'Neutral', count: 0, pnl: 0, wins: 0, color: EMO_META['Neutral'].color })
    }

    trades.forEach(t => {
      // Find emotion from the associated EmotionLog (it's 1-to-1 but nested in db structure usually, assuming t.emotionLog[0]?.primaryEmotion)
      // If we don't have it mapped perfectly in types, we assume a fallback
      const eList = (t as any).emotionLogs || []
      const eRaw = eList[0]?.primaryEmotion || 'Neutral'
      
      const emo = raw[eRaw as keyof typeof raw] || raw['Neutral']
      
      emo.count++
      if (t.status === 'CLOSED') {
        const pnl = t.position?.realizedPnl || 0
        emo.pnl += pnl
        if (pnl > 0) emo.wins++
      }
    })

    const sumArr = Object.values(raw)
    
    // Average PNL per trade for the chart
    const cData = sumArr.map(e => ({
      name: e.name,
      avgPnl: e.count > 0 ? e.pnl / e.count : 0,
      color: e.color
    }))

    return { summary: sumArr, chartData: cData }
  }, [trades])

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 bg-base flex flex-col">
         
         <div className="mb-6 shrink-0 border-b border-border-subtle pb-4 flex items-center gap-3 mt-4 md:mt-0">
           <BrainCircuit className="w-8 h-8 text-accent" />
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Psychology Log</h1>
             <p className="text-sm text-text-secondary">Analyze exactly how your emotional state impacts your profitability.</p>
           </div>
         </div>

         {loading ? (
             <div className="flex-1 flex items-center justify-center"><span className="text-text-secondary text-sm">Quantifying emotions...</span></div>
         ) : trades.length === 0 ? (
             <div className="flex-1 flex items-center justify-center"><span className="text-text-disabled text-sm">No trades logged yet. Go make a trade.</span></div>
         ) : (
           <>
              {/* TOP ROW: CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                 {summary.map(s => (
                   <div key={s.name} className="bg-surface rounded-lg border border-border-subtle p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{s.name}</span>
                         <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: s.color, backgroundColor: s.color }} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-[10px] text-text-disabled uppercase">Trades</span>
                           <span className="font-mono text-sm text-white font-bold">{s.count}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-[10px] text-text-disabled uppercase">Win Rate</span>
                           <span className="font-mono text-sm font-medium text-white">{s.count > 0 ? Math.round((s.wins/s.count)*100) : 0}%</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-border-subtle pt-2 mt-2">
                           <span className="text-[10px] text-text-disabled uppercase">Avg P&L</span>
                           <span className={`font-mono text-sm font-bold ${s.pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                              {s.count > 0 ? `${s.pnl >= 0 ? '+' : ''}$${(s.pnl/s.count).toFixed(2)}` : '$0.00'}
                           </span>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>

              {/* CHART */}
              <div className="bg-surface border border-border-subtle rounded-lg p-6 mb-8 h-[350px]">
                 <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">How Your Emotions Affect Your Returns</h3>
                 <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <XAxis dataKey="name" stroke="#787B86" fontSize={12} tickLine={false} axisLine={false} />
                       <YAxis stroke="#787B86" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                       <Tooltip 
                         cursor={{ fill: '#1C2030' }}
                         contentStyle={{ backgroundColor: '#1C2030', borderColor: '#2A2E39', color: '#fff', borderRadius: '4px' }}
                         formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Avg P&L']}
                       />
                       <Bar dataKey="avgPnl" radius={[4, 4, 4, 4]}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>

              {/* TABLE */}
              <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden flex-1 flex flex-col">
                 <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-base/50 shrink-0">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Logs</h3>
                 </div>
                 <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                       <thead>
                          <tr className="border-b border-border-subtle text-xs font-semibold text-text-secondary tracking-wider uppercase">
                             <th className="p-4 font-inter">Date</th>
                             <th className="p-4 font-inter">Asset</th>
                             <th className="p-4 font-inter">Action</th>
                             <th className="p-4 font-inter text-right">P&L</th>
                             <th className="p-4 font-inter text-center">Emotion</th>
                             <th className="p-4 font-inter text-center">Outcome</th>
                          </tr>
                       </thead>
                       <tbody className="text-sm">
                          {trades.slice().reverse().map(t => {
                             const pnl = t.position?.realizedPnl || 0
                             const isClosed = t.status === 'CLOSED'
                             const outcome = !isClosed ? 'OPEN' : (pnl > 0 ? 'WIN' : 'LOSS')
                             
                             const eList = (t as any).emotionLogs || []
                             const eRaw = eList[0]?.primaryEmotion || 'Neutral'
                             const emoObj = EMO_META[eRaw as keyof typeof EMO_META] || EMO_META['Neutral']

                             return (
                               <tr key={t.id} className="border-b border-border-subtle/50 hover:bg-surface-elevated transition-colors">
                                 <td className="p-4 font-mono text-xs text-text-secondary">{new Date(t.enteredAt).toLocaleString()}</td>
                                 <td className="p-4 font-mono font-bold text-white">{t.symbol}</td>
                                 <td className="p-4">
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.direction === 'LONG' ? 'bg-bullish text-black' : 'bg-bearish text-white'}`}>{t.direction}</span>
                                 </td>
                                 <td className={`p-4 font-mono text-right font-bold ${!isClosed ? 'text-text-disabled' : (pnl >= 0 ? 'text-bullish' : 'text-bearish')}`}>
                                    {isClosed ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : '-'}
                                 </td>
                                 <td className="p-4 text-center">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-block ${emoObj.bg} text-white`}>{eRaw}</span>
                                 </td>
                                 <td className="p-4 text-center">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 border rounded inline-block bg-base ${
                                      outcome === 'WIN' ? 'border-bullish text-bullish' : (outcome === 'LOSS' ? 'border-bearish text-bearish' : 'border-border-subtle text-text-secondary')
                                    }`}>{outcome}</span>
                                 </td>
                               </tr>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </>
         )}
      </div>
    </Layout>
  )
}
