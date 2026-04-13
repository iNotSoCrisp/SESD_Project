import client from './client'

export const getPrice = (symbol: string) =>
  client.get<{ data: { symbol: string; currentPrice: number } }>(`/market/${symbol}`)
