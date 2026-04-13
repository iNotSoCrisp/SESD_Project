import type { TradeStatus } from '../../models/trade.types';

export type TradeEventType = 'TRADE_OPENED' | 'TRADE_CLOSED' | 'TRADE_CANCELLED';

export interface BaseTradeEvent {
  readonly type: TradeEventType;
  readonly tradeId: string;
  readonly occurredAt: Date;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface TradeOpenedEvent extends BaseTradeEvent {
  readonly type: 'TRADE_OPENED';
  readonly status: TradeStatus;
}

export interface TradeCancelledEvent extends BaseTradeEvent {
  readonly type: 'TRADE_CANCELLED';
  readonly status: TradeStatus;
}

export interface TradeClosedEvent extends BaseTradeEvent {
  readonly type: 'TRADE_CLOSED';
  readonly accountId: string;
  readonly userId: string;
}

export type TradeEvent = TradeOpenedEvent | TradeCancelledEvent | TradeClosedEvent;

export interface TradeEventObserver {
  onTradeEvent(event: TradeEvent): void | Promise<void>;
}

export class TradeEventPublisher {
  private readonly observers: TradeEventObserver[] = [];

  subscribe(observer: TradeEventObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: TradeEventObserver): void {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  async notify(event: TradeEvent): Promise<void> {
    await Promise.all(this.observers.map((observer) => observer.onTradeEvent(event)));
  }

  async publish(event: TradeEvent): Promise<void> {
    await this.notify(event);
  }
}