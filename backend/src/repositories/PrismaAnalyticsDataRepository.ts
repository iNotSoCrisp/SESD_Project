import type { TradeData } from '../patterns/analytics/AnalyticsEngine';
import type { IAnalyticsDataRepository } from './interfaces/IAnalyticsDataRepository';
import { prisma } from './prisma';

export class PrismaAnalyticsDataRepository implements IAnalyticsDataRepository {
  async findClosedTradesWithEmotionsAndPositions(userId: string): Promise<readonly TradeData[]> {
    const trades = await prisma.trade.findMany({
      where: {
        status: 'CLOSED',
        tradingAccount: {
          userId,
        },
        exitPrice: { not: null },
        openedAt: { not: null },
        closedAt: { not: null },
      },
      include: {
        position: true,
        emotionLogs: true,
      },
      orderBy: { closedAt: 'desc' },
    });

    return trades
      .map((trade) => {
        const exitPrice = Number(trade.exitPrice!);
        const entryPrice = trade.entryPrice !== null ? Number(trade.entryPrice) : 0;
        const rawPnl = (exitPrice - entryPrice) * Number(trade.quantity);
        const pnl = trade.direction === 'SHORT' ? rawPnl * -1 : rawPnl;
        const costBasis = entryPrice * Number(trade.quantity);
        const pnlPercent = costBasis === 0 ? 0 : (pnl / costBasis) * 100;

        const postEmotion = trade.emotionLogs.find((e) => e.phase === 'POST');
        const preEmotion = trade.emotionLogs.find((e) => e.phase === 'PRE');

        return {
          tradeId: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice,
          exitPrice,
          pnl,
          pnlPercent,
          enteredAt: trade.openedAt!,
          closedAt: trade.closedAt!,
          emotionType: postEmotion?.emotionType ?? preEmotion?.emotionType ?? undefined,
          emotionIntensity: postEmotion?.intensity ?? preEmotion?.intensity,
        };
      });
  }
}
