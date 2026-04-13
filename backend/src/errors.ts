import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export class AppError extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400) }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404) }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409) }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) { super(message, 401) }
}

export class InvalidStateError extends Error {
  constructor(message: string) { super(message); this.name = 'InvalidStateError' }
}

// ─── JWT Auth Middleware ─────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface User { userId: string; email: string }
    interface Request { user?: User }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? ''

export function authenticate(secret?: string) {
  const s = secret ?? JWT_SECRET
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authHeader = request.headers.authorization
    if (authHeader === undefined || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header.')
    }
    const token = authHeader.slice(7)
    try {
      const decoded = jwt.verify(token, s) as Express.User
      request.user = decoded
      next()
    } catch {
      throw new UnauthorizedError('Invalid or expired token.')
    }
  }
}
