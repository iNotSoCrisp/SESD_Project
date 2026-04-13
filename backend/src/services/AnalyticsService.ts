import type { InsightReport, TradeData, AnalyticsReportRecord } from '../types'
import { EmotionPerformanceAnalyzer, TimeOfDayAnalyzer, WinRateAnalyzer } from '../patterns/Analyzers'
import type { IAnalyticsReportRepository, IAccountRepository } from '../repositories/AccountRepository'
import type { IAnalyticsDataRepository } from '../repositories/TradeRepository'

const ENGINE_MAP: Record<string, { new(): import('../patterns/Analyzers').AnalyticsEngine }> = {
  'emotion-performance': EmotionPerformanceAnalyzer,
  'time-of-day': TimeOfDayAnalyzer,
  'win-rate': WinRateAnalyzer,
}

export class AnalyticsService {
  constructor(
    private readonly reportRepo: IAnalyticsReportRepository,
    private readonly dataRepo: IAnalyticsDataRepository,
  ) {}

  async getReport(userId: string, reportType: string): Promise<InsightReport> {
    const cached = await this.reportRepo.findByUserAndType(userId, reportType)
    if (cached && !cached.isStale) return cached.data as unknown as InsightReport

    const engine = this.getEngine(reportType)
    const data = await this.dataRepo.findClosedTradesWithEmotionsAndPositions(userId)
    const report = engine.analyzeWithData(data)

    await this.reportRepo.upsert(userId, reportType, report as unknown as Record<string, unknown>, false)
    return report
  }

  private getEngine(type: string) {
    const Ctor = ENGINE_MAP[type]
    if (!Ctor) throw new Error(`Unknown report type: ${type}`)
    return new Ctor()
  }
}
