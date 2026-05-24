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
                  <stop offset="0%" stopColor="#ffffff" />
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
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', maxWidth: '400px', lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
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
                color: '#fff',
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
        <div className="logo-fallback-container">
          <div className="logo-fallback-glass">
            <svg className="logo-fallback-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
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
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
