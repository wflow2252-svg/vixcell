import { useState } from 'react'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'

interface Props { onLogin: () => void }

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      onLogin()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed. Check credentials.')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-surface-900 overflow-hidden">
      <TitleBarMini />
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md px-6">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mb-4 shadow-glow">
              <Icon name="bolt" size={32} filled className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">Vixcell AI OS</h1>
            <p className="text-slate-400 mt-1 text-sm">AI-Powered Business Operating System</p>
          </div>

          {/* Form */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-white mb-6">Welcome back</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input-field pe-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <Icon name={showPwd ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            Vixcell AI OS v1.0 • Secure Desktop Application
          </p>
        </div>
      </div>
    </div>
  )
}

function TitleBarMini() {
  const eAPI = (window as any).electronAPI
  return (
    <div className="drag-region h-10 bg-surface-900 border-b border-line flex items-center justify-end px-4">
      <div className="no-drag flex items-center gap-1">
        {[
          { fn: () => eAPI?.minimize(), color: '#f59e0b', title: 'Minimize' },
          { fn: () => eAPI?.maximize(), color: '#10b981', title: 'Maximize' },
          { fn: () => eAPI?.close(),    color: '#ef4444', title: 'Close' },
        ].map(({ fn, color, title }) => (
          <button key={title} onClick={fn} title={title}
            className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  )
}
