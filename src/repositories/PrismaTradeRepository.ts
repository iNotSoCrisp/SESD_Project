import type { Prisma } from '@prisma/client';
import type {
  CreateTradeRecordInput,
  ITradeRepository,
  PersistedTradeRecord,
  TradeListFilters,
  TradeStatus,
  UpdateTradeRecordInput,
} from './interfaces/ITradeRepository';
import { prisma } from './prisma';

export class PrismaTradeRepository implements ITradeRepository {
  async findMany(filters: TradeListFilters): Promise<ReadonlyArray<PersistedTradeRecord>> {
    const where: Prisma.TradeWhereInput = {};
    if (filters.accountId !== undefined) {
      where.tradingAccountId = filters.accountId;
    }
    if (filters.symbol !== undefined) {
      where.symbol = filters.symbol;
    }
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    if (filters.direction !== undefined) {
      where.direction = filters.direction;
    }
    if (filters.orderType !== undefined) {
      where.orderType = filters.orderType;
    }

    const records = await prisma.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toPersistedTradeRecord(record));
  }

  async findById(id: string): Promise<PersistedTradeRecord | null> {
    const record = await prisma.trade.findUnique({
      where: { id },
    });

    if (record === null) {
      return null;
    }

    return this.toPersistedTradeRecord(record);
  }

  async create(input: CreateTradeRecordInput): Promise<PersistedTradeRecord> {
    const created = await prisma.trade.create({
      data: {
        ...(input.id !== undefined && input.id.length > 0 && { id: input.id }),
        tradingAccountId: input.accountId,
        symbol: input.symbol,
        direction: input.direction,
        orderType: input.orderType,
        quantity: input.quantity,
        entryPrice: input.entryPrice,
        status: input.status,
        openedAt: input.enteredAt,
        closedAt: input.closedAt,
        ...(input.limitPrice !== undefined && { limitPrice: input.limitPrice }),
        ...(input.stopPrice !== undefined && { stopPrice: input.stopPrice }),
      },
    });

    return this.toPersistedTradeRecord(created);
  }

  async update(id: string, input: UpdateTradeRecordInput): Promise<PersistedTradeRecord> {
    const data: Record<string, unknown> = {};
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.entryPrice !== undefined) {
      data.entryPrice = input.entryPrice;
    }
    if (input.enteredAt !== undefined) {
      data.openedAt = input.enteredAt;
    }
    if (input.closedAt !== undefined) {
      data.closedAt = input.closedAt;
    }

    const updated = await prisma.trade.update({
      where: { id },
      data,
    });

    return this.toPersistedTradeRecord(updated);
  }

  async findByAccountId(accountId: string, filters?: TradeListFilters): Promise<ReadonlyArray<PersistedTradeRecord>> {
    return this.findMany({ ...(filters ?? {}), accountId });
  }

  async findByUserId(userId: string, filters?: TradeListFilters): Promise<ReadonlyArray<PersistedTradeRecord>> {
    const where: Prisma.TradeWhereInput = {
      tradingAccount: {
        userId,
      },
    };
    if (filters?.symbol !== undefined) {
      where.symbol = filters.symbol;
    }
    if (filters?.status !== undefined) {
      where.status = filters.status;
    }
    if (filters?.direction !== undefined) {
      where.direction = filters.direction;
    }
    if (filters?.orderType !== undefined) {
      where.orderType = filters.orderType;
    }

    const records = await prisma.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toPersistedTradeRecord(record));
  }

  async updateStatus(id: string, status: TradeStatus, closedAt?: Date): Promise<PersistedTradeRecord> {
    const updated = await prisma.trade.update({
      where: { id },
      data: {
        status,
        ...(closedAt !== undefined && { closedAt }),
      },
    });

    return this.toPersistedTradeRecord(updated);
  }

  private toPersistedTradeRecord(record: {
    id: string;
    tradingAccountId: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    orderType: 'MARKET' | 'LIMIT' | 'STOP';
    quantity: import('@prisma/client').Prisma.Decimal;
    entryPrice: import('@prisma/client').Prisma.Decimal | null;
    status: 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED';
    openedAt: Date | null;
    closedAt: Date | null;
    limitPrice: import('@prisma/client').Prisma.Decimal | null;
    stopPrice: import('@prisma/client').Prisma.Decimal | null;
  }): PersistedTradeRecord {
    const base = {
      id: record.id,
      accountId: record.tradingAccountId,
      symbol: record.symbol,
      direction: record.direction,
      orderType: record.orderType,
      quantity: Number(record.quantity),
      entryPrice: record.entryPrice !== null ? Number(record.entryPrice) : 0,
      status: record.status,
      enteredAt: record.openedAt,
      closedAt: record.closedAt,
    };

    if (record.limitPrice !== null) {
      return {
        ...base,
        limitPrice: Number(record.limitPrice),
      };
    }

    if (record.stopPrice !== null) {
      return {
        ...base,
        stopPrice: Number(record.stopPrice),
      };
    }

    return base;
  }
}
