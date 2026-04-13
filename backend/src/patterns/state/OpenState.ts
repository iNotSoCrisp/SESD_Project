import { InvalidStateError } from './InvalidStateError';
import type { TradeState, TradeStateContext, TradeStateTransition } from './TradeState';

export class OpenState implements TradeState {
  readonly status = 'OPEN';

  open(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('Trade is already open.');
  }

  close(_context: TradeStateContext): TradeStateTransition {
    return {
      nextStatus: 'CLOSED',
    };
  }

  cancel(_context: TradeStateContext): TradeStateTransition {
    return {
      nextStatus: 'CANCELLED',
    };
  }
}