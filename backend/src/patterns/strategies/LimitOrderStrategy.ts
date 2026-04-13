import { LimitTrade } from '../../models/LimitTrade';
import { Trade } from '../../models/Trade';
import { MarketData, TradeResult } from '../../models/trade.types';
import { OrderStrategy } from './OrderStrategy';

export class LimitOrderStrategy implements OrderStrategy {
  public execute(trade: Trade, market: MarketData): TradeResult {
    if (!(trade instanceof LimitTrade)) {
      throw new Error('LimitOrderStrategy requires a LimitTrade instance');
    }

    const canExecute =
      (trade.direction === 'LONG' && market.askPrice <= trade.limitPrice) ||
      (trade.direction === 'SHORT' && market.bidPrice >= trade.limitPrice);

    if (!canExecute) {
      return {
        tradeId: trade.id,
        executed: false,
        executionPrice: null,
        status: trade.status,
        message: `Limit order pending for ${trade.symbol}; target price ${trade.limitPrice.toFixed(2)} not reached`,
        timestamp: market.timestamp,
      };
    }

    trade.entryPrice = trade.limitPrice;
    trade.execute();

    return {
      tradeId: trade.id,
      executed: true,
      executionPrice: trade.limitPrice,
      status: trade.status,
      message: `Limit order executed for ${trade.symbol} at ${trade.limitPrice.toFixed(2)}`,
      timestamp: market.timestamp,
    };
  }
}