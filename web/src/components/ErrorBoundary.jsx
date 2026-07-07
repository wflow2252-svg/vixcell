import React, { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // If used as a top-level app wrapper, show full-page fallback
      if (this.props.children?.type?.name === 'App' || this.props.fullPage) {
        return (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#07070a',
            color: '#e2e8f0',
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
            padding: '2rem',
            textAlign: 'center',
          }}>
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="app-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FAF6F0" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <path
                d="M32 24 L50 72 L68 24 H58 L50 51 L42 24 Z"
                fill="url(#app-logo-grad)"
              />
            </svg>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '1.5rem 0 0.5rem' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: 'rgba(250, 246, 240,0.5)', fontSize: '1rem', maxWidth: '400px', lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#fca5a5',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              <strong style={{ color: '#ef4444' }}>Error: </strong>
              {this.state.error?.message || String(this.state.error)}
              {this.state.error?.stack && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(250, 246, 240,0.5)' }}>Stack Trace</summary>
                  <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', lineHeight: '1.4', overflowX: 'auto' }}>
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('vix_view')
                window.location.reload()
              }}
              style={{
                marginTop: '2rem',
                padding: '0.8rem 2rem',
                borderRadius: '50px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                color: '#FAF6F0',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
              }}
            >
              Refresh Page
            </button>
          </div>
        )
      }
 
      // Component-level fallback (e.g., 3D logo)
      return (
        <div className="logo-fallback-container" style={{ flexDirection: 'column', gap: '1rem' }}>
          <div className="logo-fallback-glass">
            <svg className="logo-fallback-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FAF6F0" />
                  <stop offset="100%" stopColor="var(--primary, #0055FF)" />
                </linearGradient>
                <filter id="fallback-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Elegant Symmetrical Vixcell Logo V Shape */}
              <path
                d="M32 24 L50 72 L68 24 H58 L50 51 L42 24 Z"
                fill="url(#logo-glow-gradient)"
                filter="url(#fallback-glow)"
              />
            </svg>
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(250, 246, 240,0.4)',
            maxWidth: '300px',
            textAlign: 'center',
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(250, 246, 240,0.1)',
            pointerEvents: 'auto',
          }}>
            Error: {this.state.error?.message || String(this.state.error)}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
