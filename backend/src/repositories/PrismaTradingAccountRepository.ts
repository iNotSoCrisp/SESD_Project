import type {
  CreateTradingAccountInput,
  ITradingAccountRepository,
  TradingAccountSummary,
} from './interfaces/ITradingAccountRepository';
import { prisma } from './prisma';

export class PrismaTradingAccountRepository implements ITradingAccountRepository {
  async findById(id: string): Promise<TradingAccountSummary | null> {
    const record = await prisma.tradingAccount.findUnique({
      where: { id },
    });

    if (record === null) {
      return null;
    }

    return this.toSummary(record);
  }

  async findByUserId(userId: string): Promise<ReadonlyArray<TradingAccountSummary>> {
    const records = await prisma.tradingAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toSummary(record));
  }

  async create(data: CreateTradingAccountInput): Promise<TradingAccountSummary> {
    const created = await prisma.tradingAccount.create({
      data: {
        userId: data.userId,
        name: data.name,
        currency: data.currency,
        balance: data.balance,
        ...(data.broker !== undefined && { broker: data.broker }),
      },
    });

    return this.toSummary(created);
  }

  async updateBalance(id: string, newBalance: number): Promise<TradingAccountSummary> {
    const updated = await prisma.tradingAccount.update({
      where: { id },
      data: { balance: newBalance },
    });

    return this.toSummary(updated);
  }

  private toSummary(record: {
    id: string;
    userId: string;
    name: string;
    balance: import('@prisma/client').Prisma.Decimal;
    isActive: boolean;
    broker: string | null;
    currency: string;
  }): TradingAccountSummary {
    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      balance: Number(record.balance),
      isActive: record.isActive,
      broker: record.broker ?? undefined,
      currency: record.currency,
    };
  }
}
