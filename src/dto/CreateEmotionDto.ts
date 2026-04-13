export type EmotionPhase = 'PRE' | 'POST';

export type EmotionType = 'FOMO' | 'CONFIDENT' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'NEUTRAL';

export interface CreateEmotionDto {
  readonly tradeId: string;
  readonly phase: EmotionPhase;
  readonly emotionType: EmotionType;
  readonly intensity: number;
  readonly notes?: string | undefined;
  readonly loggedAt?: Date | undefined;
}