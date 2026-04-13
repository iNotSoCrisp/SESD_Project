import type { Request, Response } from 'express'
import type { AnalyticsService } from '../services/AnalyticsService'

type Handler = (req: Request, res: Response) => Promise<Response>

export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  emotionPerformance: Handler = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
    const report = await this.svc.getReport(req.user.userId, 'emotion-performance')
    return res.status(200).json({ data: report })
  }

  timeOfDay: Handler = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
    const report = await this.svc.getReport(req.user.userId, 'time-of-day')
    return res.status(200).json({ data: report })
  }

  winRate: Handler = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
    const report = await this.svc.getReport(req.user.userId, 'win-rate')
    return res.status(200).json({ data: report })
  }
}
