import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { register, login } from '../api/auth'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = isLogin
        ? await login(email, password)
        : await register(email, username, password)
      const { user, token } = res.data.data
      authLogin(user, token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-base text-text-primary font-inter">
      
      {/* Left Panel (40%) - Visual Hero */}
      <div className="hidden lg:flex w-[40%] bg-base flex-col relative overflow-hidden border-r border-border-subtle p-12">
        {/* Animated Gradient Blob (abstract background) */}
        <div className="absolute top-1/4 left-1/4 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 opacity-[0.03] bg-[conic-gradient(from_0deg,var(--color-accent),#AB47BC,var(--color-bullish),var(--color-accent))] blur-[100px] animate-spin" style={{ animationDuration: '20s' }}></div>
        
        {/* Abstract Chart SVG Layer (Opacity 0.04) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 80 L 10 75 L 20 85 L 30 65 L 40 70 L 50 40 L 60 55 L 70 30 L 80 45 L 90 20 L 100 35 L 100 100 L 0 100 Z" fill="var(--color-accent)"/>
          <path d="M0 80 L 10 75 L 20 85 L 30 65 L 40 70 L 50 40 L 60 55 L 70 30 L 80 45 L 90 20 L 100 35" stroke="var(--color-accent)" strokeWidth="0.5" fill="none"/>
        </svg>

        {/* Brand */}
        <div className="flex items-center gap-2 mb-auto shrink-0 relative z-10">
          <Activity className="text-accent w-6 h-6" />
          <span className="font-mono font-bold text-xl tracking-tight text-white">ShadowTrade</span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-[320px] mb-24">
          <h1 className="text-[32px] font-semibold leading-tight text-white mb-4">
            <span className="block text-text-secondary">Trade without risk.</span>
            <span className="block">Understand your mind.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Paper trading with emotion tracking. Built for self-aware traders.
          </p>
        </div>

        {/* Bottom Trust Strip */}
        <div className="mt-auto flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-disabled">
            <span className="bg-surface-elevated px-2 py-1 rounded border border-border-subtle">10,000+ Trades Simulated</span>
            <span className="bg-surface-elevated px-2 py-1 rounded border border-border-subtle">94% Accuracy Tracked</span>
            <span className="bg-surface-elevated px-2 py-1 rounded border border-border-subtle">Real Market Data</span>
          </div>
        </div>
      </div>

      {/* Right Panel (60%) - Login Form */}
      <div className="w-full lg:w-[60%] bg-surface flex items-center justify-center relative p-6">


        <div className="w-full max-w-[360px] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-1">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-text-secondary">
              {isLogin ? 'Sign in to your trading dashboard' : 'Start mastering your trading psychology'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-base border border-border-subtle rounded-[6px] text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent focus:shadow-accent-glow transition-all"
              />
            </div>

            {!isLogin && (
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-base border border-border-subtle rounded-[6px] text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent focus:shadow-accent-glow transition-all"
                />
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-base border border-border-subtle rounded-[6px] text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent focus:shadow-accent-glow transition-all pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-text-primary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end pt-1">
                <button type="button" className="text-[12px] text-accent hover:text-[#427AEE] transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="text-bearish text-xs py-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-accent hover:bg-[#427AEE] hover:scale-[1.01] hover:shadow-accent-glow disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none rounded-[6px] text-sm font-semibold text-white transition-all"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="my-6 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
            <span className="relative px-3 bg-surface text-xs text-text-disabled uppercase">or</span>
          </div>

          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setPassword('') }}
            className="w-full py-2.5 bg-transparent border border-border-subtle hover:border-border-active rounded-[6px] text-sm font-semibold text-text-primary transition-colors"
          >
            {isLogin ? 'Create Account' : 'Sign In to Existing Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
