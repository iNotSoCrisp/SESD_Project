import client from './client'
import type { MarketQuote } from '../types'

export const getPrice = (symbol: string) =>
  client.get<{ data: MarketQuote }>(`/market/${symbol}`)
