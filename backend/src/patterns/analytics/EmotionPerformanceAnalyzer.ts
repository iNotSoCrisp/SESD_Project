import type { Insight, ProcessedData, TradeData } from './AnalyticsEngine';
import { AnalyticsEngine } from './AnalyticsEngine';

export class EmotionPerformanceAnalyzer extends AnalyticsEngine {
  protected reportType = 'emotion-performance';

  protected async fetchData(_userId: string): Promise<readonly TradeData[]> {
    // Delegated to IAnalyticsDataRepository in the service layer
    return [];
  }

  protected processData(data: readonly TradeData[]): ProcessedData {
    const emotionGroups = new Map<string, { trades: number; totalPnlPercent: number; totalPnl: number }>();

    for (const trade of data) {
      const emotion = trade.emotionType ?? 'NEUTRAL';
      const existing = emotionGroups.get(emotion) ?? { trades: 0, totalPnlPercent: 0, totalPnl: 0 };
      existing.trades += 1;
      existing.totalPnlPercent += trade.pnlPercent;
      existing.totalPnl += trade.pnl;
      emotionGroups.set(emotion, existing);
    }

    const groups = new Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>();
    for (const [emotion, stats] of emotionGroups) {
      groups.set(emotion, {
        trades: stats.trades,
        wins: 0,
        avgPnl: stats.totalPnl / stats.trades,
        avgPnlPercent: stats.totalPnlPercent / stats.trades,
      });
    }

    return { groups };
  }

  protected generateInsights(data: ProcessedData): readonly Insight[] {
    const insights: Insight[] = [];

    for (const [emotion, stats] of data.groups) {
      const sign = stats.avgPnlPercent >= 0 ? '+' : '';
      insights.push({
        key: emotion,
        message: `Average ${sign}${stats.avgPnlPercent.toFixed(1)}% P&L when trading with ${emotion} emotion across ${stats.trades} trades.`,
      });
    }

    if (insights.length >= 2) {
      const sorted = [...data.groups.entries()].sort((a, b) => b[1].avgPnlPercent - a[1].avgPnlPercent);
      const best = sorted[0]!;
      const worst = sorted[sorted.length - 1]!;
      insights.push({
        key: 'comparison',
        message: `Best performance with ${best[0]} (${best[1].avgPnlPercent.toFixed(1)}% avg) vs worst with ${worst[0]} (${worst[1].avgPnlPercent.toFixed(1)}% avg).`,
      });
    }

    return insights;
  }
}
