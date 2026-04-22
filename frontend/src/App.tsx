import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import React from 'react'
import ErrorBoundary from './components/ErrorBoundary'

import AuthPage from './pages/AuthPage'
import Portfolio from './pages/Portfolio'
import TradeHistory from './pages/TradeHistory'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import GainersLosers from './pages/GainersLosers'
import Heatmap from './pages/Heatmap'
import CryptoPage from './pages/CryptoPage'
import PsychologyLog from './pages/PsychologyLog'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth()
  if (!isLoaded) return <div className="min-h-screen bg-base flex justify-center items-center text-accent">Loading...</div>
  return userId ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />
            <Route path="/movers" element={<ProtectedRoute><GainersLosers /></ProtectedRoute>} />
            <Route path="/heatmap" element={<ProtectedRoute><Heatmap /></ProtectedRoute>} />
            <Route path="/crypto" element={<ProtectedRoute><CryptoPage /></ProtectedRoute>} />
            <Route path="/psychology" element={<ProtectedRoute><PsychologyLog /></ProtectedRoute>} />

            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
    </ErrorBoundary>
  )
}
