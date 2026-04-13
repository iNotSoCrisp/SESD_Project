import { Router } from 'express'
import { AnalyticsController } from '../controllers/AnalyticsController'
import { EmotionController } from '../controllers/EmotionController'
import { AnalyticsService } from '../services/AnalyticsService'
import { EmotionService } from '../services/EmotionService'
import { AnalyticsReportRepository, AccountRepository } from '../repositories/AccountRepository'
import { AnalyticsDataRepository, TradeRepository } from '../repositories/TradeRepository'
import { EmotionRepository } from '../repositories/EmotionRepository'
import { authenticate } from '../errors'

const analyticsService = new AnalyticsService(new AnalyticsReportRepository(), new AnalyticsDataRepository())
const emotionService = new EmotionService(new EmotionRepository(), new TradeRepository())
const analyticsController = new AnalyticsController(analyticsService)
const emotionController = new EmotionController(emotionService)

export const analyticsRoutes = Router()

// Emotion
analyticsRoutes.post('/emotions', authenticate(), emotionController.createEmotion)
analyticsRoutes.get('/emotions/:tradeId', authenticate(), emotionController.getEmotionsByTradeId)

// Analytics
analyticsRoutes.get('/analytics/emotion-performance', authenticate(), analyticsController.emotionPerformance)
analyticsRoutes.get('/analytics/time-of-day', authenticate(), analyticsController.timeOfDay)
analyticsRoutes.get('/analytics/win-rate', authenticate(), analyticsController.winRate)
