import type { TradeState, TradeStateContext, TradeStateTransition } from './TradeState';
import { InvalidStateError } from './InvalidStateError';

export class ClosedState implements TradeState {
  readonly status = 'CLOSED';

  open(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('A closed trade cannot be reopened.');
  }

  close(_context: TradeStateContext): TradeStateTransition {
    return {
      nextStatus: 'CLOSED',
    };
  }

  cancel(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('A closed trade cannot be cancelled.');
  }
}