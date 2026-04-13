export type { OrderType, TradeDirection, TradeStatus } from '../../models/trade.types';
import type { OrderType, TradeDirection, TradeStatus } from '../../models/trade.types';

export interface PersistedTradeRecord {
  readonly id: string;
  readonly accountId: string;
  readonly symbol: string;
  readonly direction: TradeDirection;
  readonly orderType: OrderType;
  readonly quantity: number;
  readonly entryPrice: number;
  readonly status: TradeStatus;
  readonly enteredAt: Date | null;
  readonly closedAt: Date | null;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

export interface TradeListFilters {
  readonly accountId?: string | undefined;
  readonly symbol?: string | undefined;
  readonly status?: TradeStatus | undefined;
  readonly direction?: TradeDirection | undefined;
  readonly orderType?: OrderType | undefined;
}

export interface CreateTradeRecordInput {
  readonly id?: string;
  readonly accountId: string;
  readonly symbol: string;
  readonly direction: TradeDirection;
  readonly orderType: OrderType;
  readonly quantity: number;
  readonly entryPrice: number;
  readonly status: TradeStatus;
  readonly enteredAt: Date | null;
  readonly closedAt: Date | null;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

export interface UpdateTradeRecordInput {
  readonly status?: TradeStatus;
  readonly entryPrice?: number;
  readonly enteredAt?: Date | null;
  readonly closedAt?: Date | null;
}

export interface ITradeRepository {
  findMany(filters: TradeListFilters): Promise<ReadonlyArray<PersistedTradeRecord>>;
  findById(id: string): Promise<PersistedTradeRecord | null>;
  findByAccountId(accountId: string, filters?: TradeListFilters): Promise<ReadonlyArray<PersistedTradeRecord>>;
  findByUserId(userId: string, filters?: TradeListFilters): Promise<ReadonlyArray<PersistedTradeRecord>>;
  create(input: CreateTradeRecordInput): Promise<PersistedTradeRecord>;
  update(id: string, input: UpdateTradeRecordInput): Promise<PersistedTradeRecord>;
  updateStatus(id: string, status: TradeStatus, closedAt?: Date): Promise<PersistedTradeRecord>;
}