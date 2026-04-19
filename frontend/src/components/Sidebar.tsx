import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Activity, LayoutGrid, TrendingUp, Map, Bitcoin, BrainCircuit, Briefcase, History, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/accounts'
import type { TradingAccount } from '../types'

interface SidebarProps {
  accounts?: TradingAccount[]
  selectedAccountId?: string | null
}

export default function Sidebar({ accounts = [], selectedAccountId }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [localAccounts, setLocalAccounts] = useState<TradingAccount[]>([])

  useEffect(() => {
    // If parent doesn't provide accounts (e.g. on generic pages like Movers), fetch them here
    if (user && accounts.length === 0) {
      getAccounts().then(res => setLocalAccounts(res.data.data)).catch(console.warn)
    }
  }, [user, accounts.length])

  const displayAccounts = accounts.length > 0 ? accounts : localAccounts
  const displayAccountId = selectedAccountId || (displayAccounts.length > 0 ? displayAccounts[0].id : null)
  const activeAccount = displayAccounts.find(a => a.id === displayAccountId)

  return (
    <aside style={{ width: 220, background: 'linear-gradient(180deg, #0F1117 0%, #0D0E11 100%)', borderRight: '1px solid #1E2230', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Brand */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, borderBottom: '1px solid #1E2230', cursor: 'pointer', flexShrink: 0 }}
      >
        <Activity style={{ color: '#2962FF', width: 18, height: 18 }} />
        <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 0 20px rgba(41,98,255,0.4)' }}>ShadowTrade</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <NavItem to="/dashboard" icon={<LayoutGrid size={15} />} label="Market Overview" />
        <NavItem to="/movers" icon={<TrendingUp size={15} />} label="Gainers & Losers" />
        <NavItem to="/heatmap" icon={<Map size={15} />} label="Sector Heatmap" />
        <NavItem to="/crypto" icon={<Bitcoin size={15} />} label="Crypto" />
        <NavItem to="/psychology" icon={<BrainCircuit size={15} />} label="Psychology Log" />

        <div style={{ margin: '8px 0', borderTop: '1px solid #1E2230' }} />

        <NavItem to="/portfolio" icon={<Briefcase size={15} />} label="My Portfolio" />
        <NavItem to="/history" icon={<History size={15} />} label="Trade History" />
        <NavItem to="/settings" icon={<Settings size={15} />} label="Settings" />
      </nav>

      {/* User Card */}
      {user ? (
        <div style={{ padding: 12, borderTop: '1px solid #1E2230', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1C2030', border: '1px solid #2A2E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>
                {user.email[0]}
              </div>
              <span style={{ fontSize: 12, color: '#D1D4DC', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username || user.email.split('@')[0]}
              </span>
            </div>
            <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#787B86', padding: 4, display: 'flex' }}>
              <LogOut size={14} />
            </button>
          </div>
          <div style={{ background: '#131722', border: '1px solid #1E2230', borderRadius: 5, padding: '6px 10px', textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#434651', marginBottom: 2 }}>Paper Balance</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#26A69A', fontWeight: 600 }}>
              <span className="pulse-dot" />
              {activeAccount ? `$${activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$—'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, borderTop: '1px solid #1E2230', flexShrink: 0 }}>
          <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '8px 0', background: '#2962FF', border: 'none', borderRadius: 5, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
        </div>
      )}
    </aside>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 16px 7px 13px',
      borderLeft: isActive ? '3px solid #2962FF' : '3px solid transparent',
      background: isActive ? '#1C2030' : 'transparent',
      color: isActive ? '#FFFFFF' : '#787B86',
      fontSize: 13, fontWeight: 500, textDecoration: 'none',
      transition: 'all 120ms ease',
    })}
    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!e.currentTarget.style.borderLeftColor.includes('41, 98')) {
        e.currentTarget.style.background = '#161B27'
        e.currentTarget.style.color = '#D1D4DC'
      }
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!e.currentTarget.style.borderLeftColor.includes('41, 98')) {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = '#787B86'
      }
    }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      {label}
    </NavLink>
  )
}
