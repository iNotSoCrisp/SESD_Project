import { Trade } from '../../models/Trade';
import { MarketData, TradeResult } from '../../models/trade.types';
import { OrderStrategy } from '../strategies/OrderStrategy';

export class TradeContext {
  private strategy: OrderStrategy;

  public constructor(strategy: OrderStrategy) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: OrderStrategy): void {
    this.strategy = strategy;
  }

  public executeOrder(trade: Trade, market: MarketData): TradeResult {
    return this.strategy.execute(trade, market);
  }
}