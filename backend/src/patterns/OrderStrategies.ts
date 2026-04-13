import type { Trade } from '../models/Trade'
import type { LimitTrade, StopTrade } from '../models/Trade'
import type { MarketData, TradeResult } from '../types'

export interface OrderStrategy {
  execute(trade: Trade, market: MarketData): TradeResult
}

export class MarketOrderStrategy implements OrderStrategy {
  public execute(trade: Trade, market: MarketData): TradeResult {
    const executionPrice = trade.direction === 'LONG' ? market.askPrice : market.bidPrice
    trade.entryPrice = executionPrice
    trade.execute()
    return { tradeId: trade.id, executed: true, executionPrice, status: trade.status, message: `Market order executed for ${trade.symbol} at ${executionPrice.toFixed(2)}`, timestamp: market.timestamp }
  }
}

export class LimitOrderStrategy implements OrderStrategy {
  public execute(trade: Trade, market: MarketData): TradeResult {
    const lt = trade as LimitTrade
    const canExecute = (trade.direction === 'LONG' && market.askPrice <= lt.limitPrice) || (trade.direction === 'SHORT' && market.bidPrice >= lt.limitPrice)
    if (!canExecute) {
      return { tradeId: trade.id, executed: false, executionPrice: null, status: trade.status, message: `Limit order pending for ${trade.symbol}; target price ${lt.limitPrice.toFixed(2)} not reached`, timestamp: market.timestamp }
    }
    trade.entryPrice = lt.limitPrice; trade.execute()
    return { tradeId: trade.id, executed: true, executionPrice: lt.limitPrice, status: trade.status, message: `Limit order executed for ${trade.symbol} at ${lt.limitPrice.toFixed(2)}`, timestamp: market.timestamp }
  }
}

export class StopOrderStrategy implements OrderStrategy {
  public execute(trade: Trade, market: MarketData): TradeResult {
    const st = trade as StopTrade
    const canExecute = (trade.direction === 'LONG' && market.askPrice >= st.stopPrice) || (trade.direction === 'SHORT' && market.bidPrice <= st.stopPrice)
    if (!canExecute) {
      return { tradeId: trade.id, executed: false, executionPrice: null, status: trade.status, message: `Stop order pending for ${trade.symbol}; trigger price ${st.stopPrice.toFixed(2)} not reached`, timestamp: market.timestamp }
    }
    trade.entryPrice = st.stopPrice; trade.execute()
    return { tradeId: trade.id, executed: true, executionPrice: st.stopPrice, status: trade.status, message: `Stop order executed for ${trade.symbol} at ${st.stopPrice.toFixed(2)}`, timestamp: market.timestamp }
  }
}

export function getStrategy(orderType: 'MARKET' | 'LIMIT' | 'STOP'): OrderStrategy {
  switch (orderType) {
    case 'MARKET': return new MarketOrderStrategy()
    case 'LIMIT': return new LimitOrderStrategy()
    case 'STOP': return new StopOrderStrategy()
    default: { const _: never = orderType; throw new Error(`Unsupported order type: ${String(_)}`) }
  }
}

export class TradeContext {
  private strategy: OrderStrategy
  constructor(strategy: OrderStrategy) { this.strategy = strategy }
  setStrategy(s: OrderStrategy): void { this.strategy = s }
  executeOrder(trade: Trade, market: MarketData): TradeResult { return this.strategy.execute(trade, market) }
}
