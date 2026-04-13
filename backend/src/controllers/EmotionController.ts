import type { Request, Response } from 'express'
import type { EmotionService } from '../services/EmotionService'

type Handler = (req: Request, res: Response) => Promise<Response>

export class EmotionController {
  constructor(private readonly svc: EmotionService) {}

  createEmotion: Handler = async (req, res) => {
    try {
      const b = req.body as Record<string, unknown>
      const input = {
        tradeId: this.reqStr(b.tradeId), phase: this.reqEnum(b.phase, ['PRE', 'POST']) as 'PRE'|'POST',
        emotionType: this.reqEnum(b.emotionType, ['FOMO','CONFIDENT','FEARFUL','GREEDY','ANXIOUS','NEUTRAL']) as any,
        intensity: this.reqInt(b.intensity), notes: this.optStr(b.notes), loggedAt: this.optDate(b.loggedAt),
      }
      const created = await this.svc.createEmotion(input)
      return res.status(201).json({ data: created })
    } catch (e: unknown) { return this.err(res, e) }
  }

  getEmotionsByTradeId: Handler = async (req, res) => {
    try {
      const emotions = await this.svc.getEmotionsByTradeId(this.reqStr(req.params.tradeId))
      return res.status(200).json({ data: emotions })
    } catch (e: unknown) { return this.err(res, e) }
  }

  private reqStr(v: unknown): string { if (typeof v !== 'string' || !v.trim()) throw new Error('Field required.'); return v.trim() }
  private reqEnum(v: unknown, vals: string[]): string { if (vals.includes(v as string)) return v as string; throw new Error(`Invalid value. Expected: ${vals.join(', ')}`) }
  private reqInt(v: unknown): number { if (typeof v !== 'number' || !Number.isInteger(v)) throw new Error('Must be an integer'); return v }
  private optStr(v: unknown): string | undefined { return typeof v === 'string' ? v : undefined }
  private optDate(v: unknown): Date | undefined {
    if (v === undefined) return undefined
    if (typeof v !== 'string') throw new Error('Must be a date string')
    const d = new Date(v); if (Number.isNaN(d.getTime())) throw new Error('Invalid date'); return d
  }
  private err(res: Response, e: unknown): Response {
    if (e instanceof Error) { const sc = 'statusCode' in e ? (e as any).statusCode : 400; return res.status(sc).json({ error: e.message }) }
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
