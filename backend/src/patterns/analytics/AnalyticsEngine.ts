export interface TradeData {
  readonly tradeId: string;
  readonly symbol: string;
  readonly direction: 'LONG' | 'SHORT';
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly pnl: number;
  readonly pnlPercent: number;
  readonly enteredAt: Date;
  readonly closedAt: Date;
  readonly emotionType?: string | undefined;
  readonly emotionIntensity?: number | undefined;
}

export interface ProcessedData {
  readonly groups: Map<string, { trades: number; wins: number; avgPnl: number; avgPnlPercent: number }>;
}

export interface Insight {
  readonly key: string;
  readonly message: string;
}

export interface InsightReport {
  readonly type: string;
  readonly insights: readonly Insight[];
  readonly generatedAt: Date;
}

export abstract class AnalyticsEngine {
  protected abstract reportType: string;

  /**
   * Template Method: orchestrates the analysis pipeline.
   * Subclasses override the three protected steps.
   */
  async analyze(userId: string): Promise<InsightReport> {
    const raw = await this.fetchData(userId);
    const processed = this.processData(raw);
    const insights = this.generateInsights(processed);
    return { type: this.reportType, insights, generatedAt: new Date() };
  }

  /**
   * Public entry point for when data is supplied externally
   * (e.g., from a repository rather than fetched by the engine itself).
   */
  analyzeWithData(data: readonly TradeData[]): InsightReport {
    const processed = this.processData(data);
    const insights = this.generateInsights(processed);
    return { type: this.reportType, insights, generatedAt: new Date() };
  }

  protected abstract fetchData(userId: string): Promise<readonly TradeData[]>;
  protected abstract processData(data: readonly TradeData[]): ProcessedData;
  protected abstract generateInsights(data: ProcessedData): readonly Insight[];
}
