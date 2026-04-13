import { Trade } from '../../models/Trade';
import { MarketData, TradeResult } from '../../models/trade.types';

export interface OrderStrategy {
  execute(trade: Trade, market: MarketData): TradeResult;
}