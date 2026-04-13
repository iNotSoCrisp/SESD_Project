import type { MarketData } from '../../models/trade.types';

export interface IMarketDataService {
  getPrice(symbol: string): Promise<MarketData>;
  getMarketData(symbol: string): Promise<MarketData>;
}