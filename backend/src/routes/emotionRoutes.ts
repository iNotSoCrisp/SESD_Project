import { Router } from 'express';
import { EmotionController } from '../controllers/EmotionController';
import { PrismaEmotionRepository } from '../repositories/PrismaEmotionRepository';
import { PrismaTradeRepository } from '../repositories/PrismaTradeRepository';
import { EmotionService } from '../services/EmotionService';
import { authenticate } from '../middleware/authenticate';

const jwtSecret = process.env.JWT_SECRET;
if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
  throw new Error('JWT_SECRET must be configured in environment.');
}

const emotionService = new EmotionService({
  emotionRepository: new PrismaEmotionRepository(),
  tradeRepository: new PrismaTradeRepository(),
});

const emotionController = new EmotionController(emotionService);

export const emotionRoutes = Router();

emotionRoutes.post('/emotions', authenticate(jwtSecret), emotionController.createEmotion);
emotionRoutes.get('/emotions/:tradeId', authenticate(jwtSecret), emotionController.getEmotionsByTradeId);
