import { Trade } from './Trade';
import { MarketTradeCreationParams } from './trade.types';

export class MarketTrade extends Trade {
  public constructor(params: MarketTradeCreationParams) {
    super(params);
  }

  public execute(): void {
    this.status = 'OPEN';
    this.enteredAt = this.enteredAt ?? new Date();
  }

  public calculatePnL(currentPrice: number): number {
    return this.calculateDirectionalDifference(currentPrice) * this.quantity;
  }
}