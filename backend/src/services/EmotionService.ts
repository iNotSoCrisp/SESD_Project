import type { CreateEmotionDto } from '../dto/CreateEmotionDto';
import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import type { IEmotionRepository } from '../repositories/interfaces/IEmotionRepository';
import type { ITradeRepository } from '../repositories/interfaces/ITradeRepository';

export interface EmotionServiceDependencies {
  readonly emotionRepository: IEmotionRepository;
  readonly tradeRepository: ITradeRepository;
}

export class EmotionService {
  private readonly emotionRepository: IEmotionRepository;
  private readonly tradeRepository: ITradeRepository;

  constructor(dependencies: EmotionServiceDependencies) {
    this.emotionRepository = dependencies.emotionRepository;
    this.tradeRepository = dependencies.tradeRepository;
  }

  async createEmotion(input: CreateEmotionDto) {
    this.validateIntensity(input.intensity);

    const trade = await this.tradeRepository.findById(input.tradeId);
    if (trade === null) {
      throw new NotFoundError('Trade not found.');
    }

    await this.validatePhaseRules(input.tradeId, input.phase, trade.status);

    return this.emotionRepository.create({
      tradeId: input.tradeId,
      phase: input.phase,
      emotionType: input.emotionType,
      intensity: input.intensity,
      notes: input.notes,
      loggedAt: input.loggedAt,
    });
  }

  async getEmotionsByTradeId(tradeId: string) {
    const trade = await this.tradeRepository.findById(tradeId);
    if (trade === null) {
      throw new NotFoundError('Trade not found.');
    }

    const [pre, post, all] = await Promise.all([
      this.emotionRepository.findPreEmotion(tradeId),
      this.emotionRepository.findPostEmotion(tradeId),
      this.emotionRepository.findByTradeId(tradeId),
    ]);

    return {
      tradeId,
      pre,
      post,
      logs: all,
    };
  }

  private async validatePhaseRules(
    tradeId: string,
    phase: 'PRE' | 'POST',
    tradeStatus: 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED',
  ): Promise<void> {
    if (phase === 'PRE') {
      if (tradeStatus !== 'PENDING' && tradeStatus !== 'OPEN') {
        throw new ValidationError('PRE emotion can only be logged for trades in PENDING or OPEN status.');
      }

      const existingPre = await this.emotionRepository.findPreEmotion(tradeId);
      if (existingPre !== null) {
        throw new ConflictError('PRE emotion already exists for this trade.');
      }

      return;
    }

    if (tradeStatus !== 'CLOSED') {
      throw new ValidationError('POST emotion can only be logged for trades in CLOSED status.');
    }

    const existingPost = await this.emotionRepository.findPostEmotion(tradeId);
    if (existingPost !== null) {
      throw new ConflictError('POST emotion already exists for this trade.');
    }
  }

  private validateIntensity(intensity: number): void {
    if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) {
      throw new ValidationError('intensity must be an integer between 1 and 5.');
    }
  }
}