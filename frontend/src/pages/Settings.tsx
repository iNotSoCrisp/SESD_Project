import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { resetAccount } from '../api/accounts'
import { useNavigate } from 'react-router-dom'

type Section = 'trading' | 'api' | 'appearance' | 'profile' | 'about'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`toggle ${on ? 'toggle-on' : 'toggle-off'}`}
    />
  )
}

function SettingRow({ label, desc, control }: { label: string; desc?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1A1E2E', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: '#D1D4DC', fontWeight: 500, marginBottom: desc ? 3 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#787B86' }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: '#131722', border: '1px solid #2A2E39', borderRadius: 5, color: '#D1D4DC',
      fontSize: 12, padding: '5px 10px', outline: 'none', cursor: 'pointer',
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

const NavItem = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', width: '100%', padding: '8px 16px 8px 13px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 500, background: 'transparent',
    borderLeft: active ? '3px solid #2962FF' : '3px solid transparent',
    color: active ? '#fff' : '#787B86',
    backgroundColor: active ? '#1C2030' : 'transparent',
    transition: 'all 120ms',
  }}>
    {label}
  </button>
)

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('profile')

  const [resetConfirming, setResetConfirming] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // Trading prefs state
  const [orderType, setOrderType] = useState('Market')
  const [defaultQty, setDefaultQty] = useState('1')
  const [confirmTrade, setConfirmTrade] = useState(true)
  const [showEmotion, setShowEmotion] = useState(true)

  // API state
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_FINNHUB_KEY || '')
  const [refreshRate, setRefreshRate] = useState('30s')

  // Appearance state
  const [chartType, setChartType] = useState('Candlestick')
  const [chartPeriod, setChartPeriod] = useState('3M')

  const sections: { id: Section; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'trading', label: 'Trading Preferences' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'api', label: 'API & Data' },
    { id: 'about', label: 'About' },
  ]

  return (
    <Layout title="Settings">
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#0B0D13' }}>
        
        {/* Left nav */}
        <div style={{ width: 200, background: '#0D0E11', borderRight: '1px solid #1E2230', paddingTop: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#434651', padding: '0 16px 8px' }}>Settings</div>
          {sections.map(s => (
            <NavItem key={s.id} label={s.label} active={section === s.id} onClick={() => setSection(s.id)} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* TRADING */}
          {section === 'trading' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Trading Preferences</h2>
              <p style={{ fontSize: 12, color: '#787B86', marginBottom: 24 }}>Configure default order behavior and prompts.</p>
              <SettingRow label="Default Order Type" desc="Used when placing quick market orders"
                control={<Select options={['Market', 'Limit']} value={orderType} onChange={setOrderType} />} />
              <SettingRow label="Default Quantity" desc="Pre-fill quantity field with this value"
                control={<input type="number" value={defaultQty} onChange={e => setDefaultQty(e.target.value)} min="0.01" step="0.01" style={{ width: 70, background: '#131722', border: '1px solid #2A2E39', borderRadius: 5, color: '#D1D4DC', fontSize: 12, padding: '5px 8px', outline: 'none', textAlign: 'right' }} />} />
              <SettingRow label="Confirm Before Trade" desc="Show a confirmation dialog before executing"
                control={<Toggle on={confirmTrade} onToggle={() => setConfirmTrade(v => !v)} />} />
              <SettingRow label="Show Emotion Prompt" desc="Prompt to log your emotional state with each trade"
                control={<Toggle on={showEmotion} onToggle={() => setShowEmotion(v => !v)} />} />
            </div>
          )}

          {/* API */}
          {section === 'api' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>API & Data</h2>
              <p style={{ fontSize: 12, color: '#787B86', marginBottom: 24 }}>Configure market data sources and refresh rates.</p>
              <SettingRow label="Finnhub API Key" desc="Used for real-time stock and crypto quotes"
                control={
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                      style={{ width: 200, background: '#131722', border: '1px solid #2A2E39', borderRadius: 5, color: '#D1D4DC', fontSize: 12, padding: '5px 10px', outline: 'none', fontFamily: 'DM Mono, monospace' }} />
                    <button style={{ background: '#2962FF', border: 'none', borderRadius: 5, color: '#fff', fontSize: 12, fontWeight: 600, padding: '0 12px', cursor: 'pointer' }}>Save</button>
                  </div>
                } />
              <SettingRow label="Data Refresh Rate" desc="How often to poll for new quotes"
                control={<Select options={['15s', '30s', '60s']} value={refreshRate} onChange={setRefreshRate} />} />
              <SettingRow label="API Status"
                control={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: apiKey ? '#26A69A' : '#EF5350' }} />
                    <span style={{ fontSize: 12, color: apiKey ? '#26A69A' : '#EF5350' }}>{apiKey ? 'Connected' : 'Disconnected'}</span>
                  </div>
                } />
            </div>
          )}

          {/* APPEARANCE */}
          {section === 'appearance' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Appearance</h2>
              <p style={{ fontSize: 12, color: '#787B86', marginBottom: 24 }}>Customize chart and visual defaults.</p>
              <SettingRow label="Default Chart Type" desc="Chart style shown on stock detail pages"
                control={<Select options={['Candlestick', 'Area', 'Line']} value={chartType} onChange={setChartType} />} />
              <SettingRow label="Default Chart Period" desc="Timeframe shown when first opening a chart"
                control={<Select options={['1W', '1M', '3M', '6M', '1Y']} value={chartPeriod} onChange={setChartPeriod} />} />
            </div>
          )}

          {/* PROFILE */}
          {section === 'profile' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Profile</h2>
              <p style={{ fontSize: 12, color: '#787B86', marginBottom: 24 }}>Your account information.</p>
              <SettingRow label="Username" control={<span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#D1D4DC' }}>{user?.username || '—'}</span>} />
              <SettingRow label="Email" control={<span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#D1D4DC' }}>{user?.email || '—'}</span>} />
              <SettingRow label="Account Type" control={<span style={{ fontSize: 12, color: '#2962FF', background: 'rgba(41,98,255,0.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(41,98,255,0.3)' }}>Paper Trading</span>} />
              
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #1A1E2E' }}>
                <h3 style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 8 }}>Danger Zone</h3>
                {resetConfirming ? (
                  <div style={{ padding: 12, background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: 6 }}>
                    <p style={{ fontSize: 13, color: '#EF5350', marginBottom: 12, fontWeight: 500 }}>
                      This will clear all your holdings and trade history. Are you sure?
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button disabled={resetLoading} style={{ background: '#EF5350', border: 'none', borderRadius: 5, color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 16px', cursor: 'pointer' }}
                        onClick={async () => {
                          setResetLoading(true)
                          try {
                            await resetAccount()
                            alert('Account reset successfully')
                            navigate('/dashboard')
                          } catch (e) {
                            alert('Failed to reset account')
                          } finally {
                            setResetLoading(false)
                          }
                        }}>
                        {resetLoading ? 'Resetting...' : 'Reset Everything'}
                      </button>
                      <button disabled={resetLoading} style={{ background: 'transparent', border: '1px solid #2A2E39', borderRadius: 5, color: '#D1D4DC', fontSize: 12, fontWeight: 600, padding: '6px 16px', cursor: 'pointer' }} onClick={() => setResetConfirming(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <SettingRow label="Reset Paper Balance" desc="Sets your balance back to $100,000"
                    control={
                      <button style={{ background: 'transparent', border: '1px solid #EF5350', borderRadius: 5, color: '#EF5350', fontSize: 12, fontWeight: 600, padding: '5px 14px', cursor: 'pointer' }}
                        onClick={() => setResetConfirming(true)}>
                        Reset to $100,000
                      </button>
                    } />
                )}
              </div>
            </div>
          )}

          {/* ABOUT */}
          {section === 'about' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>About ShadowTrade</h2>
              <p style={{ fontSize: 12, color: '#787B86', marginBottom: 24 }}>Version information and credits.</p>
              <SettingRow label="Version" control={<span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#787B86' }}>1.0.0</span>} />
              <SettingRow label="Data Provider" control={<span style={{ fontSize: 12, color: '#787B86' }}>Finnhub.io</span>} />
              <SettingRow label="Charts" control={<span style={{ fontSize: 12, color: '#787B86' }}>TradingView Lightweight Charts</span>} />
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}
