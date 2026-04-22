import type { NextFunction, Request, Response } from 'express'

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

// ─── Clerk Auth Middleware ─────────────────────────────────────────────────────
import { requireAuth } from '@clerk/express'

export function authenticate() {
  return requireAuth()
}
