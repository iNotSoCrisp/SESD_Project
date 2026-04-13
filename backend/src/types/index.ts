// ─── Trade ───────────────────────────────────────────────────────────────────
export type TradeDirection = 'LONG' | 'SHORT'
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP'
export type TradeStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED'

export interface TradeBaseParams {
  id: string
  accountId: string
  symbol: string
  direction: TradeDirection
  quantity: number
  entryPrice: number
  status?: TradeStatus
  enteredAt?: Date | null
  closedAt?: Date | null
}

export interface MarketTradeCreationParams extends TradeBaseParams { orderType: 'MARKET' }
export interface LimitTradeCreationParams extends TradeBaseParams { orderType: 'LIMIT'; limitPrice: number }
export interface StopTradeCreationParams extends TradeBaseParams { orderType: 'STOP'; stopPrice: number }
export type TradeCreationParams = MarketTradeCreationParams | LimitTradeCreationParams | StopTradeCreationParams

export interface MarketData {
  symbol: string; price: number; currentPrice: number
  bidPrice: number; askPrice: number; open: number; high: number; low: number; volume: number; timestamp: Date
}

export interface TradeResult {
  tradeId: string; executed: boolean; executionPrice: number | null
  status: TradeStatus; message: string; timestamp: Date
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface UserRecord {
  id: string; email: string; username: string; passwordHash: string
  firstName?: string | undefined; lastName?: string | undefined; createdAt: Date
}

export interface CreateUserDto {
  email: string; username: string; password: string
  firstName?: string | undefined; lastName?: string | undefined
}

export interface AuthResult {
  user: { id: string; email: string; username: string; createdAt: Date }
  token: string
}

// ─── Emotion ─────────────────────────────────────────────────────────────────
export type EmotionPhase = 'PRE' | 'POST'
export type EmotionType = 'FOMO' | 'CONFIDENT' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'NEUTRAL'

export interface CreateEmotionDto {
  readonly tradeId: string; readonly phase: EmotionPhase; readonly emotionType: EmotionType
  readonly intensity: number; readonly notes?: string | undefined; readonly loggedAt?: Date | undefined
}

export interface EmotionLogRecord {
  readonly id: string; readonly tradeId: string; readonly phase: EmotionPhase
  readonly emotionType: EmotionType; readonly intensity: number
  readonly notes?: string | undefined; readonly loggedAt: Date
}

export interface CreateEmotionRecordInput {
  readonly tradeId: string; readonly phase: EmotionPhase; readonly emotionType: EmotionType
  readonly intensity: number; readonly notes?: string | undefined; readonly loggedAt?: Date | undefined
}

// ─── Account ─────────────────────────────────────────────────────────────────
export interface TradingAccountSummary {
  readonly id: string; readonly userId: string; readonly name: string
  readonly balance: number; readonly broker?: string | undefined
  readonly isActive: boolean; readonly currency: string
}

export interface CreateTradingAccountInput {
  readonly userId: string; readonly name: string; readonly currency: string
  readonly balance: number; readonly broker?: string | undefined
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface TradeData {
  readonly tradeId: string; readonly symbol: string; readonly direction: 'LONG' | 'SHORT'
  readonly entryPrice: number; readonly exitPrice: number
  readonly pnl: number; readonly pnlPercent: number
  readonly enteredAt: Date; readonly closedAt: Date
  readonly emotionType?: string | undefined; readonly emotionIntensity?: number | undefined
}

export interface ProcessedData {
  readonly groups: Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>
}

export interface Insight { readonly key: string; readonly message: string }
export interface InsightReport { readonly type: string; readonly insights: readonly Insight[]; readonly generatedAt: Date }

export interface AnalyticsReportRecord {
  readonly id: string; readonly userId: string; readonly reportType: string
  readonly data: Record<string, unknown>; readonly isStale: boolean; readonly generatedAt: Date
}

// ─── Position ────────────────────────────────────────────────────────────────
export interface PositionRecord {
  readonly id: string; readonly tradeId: string
  readonly realizedPnl: number | null; readonly returnPct: number | null
  readonly durationMins: number | null; readonly maxDrawdown: number | null
  readonly maxProfit: number | null; readonly createdAt: Date; readonly updatedAt: Date
}

export interface CreatePositionInput {
  readonly tradeId: string; readonly realizedPnl: number; readonly returnPct: number
  readonly durationMins?: number | undefined
  readonly maxDrawdown?: number | undefined; readonly maxProfit?: number | undefined
}

// ─── Trade Repository ────────────────────────────────────────────────────────
export interface PersistedTradeRecord {
  readonly id: string; readonly accountId: string; readonly symbol: string
  readonly direction: TradeDirection; readonly orderType: OrderType
  readonly quantity: number; readonly entryPrice: number; readonly status: TradeStatus
  readonly enteredAt: Date | null; readonly closedAt: Date | null
  readonly limitPrice?: number; readonly stopPrice?: number
}

export interface TradeListFilters {
  readonly accountId?: string | undefined; readonly symbol?: string | undefined
  readonly status?: TradeStatus | undefined; readonly direction?: TradeDirection | undefined
  readonly orderType?: OrderType | undefined
}

export interface CreateTradeRecordInput {
  readonly id?: string; readonly accountId: string; readonly symbol: string
  readonly direction: TradeDirection; readonly orderType: OrderType
  readonly quantity: number; readonly entryPrice: number; readonly status: TradeStatus
  readonly enteredAt: Date | null; readonly closedAt: Date | null
  readonly limitPrice?: number; readonly stopPrice?: number
}

export interface UpdateTradeRecordInput {
  readonly status?: TradeStatus; readonly entryPrice?: number
  readonly enteredAt?: Date | null; readonly closedAt?: Date | null
}

// ─── Market Data ─────────────────────────────────────────────────────────────
export interface IMarketDataService {
  getPrice(symbol: string): Promise<MarketData>
  getMarketData(symbol: string): Promise<MarketData>
}
