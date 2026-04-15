import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register, login } from '../api/auth'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4">
      <div className="w-full max-w-md bg-[#111827] border border-[#1f2937] rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">ShadowTrade</h1>
          <p className="text-[#9ca3af] mt-1">Paper trading. Real psychology.</p>
        </div>

        <div className="flex bg-[#1f2937] rounded-lg p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-[#111827] text-white' : 'text-[#9ca3af] hover:text-gray-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-[#111827] text-white' : 'text-[#9ca3af] hover:text-gray-200'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#34d399] transition-colors"
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
                className="w-full px-4 py-2.5 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#34d399] transition-colors"
              />
            </div>
          )}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#34d399] transition-colors"
            />
          </div>

          {error && <p className="text-[#f87171] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#10b981] hover:bg-[#34d399] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-black transition-colors"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#1f2937] text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[#6b7280] hover:text-[#9ca3af] text-sm transition-colors"
          >
            Explore without an account →
          </button>
        </div>
      </div>
    </div>
  )
}
