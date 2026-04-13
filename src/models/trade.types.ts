export type TradeDirection = 'LONG' | 'SHORT';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';

export type TradeStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface TradeBaseParams {
  id: string;
  accountId: string;
  symbol: string;
  direction: TradeDirection;
  quantity: number;
  entryPrice: number;
  status?: TradeStatus;
  enteredAt?: Date | null;
  closedAt?: Date | null;
}

export interface MarketTradeCreationParams extends TradeBaseParams {
  orderType: 'MARKET';
}

export interface LimitTradeCreationParams extends TradeBaseParams {
  orderType: 'LIMIT';
  limitPrice: number;
}

export interface StopTradeCreationParams extends TradeBaseParams {
  orderType: 'STOP';
  stopPrice: number;
}

export type TradeCreationParams =
  | MarketTradeCreationParams
  | LimitTradeCreationParams
  | StopTradeCreationParams;

export interface MarketData {
  symbol: string;
  price: number;
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface TradeResult {
  tradeId: string;
  executed: boolean;
  executionPrice: number | null;
  status: TradeStatus;
  message: string;
  timestamp: Date;
}