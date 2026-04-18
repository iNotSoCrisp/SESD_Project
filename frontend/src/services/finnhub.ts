import axios from 'axios'
import type { MarketQuote } from '../types'

const API_KEY = import.meta.env.VITE_FINNHUB_KEY
const BASE_URL = 'https://finnhub.io/api/v1'

const client = axios.create({
  baseURL: BASE_URL,
  params: {
    token: API_KEY
  }
})

// Custom interface for internal caching
export interface QuoteExtended extends MarketQuote {
  name?: string
  sector?: string
  ticker?: string
}

const quoteCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 15000 // 15 seconds

export async function getQuote(symbol: string) {
  const now = Date.now()
  if (quoteCache.has(symbol)) {
    const cached = quoteCache.get(symbol)!
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  const response = await client.get(`/quote`, { params: { symbol } })
  const d = response.data
  
  if (d.d === null && d.c === 0 && d.pc === 0) {
     throw new Error('No data')
  }

  const result = {
    c: d.c,
    h: d.h,
    l: d.l,
    o: d.o,
    pc: d.pc,
    t: d.t
  }

  quoteCache.set(symbol, { data: result, timestamp: now })
  return result
}

export async function getCandles(symbol: string, resolution: string, from: number, to: number) {
  const response = await client.get(`/stock/candle`, {
    params: { symbol, resolution, from, to }
  })
  return response.data
}

export async function searchSymbol(q: string) {
  const response = await client.get(`/search`, { params: { q } })
  return response.data.result
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function getAllQuotes(symbolsArray: { symbol: string, name: string, sector?: string, ticker?: string }[]) {
  const results: QuoteExtended[] = []
  
  for (const item of symbolsArray) {
    try {
      const q = await getQuote(item.symbol)
      const change = q.c - q.pc
      const changePercent = q.pc !== 0 ? (change / q.pc) * 100 : 0
      
      results.push({
        symbol: item.symbol,
        name: item.name,
        sector: item.sector,
        ticker: item.ticker,
        price: q.c,     // duplicate for MarketQuote interface
        currentPrice: q.c,
        open: q.o,
        high: q.h,
        low: q.l,
        change: change,
        changePercent: parseFloat(changePercent.toFixed(2)),
        timestamp: new Date(q.t * 1000).toISOString(),
        bidPrice: 0,
        askPrice: 0,
        volume: 0
      })
    } catch (e) {
      console.warn(`Failed to fetch quote for ${item.symbol}`)
    }
    await delay(100) // 100ms stagger
  }
  
  return results
}
