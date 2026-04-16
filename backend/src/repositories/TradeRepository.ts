import { PrismaClient } from '@prisma/client'
import type {
  CreateTradeRecordInput, PersistedTradeRecord, TradeListFilters,
  UpdateTradeRecordInput, TradeStatus, CreatePositionInput, PositionRecord, TradeData
} from '../types'

const prisma = new PrismaClient()

// ─── Trade Repository ────────────────────────────────────────────────────────
export interface ITradeRepository {
  findMany(filters: TradeListFilters): Promise<readonly PersistedTradeRecord[]>
  findById(id: string): Promise<PersistedTradeRecord | null>
  findByAccountId(accountId: string, filters?: TradeListFilters): Promise<readonly PersistedTradeRecord[]>
  findByUserId(userId: string, filters?: TradeListFilters): Promise<readonly PersistedTradeRecord[]>
  create(input: CreateTradeRecordInput): Promise<PersistedTradeRecord>
  update(id: string, input: UpdateTradeRecordInput): Promise<PersistedTradeRecord>
  updateStatus(id: string, status: TradeStatus, closedAt?: Date): Promise<PersistedTradeRecord>
}

export class TradeRepository implements ITradeRepository {
  async findMany(filters: TradeListFilters): Promise<readonly PersistedTradeRecord[]> {
    const where: Record<string, unknown> = {}
    if (filters.accountId) where.tradingAccountId = filters.accountId
    if (filters.symbol) where.symbol = filters.symbol
    if (filters.status) where.status = filters.status
    if (filters.direction) where.direction = filters.direction
    if (filters.orderType) where.orderType = filters.orderType
    const records = await prisma.trade.findMany({
      where,
      include: {
        position: true,
        emotionLogs: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return records.map(r => this.toRecord(r))
  }
  async findById(id: string): Promise<PersistedTradeRecord | null> {
    const r = await prisma.trade.findUnique({ where: { id } }); return r ? this.toRecord(r) : null
  }
  async create(input: CreateTradeRecordInput): Promise<PersistedTradeRecord> {
    const c = await prisma.trade.create({
      data: {
        ...(input.id && input.id.length > 0 && { id: input.id }),
        tradingAccountId: input.accountId, symbol: input.symbol, direction: input.direction,
        orderType: input.orderType, quantity: input.quantity, entryPrice: input.entryPrice,
        status: input.status, openedAt: input.enteredAt, closedAt: input.closedAt,
        ...(input.limitPrice !== undefined && { limitPrice: input.limitPrice }),
        ...(input.stopPrice !== undefined && { stopPrice: input.stopPrice }),
      }
    })
    return this.toRecord(c)
  }
  async update(id: string, input: UpdateTradeRecordInput): Promise<PersistedTradeRecord> {
    const data: Record<string, unknown> = {}
    if (input.status !== undefined) data.status = input.status
    if (input.entryPrice !== undefined) data.entryPrice = input.entryPrice
    if (input.enteredAt !== undefined) data.openedAt = input.enteredAt
    if (input.closedAt !== undefined) data.closedAt = input.closedAt
    const u = await prisma.trade.update({ where: { id }, data }); return this.toRecord(u)
  }
  async findByAccountId(accountId: string, filters?: TradeListFilters): Promise<readonly PersistedTradeRecord[]> {
    const where: Record<string, unknown> = { tradingAccountId: accountId }
    if (filters?.symbol) where.symbol = filters.symbol
    if (filters?.status) where.status = filters.status
    if (filters?.direction) where.direction = filters.direction
    if (filters?.orderType) where.orderType = filters.orderType
    const records = await prisma.trade.findMany({
      where,
      include: { position: true },
      orderBy: { createdAt: 'desc' }
    })
    return records.map(r => this.toRecord(r))
  }
  async findByUserId(userId: string, filters?: TradeListFilters): Promise<readonly PersistedTradeRecord[]> {
    const where: Record<string, unknown> = { tradingAccount: { userId } }
    if (filters?.symbol) where.symbol = filters.symbol
    if (filters?.status) where.status = filters.status
    if (filters?.direction) where.direction = filters.direction
    if (filters?.orderType) where.orderType = filters.orderType
    const records = await prisma.trade.findMany({ where, orderBy: { createdAt: 'desc' } })
    return records.map(r => this.toRecord(r))
  }
  async updateStatus(id: string, status: TradeStatus, closedAt?: Date): Promise<PersistedTradeRecord> {
    const u = await prisma.trade.update({ where: { id }, data: { status, ...(closedAt && { closedAt }) } }); return this.toRecord(u)
  }
  private toRecord(r: { id: string; tradingAccountId: string; symbol: string; direction: 'LONG'|'SHORT'; orderType: 'MARKET'|'LIMIT'|'STOP'; quantity: import('@prisma/client').Prisma.Decimal; entryPrice: import('@prisma/client').Prisma.Decimal | null; status: 'PENDING'|'OPEN'|'CLOSED'|'CANCELLED'; openedAt: Date | null; closedAt: Date | null; limitPrice: import('@prisma/client').Prisma.Decimal | null; stopPrice: import('@prisma/client').Prisma.Decimal | null; position?: { realizedPnl: import('@prisma/client').Prisma.Decimal | null; returnPct: import('@prisma/client').Prisma.Decimal | null } | null }): PersistedTradeRecord {
    const base: PersistedTradeRecord = {
      id: r.id, accountId: r.tradingAccountId, symbol: r.symbol, direction: r.direction,
      orderType: r.orderType, quantity: Number(r.quantity),
      entryPrice: r.entryPrice !== null ? Number(r.entryPrice) : 0,
      status: r.status, enteredAt: r.openedAt, closedAt: r.closedAt,
      ...(r.limitPrice !== null && { limitPrice: Number(r.limitPrice) }),
      ...(r.stopPrice !== null && { stopPrice: Number(r.stopPrice) }),
      ...(r.position != null && {
        position: {
          realizedPnl: r.position.realizedPnl !== null ? Number(r.position.realizedPnl) : null,
          returnPct: r.position.returnPct !== null ? Number(r.position.returnPct) : null,
        }
      }),
    }
    return base
  }
}

// ─── Position Repository (merged) ────────────────────────────────────────────
export interface IPositionRepository {
  create(input: CreatePositionInput): Promise<PositionRecord>
  findByTradeId(tradeId: string): Promise<PositionRecord | null>
}

export class PositionRepository implements IPositionRepository {
  async create(input: CreatePositionInput): Promise<PositionRecord> {
    const p = await prisma.position.create({ data: { tradeId: input.tradeId, realizedPnl: input.realizedPnl, returnPct: input.returnPct, ...(input.durationMins !== undefined && { durationMins: input.durationMins }), ...(input.maxDrawdown !== undefined && { maxDrawdown: input.maxDrawdown }), ...(input.maxProfit !== undefined && { maxProfit: input.maxProfit }) } })
    return this.toRecord(p)
  }
  async findByTradeId(tradeId: string): Promise<PositionRecord | null> {
    const p = await prisma.position.findUnique({ where: { tradeId } }); return p ? this.toRecord(p) : null
  }
  private toRecord(p: { id: string; tradeId: string; realizedPnl: import('@prisma/client').Prisma.Decimal | null; returnPct: import('@prisma/client').Prisma.Decimal | null; durationMins: number | null; maxDrawdown: import('@prisma/client').Prisma.Decimal | null; maxProfit: import('@prisma/client').Prisma.Decimal | null; createdAt: Date; updatedAt: Date }): PositionRecord {
    return { id: p.id, tradeId: p.tradeId, realizedPnl: p.realizedPnl === null ? null : Number(p.realizedPnl), returnPct: p.returnPct === null ? null : Number(p.returnPct), durationMins: p.durationMins, maxDrawdown: p.maxDrawdown === null ? null : Number(p.maxDrawdown), maxProfit: p.maxProfit === null ? null : Number(p.maxProfit), createdAt: p.createdAt, updatedAt: p.updatedAt }
  }
}

// ─── Analytics Data Repository (merged) ──────────────────────────────────────
export interface IAnalyticsDataRepository {
  findClosedTradesWithEmotionsAndPositions(userId: string): Promise<readonly TradeData[]>
}

export class AnalyticsDataRepository implements IAnalyticsDataRepository {
  async findClosedTradesWithEmotionsAndPositions(userId: string): Promise<readonly TradeData[]> {
    const trades = await prisma.trade.findMany({
      where: { status: 'CLOSED', tradingAccount: { userId }, exitPrice: { not: null }, openedAt: { not: null }, closedAt: { not: null } },
      include: { position: true, emotionLogs: true }, orderBy: { closedAt: 'desc' }
    })
    return trades.map(t => {
      const exitPrice = Number(t.exitPrice!), entryPrice = t.entryPrice !== null ? Number(t.entryPrice) : 0
      const rawPnl = (exitPrice - entryPrice) * Number(t.quantity)
      const pnl = t.direction === 'SHORT' ? rawPnl * -1 : rawPnl
      const costBasis = entryPrice * Number(t.quantity)
      const pnlPercent = costBasis === 0 ? 0 : (pnl / costBasis) * 100
      const postEmotion = t.emotionLogs.find(e => e.phase === 'POST')
      const preEmotion = t.emotionLogs.find(e => e.phase === 'PRE')
      return { tradeId: t.id, symbol: t.symbol, direction: t.direction as 'LONG'|'SHORT', entryPrice, exitPrice, pnl, pnlPercent, enteredAt: t.openedAt!, closedAt: t.closedAt!, emotionType: postEmotion?.emotionType ?? preEmotion?.emotionType ?? undefined, emotionIntensity: postEmotion?.intensity ?? preEmotion?.intensity }
    })
  }
}
