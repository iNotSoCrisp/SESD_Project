import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { PrismaTradingAccountRepository } from '../repositories/PrismaTradingAccountRepository';
import { authenticate } from '../middleware/authenticate';

const jwtSecret = process.env.JWT_SECRET;
if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
  throw new Error('JWT_SECRET must be configured in environment.');
}

const accountController = new AccountController(new PrismaTradingAccountRepository());

export const accountRoutes = Router();

accountRoutes.get('/accounts', authenticate(jwtSecret), accountController.listAccounts);
accountRoutes.post('/accounts', authenticate(jwtSecret), accountController.createAccount);
