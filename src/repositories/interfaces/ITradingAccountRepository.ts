export interface TradingAccountSummary {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly balance: number;
  readonly broker?: string | undefined;
  readonly isActive: boolean;
  readonly currency: string;
}

export interface CreateTradingAccountInput {
  readonly userId: string;
  readonly name: string;
  readonly currency: string;
  readonly balance: number;
  readonly broker?: string | undefined;
}

export interface ITradingAccountRepository {
  findById(id: string): Promise<TradingAccountSummary | null>;
  findByUserId(userId: string): Promise<ReadonlyArray<TradingAccountSummary>>;
  create(data: CreateTradingAccountInput): Promise<TradingAccountSummary>;
  updateBalance(id: string, newBalance: number): Promise<TradingAccountSummary>;
}