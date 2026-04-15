export interface User {
  id: string
  email: string
  username: string
}

export interface TradingAccount {
  id: string
  name: string
  balance: number
  currency: string
}

export type Direction = 'LONG' | 'SHORT'
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP'
export type TradeStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED'
export type EmotionType = 'FOMO' | 'CONFIDENT' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'NEUTRAL'
export type EmotionPhase = 'PRE' | 'POST'

export interface Position {
  realizedPnl: number | null
  returnPct: number | null
}

export interface Trade {
  id: string
  accountId: string
  symbol: string
  direction: Direction
  orderType: OrderType
  status: TradeStatus
  entryPrice: number
  quantity: number
  enteredAt: string
  closedAt?: string
  limitPrice?: number
  stopPrice?: number
  position?: Position
}

export interface PersistedTradeRecord extends Trade {}

export interface EmotionLog {
  id: string
  tradeId: string
  phase: EmotionPhase
  emotionType: EmotionType
  intensity: number
  notes?: string
}

export interface AnalyticsInsight {
  type: string
  insights: { key: string; message: string }[]
  generatedAt: string
}

export interface MarketQuote {
  symbol: string
  price: number
  currentPrice: number
  bidPrice: number
  askPrice: number
  open: number
  high: number
  low: number
  volume: number
  change: number
  changePercent: number
  timestamp: string
}
