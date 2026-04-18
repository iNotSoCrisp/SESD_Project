import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import { authRoutes } from './routes/authRoutes'
import { tradeRoutes } from './routes/tradeRoutes'
import { analyticsRoutes } from './routes/analyticsRoutes'
import { PrismaClient } from '@prisma/client'

dotenv.config()

async function main() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  await prisma.$executeRawUnsafe('SELECT 1')
  await prisma.$disconnect()
  console.log('Database connection verified')

  const app = express()

  const frontendUrl = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  app.use(cors({
    origin: ['http://localhost:5173', frontendUrl].filter(Boolean),
    credentials: true,
  }))
  app.use(express.json())

  app.use('/api', authRoutes)
  app.use('/api', tradeRoutes)
  app.use('/api', analyticsRoutes)

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))

  const PORT = process.env.PORT ?? 3000
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

main().catch(err => {
  console.error('Failed to initialize:', err)
  process.exit(1)
})
