import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Activity, 
  LayoutGrid, 
  TrendingUp, 
  Map, 
  Bitcoin, 
  BrainCircuit, 
  Briefcase, 
  History, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { TradingAccount } from '../types'

interface SidebarProps {
  accounts?: TradingAccount[]
  selectedAccountId?: string | null
}

export default function Sidebar({ accounts = [], selectedAccountId }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const activeAccount = accounts.find(a => a.id === selectedAccountId)

  return (
    <aside className="w-[220px] bg-base flex flex-col border-r border-border-subtle shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 gap-2 border-b border-border-subtle shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <Activity className="text-accent w-5 h-5 shrink-0" />
        <span className="font-mono font-bold text-[15px] tracking-tight text-white">ShadowTrade</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 mt-4 overflow-y-auto overflow-x-hidden">
        <NavItem to="/dashboard" icon={<LayoutGrid className="w-4 h-4" />} label="Market Overview" />
        <NavItem to="/movers" icon={<TrendingUp className="w-4 h-4" />} label="Gainers & Losers" />
        <NavItem to="/heatmap" icon={<Map className="w-4 h-4" />} label="Sector Heatmap" />
        <NavItem to="/crypto" icon={<Bitcoin className="w-4 h-4" />} label="Crypto" />
        <NavItem to="/psychology" icon={<BrainCircuit className="w-4 h-4" />} label="Psychology Log" />
        
        <div className="my-4 border-t border-border-subtle mx-[-12px]" />
        
        <NavItem to="/portfolio" icon={<Briefcase className="w-4 h-4" />} label="My Portfolio" />
        <NavItem to="/history" icon={<History className="w-4 h-4" />} label="Trade History" />
        <NavItem to="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
      </nav>

      {/* User Card */}
      {user ? (
          <div className="p-4 border-t border-border-subtle mt-auto shrink-0 bg-base">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-xs font-medium text-white uppercase select-none">
                  {user.email[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[13px] font-medium text-white truncate max-w-[100px]">{user.username || user.email.split('@')[0]}</p>
                </div>
              </div>
              <button onClick={logout} className="text-text-secondary hover:text-bearish transition-colors p-1" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            {/* Paper Balance Chip */}
            <div className="bg-surface rounded border border-border-subtle px-2.5 py-1.5 flex flex-col items-center">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-text-secondary mb-0.5">Paper Balance</span>
              <span className="text-[15px] font-mono font-medium text-bullish tracking-tight truncate">
                {activeAccount ? `$${activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
              </span>
            </div>
          </div>
      ) : (
        <div className="p-4 border-t border-border-subtle mt-auto flex flex-col gap-2 shrink-0 bg-base">
          <span className="text-xs text-text-secondary text-center mb-1">Guest Mode</span>
          <button onClick={() => navigate('/login')} className="w-full py-2 bg-accent hover:bg-[#427AEE] rounded text-[13px] font-semibold text-white transition-colors">
            Sign In
          </button>
        </div>
      )}
    </aside>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all ${
          isActive 
            ? 'bg-surface-elevated text-white text-accent border-l-[3px] border-accent border-l-accent'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border-l-[3px] border-transparent'
        }`.replace('border-l-accent', 'border-accent')
      }
      style={({ isActive }) => isActive ? { borderLeftColor: 'var(--color-accent)', backgroundColor: 'var(--color-surface-elevated)' } : {}}
    >
      <span className="text-inherit opacity-80">{icon}</span>
      {label}
    </NavLink>
  )
}
