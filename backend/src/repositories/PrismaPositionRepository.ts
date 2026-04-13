import type {
  CreatePositionInput,
  IPositionRepository,
  PositionRecord,
} from './interfaces/IPositionRepository';
import { prisma } from './prisma';

export class PrismaPositionRepository implements IPositionRepository {

  async create(input: CreatePositionInput): Promise<PositionRecord> {
    const position = await prisma.position.create({
      data: {
        tradeId: input.tradeId,
        realizedPnl: input.realizedPnl,
        returnPct: input.returnPct,
        ...(input.durationMins !== undefined && { durationMins: input.durationMins }),
        ...(input.maxDrawdown !== undefined && { maxDrawdown: input.maxDrawdown }),
        ...(input.maxProfit !== undefined && { maxProfit: input.maxProfit }),
      },
    });

    return {
      id: position.id,
      tradeId: position.tradeId,
      realizedPnl: position.realizedPnl === null ? null : Number(position.realizedPnl),
      returnPct: position.returnPct === null ? null : Number(position.returnPct),
      durationMins: position.durationMins,
      maxDrawdown: position.maxDrawdown === null ? null : Number(position.maxDrawdown),
      maxProfit: position.maxProfit === null ? null : Number(position.maxProfit),
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }

  async findByTradeId(tradeId: string): Promise<PositionRecord | null> {
    const position = await prisma.position.findUnique({
      where: { tradeId },
    });

    if (position === null) {
      return null;
    }

    return {
      id: position.id,
      tradeId: position.tradeId,
      realizedPnl: position.realizedPnl === null ? null : Number(position.realizedPnl),
      returnPct: position.returnPct === null ? null : Number(position.returnPct),
      durationMins: position.durationMins,
      maxDrawdown: position.maxDrawdown === null ? null : Number(position.maxDrawdown),
      maxProfit: position.maxProfit === null ? null : Number(position.maxProfit),
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }
}