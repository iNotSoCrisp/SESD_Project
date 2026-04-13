import { Router } from 'express';
import { MarketController } from '../controllers/MarketController';
import { TradeController } from '../controllers/TradeController';
import { TradeService } from '../services/TradeService';
import { AlphaVantageMarketDataService } from '../services/AlphaVantageMarketDataService';
import { MockMarketDataService } from '../services/MockMarketDataService';
import { PrismaTradeRepository } from '../repositories/PrismaTradeRepository';
import { PrismaTradingAccountRepository } from '../repositories/PrismaTradingAccountRepository';
import { PrismaPositionRepository } from '../repositories/PrismaPositionRepository';
import { PrismaAnalyticsReportRepository } from '../repositories/PrismaAnalyticsReportRepository';
import type { IMarketDataService } from '../repositories/interfaces/IMarketDataService';
import { TradeEventPublisher } from '../patterns/observers/TradeEventPublisher';
import { PnLCalculatorObserver } from '../patterns/observers/PnLCalculatorObserver';
import { AnalyticsTriggerObserver } from '../patterns/observers/AnalyticsTriggerObserver';
import { NotificationObserver } from '../patterns/observers/NotificationObserver';
import { ConsoleNotifier } from '../patterns/observers/Notifier';
import { authenticate } from '../middleware/authenticate';

const jwtSecret = process.env.JWT_SECRET;
if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
  throw new Error('JWT_SECRET must be configured in environment.');
}

const createMarketDataService = (): IMarketDataService => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (typeof apiKey === 'string' && apiKey.trim().length > 0) {
    return new AlphaVantageMarketDataService(apiKey);
  }

  return new MockMarketDataService();
};

const marketDataService = createMarketDataService();
const tradeRepository = new PrismaTradeRepository();
const tradingAccountRepository = new PrismaTradingAccountRepository();
const positionRepository = new PrismaPositionRepository();
const analyticsRepository = new PrismaAnalyticsReportRepository();

const eventPublisher = new TradeEventPublisher();
eventPublisher.subscribe(
  new PnLCalculatorObserver({
    tradeRepository,
    tradingAccountRepository,
    marketDataService,
    positionRepository,
  }),
);
eventPublisher.subscribe(new AnalyticsTriggerObserver(analyticsRepository));
eventPublisher.subscribe(new NotificationObserver(new ConsoleNotifier()));

const tradeService = new TradeService({
  tradeRepository,
  tradingAccountRepository,
  marketDataService,
  eventPublisher,
});

const tradeController = new TradeController(tradeService);
const marketController = new MarketController(marketDataService);

export const tradeRoutes = Router();

// Public route
tradeRoutes.get('/market/:symbol', marketController.getMarketPrice);

// Protected routes
tradeRoutes.get('/trades', authenticate(jwtSecret), tradeController.listTrades);
tradeRoutes.post('/trades', authenticate(jwtSecret), tradeController.openTrade);
tradeRoutes.patch('/trades/:id/close', authenticate(jwtSecret), tradeController.closeTrade);
tradeRoutes.patch('/trades/:id/cancel', authenticate(jwtSecret), tradeController.cancelTrade);
