import type { Insight, ProcessedData, TradeData } from './AnalyticsEngine';
import { AnalyticsEngine } from './AnalyticsEngine';

const TIME_BUCKETS = ['morning', 'afternoon', 'evening', 'night'] as const;

function getTimeBucket(date: Date): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export class TimeOfDayAnalyzer extends AnalyticsEngine {
  protected reportType = 'time-of-day';

  protected async fetchData(_userId: string): Promise<readonly TradeData[]> {
    return [];
  }

  protected processData(data: readonly TradeData[]): ProcessedData {
    const bucketMap = new Map<string, { trades: number; wins: number; totalPnlPercent: number }>();

    for (const trade of data) {
      const bucket = getTimeBucket(trade.enteredAt);
      const existing = bucketMap.get(bucket) ?? { trades: 0, wins: 0, totalPnlPercent: 0 };
      existing.trades += 1;
      if (trade.pnl > 0) {
        existing.wins += 1;
      }
      existing.totalPnlPercent += trade.pnlPercent;
      bucketMap.set(bucket, existing);
    }

    const groups = new Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>();
    for (const [bucket, stats] of bucketMap) {
      groups.set(bucket, {
        trades: stats.trades,
        wins: stats.wins,
        avgPnl: 0,
        avgPnlPercent: stats.totalPnlPercent / stats.trades,
      });
    }

    return { groups };
  }

  protected generateInsights(data: ProcessedData): readonly Insight[] {
    const insights: Insight[] = [];

    const bucketLabels: Record<string, string> = {
      morning: 'Morning (6AM–12PM)',
      afternoon: 'Afternoon (12PM–5PM)',
      evening: 'Evening (5PM–9PM)',
      night: 'Night (9PM–6AM)',
    };

    for (const bucket of TIME_BUCKETS) {
      const stats = data.groups.get(bucket);
      if (stats === undefined || stats.trades === 0) continue;
      const winRate = ((stats.wins / stats.trades) * 100).toFixed(0);
      insights.push({
        key: bucket,
        message: `${bucketLabels[bucket]} trades: ${winRate}% win rate (${stats.wins}/${stats.trades} trades).`,
      });
    }

    return insights;
  }
}
