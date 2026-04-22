import { Router } from 'express'
import { AccountController } from '../controllers/AccountController'
import { AccountRepository } from '../repositories/AccountRepository'
import { authenticate } from '../errors'

const accountRepo = new AccountRepository()
const accountController = new AccountController(accountRepo)

export const accountRoutes = Router()

accountRoutes.get('/accounts', authenticate(), accountController.listAccounts)
accountRoutes.post('/accounts', authenticate(), accountController.createAccount)
accountRoutes.post('/accounts/reset', authenticate(), accountController.resetWallet)
