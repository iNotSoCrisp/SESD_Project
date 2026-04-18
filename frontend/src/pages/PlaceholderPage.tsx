import Layout from '../components/Layout'
import { Activity, Briefcase, History, BrainCircuit, Settings } from 'lucide-react'

// Simple map to get right icon and heading
const METADATA: Record<string, any> = {
  '/portfolio': { title: 'Portfolio Management', icon: Briefcase, desc: 'View your macro allocations and active trades.' },
  '/history': { title: 'Trade History', icon: History, desc: 'Complete historical log of your paper executions.' },
  '/psychology': { title: 'Psychology Analytics', icon: BrainCircuit, desc: 'AI-driven insights correlating your emotions to P&L.' },
  '/settings': { title: 'Platform Settings', icon: Settings, desc: 'Manage your profile and broker integrations.' }
}

export default function PlaceholderPage({ path }: { path: string }) {
  const meta = METADATA[path] || { title: 'Under Construction', icon: Activity, desc: 'This page is being built.' }
  const Icon = meta.icon

  return (
    <Layout>
      <div className="flex-1 p-8 flex flex-col bg-base overflow-hidden">
        <div className="mb-8 border-b border-border-subtle pb-6 flex items-center gap-3">
           <Icon className="w-6 h-6 text-accent" />
           <div>
             <h1 className="text-xl font-bold text-white tracking-tight">{meta.title}</h1>
             <p className="text-sm text-text-secondary mt-1">{meta.desc}</p>
           </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center border border-dashed border-border-subtle rounded-lg bg-surface">
           <div className="text-center text-text-secondary flex flex-col items-center gap-3">
             <Icon className="w-10 h-10 opacity-20" />
             <p className="text-sm font-semibold tracking-[0.1em] uppercase">Module under construction</p>
           </div>
        </div>
      </div>
    </Layout>
  )
}
