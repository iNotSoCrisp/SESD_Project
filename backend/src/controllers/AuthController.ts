import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

type RequestHandler = (request: Request, response: Response) => Promise<Response> | Response;

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register: RequestHandler = async (request, response) => {
    try {
      const { email, username, password } = request.body as Record<string, string>;

      if (typeof email !== 'string' || email.trim().length === 0) {
        return response.status(400).json({ error: 'email is required.' });
      }

      if (typeof username !== 'string' || username.trim().length === 0) {
        return response.status(400).json({ error: 'username is required.' });
      }

      if (typeof password !== 'string' || password.length < 6) {
        return response.status(400).json({ error: 'password must be at least 6 characters.' });
      }

      const result = await this.authService.register(email.trim(), username.trim(), password);
      return response.status(201).json({ data: result });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  login: RequestHandler = async (request, response) => {
    try {
      const { email, password } = request.body as Record<string, string>;

      if (typeof email !== 'string' || email.trim().length === 0) {
        return response.status(400).json({ error: 'email is required.' });
      }

      if (typeof password !== 'string' || password.length === 0) {
        return response.status(400).json({ error: 'password is required.' });
      }

      const result = await this.authService.login(email.trim(), password);
      return response.status(200).json({ data: result });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  private handleError(response: Response, error: unknown): Response {
    if (error instanceof Error) {
      const statusCode = 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
      return response.status(statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
