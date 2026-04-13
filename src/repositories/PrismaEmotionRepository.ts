import type {
  CreateEmotionRecordInput,
  EmotionLogRecord,
  IEmotionRepository,
} from './interfaces/IEmotionRepository';
import { prisma } from './prisma';

export class PrismaEmotionRepository implements IEmotionRepository {
  async create(data: CreateEmotionRecordInput): Promise<EmotionLogRecord> {
    const created = await prisma.emotionLog.create({
      data: {
        tradeId: data.tradeId,
        phase: data.phase,
        emotionType: data.emotionType,
        intensity: data.intensity,
        ...(data.notes !== undefined && { notes: data.notes }),
        loggedAt: data.loggedAt ?? new Date(),
      },
    });

    return this.toEmotionLogRecord(created);
  }

  async findByTradeId(tradeId: string): Promise<ReadonlyArray<EmotionLogRecord>> {
    const records = await prisma.emotionLog.findMany({
      where: {
        tradeId,
      },
      orderBy: {
        loggedAt: 'asc',
      },
    });

    return records.map((record: {
      id: string;
      tradeId: string;
      phase: 'PRE' | 'POST';
      emotionType: 'FOMO' | 'CONFIDENT' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'NEUTRAL';
      intensity: number;
      notes: string | null;
      loggedAt: Date;
    }) => this.toEmotionLogRecord(record));
  }

  async findPreEmotion(tradeId: string): Promise<EmotionLogRecord | null> {
    const record = await prisma.emotionLog.findFirst({
      where: {
        tradeId,
        phase: 'PRE',
      },
    });

    return record === null ? null : this.toEmotionLogRecord(record);
  }

  async findPostEmotion(tradeId: string): Promise<EmotionLogRecord | null> {
    const record = await prisma.emotionLog.findFirst({
      where: {
        tradeId,
        phase: 'POST',
      },
    });

    return record === null ? null : this.toEmotionLogRecord(record);
  }

  private toEmotionLogRecord(record: {
    id: string;
    tradeId: string;
    phase: 'PRE' | 'POST';
    emotionType: 'FOMO' | 'CONFIDENT' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'NEUTRAL';
    intensity: number;
    notes: string | null;
    loggedAt: Date;
  }): EmotionLogRecord {
    return {
      id: record.id,
      tradeId: record.tradeId,
      phase: record.phase,
      emotionType: record.emotionType,
      intensity: record.intensity,
      notes: record.notes ?? undefined,
      loggedAt: record.loggedAt,
    };
  }
}