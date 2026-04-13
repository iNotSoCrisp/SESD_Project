import { Trade } from '../../models/Trade';
import { MarketData, TradeResult } from '../../models/trade.types';
import { OrderStrategy } from './OrderStrategy';

export class MarketOrderStrategy implements OrderStrategy {
  public execute(trade: Trade, market: MarketData): TradeResult {
    const executionPrice = trade.direction === 'LONG' ? market.askPrice : market.bidPrice;

    trade.entryPrice = executionPrice;
    trade.execute();

    return {
      tradeId: trade.id,
      executed: true,
      executionPrice,
      status: trade.status,
      message: `Market order executed for ${trade.symbol} at ${executionPrice.toFixed(2)}`,
      timestamp: market.timestamp,
    };
  }
}