import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export function authenticate(secret: string) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authHeader = request.headers.authorization;

    if (authHeader === undefined || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header.');
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, secret) as Express.User;
      request.user = decoded;
      next();
    } catch {
      throw new UnauthorizedError('Invalid or expired token.');
    }
  };
}
