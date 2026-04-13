import { PrismaClient } from '@prisma/client'
import type { EmotionLogRecord, CreateEmotionRecordInput } from '../types'

const prisma = new PrismaClient()

export interface IEmotionRepository {
  create(data: CreateEmotionRecordInput): Promise<EmotionLogRecord>
  findByTradeId(tradeId: string): Promise<readonly EmotionLogRecord[]>
  findPreEmotion(tradeId: string): Promise<EmotionLogRecord | null>
  findPostEmotion(tradeId: string): Promise<EmotionLogRecord | null>
}

export class EmotionRepository implements IEmotionRepository {
  async create(data: CreateEmotionRecordInput): Promise<EmotionLogRecord> {
    const c = await prisma.emotionLog.create({ data: { tradeId: data.tradeId, phase: data.phase, emotionType: data.emotionType, intensity: data.intensity, ...(data.notes !== undefined && { notes: data.notes }), loggedAt: data.loggedAt ?? new Date() } })
    return this.toRecord(c)
  }
  async findByTradeId(tradeId: string): Promise<readonly EmotionLogRecord[]> {
    const records = await prisma.emotionLog.findMany({ where: { tradeId }, orderBy: { loggedAt: 'asc' } })
    return records.map(r => this.toRecord(r))
  }
  async findPreEmotion(tradeId: string): Promise<EmotionLogRecord | null> {
    const r = await prisma.emotionLog.findFirst({ where: { tradeId, phase: 'PRE' } }); return r ? this.toRecord(r) : null
  }
  async findPostEmotion(tradeId: string): Promise<EmotionLogRecord | null> {
    const r = await prisma.emotionLog.findFirst({ where: { tradeId, phase: 'POST' } }); return r ? this.toRecord(r) : null
  }
  private toRecord(r: { id: string; tradeId: string; phase: 'PRE'|'POST'; emotionType: 'FOMO'|'CONFIDENT'|'FEARFUL'|'GREEDY'|'ANXIOUS'|'NEUTRAL'; intensity: number; notes: string | null; loggedAt: Date }): EmotionLogRecord {
    return { id: r.id, tradeId: r.tradeId, phase: r.phase, emotionType: r.emotionType, intensity: r.intensity, notes: r.notes ?? undefined, loggedAt: r.loggedAt }
  }
}
