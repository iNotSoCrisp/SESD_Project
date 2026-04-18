import { useEffect, useRef, useState } from 'react'
import { createChart } from "lightweight-charts";
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { getCandles } from '../services/finnhub'

interface TradeChartProps {
  symbol: string
}

export default function TradeChart({ symbol }: TradeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)

  const [timeframe, setTimeframe] = useState<'1W'|'1M'|'3M'|'6M'|'1Y'>('3M')
  const [chartType, setChartType] = useState<'CANDLE'|'AREA'|'LINE'>('CANDLE')
  
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [noData, setNoData] = useState(false)

  // Fetch Data Logic
  useEffect(() => {
    let active = true
    const fetchChartData = async () => {
      setLoading(true)
      setNoData(false)
      try {
        const now = Math.floor(Date.now() / 1000)
        let from = now
        switch (timeframe) {
          case '1W': from = now - (7 * 86400); break;
          case '1M': from = now - (30 * 86400); break;
          case '3M': from = now - (90 * 86400); break;
          case '6M': from = now - (180 * 86400); break;
          case '1Y': from = now - (365 * 86400); break;
        }

        const res = await getCandles(symbol, 'D', from, now)
        if (res.s === 'no_data' || !res.t) {
          if (active) setNoData(true)
          return
        }

        const formatted = res.t.map((t: number, i: number) => ({
          time: t as Time,
          open: res.o[i],
          high: res.h[i],
          low: res.l[i],
          close: res.c[i]
        }))

        if (active) setData(formatted)
      } catch (err) {
        if (active) setNoData(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    if (symbol) fetchChartData()
    return () => { active = false }
  }, [symbol, timeframe])

  // Setup Chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#787B86',
      },
      grid: {
        vertLines: { color: '#1C2030' },
        horzLines: { color: '#1C2030' },
      },
      crosshair: {
        vertLine: { color: '#363A48' },
        horzLine: { color: '#363A48' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    })
    
    chartRef.current = chart

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Sync Series
  useEffect(() => {
    if (!chartRef.current) return
    
    // Clear old series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current)
      seriesRef.current = null
    }

    if (noData || data.length === 0) return

    let series: any
    if (chartType === 'CANDLE') {
      series = chartRef.current.addCandlestickSeries({
        upColor: '#26A69A',
        downColor: '#EF5350',
        borderVisible: false,
        wickUpColor: '#26A69A',
        wickDownColor: '#EF5350'
      })
      series.setData(data)
    } else if (chartType === 'AREA') {
      series = chartRef.current.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.3)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: '#2962FF',
      })
      series.setData(data.map(d => ({ time: d.time, value: d.close })))
    } else if (chartType === 'LINE') {
      series = chartRef.current.addLineSeries({
        color: '#2962FF',
      })
      series.setData(data.map(d => ({ time: d.time, value: d.close })))
    }

    // Auto scale to fit
    chartRef.current.timeScale().fitContent()
    seriesRef.current = series

  }, [chartType, data, noData])

  return (
    <div className="flex flex-col h-full bg-base border-border-subtle overflow-hidden">
       {/* Toolbar */}
       <div className="flex justify-between items-center p-2 border-b border-border-subtle shrink-0">
          <div className="flex gap-1">
             {['1W', '1M', '3M', '6M', '1Y'].map(tf => (
               <button
                 key={tf}
                 onClick={() => setTimeframe(tf as any)}
                 className={`px-2 py-1 text-xs font-semibold rounded ${
                   timeframe === tf 
                     ? 'text-white border-b-2 border-accent bg-surface-elevated' 
                     : 'text-text-secondary hover:text-text-primary border-b-2 border-transparent'
                 }`}
               >
                 {tf}
               </button>
             ))}
          </div>
          <div className="flex bg-surface-elevated rounded border border-border-subtle p-0.5">
             <button
               onClick={() => setChartType('CANDLE')}
               className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-colors ${chartType === 'CANDLE' ? 'bg-surface text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
             >Candles</button>
             <button
               onClick={() => setChartType('AREA')}
               className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-colors ${chartType === 'AREA' ? 'bg-surface text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
             >Area</button>
             <button
               onClick={() => setChartType('LINE')}
               className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-colors ${chartType === 'LINE' ? 'bg-surface text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
             >Line</button>
          </div>
       </div>

       {/* Chart Container */}
       <div className="flex-1 relative" ref={chartContainerRef}>
         {loading && (
           <div className="absolute inset-0 z-10 bg-base/50 flex items-center justify-center backdrop-blur-[2px]">
              <div className="text-text-secondary text-sm">Loading chart...</div>
           </div>
         )}
         {noData && !loading && (
           <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="text-text-disabled text-sm">No chart data available</div>
           </div>
         )}
       </div>
    </div>
  )
}
