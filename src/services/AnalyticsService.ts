import type { IAnalyticsReportRepository } from '../repositories/interfaces/IAnalyticsReportRepository';
import type { IAnalyticsDataRepository } from '../repositories/interfaces/IAnalyticsDataRepository';
import type { AnalyticsEngine, InsightReport, TradeData } from '../patterns/analytics/AnalyticsEngine';
import { EmotionPerformanceAnalyzer } from '../patterns/analytics/EmotionPerformanceAnalyzer';
import { TimeOfDayAnalyzer } from '../patterns/analytics/TimeOfDayAnalyzer';
import { WinRateAnalyzer } from '../patterns/analytics/WinRateAnalyzer';

const ENGINE_MAP: Record<string, () => AnalyticsEngine> = {
  'emotion-performance': () => new EmotionPerformanceAnalyzer(),
  'time-of-day': () => new TimeOfDayAnalyzer(),
  'win-rate': () => new WinRateAnalyzer(),
};

export interface AnalyticsServiceDependencies {
  readonly analyticsReportRepository: IAnalyticsReportRepository;
  readonly analyticsDataRepository: IAnalyticsDataRepository;
}

export class AnalyticsService {
  private readonly analyticsReportRepository: IAnalyticsReportRepository;
  private readonly analyticsDataRepository: IAnalyticsDataRepository;

  constructor(dependencies: AnalyticsServiceDependencies) {
    this.analyticsReportRepository = dependencies.analyticsReportRepository;
    this.analyticsDataRepository = dependencies.analyticsDataRepository;
  }

  async getReport(userId: string, reportType: string): Promise<InsightReport> {
    const cached = await this.analyticsReportRepository.findByUserAndType(userId, reportType);
    if (cached !== null && !cached.isStale) {
      return cached.data as unknown as InsightReport;
    }

    const engine = this.getEngine(reportType);
    const rawData = await this.analyticsDataRepository.findClosedTradesWithEmotionsAndPositions(userId);

    const report = this.analyzeWithEngine(engine, rawData);

    await this.analyticsReportRepository.upsert(
      userId,
      reportType,
      report as unknown as Record<string, unknown>,
      false,
    );

    return report;
  }

  private getEngine(reportType: string): AnalyticsEngine {
    const factory = ENGINE_MAP[reportType];
    if (factory === undefined) {
      throw new Error(`Unknown report type: ${reportType}`);
    }
    return factory();
  }

  private analyzeWithEngine(engine: AnalyticsEngine, data: readonly TradeData[]): InsightReport {
    return engine.analyzeWithData(data);
  }
}
