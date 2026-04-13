import client from './client'
import type { EmotionLog, EmotionType, EmotionPhase } from '../types'

export const logEmotion = (data: {
  tradeId: string; phase: EmotionPhase; emotionType: EmotionType
  intensity: number; notes?: string
}) => client.post<{ data: EmotionLog }>('/emotions', data)

export const getEmotions = (tradeId: string) =>
  client.get<{ data: { pre: EmotionLog | null; post: EmotionLog | null; logs: EmotionLog[] } }>(`/emotions/${tradeId}`)
