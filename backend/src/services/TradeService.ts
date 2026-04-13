import { TradeFactory } from '../patterns/factories/TradeFactory';
import { TradeContext } from '../patterns/context/TradeContext';
import { TradeEventPublisher } from '../patterns/observers/TradeEventPublisher';
import { ClosedState } from '../patterns/state/ClosedState';
import { CancelledState } from '../patterns/state/CancelledState';
import { OpenState } from '../patterns/state/OpenState';
import { PendingState } from '../patterns/state/PendingState';
import type { TradeState } from '../patterns/state/TradeState';
import { MarketOrderStrategy } from '../patterns/strategies/MarketOrderStrategy';
import { LimitOrderStrategy } from '../patterns/strategies/LimitOrderStrategy';
import { StopOrderStrategy } from '../patterns/strategies/StopOrderStrategy';
import type { Trade } from '../models/Trade';
import type {
  MarketData,
  OrderType,
  TradeCreationParams,
  TradeResult,
  TradeStatus,
} from '../models/trade.types';
import type {
  CreateTradeRecordInput,
  ITradeRepository,
  PersistedTradeRecord,
  TradeListFilters,
  UpdateTradeRecordInput,
} from '../repositories/interfaces/ITradeRepository';
import type { ITradingAccountRepository } from '../repositories/interfaces/ITradingAccountRepository';
import type { IMarketDataService } from '../repositories/interfaces/IMarketDataService';

export interface ListTradesInput extends TradeListFilters {}

export type OpenTradeInput =
  | Omit<
      Extract<TradeCreationParams, { orderType: 'MARKET' }>,
      'id' | 'status' | 'enteredAt' | 'closedAt' | 'entryPrice'
    >
  | Omit<
      Extract<TradeCreationParams, { orderType: 'LIMIT' }>,
      'id' | 'status' | 'enteredAt' | 'closedAt' | 'entryPrice'
    >
  | Omit<
      Extract<TradeCreationParams, { orderType: 'STOP' }>,
      'id' | 'status' | 'enteredAt' | 'closedAt' | 'entryPrice'
    >;

export interface CloseTradeInput {
  readonly tradeId: string;
}

export interface CancelTradeInput {
  readonly tradeId: string;
}

export interface TradeResponseDto {
  readonly id: string;
  readonly accountId: string;
  readonly symbol: string;
  readonly direction: string;
  readonly orderType: OrderType;
  readonly quantity: number;
  readonly entryPrice: number;
  readonly status: TradeStatus;
  readonly enteredAt: Date | null;
  readonly closedAt: Date | null;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

export interface OpenTradeResponse {
  readonly trade: TradeResponseDto;
  readonly execution: TradeResult;
}

export interface CloseTradeResponse {
  readonly trade: TradeResponseDto;
  readonly market: MarketData;
  readonly pnl: number;
}

export interface CancelTradeResponse {
  readonly trade: TradeResponseDto;
}

export interface TradeServiceDependencies {
  readonly tradeRepository: ITradeRepository;
  readonly tradingAccountRepository: ITradingAccountRepository;
  readonly marketDataService: IMarketDataService;
  readonly eventPublisher: TradeEventPublisher;
}

export class TradeService {
  private readonly tradeRepository: ITradeRepository;
  private readonly tradingAccountRepository: ITradingAccountRepository;
  private readonly marketDataService: IMarketDataService;
  private readonly eventPublisher: TradeEventPublisher;

  constructor(dependencies: TradeServiceDependencies) {
    this.tradeRepository = dependencies.tradeRepository;
    this.tradingAccountRepository = dependencies.tradingAccountRepository;
    this.marketDataService = dependencies.marketDataService;
    this.eventPublisher = dependencies.eventPublisher;
  }

  async listTrades(filters: ListTradesInput): Promise<ReadonlyArray<TradeResponseDto>> {
    const records = await this.tradeRepository.findMany(filters);
    return records.map((record) => this.toTradeResponse(record));
  }

