import { SignIn } from '@clerk/clerk-react'
import { Activity } from 'lucide-react'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex w-full bg-base text-text-primary font-inter">
      {/* Left Panel (40%) - Visual Hero */}
      <div className="hidden lg:flex w-[40%] bg-base flex-col relative overflow-hidden border-r border-border-subtle p-12">
        <div className="absolute top-1/4 left-1/4 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 opacity-[0.03] bg-[conic-gradient(from_0deg,var(--color-accent),#AB47BC,var(--color-bullish),var(--color-accent))] blur-[100px] animate-spin" style={{ animationDuration: '20s' }}></div>
        
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 80 L 10 75 L 20 85 L 30 65 L 40 70 L 50 40 L 60 55 L 70 30 L 80 45 L 90 20 L 100 35 L 100 100 L 0 100 Z" fill="var(--color-accent)"/>
          <path d="M0 80 L 10 75 L 20 85 L 30 65 L 40 70 L 50 40 L 60 55 L 70 30 L 80 45 L 90 20 L 100 35" stroke="var(--color-accent)" strokeWidth="0.5" fill="none"/>
        </svg>

        <div className="flex items-center gap-2 mb-auto shrink-0 relative z-10">
          <Activity className="text-accent w-6 h-6" />
          <span className="font-mono font-bold text-xl tracking-tight text-white">ShadowTrade</span>
        </div>

        <div className="relative z-10 max-w-[320px] mb-24">
          <h1 className="text-[32px] font-semibold leading-tight text-white mb-4">
            <span className="block text-text-secondary">Trade without risk.</span>
            <span className="block">Understand your mind.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Paper trading with emotion tracking. Built for self-aware traders.
          </p>
        </div>

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
        <SignIn 
            appearance={{
              elements: {
                // Apply our dark mode styling to Clerk
                card: "bg-surface-elevated border border-border-subtle text-white rounded-lg",
                headerTitle: "text-white",
                headerSubtitle: "text-text-secondary",
                socialButtonsBlockButton: "border border-border-subtle text-white hover:bg-surface transition-colors",
                socialButtonsBlockButtonText: "font-semibold",
                dividerLine: "bg-border-subtle",
                dividerText: "text-text-disabled",
                formFieldLabel: "text-text-primary",
                formFieldInput: "bg-base border border-border-subtle text-white placeholder-text-disabled focus:ring-1 focus:ring-accent focus:border-accent",
                formButtonPrimary: "bg-accent hover:bg-[#427AEE] shadow-accent-glow text-white font-semibold transition-all",
                footerActionText: "text-text-secondary",
                footerActionLink: "text-accent hover:text-[#427AEE]"
              }
            }}
        />
      </div>
    </div>
  )
}
