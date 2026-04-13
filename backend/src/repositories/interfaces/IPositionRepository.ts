export interface CreatePositionInput {
  readonly tradeId: string;
  readonly realizedPnl: number;
  readonly returnPct: number;
  readonly durationMins?: number | undefined;
  readonly maxDrawdown?: number | undefined;
  readonly maxProfit?: number | undefined;
}

export interface PositionRecord {
  readonly id: string;
  readonly tradeId: string;
  readonly realizedPnl: number | null;
  readonly returnPct: number | null;
  readonly durationMins: number | null;
  readonly maxDrawdown: number | null;
  readonly maxProfit: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IPositionRepository {
  create(input: CreatePositionInput): Promise<PositionRecord>;
  findByTradeId(tradeId: string): Promise<PositionRecord | null>;
}