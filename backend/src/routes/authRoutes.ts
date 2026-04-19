import { Router } from 'express'
import { AuthService } from '../services/AuthService'
import { AuthRepository } from '../repositories/AuthRepository'
import { AuthController } from '../controllers/AuthController'
import { AccountController } from '../controllers/AccountController'
import { AccountRepository } from '../repositories/AccountRepository'
import { authenticate } from '../errors'

// Lazily read JWT_SECRET — resolves dotenv timing issue where module-level
// reads happen before dotenv.config() fires in app.ts
function getJwtSecret(): string {
  const s = process.env.JWT_SECRET ?? ''
  if (!s) throw new Error('JWT_SECRET must be configured')
  return s
}

// Build auth service lazily via a factory function so secrets are read at
// request time, by which point dotenv.config() has already run.
function makeAuthController() {
  return new AuthController(new AuthService(new AuthRepository(), getJwtSecret()))
}

const accountController = new AccountController(new AccountRepository())
export const authRoutes = Router()

// Public — controllers are created per-request to pick up fresh env vars
authRoutes.post('/auth/register', (req, res) => makeAuthController().register(req, res))
authRoutes.post('/auth/login', (req, res) => makeAuthController().login(req, res))

// Protected
authRoutes.get('/accounts', authenticate(), accountController.listAccounts)
authRoutes.post('/accounts', authenticate(), accountController.createAccount)
