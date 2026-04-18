import { NavLink, useNavigate } from 'react-router-dom'
import { Activity, Home, Briefcase, History, BrainCircuit, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { TradingAccount } from '../types'

interface LayoutProps {
  children: React.ReactNode
  accounts?: TradingAccount[]
  selectedAccountId?: string | null
}

export default function Layout({ children, accounts = [], selectedAccountId }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const activeAccount = accounts.find(a => a.id === selectedAccountId)

  return (
    <div className="min-h-screen bg-base text-text-primary font-inter flex flex-col md:flex-row overflow-hidden h-screen">
      
      {/* Left Sidebar (220px Fixed) */}
      <aside className="w-[220px] bg-base flex flex-col border-r border-border-subtle shrink-0">
        {/* Brand */}
        <div className="h-14 flex items-center px-4 gap-2 border-b border-border-subtle shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <Activity className="text-accent w-5 h-5 shrink-0" />
          <span className="font-mono font-bold text-[15px] tracking-tight text-white">ShadowTrade</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 mt-4">
          <NavItem to="/" icon={<Home className="w-4 h-4" />} label="Dashboard" />
          <NavItem to="/portfolio" icon={<Briefcase className="w-4 h-4" />} label="Portfolio" />
          <NavItem to="/history" icon={<History className="w-4 h-4" />} label="Trade History" />
          <NavItem to="/psychology" icon={<BrainCircuit className="w-4 h-4" />} label="Psychology Log" />
          <div className="my-4 border-t border-border-subtle mx-[-12px]" />
          <NavItem to="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </nav>

        {/* User Card */}
        {user ? (
           <div className="p-4 border-t border-border-subtle mt-auto">
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
          <div className="p-4 border-t border-border-subtle mt-auto flex flex-col gap-2">
            <span className="text-xs text-text-secondary text-center mb-1">Guest Mode</span>
            <button onClick={() => navigate('/login')} className="w-full py-2 bg-accent hover:bg-[#427AEE] rounded text-[13px] font-semibold text-white transition-colors">
              Sign In
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>

    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all ${
          isActive 
            ? 'bg-surface-elevated text-white text-accent border-l-2 border-accent border-l-accent' // Tailwind border-l won't apply properly via color, need specific class
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border-l-2 border-transparent'
        }`.replace('border-l-accent', 'border-accent') // Workaround for dynamic border color
      }
      style={({ isActive }) => isActive ? { borderLeftColor: 'var(--color-accent)', backgroundColor: 'var(--color-surface-elevated)' } : {}}
    >
      <span className="text-inherit opacity-80">{icon}</span>
      {label}
    </NavLink>
  )
}