  async openTrade(input: OpenTradeInput): Promise<OpenTradeResponse> {
    const account = await this.tradingAccountRepository.findById(input.accountId);
    if (account === null) {
      throw new Error('Trading account not found.');
    }

    if (!account.isActive) {
      throw new Error('Trading account is inactive.');
    }

    const tradeId = this.generateTradeId();
    const market = await this.marketDataService.getMarketData(input.symbol);
    const trade = TradeFactory.create(input.orderType, {
      ...input,
      id: tradeId,
      entryPrice: this.resolveRequestedEntryPrice(input, market),
      status: 'PENDING',
      enteredAt: null,
      closedAt: null,
    } as TradeCreationParams);

    const context = new TradeContext(this.getStrategy(input.orderType));
    const execution = context.executeOrder(trade, market);

    const nextStatus = execution.executed ? 'OPEN' : 'PENDING';
    if (execution.executed) {
      new PendingState().open({
        tradeId,
      });
      await this.eventPublisher.notify({
        type: 'TRADE_OPENED',
        tradeId,
        status: nextStatus,
        occurredAt: new Date(),
        metadata: {
          symbol: input.symbol,
          accountId: input.accountId,
        },
      });
    }

    const persisted = await this.tradeRepository.create(
      this.toCreateTradeRecordInput(input, execution, nextStatus),
    );

    return {
      trade: this.toTradeResponse(persisted),
      execution,
    };
  }

  async closeTrade(input: CloseTradeInput): Promise<CloseTradeResponse> {
    const record = await this.tradeRepository.findById(input.tradeId);
    if (record === null) {
      throw new Error('Trade not found.');
    }

    const currentState = this.getState(record.status);
    currentState.close({
      tradeId: record.id,
    });

    const market = await this.marketDataService.getMarketData(record.symbol);
    const trade = this.createTradeFromRecord(record);
    const pnl = trade.calculatePnL(market.currentPrice);

    const updateInput: UpdateTradeRecordInput = {
      status: 'CLOSED',
      closedAt: new Date(),
    };

    const updated = await this.tradeRepository.update(record.id, updateInput);
    const account = await this.tradingAccountRepository.findById(record.accountId);

    if (account === null) {
      throw new Error('Trading account not found.');
    }

    await this.eventPublisher.notify({
      type: 'TRADE_CLOSED',
      tradeId: record.id,
      accountId: record.accountId,
      userId: account.userId,
      occurredAt: new Date(),
      metadata: {
        symbol: record.symbol,
      },
    });

    return {
      trade: this.toTradeResponse(updated),
      market,
      pnl,
    };
  }

  async cancelTrade(input: CancelTradeInput): Promise<CancelTradeResponse> {
    const record = await this.tradeRepository.findById(input.tradeId);
    if (record === null) {
      throw new Error('Trade not found.');
    }

    const currentState = this.getState(record.status);
    currentState.cancel({
      tradeId: record.id,
    });

    await this.eventPublisher.notify({
      type: 'TRADE_CANCELLED',
      tradeId: record.id,
      status: 'CANCELLED',
      occurredAt: new Date(),
      metadata: {
        symbol: record.symbol,
      },
    });

    const updated = await this.tradeRepository.update(record.id, {
      status: 'CANCELLED',
    });

    return {
      trade: this.toTradeResponse(updated),
    };
  }

  private getStrategy(orderType: OrderType): MarketOrderStrategy | LimitOrderStrategy | StopOrderStrategy {
    switch (orderType) {
      case 'MARKET':
        return new MarketOrderStrategy();
      case 'LIMIT':
        return new LimitOrderStrategy();
      case 'STOP':
        return new StopOrderStrategy();
      default: {
        const unreachable: never = orderType;
        throw new Error(`Unsupported order type: ${String(unreachable)}`);
      }
    }
  }

  private getState(status: TradeStatus): TradeState {
    switch (status) {
      case 'PENDING':
        return new PendingState();
      case 'OPEN':
        return new OpenState();
      case 'CLOSED':
        return new ClosedState();
      case 'CANCELLED':
        return new CancelledState();
      default: {
        const unreachable: never = status;
        throw new Error(`Unsupported trade status: ${String(unreachable)}`);
      }
    }
  }

  private resolveRequestedEntryPrice(input: OpenTradeInput, market: MarketData): number {
    switch (input.orderType) {
      case 'MARKET':
        return market.askPrice;
      case 'LIMIT':
        return input.limitPrice;
      case 'STOP':
        return input.stopPrice;
      default: {
        const unreachable: never = input;
        throw new Error(`Unsupported trade input: ${String(unreachable)}`);
      }
    }
  }

