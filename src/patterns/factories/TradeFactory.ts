import { LimitTrade } from '../../models/LimitTrade';
import { MarketTrade } from '../../models/MarketTrade';
import { StopTrade } from '../../models/StopTrade';
import { Trade } from '../../models/Trade';
import { OrderType, TradeCreationParams } from '../../models/trade.types';

export class TradeFactory {
  public static create(type: OrderType, params: TradeCreationParams): Trade {
    switch (type) {
      case 'MARKET':
        return new MarketTrade(params as Extract<TradeCreationParams, { orderType: 'MARKET' }>);
      case 'LIMIT':
        return new LimitTrade(params as Extract<TradeCreationParams, { orderType: 'LIMIT' }>);
      case 'STOP':
        return new StopTrade(params as Extract<TradeCreationParams, { orderType: 'STOP' }>);
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unsupported order type: ${String(exhaustiveCheck)}`);
      }
    }
  }
}