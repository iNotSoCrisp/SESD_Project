import { ConflictError, NotFoundError, ValidationError } from '../errors'
import type { CreateEmotionDto, EmotionLogRecord, PersistedTradeRecord } from '../types'
import type { IEmotionRepository } from '../repositories/EmotionRepository'
import type { ITradeRepository } from '../repositories/TradeRepository'

export class EmotionService {
  constructor(
    private readonly emotionRepo: IEmotionRepository,
    private readonly tradeRepo: ITradeRepository,
  ) {}

  async createEmotion(input: CreateEmotionDto): Promise<EmotionLogRecord> {
    this.validateIntensity(input.intensity)
    const trade = await this.tradeRepo.findById(input.tradeId)
    if (!trade) throw new NotFoundError('Trade not found.')
    await this.validatePhaseRules(input.tradeId, input.phase, trade.status)
    return this.emotionRepo.create({ tradeId: input.tradeId, phase: input.phase, emotionType: input.emotionType, intensity: input.intensity, notes: input.notes, loggedAt: input.loggedAt })
  }

  async getEmotionsByTradeId(tradeId: string): Promise<{ tradeId: string; pre: EmotionLogRecord | null; post: EmotionLogRecord | null; logs: readonly EmotionLogRecord[] }> {
    const trade = await this.tradeRepo.findById(tradeId)
    if (!trade) throw new NotFoundError('Trade not found.')
    const [pre, post, logs] = await Promise.all([this.emotionRepo.findPreEmotion(tradeId), this.emotionRepo.findPostEmotion(tradeId), this.emotionRepo.findByTradeId(tradeId)])
    return { tradeId, pre, post, logs }
  }

  private async validatePhaseRules(tradeId: string, phase: 'PRE' | 'POST', status: 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED'): Promise<void> {
    if (phase === 'PRE') {
      if (status !== 'PENDING' && status !== 'OPEN') throw new ValidationError('PRE emotion can only be logged for trades in PENDING or OPEN status.')
      const existing = await this.emotionRepo.findPreEmotion(tradeId)
      if (existing) throw new ConflictError('PRE emotion already exists for this trade.')
      return
    }
    if (status !== 'CLOSED') throw new ValidationError('POST emotion can only be logged for trades in CLOSED status.')
    const existing = await this.emotionRepo.findPostEmotion(tradeId)
    if (existing) throw new ConflictError('POST emotion already exists for this trade.')
  }

  private validateIntensity(intensity: number): void {
    if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) throw new ValidationError('intensity must be an integer between 1 and 5.')
  }
}
