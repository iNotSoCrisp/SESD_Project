import type { Request, Response } from 'express'
import type { TradeService } from '../services/TradeService'

type Handler = (req: Request, res: Response) => Promise<Response>

export class TradeController {
  constructor(private readonly svc: TradeService) {}

  listTrades: Handler = async (req, res) => {
    try {
      const q = req.query as Record<string, string | undefined>
      const trades = await this.svc.listTrades({ accountId: q.accountId, symbol: q.symbol, status: q.status as any, direction: q.direction as any, orderType: q.orderType as any })
      return res.status(200).json({ data: trades })
    } catch (e: unknown) { return this.err(res, e) }
  }

  openTrade: Handler = async (req, res) => {
    try {
      const b = req.body as Record<string, unknown>
      const input = {
        accountId: this.reqStr(b.accountId), symbol: (this.reqStr(b.symbol) as string).toUpperCase(),
        direction: this.reqEnum(b.direction, ['LONG', 'SHORT']) as 'LONG'|'SHORT',
        orderType: this.reqEnum(b.orderType, ['MARKET', 'LIMIT', 'STOP']) as 'MARKET'|'LIMIT'|'STOP',
        quantity: this.reqNum(b.quantity),
        ...(this.optNum(b.limitPrice) !== undefined && { limitPrice: this.optNum(b.limitPrice) }),
        ...(this.optNum(b.stopPrice) !== undefined && { stopPrice: this.optNum(b.stopPrice) }),
        ...(typeof b.emotion === 'string' && b.emotion.trim() && { emotion: b.emotion.trim() }),
      } as { accountId: string; symbol: string; direction: 'LONG'|'SHORT'; orderType: 'MARKET'|'LIMIT'|'STOP'; quantity: number; limitPrice?: number; stopPrice?: number; emotion?: string }
      const result = await this.svc.openTrade(input)
      return res.status(201).json({ data: result })
    } catch (e: unknown) { return this.err(res, e) }
  }

  closeTrade: Handler = async (req, res) => {
    try {
      const result = await this.svc.closeTrade(this.reqStr(req.params.id))
      return res.status(200).json({ data: result })
    } catch (e: unknown) { return this.err(res, e) }
  }

  sellTrade: Handler = async (req, res) => {
    try {
      const b = req.body as Record<string, unknown>
      const accountId = this.reqStr(b.accountId)
      const symbol = (this.reqStr(b.symbol) as string).toUpperCase()
      const quantity = this.reqNum(b.quantity)
      const emotion = typeof b.emotion === 'string' ? b.emotion.trim() : undefined
      const result = await this.svc.sellTrade(accountId, symbol, quantity, emotion)
      return res.status(200).json({ data: result })
    } catch (e: unknown) { return this.err(res, e) }
  }

  cancelTrade: Handler = async (req, res) => {
    try {
      const result = await this.svc.cancelTrade(this.reqStr(req.params.id))
      return res.status(200).json({ data: result })
    } catch (e: unknown) { return this.err(res, e) }
  }

  private reqStr(v: unknown): string { if (typeof v !== 'string' || !v.trim()) throw new Error('Field required.'); return v.trim() }
  private reqEnum(v: unknown, vals: string[]): string { if (vals.includes(v as string)) return v as string; throw new Error(`Invalid value. Expected one of: ${vals.join(', ')}`) }
  private reqNum(v: unknown): number { if (typeof v !== 'number' || Number.isNaN(v)) throw new Error('Field must be a number'); return v }
  private optNum(v: unknown): number | undefined { return typeof v === 'number' && !Number.isNaN(v) ? v : undefined }
  private err(res: Response, e: unknown): Response {
    if (e instanceof Error) { const sc = 'statusCode' in e ? (e as any).statusCode : 400; return res.status(sc).json({ error: e.message }) }
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
