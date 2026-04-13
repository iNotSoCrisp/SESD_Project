import type { CreateEmotionDto, EmotionPhase, EmotionType } from '../../dto/CreateEmotionDto';

export interface EmotionLogRecord {
  readonly id: string;
  readonly tradeId: string;
  readonly phase: EmotionPhase;
  readonly emotionType: EmotionType;
  readonly intensity: number;
  readonly notes?: string | undefined;
  readonly loggedAt: Date;
}

export interface CreateEmotionRecordInput {
  readonly tradeId: string;
  readonly phase: EmotionPhase;
  readonly emotionType: EmotionType;
  readonly intensity: number;
  readonly notes?: string | undefined;
  readonly loggedAt?: Date | undefined;
}

export interface IEmotionRepository {
  create(data: CreateEmotionRecordInput): Promise<EmotionLogRecord>;
  findByTradeId(tradeId: string): Promise<ReadonlyArray<EmotionLogRecord>>;
  findPreEmotion(tradeId: string): Promise<EmotionLogRecord | null>;
  findPostEmotion(tradeId: string): Promise<EmotionLogRecord | null>;
}

export type { CreateEmotionDto };