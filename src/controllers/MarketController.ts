import type { Request, Response } from 'express';
import type { IMarketDataService } from '../repositories/interfaces/IMarketDataService';

type RequestHandler = (request: Request, response: Response) => Promise<Response> | Response;

export class MarketController {
  constructor(private readonly marketDataService: IMarketDataService) {}

  getMarketPrice: RequestHandler = async (request, response) => {
    try {
      const symbol = this.getRequiredSymbol(request.params.symbol);
      const marketData = await this.marketDataService.getPrice(symbol);

      return response.status(200).json({
        data: marketData,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return response.status(400).json({
          error: error.message,
        });
      }

      return response.status(500).json({
        error: 'An unexpected error occurred.',
      });
    }
  };

  private getRequiredSymbol(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('symbol must be a non-empty string.');
    }

    return value.trim().toUpperCase();
  }
}