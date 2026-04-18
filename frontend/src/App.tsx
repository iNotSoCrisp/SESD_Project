import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import React from 'react'
import ErrorBoundary from './components/ErrorBoundary'

import AuthPage from './pages/AuthPage'
import PlaceholderPage from './pages/PlaceholderPage'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import GainersLosers from './pages/GainersLosers'
import Heatmap from './pages/Heatmap'
import CryptoPage from './pages/CryptoPage'
import PsychologyLog from './pages/PsychologyLog'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
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

            <Route path="/portfolio" element={<ProtectedRoute><PlaceholderPage path="/portfolio" /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><PlaceholderPage path="/history" /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PlaceholderPage path="/settings" /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
