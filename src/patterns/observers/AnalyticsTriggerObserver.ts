import type { TradeEvent, TradeEventObserver } from './TradeEventPublisher';
import type { IAnalyticsReportRepository } from '../../repositories/interfaces/IAnalyticsReportRepository';

export class AnalyticsTriggerObserver implements TradeEventObserver {
  constructor(private readonly analyticsReportRepository: IAnalyticsReportRepository) {}

  async onTradeEvent(event: TradeEvent): Promise<void> {
    if (event.type !== 'TRADE_CLOSED') {
      return;
    }

    await this.analyticsReportRepository.markAllAsStaleByUserId(event.userId);
  }
}