import { LimitTrade, MarketTrade, StopTrade, type Trade } from './Trade'
import type { OrderType, TradeCreationParams } from '../types'

export class TradeFactory {
  public static create(type: OrderType, params: TradeCreationParams): Trade {
    switch (type) {
      case 'MARKET': return new MarketTrade(params as Extract<TradeCreationParams, { orderType: 'MARKET' }>)
      case 'LIMIT': return new LimitTrade(params as Extract<TradeCreationParams, { orderType: 'LIMIT' }>)
      case 'STOP': return new StopTrade(params as Extract<TradeCreationParams, { orderType: 'STOP' }>)
      default: { const _: never = type; throw new Error(`Unsupported order type: ${String(_)}`) }
    }
  }
}
