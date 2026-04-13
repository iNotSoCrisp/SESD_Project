import { StopTrade } from '../../models/StopTrade';
import { Trade } from '../../models/Trade';
import { MarketData, TradeResult } from '../../models/trade.types';
import { OrderStrategy } from './OrderStrategy';

export class StopOrderStrategy implements OrderStrategy {
  public execute(trade: Trade, market: MarketData): TradeResult {
    if (!(trade instanceof StopTrade)) {
      throw new Error('StopOrderStrategy requires a StopTrade instance');
    }

    const canExecute =
      (trade.direction === 'LONG' && market.askPrice >= trade.stopPrice) ||
      (trade.direction === 'SHORT' && market.bidPrice <= trade.stopPrice);

    if (!canExecute) {
      return {
        tradeId: trade.id,
        executed: false,
        executionPrice: null,
        status: trade.status,
        message: `Stop order pending for ${trade.symbol}; trigger price ${trade.stopPrice.toFixed(2)} not reached`,
        timestamp: market.timestamp,
      };
    }

    trade.entryPrice = trade.stopPrice;
    trade.execute();

    return {
      tradeId: trade.id,
      executed: true,
      executionPrice: trade.stopPrice,
      status: trade.status,
      message: `Stop order executed for ${trade.symbol} at ${trade.stopPrice.toFixed(2)}`,
      timestamp: market.timestamp,
    };
  }
}