import type { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

type RequestHandler = (request: Request, response: Response) => Promise<Response> | Response;

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  emotionPerformance: RequestHandler = async (request, response) => {
    if (request.user === undefined) {
      return response.status(401).json({ error: 'Authentication required.' });
    }
    const report = await this.analyticsService.getReport(request.user.userId, 'emotion-performance');
    return response.status(200).json({ data: report });
  };

  timeOfDay: RequestHandler = async (request, response) => {
    if (request.user === undefined) {
      return response.status(401).json({ error: 'Authentication required.' });
    }
    const report = await this.analyticsService.getReport(request.user.userId, 'time-of-day');
    return response.status(200).json({ data: report });
  };

  winRate: RequestHandler = async (request, response) => {
    if (request.user === undefined) {
      return response.status(401).json({ error: 'Authentication required.' });
    }
    const report = await this.analyticsService.getReport(request.user.userId, 'win-rate');
    return response.status(200).json({ data: report });
  };
}
