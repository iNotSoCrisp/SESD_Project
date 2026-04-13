import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { AnalyticsService } from '../services/AnalyticsService';
import { PrismaAnalyticsReportRepository } from '../repositories/PrismaAnalyticsReportRepository';
import { PrismaAnalyticsDataRepository } from '../repositories/PrismaAnalyticsDataRepository';
import { authenticate } from '../middleware/authenticate';

const jwtSecret = process.env.JWT_SECRET;
if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
  throw new Error('JWT_SECRET must be configured in environment.');
}

const analyticsService = new AnalyticsService({
  analyticsReportRepository: new PrismaAnalyticsReportRepository(),
  analyticsDataRepository: new PrismaAnalyticsDataRepository(),
});

const analyticsController = new AnalyticsController(analyticsService);

export const analyticsRoutes = Router();

analyticsRoutes.get('/analytics/emotion-performance', authenticate(jwtSecret), analyticsController.emotionPerformance);
analyticsRoutes.get('/analytics/time-of-day', authenticate(jwtSecret), analyticsController.timeOfDay);
analyticsRoutes.get('/analytics/win-rate', authenticate(jwtSecret), analyticsController.winRate);
