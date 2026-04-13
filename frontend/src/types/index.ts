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

export interface Trade {
  id: string
  symbol: string
  direction: Direction
  orderType: OrderType
  status: TradeStatus
  entryPrice: number
  quantity: number
  enteredAt: string
  closedAt?: string
}

export interface EmotionLog {
  id: string
  tradeId: string
  phase: EmotionPhase
  emotionType: EmotionType
  intensity: number
  notes?: string
}

export interface Position {
  exitPrice: number
  pnl: number
  pnlPercent: number
}

export interface AnalyticsInsight {
  type: string
  insights: string[]
  generatedAt: string
}
