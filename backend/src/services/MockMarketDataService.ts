import type { MarketData } from '../models/trade.types';
import type { IMarketDataService } from '../repositories/interfaces/IMarketDataService';

const DEFAULT_BASE_PRICE = 100;

const BASE_PRICES: Record<string, number> = {
  AAPL: 175,
  BTC: 45000,
  ETH: 2400,
  TSLA: 190,
  MSFT: 420,
  GOOGL: 155,
};

export class MockMarketDataService implements IMarketDataService {
  async getPrice(symbol: string): Promise<MarketData> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const basePrice = BASE_PRICES[normalizedSymbol] ?? DEFAULT_BASE_PRICE;
    const noiseFactor = 1 + this.randomBetween(-0.02, 0.02);
    const price = this.round(basePrice * noiseFactor);
    const spread = this.round(price * 0.001);
    const open = this.round(price * (1 + this.randomBetween(-0.01, 0.01)));
    const high = this.round(Math.max(price, open) * (1 + this.randomBetween(0, 0.01)));
    const low = this.round(Math.min(price, open) * (1 - this.randomBetween(0, 0.01)));
    const volume = Math.floor(this.randomBetween(10_000, 5_000_000));
    const timestamp = new Date();

    return {
      symbol: normalizedSymbol,
      price,
      currentPrice: price,
      bidPrice: this.round(price - spread),
      askPrice: this.round(price + spread),
      open,
      high,
      low,
      volume,
      timestamp,
    };
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    return this.getPrice(symbol);
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}