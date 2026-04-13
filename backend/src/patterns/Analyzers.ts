import type { TradeData, ProcessedData, Insight, InsightReport } from '../types'

// ─── Template Method Base ────────────────────────────────────────────────────
export abstract class AnalyticsEngine {
  protected abstract reportType: string
  async analyze(_userId: string): Promise<InsightReport> {
    const raw = await this.fetchData(_userId)
    const processed = this.processData(raw)
    const insights = this.generateInsights(processed)
    return { type: this.reportType, insights, generatedAt: new Date() }
  }
  analyzeWithData(data: readonly TradeData[]): InsightReport {
    const processed = this.processData(data)
    const insights = this.generateInsights(processed)
    return { type: this.reportType, insights, generatedAt: new Date() }
  }
  protected abstract fetchData(userId: string): Promise<readonly TradeData[]>
  protected abstract processData(data: readonly TradeData[]): ProcessedData
  protected abstract generateInsights(data: ProcessedData): readonly Insight[]
}

// ─── EmotionPerformanceAnalyzer ──────────────────────────────────────────────
export class EmotionPerformanceAnalyzer extends AnalyticsEngine {
  protected reportType = 'emotion-performance'
  protected async fetchData(): Promise<readonly TradeData[]> { return [] }
  protected processData(data: readonly TradeData[]): ProcessedData {
    const groups = new Map<string, { trades: number; totalPnlPercent: number; totalPnl: number }>()
    for (const t of data) {
      const e = t.emotionType ?? 'NEUTRAL'; const g = groups.get(e) ?? { trades: 0, totalPnlPercent: 0, totalPnl: 0 }
      g.trades++; g.totalPnlPercent += t.pnlPercent; g.totalPnl += t.pnl; groups.set(e, g)
    }
    const result = new Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>()
    for (const [e, s] of groups) result.set(e, { trades: s.trades, wins: 0, avgPnl: s.totalPnl / s.trades, avgPnlPercent: s.totalPnlPercent / s.trades })
    return { groups: result }
  }
  protected generateInsights(data: ProcessedData): readonly Insight[] {
    const out: Insight[] = []
    for (const [e, s] of data.groups) {
      const sign = s.avgPnlPercent >= 0 ? '+' : ''
      out.push({ key: e, message: `Average ${sign}${s.avgPnlPercent.toFixed(1)}% P&L when trading with ${e} emotion across ${s.trades} trades.` })
    }
    if (out.length >= 2) {
      const sorted = [...data.groups.entries()].sort((a, b) => b[1].avgPnlPercent - a[1].avgPnlPercent)
      out.push({ key: 'comparison', message: `Best performance with ${sorted[0]![0]} (${sorted[0]![1].avgPnlPercent.toFixed(1)}% avg) vs worst with ${sorted[sorted.length - 1]![0]} (${sorted[sorted.length - 1]![1].avgPnlPercent.toFixed(1)}% avg).` })
    }
    return out
  }
}

// ─── TimeOfDayAnalyzer ───────────────────────────────────────────────────────
function getTimeBucket(d: Date): string {
  const h = d.getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

export class TimeOfDayAnalyzer extends AnalyticsEngine {
  protected reportType = 'time-of-day'
  protected async fetchData(): Promise<readonly TradeData[]> { return [] }
  protected processData(data: readonly TradeData[]): ProcessedData {
    const map = new Map<string, { trades: number; wins: number; totalPnlPercent: number }>()
    for (const t of data) {
      const b = getTimeBucket(t.enteredAt); const g = map.get(b) ?? { trades: 0, wins: 0, totalPnlPercent: 0 }
      g.trades++; if (t.pnl > 0) g.wins++; g.totalPnlPercent += t.pnlPercent; map.set(b, g)
    }
    const result = new Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>()
    for (const [b, s] of map) result.set(b, { trades: s.trades, wins: s.wins, avgPnl: 0, avgPnlPercent: s.totalPnlPercent / s.trades })
    return { groups: result }
  }
  protected generateInsights(data: ProcessedData): readonly Insight[] {
    const labels: Record<string, string> = { morning: 'Morning (6AM–12PM)', afternoon: 'Afternoon (12PM–5PM)', evening: 'Evening (5PM–9PM)', night: 'Night (9PM–6AM)' }
    const out: Insight[] = []
    for (const b of ['morning', 'afternoon', 'evening', 'night'] as const) {
      const s = data.groups.get(b); if (!s || s.trades === 0) continue
      out.push({ key: b, message: `${labels[b]} trades: ${((s.wins / s.trades) * 100).toFixed(0)}% win rate (${s.wins}/${s.trades} trades).` })
    }
    return out
  }
}

// ─── WinRateAnalyzer ─────────────────────────────────────────────────────────
export class WinRateAnalyzer extends AnalyticsEngine {
  protected reportType = 'win-rate'
  protected async fetchData(): Promise<readonly TradeData[]> { return [] }
  protected processData(data: readonly TradeData[]): ProcessedData {
    const map = new Map<string, { trades: number; wins: number; totalPnlPercent: number; totalPnl: number }>()
    for (const t of data) {
      const g = map.get(t.symbol) ?? { trades: 0, wins: 0, totalPnlPercent: 0, totalPnl: 0 }
      g.trades++; if (t.pnl > 0) g.wins++; g.totalPnlPercent += t.pnlPercent; g.totalPnl += t.pnl; map.set(t.symbol, g)
    }
    const result = new Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>()
    for (const [s, g] of map) result.set(s, { trades: g.trades, wins: g.wins, avgPnl: g.totalPnl / g.trades, avgPnlPercent: g.totalPnlPercent / g.trades })
    return { groups: result }
  }
  protected generateInsights(data: ProcessedData): readonly Insight[] {
    const out: Insight[] = []
    for (const [sym, s] of data.groups) {
      const sign = s.avgPnlPercent >= 0 ? '+' : ''
      out.push({ key: sym, message: `${sym}: ${((s.wins / s.trades) * 100).toFixed(0)}% win rate, avg ${sign}${s.avgPnlPercent.toFixed(1)}% P&L across ${s.trades} trades.` })
    }
    return out
  }
}
