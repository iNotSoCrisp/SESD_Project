import { InvalidStateError } from './InvalidStateError';
import type { TradeState, TradeStateContext, TradeStateTransition } from './TradeState';

export class CancelledState implements TradeState {
  readonly status = 'CANCELLED';

  open(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('A cancelled trade cannot be opened.');
  }

  close(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('A cancelled trade cannot be closed.');
  }

  cancel(_context: TradeStateContext): TradeStateTransition {
    throw new InvalidStateError('A cancelled trade cannot be cancelled again.');
  }
}