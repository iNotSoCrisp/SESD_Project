import dotenv from 'dotenv'

// MUST be called before any other module reads process.env
// Using a top-level import so it runs as early as possible
dotenv.config()

import cors from 'cors'
import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import { syncUserMiddleware } from './middlewares/syncUser'
import { tradeRoutes } from './routes/tradeRoutes'
import { analyticsRoutes } from './routes/analyticsRoutes'
import { accountRoutes } from './routes/accountRoutes'
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  await prisma.$executeRawUnsafe('SELECT 1')
  await prisma.$disconnect()
  console.log('Database connection verified')

  const app = express()

  const frontendUrl = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', frontendUrl].filter(Boolean),
    credentials: true,
  }))
  app.use(express.json())

  // Global Clerk middleware sets req.auth
  app.use(clerkMiddleware())
  
  // Custom middleware to lazily sync Clerk users to Prisma DB
  app.use(syncUserMiddleware)
  app.use('/api', accountRoutes)
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
