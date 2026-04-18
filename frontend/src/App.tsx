import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import MainPage from './pages/MainPage'
import PlaceholderPage from './pages/PlaceholderPage'
import React from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><PlaceholderPage path="/portfolio" /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><PlaceholderPage path="/history" /></ProtectedRoute>} />
          <Route path="/psychology" element={<ProtectedRoute><PlaceholderPage path="/psychology" /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PlaceholderPage path="/settings" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
