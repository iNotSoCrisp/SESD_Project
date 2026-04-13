import type { Request, Response } from 'express';
import type { ITradingAccountRepository } from '../repositories/interfaces/ITradingAccountRepository';

type RequestHandler = (
  request: Request,
  response: Response,
) => Promise<Response> | Response;

export class AccountController {
  constructor(
    private readonly tradingAccountRepository: ITradingAccountRepository,
  ) {}

  listAccounts: RequestHandler = async (request, response) => {
    if (request.user === undefined) {
      return response.status(401).json({ error: 'Authentication required.' });
    }
    const accounts = await this.tradingAccountRepository.findByUserId(request.user!.userId);
    return response.status(200).json({ data: accounts });
  };

  createAccount: RequestHandler = async (request, response) => {
    if (request.user === undefined) {
      return response.status(401).json({ error: 'Authentication required.' });
    }

    const body = request.body as Record<string, unknown>;

    const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : undefined;
    const currency = typeof body.currency === 'string' && body.currency.trim().length > 0 ? body.currency.trim() : 'USD';
    const initialBalance = typeof body.initialBalance === 'number' && !Number.isNaN(body.initialBalance) ? body.initialBalance : 0;

    if (name === undefined) {
      return response.status(400).json({ error: 'name is required.' });
    }

    const account = await this.tradingAccountRepository.create({
      userId: request.user.userId,
      name,
      currency,
      balance: initialBalance,
    });

    return response.status(201).json({ data: account });
  };
}
