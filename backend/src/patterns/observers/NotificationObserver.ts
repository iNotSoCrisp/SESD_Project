import type { TradeEvent, TradeEventObserver } from './TradeEventPublisher';
import type { Notifier } from './Notifier';

export class NotificationObserver implements TradeEventObserver {
  constructor(private readonly notifier: Notifier) {}

  async onTradeEvent(event: TradeEvent): Promise<void> {
    if (event.type !== 'TRADE_CLOSED') {
      return;
    }

    await this.notifier.notify(
      `Trade ${event.tradeId} closed for account ${event.accountId} and user ${event.userId}.`,
    );
  }
}