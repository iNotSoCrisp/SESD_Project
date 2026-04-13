import { Trade } from './Trade';
import { StopTradeCreationParams } from './trade.types';

export class StopTrade extends Trade {
  public readonly stopPrice: number;

  public constructor(params: StopTradeCreationParams) {
    super(params);
    this.stopPrice = params.stopPrice;
  }

  public execute(): void {
    this.status = 'OPEN';
    this.enteredAt = this.enteredAt ?? new Date();
    this.entryPrice = this.stopPrice;
  }

  public calculatePnL(currentPrice: number): number {
    return this.calculateDirectionalDifference(currentPrice) * this.quantity;
  }
}