import client from './client'
import type { Trade, PersistedTradeRecord } from '../types'

type TradeRecord = Trade | PersistedTradeRecord

export const getTrades = (accountId?: string) =>
  client.get<{ data: TradeRecord[] }>('/trades', { params: accountId ? { accountId } : undefined })

export const openTrade = (data: {
  accountId: string; symbol: string; direction: 'LONG' | 'SHORT'
  orderType: 'MARKET' | 'LIMIT' | 'STOP'; quantity: number
  limitPrice?: number; stopPrice?: number; emotion?: string
}) => client.post<{ data: { trade: TradeRecord } }>('/trades', data)

export const closeTrade = (id: string) =>
  client.patch<{ data: { trade: TradeRecord; pnl: number } }>(`/trades/${id}/close`)

export const cancelTrade = (id: string) =>
  client.patch<{ data: { trade: TradeRecord } }>(`/trades/${id}/cancel`)

export const sellTrade = (data: {
  accountId: string; symbol: string; quantity: number; emotion?: string
}) => client.post<{ data: { closedCount: number; remainingQtyToSell: number } }>('/trades/sell', data)
