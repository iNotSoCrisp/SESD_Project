import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import { authRoutes } from './routes/authRoutes'
import { tradeRoutes } from './routes/tradeRoutes'
import { analyticsRoutes } from './routes/analyticsRoutes'

dotenv.config()

const app = express()

app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL ?? ''].filter(Boolean),
  credentials: true,
}))
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api', tradeRoutes)
app.use('/api', analyticsRoutes)

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3000)
if (Number.isNaN(port)) throw new Error('PORT must be a number')
app.listen(port, () => console.log(`Server running on port ${port}`))

export { app }