  private toCreateTradeRecordInput(
    input: OpenTradeInput,
    execution: TradeResult,
    status: TradeStatus,
  ): CreateTradeRecordInput {
    const recordInput: CreateTradeRecordInput = {
      accountId: input.accountId,
      symbol: input.symbol,
      direction: input.direction,
      orderType: input.orderType,
      quantity: input.quantity,
      entryPrice: execution.executionPrice ?? this.resolveFallbackEntryPrice(input),
      status,
      enteredAt: execution.executed ? new Date() : null,
      closedAt: null,
    };

    if (input.orderType === 'LIMIT') {
      return {
        ...recordInput,
        limitPrice: input.limitPrice,
      };
    }

    if (input.orderType === 'STOP') {
      return {
        ...recordInput,
        stopPrice: input.stopPrice,
      };
    }

    return recordInput;
  }

  private resolveFallbackEntryPrice(input: OpenTradeInput): number {
    switch (input.orderType) {
      case 'MARKET':
        throw new Error('Market order must return an execution price.');
      case 'LIMIT':
        return input.limitPrice;
      case 'STOP':
        return input.stopPrice;
      default: {
        const unreachable: never = input;
        throw new Error(`Unsupported trade input: ${String(unreachable)}`);
      }
    }
  }

  private toTradeResponse(record: PersistedTradeRecord): TradeResponseDto {
    const baseResponse = {
      id: record.id,
      accountId: record.accountId,
      symbol: record.symbol,
      direction: record.direction,
      orderType: record.orderType,
      quantity: record.quantity,
      entryPrice: record.entryPrice,
      status: record.status,
      enteredAt: record.enteredAt,
      closedAt: record.closedAt,
    };

    if (record.limitPrice !== undefined) {
      return {
        ...baseResponse,
        limitPrice: record.limitPrice,
      };
    }

    if (record.stopPrice !== undefined) {
      return {
        ...baseResponse,
        stopPrice: record.stopPrice,
      };
    }

    return baseResponse;
  }

  private createTradeFromRecord(record: PersistedTradeRecord): Trade {
    if (record.orderType === 'LIMIT' && record.limitPrice === undefined) {
      throw new Error('Limit trade record missing limitPrice.');
    }

    if (record.orderType === 'STOP' && record.stopPrice === undefined) {
      throw new Error('Stop trade record missing stopPrice.');
    }

    if (record.orderType === 'MARKET') {
      return TradeFactory.create('MARKET', {
        id: record.id,
        accountId: record.accountId,
        symbol: record.symbol,
        direction: record.direction,
        orderType: 'MARKET',
        quantity: record.quantity,
        entryPrice: record.entryPrice,
        status: record.status,
        enteredAt: record.enteredAt,
        closedAt: record.closedAt,
      });
    }

    if (record.orderType === 'LIMIT') {
      if (record.limitPrice === undefined) {
        throw new Error('Limit trade record missing limitPrice.');
      }
      return TradeFactory.create('LIMIT', {
        id: record.id,
        accountId: record.accountId,
        symbol: record.symbol,
        direction: record.direction,
        orderType: 'LIMIT',
        quantity: record.quantity,
        entryPrice: record.entryPrice,
        status: record.status,
        enteredAt: record.enteredAt,
        closedAt: record.closedAt,
        limitPrice: record.limitPrice,
      });
    }

    if (record.orderType === 'STOP') {
      if (record.stopPrice === undefined) {
        throw new Error('Stop trade record missing stopPrice.');
      }
      return TradeFactory.create('STOP', {
        id: record.id,
        accountId: record.accountId,
        symbol: record.symbol,
        direction: record.direction,
        orderType: 'STOP',
        quantity: record.quantity,
        entryPrice: record.entryPrice,
        status: record.status,
        enteredAt: record.enteredAt,
        closedAt: record.closedAt,
        stopPrice: record.stopPrice,
      });
    }

    const unreachable: never = record.orderType;
    throw new Error(`Unsupported order type: ${String(unreachable)}`);
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  }
}
