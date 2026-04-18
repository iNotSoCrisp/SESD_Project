import React from 'react'

interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#0D0E11', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#EF5350', fontSize: 20, fontWeight: 700 }}>⚠ Runtime Error</div>
          <pre style={{ color: '#ccc', background: '#131722', padding: 24, borderRadius: 8, maxWidth: 700, overflow: 'auto', fontSize: 13 }}>
            {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
