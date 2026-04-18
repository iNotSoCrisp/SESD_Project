import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useQuotes } from '../hooks/useQuotes'

export default function Heatmap() {
  const { stocks, loadingStocks } = useQuotes()
  const navigate = useNavigate()
  const [hoveredSector, setHoveredSector] = useState<string | null>(null)

  const sectorData = useMemo(() => {
    if (stocks.length === 0) return []
    
    const groups: Record<string, any[]> = {}
    stocks.forEach(s => {
      const sec = s.sector || 'Other'
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(s)
    })

    return Object.keys(groups).map(sec => {
      const list = groups[sec]
      const avgChange = list.reduce((sum, s) => sum + s.changePercent, 0) / list.length
      return {
        sector: sec,
        count: list.length,
        avgChange,
        topSymbols: [...list].sort((a,b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 3)
      }
    }).sort((a, b) => b.count - a.count)
  }, [stocks])

  const getHeatColor = (val: number) => {
    if (val > 2) return '#1B5E20'
    if (val > 1) return '#2E7D32'
    if (val > 0) return '#388E3C'
    if (val === 0) return '#263238'
    if (val > -1) return '#C62828'
    if (val > -2) return '#B71C1C'
    return '#7F0000'
  }

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 bg-base flex flex-col h-full">
         <div className="mb-6 shrink-0 border-b border-border-subtle pb-4">
           <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Sector Heatmap</h1>
           <p className="text-sm text-text-secondary">Visual performance breakdown of S&P sectors based on your watchlist.</p>
         </div>

         {loadingStocks && stocks.length === 0 ? (
           <div className="flex-1 flex items-center justify-center">
             <span className="text-text-disabled text-sm">Loading market sectors...</span>
           </div>
         ) : (
           <div className="flex-1 flex flex-col md:flex-row gap-2 min-h-[400px]">
             {sectorData.map(sec => (
                <div
                  key={sec.sector}
                  onClick={() => navigate('/dashboard', { state: { sector: sec.sector } })}
                  onMouseEnter={() => setHoveredSector(sec.sector)}
                  onMouseLeave={() => setHoveredSector(null)}
                  className="flex flex-col relative overflow-hidden transition-all duration-300 cursor-pointer rounded-sm hover:brightness-125 hover:z-10 hover:shadow-lg"
                  style={{ 
                    flexBasis: `${Math.max(10, (sec.count / stocks.length) * 100)}%`, 
                    backgroundColor: getHeatColor(sec.avgChange) 
                  }}
                >
                   <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
                      <span className="text-white font-bold tracking-widest uppercase md:text-sm text-xs opacity-90">{sec.sector}</span>
                      <span className="text-white font-mono font-bold text-lg mt-1">{sec.avgChange > 0 ? '+' : ''}{sec.avgChange.toFixed(2)}%</span>
                      
                      {/* Mini Tickers */}
                      <div className="mt-4 flex flex-col gap-1 opacity-70">
                        {sec.topSymbols.map((t: any) => (
                           <div key={t.symbol} className="flex justify-between text-[10px] font-mono gap-4">
                              <span>{t.symbol}</span>
                              <span>{t.changePercent > 0 ? '+' : ''}{t.changePercent.toFixed(1)}%</span>
                           </div>
                        ))}
                      </div>
                   </div>

                   {/* Quick Tooltip logic visually built-in via hover state (or we could use standard popup) */}
                   {hoveredSector === sec.sector && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
                        <span className="text-white font-semibold text-xs tracking-wider uppercase">View {sec.sector}</span>
                     </div>
                   )}
                </div>
             ))}
           </div>
         )}
      </div>
    </Layout>
  )
}
