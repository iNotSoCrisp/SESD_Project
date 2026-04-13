import type { MarketData } from '../models/trade.types';
import type { IMarketDataService } from '../repositories/interfaces/IMarketDataService';

interface AlphaVantageGlobalQuoteResponse {
  'Global Quote'?: Record<string, string | undefined>;
  Note?: string;
  Information?: string;
  ErrorMessage?: string;
}

export class AlphaVantageMarketDataService implements IMarketDataService {
  constructor(private readonly apiKey: string) {}

  async getPrice(symbol: string): Promise<MarketData> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (normalizedSymbol.length === 0) {
      throw new Error('symbol must be a non-empty string.');
    }

    if (this.apiKey.trim().length === 0) {
      throw new Error('Alpha Vantage API key is not configured.');
    }

    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', 'GLOBAL_QUOTE');
    url.searchParams.set('symbol', normalizedSymbol);
    url.searchParams.set('apikey', this.apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as AlphaVantageGlobalQuoteResponse;

    if (typeof payload.ErrorMessage === 'string' && payload.ErrorMessage.length > 0) {
      throw new Error(payload.ErrorMessage);
    }

    if (typeof payload.Note === 'string' && payload.Note.length > 0) {
      throw new Error(payload.Note);
    }

    if (typeof payload.Information === 'string' && payload.Information.length > 0 && payload['Global Quote'] === undefined) {
      throw new Error(payload.Information);
    }

    const quote = payload['Global Quote'];
    if (quote === undefined) {
      throw new Error('Alpha Vantage response did not include Global Quote data.');
    }

    const price = this.parseNumber(quote['05. price'], 'price');
    const open = this.parseNumber(quote['02. open'], 'open');
    const high = this.parseNumber(quote['03. high'], 'high');
    const low = this.parseNumber(quote['04. low'], 'low');
    const volume = this.parseNumber(quote['06. volume'], 'volume');
    const previousClose = this.parseOptionalNumber(quote['08. previous close']);
    const latestTradingDay = quote['07. latest trading day'];
    const timestamp = this.parseTimestamp(latestTradingDay);
    const spread = this.round(price * 0.001);

    return {
      symbol: quote['01. symbol']?.trim().toUpperCase() || normalizedSymbol,
      price,
      currentPrice: price,
      bidPrice: previousClose !== undefined ? this.round(Math.min(price, previousClose)) : this.round(price - spread),
      askPrice: previousClose !== undefined ? this.round(Math.max(price, previousClose)) : this.round(price + spread),
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

  private parseNumber(value: string | undefined, fieldName: string): number {
    if (value === undefined) {
      throw new Error(`Alpha Vantage response missing ${fieldName}.`);
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Alpha Vantage response contains invalid ${fieldName}.`);
    }

    return parsed;
  }

  private parseOptionalNumber(value: string | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private parseTimestamp(value: string | undefined): Date {
    if (value === undefined || value.trim().length === 0) {
      return new Date();
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}