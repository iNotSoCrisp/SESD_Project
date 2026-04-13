import type { TradeStatus } from '../types'
import { InvalidStateError } from '../errors'

export interface TradeStateContext { readonly tradeId: string }
export interface TradeStateTransition { nextStatus: TradeStatus }

export interface TradeState {
  readonly status: TradeStatus
  open(context: TradeStateContext): TradeStateTransition
  close(context: TradeStateContext): TradeStateTransition
  cancel(context: TradeStateContext): TradeStateTransition
}

export class PendingState implements TradeState {
  readonly status = 'PENDING'
  open() { return { nextStatus: 'OPEN' as TradeStatus } }
  close(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('A pending trade cannot be closed before it is opened.') }
  cancel() { return { nextStatus: 'CANCELLED' as TradeStatus } }
}

export class OpenState implements TradeState {
  readonly status = 'OPEN'
  open(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('Trade is already open.') }
  close() { return { nextStatus: 'CLOSED' as TradeStatus } }
  cancel() { return { nextStatus: 'CANCELLED' as TradeStatus } }
}

export class ClosedState implements TradeState {
  readonly status = 'CLOSED'
  open(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('A closed trade cannot be reopened.') }
  close() { return { nextStatus: 'CLOSED' as TradeStatus } }
  cancel(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('A closed trade cannot be cancelled.') }
}

export class CancelledState implements TradeState {
  readonly status = 'CANCELLED'
  open(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('A cancelled trade cannot be opened.') }
  close(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('A cancelled trade cannot be closed.') }
  cancel(_ctx: TradeStateContext): TradeStateTransition { throw new InvalidStateError('A cancelled trade cannot be cancelled again.') }
}

export function getState(status: TradeStatus): TradeState {
  switch (status) {
    case 'PENDING': return new PendingState()
    case 'OPEN': return new OpenState()
    case 'CLOSED': return new ClosedState()
    case 'CANCELLED': return new CancelledState()
    default: { const _: never = status; throw new Error(`Unsupported trade status: ${String(_)}`) }
  }
}
