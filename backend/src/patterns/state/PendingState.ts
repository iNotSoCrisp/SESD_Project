import { InvalidStateError } from './InvalidStateError';
import type { TradeState, TradeStateContext, TradeStateTransition } from './TradeState';

export class PendingState implements TradeState {
  readonly status = 'PENDING';

  open(_context: TradeStateContext): TradeStateTransition {
    return {
      nextStatus: 'OPEN',
    };
  }

  close(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('A pending trade cannot be closed before it is opened.');
  }

  cancel(_context: TradeStateContext): TradeStateTransition {
    return {
      nextStatus: 'CANCELLED',
    };
  }
}