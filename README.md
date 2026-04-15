# ShadowTrade

Paper trading platform with emotion and psychology tracking.

## Live
- Frontend: https://[vercel-url]
- Backend: https://[railway-url]

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Run both
```bash
npm run dev   # from repo root (uses concurrently)
```

## Design Patterns Implemented

| Pattern | Implementation |
|---|---|
| **Factory** | `TradeFactory` — creates `MarketTrade`, `LimitTrade`, or `StopTrade` based on order type |
| **Strategy** | `OrderStrategy` — `MarketOrderStrategy`, `LimitOrderStrategy`, `StopOrderStrategy` executed via `TradeContext` |
| **State** | `TradeStateMachine` — `PendingState → OpenState → ClosedState / CancelledState` |
| **Observer** | `TradeEventPublisher` notifies `PnLCalculatorObserver`, `AnalyticsTriggerObserver`, `NotificationObserver` |
| **Template Method** | `AnalyticsEngine` — `EmotionPerformanceAnalyzer`, `TimeOfDayAnalyzer`, `WinRateAnalyzer` |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT |
| Dev | concurrently, ts-node-dev |

## Project Structure

```
.
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── controllers/
│       ├── models/          # Trade abstract + subclasses
│       ├── patterns/        # Strategies, States, Observers, Analytics Engine
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       └── types/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── types/
├── idea.md
├── useCaseDiagram.md
├── sequenceDiagram.md
├── classDiagram.md
└── ErDiagram.md
```
