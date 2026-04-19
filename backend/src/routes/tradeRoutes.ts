import { Router } from 'express'
import { TradeController } from '../controllers/TradeController'
import { createTradeService, createMarketDataService } from '../services/TradeService'
import { TradeRepository, PositionRepository } from '../repositories/TradeRepository'
import { AccountRepository, AnalyticsReportRepository } from '../repositories/AccountRepository'
import { authenticate } from '../errors'

const tradeRepo = new TradeRepository()
const accountRepo = new AccountRepository()
const positionRepo = new PositionRepository()
const analyticsRepo = new AnalyticsReportRepository()

const tradeService = createTradeService(tradeRepo, accountRepo, positionRepo, analyticsRepo)
const tradeController = new TradeController(tradeService)
const marketData = createMarketDataService()

export const tradeRoutes = Router()

// Public
tradeRoutes.get('/market/:symbol', async (req, res) => {
  try {
    const symbol = typeof req.params.symbol === 'string' ? req.params.symbol.trim().toUpperCase() : undefined
    if (!symbol) return res.status(400).json({ error: 'symbol required' })
    const data = await marketData.getPrice(symbol)
    return res.status(200).json({ data })
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }) }
})

// Protected
tradeRoutes.get('/trades', authenticate(), tradeController.listTrades)
tradeRoutes.post('/trades', authenticate(), tradeController.openTrade)
tradeRoutes.post('/trades/sell', authenticate(), tradeController.sellTrade)
tradeRoutes.patch('/trades/:id/close', authenticate(), tradeController.closeTrade)
tradeRoutes.patch('/trades/:id/cancel', authenticate(), tradeController.cancelTrade)
