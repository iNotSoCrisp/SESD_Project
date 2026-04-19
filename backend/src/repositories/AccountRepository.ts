import { PrismaClient } from '@prisma/client'
import type { TradingAccountSummary, CreateTradingAccountInput, AnalyticsReportRecord } from '../types'

const prisma = new PrismaClient()

// ─── Trading Account Repository ──────────────────────────────────────────────
export interface IAccountRepository {
  findById(id: string): Promise<TradingAccountSummary | null>
  findByUserId(userId: string): Promise<readonly TradingAccountSummary[]>
  create(data: CreateTradingAccountInput): Promise<TradingAccountSummary>
  updateBalance(id: string, newBalance: number): Promise<TradingAccountSummary>
  resetWallet(id: string): Promise<void>
}

export class AccountRepository implements IAccountRepository {
  async resetWallet(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Delete all trades for the account (cascade will delete positions and emotionLogs)
      await tx.trade.deleteMany({ where: { tradingAccountId: id } })
      // Reset balance to 100000
      await tx.tradingAccount.update({ where: { id }, data: { balance: 100000 } })
    })
  }
  async findById(id: string): Promise<TradingAccountSummary | null> {
    const r = await prisma.tradingAccount.findUnique({ where: { id } }); return r ? this.toSummary(r) : null
  }
  async findByUserId(userId: string): Promise<readonly TradingAccountSummary[]> {
    const records = await prisma.tradingAccount.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return records.map(r => this.toSummary(r))
  }
  async create(data: CreateTradingAccountInput): Promise<TradingAccountSummary> {
    const c = await prisma.tradingAccount.create({ data: { userId: data.userId, name: data.name, currency: data.currency, balance: data.balance, ...(data.broker !== undefined && { broker: data.broker }) } })
    return this.toSummary(c)
  }
  async updateBalance(id: string, newBalance: number): Promise<TradingAccountSummary> {
    const u = await prisma.tradingAccount.update({ where: { id }, data: { balance: newBalance } }); return this.toSummary(u)
  }
  private toSummary(r: { id: string; userId: string; name: string; balance: import('@prisma/client').Prisma.Decimal; isActive: boolean; broker: string | null; currency: string }): TradingAccountSummary {
    return { id: r.id, userId: r.userId, name: r.name, balance: Number(r.balance), isActive: r.isActive, broker: r.broker ?? undefined, currency: r.currency }
  }
}

// ─── Analytics Report Repository (merged) ────────────────────────────────────
export interface IAnalyticsReportRepository {
  markAllAsStaleByUserId(userId: string): Promise<number>
  findByUserAndType(userId: string, reportType: string): Promise<AnalyticsReportRecord | null>
  upsert(userId: string, reportType: string, data: Record<string, unknown>, isStale: boolean): Promise<AnalyticsReportRecord>
}

export class AnalyticsReportRepository implements IAnalyticsReportRepository {
  async markAllAsStaleByUserId(userId: string): Promise<number> {
    const r = await prisma.analyticsReport.updateMany({ where: { userId }, data: { isStale: true } }); return r.count
  }
  async findByUserAndType(userId: string, reportType: string): Promise<AnalyticsReportRecord | null> {
    const r = await prisma.analyticsReport.findUnique({ where: { userId_reportType: { userId, reportType } } }); return r ? this.toRecord(r) : null
  }
  async upsert(userId: string, reportType: string, data: Record<string, unknown>, isStale: boolean): Promise<AnalyticsReportRecord> {
    const r = await prisma.analyticsReport.upsert({
      where: { userId_reportType: { userId, reportType } },
      update: { data: data as import('@prisma/client').Prisma.InputJsonValue, isStale, generatedAt: new Date() },
      create: { userId, reportType, data: data as import('@prisma/client').Prisma.InputJsonValue, isStale }
    })
    return this.toRecord(r)
  }
  private toRecord(r: { id: string; userId: string; reportType: string; data: import('@prisma/client').Prisma.JsonValue; isStale: boolean; generatedAt: Date }): AnalyticsReportRecord {
    return { id: r.id, userId: r.userId, reportType: r.reportType, data: r.data as Record<string, unknown>, isStale: r.isStale, generatedAt: r.generatedAt }
  }
}
