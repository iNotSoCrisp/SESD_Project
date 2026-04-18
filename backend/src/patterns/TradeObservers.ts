import type { TradeStatus, MarketData, IMarketDataService, CreatePositionInput, AnalyticsReportRecord } from '../types'
import type { ITradeRepository, IPositionRepository } from '../repositories/TradeRepository'
import type { IAccountRepository, IAnalyticsReportRepository } from '../repositories/AccountRepository'
import type { TradingAccountSummary } from '../types'

// ─── Events & Publisher ──────────────────────────────────────────────────────
export type TradeEventType = 'TRADE_OPENED' | 'TRADE_CLOSED' | 'TRADE_CANCELLED'

export type TradeEvent =
  | { readonly type: 'TRADE_OPENED'; readonly tradeId: string; readonly occurredAt: Date; readonly status: TradeStatus; readonly metadata?: Readonly<Record<string, string | number | boolean | null>> }
  | { readonly type: 'TRADE_CLOSED'; readonly tradeId: string; readonly accountId: string; readonly userId: string; readonly occurredAt: Date; readonly metadata?: Readonly<Record<string, string | number | boolean | null>> }
  | { readonly type: 'TRADE_CANCELLED'; readonly tradeId: string; readonly occurredAt: Date; readonly status: TradeStatus; readonly metadata?: Readonly<Record<string, string | number | boolean | null>> }

export interface TradeEventObserver { onTradeEvent(event: TradeEvent): void | Promise<void> }

export class TradeEventPublisher {
  private readonly observers: TradeEventObserver[] = []
  subscribe(o: TradeEventObserver): void { this.observers.push(o) }
  unsubscribe(o: TradeEventObserver): void { const i = this.observers.indexOf(o); if (i >= 0) this.observers.splice(i, 1) }
  async notify(event: TradeEvent): Promise<void> { await Promise.all(this.observers.map(o => o.onTradeEvent(event))) }
}

// ─── Notifier ────────────────────────────────────────────────────────────────
export interface Notifier { notify(message: string): void | Promise<void> }
export class ConsoleNotifier implements Notifier { notify(m: string): void { console.log(m) } }

// ─── PnLCalculatorObserver ───────────────────────────────────────────────────
export class PnLCalculatorObserver implements TradeEventObserver {
  constructor(
    private readonly tradeRepo: ITradeRepository,
    private readonly accountRepo: IAccountRepository,
    private readonly marketData: IMarketDataService,
    private readonly positionRepo: IPositionRepository,
  ) {}
  async onTradeEvent(event: TradeEvent): Promise<void> {
    if (event.type !== 'TRADE_CLOSED') return
    const trade = await this.tradeRepo.findById(event.tradeId)
    if (!trade) throw new Error(`Trade not found for PnL: ${event.tradeId}`)
    const account = await this.accountRepo.findById(event.accountId)
    if (!account) throw new Error(`Account not found for PnL: ${event.accountId}`)
    if ((account as { userId: string }).userId !== (event as { userId?: string }).userId) throw new Error('User context mismatch.')
    const market = await this.marketData.getMarketData(trade.symbol)
    const exitPrice = market.currentPrice
    const rawPnl = (exitPrice - trade.entryPrice) * trade.quantity
    const pnl = trade.direction === 'SHORT' ? rawPnl * -1 : rawPnl
    const costBasis = trade.entryPrice * trade.quantity
    const pnlPercent = costBasis === 0 ? 0 : (pnl / costBasis) * 100
    const durationMins = trade.enteredAt && trade.closedAt ? Math.max(0, Math.round((trade.closedAt.getTime() - trade.enteredAt.getTime()) / 60000)) : undefined
    await this.positionRepo.create({ tradeId: trade.id, realizedPnl: pnl, returnPct: pnlPercent, ...(durationMins !== undefined && { durationMins }) })
    await this.accountRepo.updateBalance(account.id, account.balance + costBasis + pnl)
  }
}

// ─── AnalyticsTriggerObserver ────────────────────────────────────────────────
export class AnalyticsTriggerObserver implements TradeEventObserver {
  constructor(private readonly repo: IAnalyticsReportRepository) {}
  async onTradeEvent(event: TradeEvent): Promise<void> {
    if (event.type !== 'TRADE_CLOSED') return
    await this.repo.markAllAsStaleByUserId((event as { userId: string }).userId)
  }
}

// ─── NotificationObserver ────────────────────────────────────────────────────
export class NotificationObserver implements TradeEventObserver {
  constructor(private readonly notifier: Notifier) {}
  async onTradeEvent(event: TradeEvent): Promise<void> {
    if (event.type !== 'TRADE_CLOSED') return
    await this.notifier.notify(`Trade ${event.tradeId} closed for account ${(event as { accountId: string }).accountId} and user ${(event as { userId: string }).userId}.`)
  }
}
