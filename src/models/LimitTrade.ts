import { Trade } from './Trade';
import { LimitTradeCreationParams } from './trade.types';

export class LimitTrade extends Trade {
  public readonly limitPrice: number;

  public constructor(params: LimitTradeCreationParams) {
    super(params);
    this.limitPrice = params.limitPrice;
  }

  public execute(): void {
    this.status = 'OPEN';
    this.enteredAt = this.enteredAt ?? new Date();
    this.entryPrice = this.limitPrice;
  }

  public calculatePnL(currentPrice: number): number {
    return this.calculateDirectionalDifference(currentPrice) * this.quantity;
  }
}