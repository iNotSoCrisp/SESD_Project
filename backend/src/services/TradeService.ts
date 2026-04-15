import { TradeFactory } from '../models/TradeFactory'
import { TradeContext, getStrategy } from '../patterns/OrderStrategies'
import { TradeEventPublisher, PnLCalculatorObserver, AnalyticsTriggerObserver, NotificationObserver, ConsoleNotifier } from '../patterns/TradeObservers'
import { getState } from '../patterns/TradeStateMachine'
import type { Trade } from '../models/Trade'
import type {
  MarketData, TradeResult, TradeCreationParams, IMarketDataService, PersistedTradeRecord,
  TradeListFilters, CreateTradeRecordInput, UpdateTradeRecordInput, TradeStatus,
} from '../types'
import type { ITradeRepository, IPositionRepository } from '../repositories/TradeRepository'
import type { IAccountRepository, IAnalyticsReportRepository } from '../repositories/AccountRepository'

// ─── Market Data Services ────────────────────────────────────────────────────
const BASE_PRICES: Record<string, number> = {
  AAPL: 178.50, MSFT: 378.20, GOOGL: 141.80, TSLA: 248.50,
  AMZN: 182.30, NVDA: 875.40, META: 505.60,
  BTC: 67500, ETH: 3200, SOL: 145.20,
}

class MockMarketData implements IMarketDataService {
  async getPrice(symbol: string): Promise<MarketData> {
    const s = symbol.trim().toUpperCase()
    const base = BASE_PRICES[s] ?? 100
    const noise = 1 + (Math.random() * 0.04 - 0.02)
    const price = Number((base * noise).toFixed(2))
    const spread = Number((price * 0.001).toFixed(2))
    const open = Number((price * (1 + Math.random() * 0.02 - 0.01)).toFixed(2))
    const high = Number((price * (1 + Math.random() * 0.01)).toFixed(2))
    const low = Number((price * (1 - Math.random() * 0.01)).toFixed(2))
    const change = Number((price - open).toFixed(2))
    const changePercent = Number(((change / open) * 100).toFixed(2))
    return {
      symbol: s, price, currentPrice: price,
      bidPrice: Number((price - spread).toFixed(2)),
      askPrice: Number((price + spread).toFixed(2)),
      open, high, low,
      volume: Math.floor(Math.random() * 9990000 + 100000),
      change, changePercent,
      timestamp: new Date(),
    }
  }
  async getMarketData(s: string): Promise<MarketData> { return this.getPrice(s) }
}

class AlphaVantageMarketData implements IMarketDataService {
  constructor(private readonly apiKey: string) {}
  async getPrice(symbol: string): Promise<MarketData> {
    const s = symbol.trim().toUpperCase(); if (!s) throw new Error('symbol required')
    if (!this.apiKey.trim()) throw new Error('Alpha Vantage API key not configured.')
    const url = new URL('https://www.alphavantage.co/query'); url.searchParams.set('function', 'GLOBAL_QUOTE'); url.searchParams.set('symbol', s); url.searchParams.set('apikey', this.apiKey)
    const res = await fetch(url); if (!res.ok) throw new Error(`Alpha Vantage failed: ${res.status}`)
    const json = await res.json() as Record<string, any>
    const quote = json['Global Quote']; if (!quote) throw new Error('No quote data')
    const price = Number(quote['05. price']); const spread = Number((price * 0.001).toFixed(2))
    const open = Number(quote['02. open'])
    const change = Number((price - open).toFixed(2))
    const changePercent = Number(((change / open) * 100).toFixed(2))
    return { symbol: quote['01. symbol']?.trim().toUpperCase() || s, price, currentPrice: price, bidPrice: Number((price - spread).toFixed(2)), askPrice: Number((price + spread).toFixed(2)), open, high: Number(quote['03. high']), low: Number(quote['04. low']), volume: Number(quote['06. volume']), change, changePercent, timestamp: new Date() }
  }
  async getMarketData(s: string): Promise<MarketData> { return this.getPrice(s) }
}

export function createMarketDataService(): IMarketDataService {
  const key = process.env.ALPHA_VANTAGE_API_KEY
  return (typeof key === 'string' && key.trim().length > 0) ? new AlphaVantageMarketData(key) : new MockMarketData()
}

// ─── Trade Service ───────────────────────────────────────────────────────────
export interface TradeServiceDeps {
  tradeRepo: ITradeRepository; accountRepo: IAccountRepository
  marketData: IMarketDataService; publisher: TradeEventPublisher
  positionRepo: IPositionRepository; analyticsRepo: IAnalyticsReportRepository
}

export class TradeService {
  constructor(private readonly d: TradeServiceDeps) {}

  async listTrades(filters: TradeListFilters): Promise<readonly PersistedTradeRecord[]> {
    return this.d.tradeRepo.findMany(filters)
  }

