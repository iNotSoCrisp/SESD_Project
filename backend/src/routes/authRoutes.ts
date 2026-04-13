import { Router } from 'express'
import { AuthService } from '../services/AuthService'
import { AuthRepository } from '../repositories/AuthRepository'
import { AuthController } from '../controllers/AuthController'
import { AccountController } from '../controllers/AccountController'
import { AccountRepository } from '../repositories/AccountRepository'
import { authenticate } from '../errors'

const jwtSecret = process.env.JWT_SECRET ?? ''
if (!jwtSecret) throw new Error('JWT_SECRET must be configured')

const authService = new AuthService(new AuthRepository(), jwtSecret)
const authController = new AuthController(authService)
const accountController = new AccountController(new AccountRepository())

export const authRoutes = Router()

// Public
authRoutes.post('/auth/register', authController.register)
authRoutes.post('/auth/login', authController.login)

// Protected
authRoutes.get('/accounts', authenticate(), accountController.listAccounts)
authRoutes.post('/accounts', authenticate(), accountController.createAccount)
