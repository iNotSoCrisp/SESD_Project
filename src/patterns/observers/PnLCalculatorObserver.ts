import type { TradeEvent, TradeEventObserver } from './TradeEventPublisher';
import type { ITradeRepository } from '../../repositories/interfaces/ITradeRepository';
import type { ITradingAccountRepository } from '../../repositories/interfaces/ITradingAccountRepository';
import type { IMarketDataService } from '../../repositories/interfaces/IMarketDataService';
import type { IPositionRepository } from '../../repositories/interfaces/IPositionRepository';

export interface PnLCalculatorObserverDependencies {
  readonly tradeRepository: ITradeRepository;
  readonly tradingAccountRepository: ITradingAccountRepository;
  readonly marketDataService: IMarketDataService;
  readonly positionRepository: IPositionRepository;
}

export class PnLCalculatorObserver implements TradeEventObserver {
  private readonly tradeRepository: ITradeRepository;
  private readonly tradingAccountRepository: ITradingAccountRepository;
  private readonly marketDataService: IMarketDataService;
  private readonly positionRepository: IPositionRepository;

  constructor(dependencies: PnLCalculatorObserverDependencies) {
    this.tradeRepository = dependencies.tradeRepository;
    this.tradingAccountRepository = dependencies.tradingAccountRepository;
    this.marketDataService = dependencies.marketDataService;
    this.positionRepository = dependencies.positionRepository;
  }

  async onTradeEvent(event: TradeEvent): Promise<void> {
    if (event.type !== 'TRADE_CLOSED') {
      return;
    }

    const trade = await this.tradeRepository.findById(event.tradeId);
    if (trade === null) {
      throw new Error(`Trade not found for PnL calculation: ${event.tradeId}`);
    }

    const account = await this.tradingAccountRepository.findById(event.accountId);
    if (account === null) {
      throw new Error(`Trading account not found for PnL calculation: ${event.accountId}`);
    }

    if (account.userId !== event.userId) {
      throw new Error('Trade close event user context does not match trading account owner.');
    }

    const market = await this.marketDataService.getMarketData(trade.symbol);
    const exitPrice = market.currentPrice;
    const rawPnl = (exitPrice - trade.entryPrice) * trade.quantity;
    const pnl = trade.direction === 'SHORT' ? rawPnl * -1 : rawPnl;
    const costBasis = trade.entryPrice * trade.quantity;
    const pnlPercent = costBasis === 0 ? 0 : (pnl / costBasis) * 100;
    const durationMins =
      trade.enteredAt === null || trade.closedAt === null
        ? undefined
        : Math.max(0, Math.round((trade.closedAt.getTime() - trade.enteredAt.getTime()) / 60000));

    await this.positionRepository.create({
      tradeId: trade.id,
      realizedPnl: pnl,
      returnPct: pnlPercent,
      durationMins,
    });
  }
}