  async openTrade(input: { accountId: string; symbol: string; direction: 'LONG'|'SHORT'; orderType: 'MARKET'|'LIMIT'|'STOP'; quantity: number; entryPrice?: number; limitPrice?: number; stopPrice?: number }): Promise<{ trade: PersistedTradeRecord; execution: TradeResult }> {
    const account = await this.d.accountRepo.findById(input.accountId)
    if (!account) throw new Error('Trading account not found.')
    if (!account.isActive) throw new Error('Trading account is inactive.')

    const market = await this.d.marketData.getMarketData(input.symbol)
    const entryPrice = input.orderType === 'MARKET' ? market.askPrice : (input.orderType === 'LIMIT' ? input.limitPrice! : input.stopPrice!)

    const params: TradeCreationParams = {
      id: `trade_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      accountId: input.accountId, symbol: input.symbol.toUpperCase(), direction: input.direction,
      orderType: input.orderType, quantity: input.quantity, entryPrice, status: 'PENDING', enteredAt: null, closedAt: null,
    } as TradeCreationParams
    if (input.orderType === 'LIMIT') (params as any).limitPrice = input.limitPrice
    if (input.orderType === 'STOP') (params as any).stopPrice = input.stopPrice

    const trade = TradeFactory.create(input.orderType, params)
    const ctx = new TradeContext(getStrategy(input.orderType))
    const execution = ctx.executeOrder(trade, market)

    if (execution.executed) {
      getState('PENDING').open({ tradeId: trade.id })
      await this.d.publisher.notify({ type: 'TRADE_OPENED', tradeId: trade.id, status: 'OPEN', occurredAt: new Date(), metadata: { symbol: input.symbol, accountId: input.accountId } })
    }

    const createInput: CreateTradeRecordInput = {
      accountId: input.accountId, symbol: input.symbol.toUpperCase(), direction: input.direction,
      orderType: input.orderType, quantity: input.quantity, entryPrice: execution.executionPrice ?? entryPrice,
      status: execution.executed ? 'OPEN' : 'PENDING', enteredAt: execution.executed ? new Date() : null, closedAt: null,
      ...(input.orderType === 'LIMIT' && input.limitPrice !== undefined && { limitPrice: input.limitPrice }),
      ...(input.orderType === 'STOP' && input.stopPrice !== undefined && { stopPrice: input.stopPrice }),
    }

    const persisted = await this.d.tradeRepo.create(createInput)
    return { trade: persisted, execution }
  }

  async closeTrade(tradeId: string): Promise<{ trade: PersistedTradeRecord; market: MarketData; pnl: number }> {
    const record = await this.d.tradeRepo.findById(tradeId)
    if (!record) throw new Error('Trade not found.')
    getState(record.status).close({ tradeId })

    const market = await this.d.marketData.getMarketData(record.symbol)
    // Rebuild Trade object for PnL calc
    const tradeObj = TradeFactory.create(record.orderType, { id: record.id, accountId: record.accountId, symbol: record.symbol, direction: record.direction, orderType: record.orderType, quantity: record.quantity, entryPrice: record.entryPrice, status: record.status, enteredAt: record.enteredAt, closedAt: record.closedAt, ...(record.limitPrice !== undefined ? { limitPrice: record.limitPrice } as any : {}), ...(record.stopPrice !== undefined ? { stopPrice: record.stopPrice } as any : {}) } as TradeCreationParams)
    const pnl = tradeObj.calculatePnL(market.currentPrice)

    const updated = await this.d.tradeRepo.update(record.id, { status: 'CLOSED', closedAt: new Date() })
    const account = await this.d.accountRepo.findById(record.accountId)
    if (!account) throw new Error('Account not found.')

    await this.d.publisher.notify({ type: 'TRADE_CLOSED', tradeId: record.id, accountId: record.accountId, userId: account.userId, occurredAt: new Date(), metadata: { symbol: record.symbol } })
    return { trade: updated, market, pnl }
  }

  async cancelTrade(tradeId: string): Promise<{ trade: PersistedTradeRecord }> {
    const record = await this.d.tradeRepo.findById(tradeId)
    if (!record) throw new Error('Trade not found.')
    getState(record.status).cancel({ tradeId })
    await this.d.publisher.notify({ type: 'TRADE_CANCELLED', tradeId: record.id, status: 'CANCELLED', occurredAt: new Date(), metadata: { symbol: record.symbol } })
    const updated = await this.d.tradeRepo.update(record.id, { status: 'CANCELLED' })
    return { trade: updated }
  }
}

export function createTradeService(tradeRepo: ITradeRepository, accountRepo: IAccountRepository, positionRepo: IPositionRepository, analyticsRepo: IAnalyticsReportRepository): TradeService {
  const marketData = createMarketDataService()
  const publisher = new TradeEventPublisher()
  publisher.subscribe(new PnLCalculatorObserver(tradeRepo, accountRepo, marketData, positionRepo))
  publisher.subscribe(new AnalyticsTriggerObserver(analyticsRepo))
  publisher.subscribe(new NotificationObserver(new ConsoleNotifier()))
  return new TradeService({ tradeRepo, accountRepo, marketData, publisher, positionRepo, analyticsRepo })
}
