import type { Request, Response } from 'express';
import { TradeService, type CancelTradeInput, type CloseTradeInput, type ListTradesInput, type OpenTradeInput } from '../services/TradeService';

type RequestHandler = (request: Request, response: Response) => Promise<Response> | Response;

export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  listTrades: RequestHandler = async (request, response) => {
    try {
      const filters: ListTradesInput = {
        accountId: this.getOptionalString(request.query.accountId),
        symbol: this.getOptionalString(request.query.symbol),
        status: this.getOptionalTradeStatus(request.query.status),
        direction: this.getOptionalTradeDirection(request.query.direction),
        orderType: this.getOptionalOrderType(request.query.orderType),
      };

      const trades = await this.tradeService.listTrades(filters);
      return response.status(200).json({ data: trades });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  openTrade: RequestHandler = async (request, response) => {
    try {
      const body = request.body as Record<string, unknown>;
      const input: OpenTradeInput = {
        accountId: this.getRequiredString(body.accountId, 'accountId'),
        symbol: this.getRequiredString(body.symbol, 'symbol').toUpperCase(),
        direction: this.getRequiredTradeDirection(body.direction),
        orderType: this.getRequiredOrderType(body.orderType),
        quantity: this.getRequiredNumber(body.quantity, 'quantity'),
        entryPrice: this.getRequiredNumber(body.entryPrice, 'entryPrice'),
        limitPrice: this.getOptionalNumber(body.limitPrice),
        stopPrice: this.getOptionalNumber(body.stopPrice),
      } as OpenTradeInput;

      const result = await this.tradeService.openTrade(input);
      return response.status(201).json({ data: result });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  closeTrade: RequestHandler = async (request, response) => {
    try {
      const input: CloseTradeInput = {
        tradeId: this.getRequiredString(request.params.id, 'id'),
      };

      const result = await this.tradeService.closeTrade(input);
      return response.status(200).json({ data: result });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  cancelTrade: RequestHandler = async (request, response) => {
    try {
      const input: CancelTradeInput = {
        tradeId: this.getRequiredString(request.params.id, 'id'),
      };

      const result = await this.tradeService.cancelTrade(input);
      return response.status(200).json({ data: result });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  private handleError(response: Response, error: unknown): Response {
    if (error instanceof Error) {
      return response.status(400).json({
        error: error.message,
      });
    }

    return response.status(500).json({
      error: 'An unexpected error occurred.',
    });
  }

  private getRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} must be a non-empty string.`);
    }

    return value.trim();
  }

  private getOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getRequiredNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`${fieldName} must be a valid number.`);
    }

    return value;
  }

  private getOptionalNumber(value: unknown): number | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }

    return value;
  }

  private getOptionalDate(value: unknown): Date | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid date value provided.');
    }

    return parsed;
  }

  private getRequiredTradeDirection(value: unknown): 'LONG' | 'SHORT' {
    if (value === 'LONG' || value === 'SHORT') {
      return value;
    }

    throw new Error('direction must be either LONG or SHORT.');
  }

  private getOptionalTradeDirection(value: unknown): 'LONG' | 'SHORT' | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.getRequiredTradeDirection(value);
  }

  private getRequiredOrderType(value: unknown): 'MARKET' | 'LIMIT' | 'STOP' {
    if (value === 'MARKET' || value === 'LIMIT' || value === 'STOP') {
      return value;
    }

    throw new Error('orderType must be MARKET, LIMIT, or STOP.');
  }

  private getOptionalOrderType(value: unknown): 'MARKET' | 'LIMIT' | 'STOP' | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.getRequiredOrderType(value);
  }

  private getOptionalTradeStatus(value: unknown): 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED' | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'PENDING' || value === 'OPEN' || value === 'CLOSED' || value === 'CANCELLED') {
      return value;
    }

    throw new Error('status must be PENDING, OPEN, CLOSED, or CANCELLED.');
  }
}