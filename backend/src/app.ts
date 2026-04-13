import cors from 'cors';
import express from 'express';
import { accountRoutes } from './routes/accountRoutes';
import { analyticsRoutes } from './routes/analyticsRoutes';
import { authRoutes } from './routes/authRoutes';
import { emotionRoutes } from './routes/emotionRoutes';
import { tradeRoutes } from './routes/tradeRoutes';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Public routes (no auth required)
app.use('/api', authRoutes);

// Protected routes (JWT auth required)
app.use('/api', accountRoutes);
app.use('/api', tradeRoutes);
app.use('/api', emotionRoutes);
app.use('/api', analyticsRoutes);

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
  });
});

export { app };
