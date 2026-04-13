import { OrderType, TradeCreationParams, TradeDirection, TradeStatus } from './trade.types';

export abstract class Trade {
  public readonly id: string;
  public readonly accountId: string;
  public readonly symbol: string;
  public readonly direction: TradeDirection;
  public readonly orderType: OrderType;
  public quantity: number;
  public entryPrice: number;
  public status: TradeStatus;
  public enteredAt: Date | null;
  public closedAt: Date | null;

  protected constructor(params: TradeCreationParams) {
    this.id = params.id;
    this.accountId = params.accountId;
    this.symbol = params.symbol;
    this.direction = params.direction;
    this.orderType = params.orderType;
    this.quantity = params.quantity;
    this.entryPrice = params.entryPrice;
    this.status = params.status ?? 'PENDING';
    this.enteredAt = params.enteredAt ?? null;
    this.closedAt = params.closedAt ?? null;
  }

  public abstract execute(): void;

  public abstract calculatePnL(currentPrice: number): number;

  protected calculateDirectionalDifference(currentPrice: number): number {
    return this.direction === 'LONG'
      ? currentPrice - this.entryPrice
      : this.entryPrice - currentPrice;
  }
}