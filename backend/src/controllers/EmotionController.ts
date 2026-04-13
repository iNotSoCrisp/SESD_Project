import type { Request, Response } from 'express';
import type { CreateEmotionDto, EmotionPhase, EmotionType } from '../dto/CreateEmotionDto';
import { AppError } from '../errors/AppError';
import { EmotionService } from '../services/EmotionService';

type RequestHandler = (request: Request, response: Response) => Promise<Response> | Response;

export class EmotionController {
  constructor(private readonly emotionService: EmotionService) {}

  createEmotion: RequestHandler = async (request, response) => {
    try {
      const body = request.body as Record<string, unknown>;
      const input: CreateEmotionDto = {
        tradeId: this.getRequiredString(body.tradeId, 'tradeId'),
        phase: this.getRequiredPhase(body.phase),
        emotionType: this.getRequiredEmotionType(body.emotionType),
        intensity: this.getRequiredNumber(body.intensity, 'intensity'),
        notes: this.getOptionalString(body.notes),
        loggedAt: this.getOptionalDate(body.loggedAt),
      };

      const created = await this.emotionService.createEmotion(input);
      return response.status(201).json({ data: created });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  getEmotionsByTradeId: RequestHandler = async (request, response) => {
    try {
      const tradeId = this.getRequiredString(request.params.tradeId, 'tradeId');
      const emotions = await this.emotionService.getEmotionsByTradeId(tradeId);
      return response.status(200).json({ data: emotions });
    } catch (error: unknown) {
      return this.handleError(response, error);
    }
  };

  private handleError(response: Response, error: unknown): Response {
    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        error: error.message,
      });
    }

    if (error instanceof Error) {
      return response.status(400).json({
        error: error.message,
      });
    }

    return response.status(500).json({
      error: 'An unexpected error occurred.',
    });
  }

  private getRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} must be a non-empty string.`);
    }

    return value.trim();
  }

  private getOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getRequiredNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`${fieldName} must be a valid number.`);
    }

    return value;
  }

  private getOptionalDate(value: unknown): Date | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new Error('loggedAt must be a valid ISO date string.');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('loggedAt must be a valid ISO date string.');
    }

    return parsed;
  }

  private getRequiredPhase(value: unknown): EmotionPhase {
    if (value === 'PRE' || value === 'POST') {
      return value;
    }

    throw new Error('phase must be either PRE or POST.');
  }

  private getRequiredEmotionType(value: unknown): EmotionType {
    if (
      value === 'FOMO' ||
      value === 'CONFIDENT' ||
      value === 'FEARFUL' ||
      value === 'GREEDY' ||
      value === 'ANXIOUS' ||
      value === 'NEUTRAL'
    ) {
      return value;
    }

    throw new Error('emotionType must be one of FOMO, CONFIDENT, FEARFUL, GREEDY, ANXIOUS, or NEUTRAL.');
  }
}