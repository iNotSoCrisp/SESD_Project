import type { TradeData } from '../../patterns/analytics/AnalyticsEngine';

export interface IAnalyticsDataRepository {
  findClosedTradesWithEmotionsAndPositions(userId: string): Promise<readonly TradeData[]>;
}
