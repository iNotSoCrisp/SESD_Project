import type { Insight, ProcessedData, TradeData } from './AnalyticsEngine';
import { AnalyticsEngine } from './AnalyticsEngine';

export class WinRateAnalyzer extends AnalyticsEngine {
  protected reportType = 'win-rate';

  protected async fetchData(_userId: string): Promise<readonly TradeData[]> {
    return [];
  }

  protected processData(data: readonly TradeData[]): ProcessedData {
    const symbolGroups = new Map<string, { trades: number; wins: number; totalPnlPercent: number; totalPnl: number }>();

    for (const trade of data) {
      const existing = symbolGroups.get(trade.symbol) ?? { trades: 0, wins: 0, totalPnlPercent: 0, totalPnl: 0 };
      existing.trades += 1;
      if (trade.pnl > 0) {
        existing.wins += 1;
      }
      existing.totalPnlPercent += trade.pnlPercent;
      existing.totalPnl += trade.pnl;
      symbolGroups.set(trade.symbol, existing);
    }

    const groups = new Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>();
    for (const [symbol, stats] of symbolGroups) {
      groups.set(symbol, {
        trades: stats.trades,
        wins: stats.wins,
        avgPnl: stats.totalPnl / stats.trades,
        avgPnlPercent: stats.totalPnlPercent / stats.trades,
      });
    }

    return { groups };
  }

  protected generateInsights(data: ProcessedData): readonly Insight[] {
    const insights: Insight[] = [];

    for (const [symbol, stats] of data.groups) {
      const winRate = ((stats.wins / stats.trades) * 100).toFixed(0);
      const sign = stats.avgPnlPercent >= 0 ? '+' : '';
      insights.push({
        key: symbol,
        message: `${symbol}: ${winRate}% win rate, avg ${sign}${stats.avgPnlPercent.toFixed(1)}% P&L across ${stats.trades} trades.`,
      });
    }

    return insights;
  }
}
