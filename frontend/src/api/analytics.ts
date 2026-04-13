import client from './client'
import type { AnalyticsInsight } from '../types'

export const getEmotionPerformance = () =>
  client.get<{ data: AnalyticsInsight }>('/analytics/emotion-performance')

export const getTimeOfDay = () =>
  client.get<{ data: AnalyticsInsight }>('/analytics/time-of-day')

export const getWinRate = () =>
  client.get<{ data: AnalyticsInsight }>('/analytics/win-rate')
