import type { TradeStatus } from '../../models/trade.types';

export interface TradeStateContext {
  readonly tradeId: string;
}

export interface TradeStateTransition {
  nextStatus: TradeStatus;
}

export interface TradeState {
  readonly status: TradeStatus;
  open(context: TradeStateContext): TradeStateTransition;
  close(context: TradeStateContext): TradeStateTransition;
  cancel(context: TradeStateContext): TradeStateTransition;
}