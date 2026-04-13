export interface AnalyticsReportRecord {
  readonly id: string;
  readonly userId: string;
  readonly reportType: string;
  readonly data: Record<string, unknown>;
  readonly isStale: boolean;
  readonly generatedAt: Date;
}

export interface IAnalyticsReportRepository {
  markAllAsStaleByUserId(userId: string): Promise<number>;
  findByUserAndType(userId: string, reportType: string): Promise<AnalyticsReportRecord | null>;
  upsert(userId: string, reportType: string, data: Record<string, unknown>, isStale: boolean): Promise<AnalyticsReportRecord>;
}
