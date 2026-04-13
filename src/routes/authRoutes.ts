import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { PrismaAuthRepository } from '../repositories/PrismaAuthRepository';

const jwtSecret = process.env.JWT_SECRET;
if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
  throw new Error('JWT_SECRET must be configured in environment.');
}

const authService = new AuthService({
  authRepository: new PrismaAuthRepository(),
  jwtSecret,
});

const authController = new AuthController(authService);

export const authRoutes = Router();

authRoutes.post('/auth/register', authController.register);
authRoutes.post('/auth/login', authController.login);
