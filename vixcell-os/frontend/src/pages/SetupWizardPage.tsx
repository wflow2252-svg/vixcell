import { useState } from 'react'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'
import { Building2, User, Mail, Lock, ChevronRight, Zap } from 'lucide-react'

interface Props { onComplete: () => void }

const steps = [
  { id: 1, title: 'Company Info',   titleAr: 'بيانات الشركة' },
  { id: 2, title: 'Admin Account',  titleAr: 'حساب المدير' },
  { id: 3, title: 'Ready!',         titleAr: 'جاهز!' },
]

export default function SetupWizardPage({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    company_name: '', admin_name: '', admin_email: '', admin_password: '', confirm_password: '',
  })
  const { setupWizard, isLoading } = useAuthStore()

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleNext = () => {
    if (step === 1 && !form.company_name.trim()) return toast.error('Company name is required')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (form.admin_password !== form.confirm_password)
      return toast.error('Passwords do not match')
    if (form.admin_password.length < 8)
      return toast.error('Password must be at least 8 characters')
    try {
      await setupWizard({
        company_name: form.company_name,
        admin_name: form.admin_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
      })
      setStep(3)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Setup failed')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-surface-900">
      <div className="drag-region h-10 bg-surface-900 border-b border-brand-500/10 flex items-center justify-end px-4">
        <div className="no-drag flex items-center gap-1">
          {[{ fn: () => (window as any).electronAPI?.minimize(), color: '#f59e0b' },
            { fn: () => (window as any).electronAPI?.maximize(), color: '#10b981' },
            { fn: () => (window as any).electronAPI?.close(), color: '#ef4444' }
          ].map(({ fn, color }, i) => (
            <button key={i} onClick={fn} className="w-3 h-3 rounded-full" style={{ background: color }} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="bg-orb w-[600px] h-[600px] bg-brand-600 top-[-200px] right-[-200px] absolute" />
        <div className="bg-orb w-80 h-80 bg-violet-600 bottom-[-80px] left-[-80px] absolute" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 w-full max-w-lg px-6">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-lg mb-4">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black gradient-text">Welcome to Vixcell AI OS</h1>
            <p className="text-slate-400 mt-1 text-sm">Let's set up your business operating system</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s.id ? 'bg-brand-gradient text-white shadow-glow' : 'bg-surface-600 text-slate-500'
                }`}>{s.id}</div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-0.5 transition-all ${step > s.id ? 'bg-brand-500' : 'bg-surface-600'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="glass-card p-8">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-brand-400" /> Company Information
                </h2>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Company / Business Name *</label>
                  <input className="input-field" placeholder="e.g. Acme Marketing LLC"
                    value={form.company_name} onChange={e => update('company_name', e.target.value)} autoFocus />
                </div>
                <button onClick={handleNext} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User size={20} className="text-brand-400" /> Admin Account
                </h2>
                {[
                  { label: 'Full Name', key: 'admin_name', icon: User, placeholder: 'John Doe', type: 'text' },
                  { label: 'Email Address', key: 'admin_email', icon: Mail, placeholder: 'admin@company.com', type: 'email' },
                  { label: 'Password', key: 'admin_password', icon: Lock, placeholder: '••••••••', type: 'password' },
                  { label: 'Confirm Password', key: 'confirm_password', icon: Lock, placeholder: '••••••••', type: 'password' },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
                    <input className="input-field" type={type} placeholder={placeholder}
                      value={(form as any)[key]} onChange={e => update(key, e.target.value)} />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-2.5">Back</button>
                  <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                    {isLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Account'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-4 animate-fade-in py-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-xl font-bold text-white">Setup Complete!</h2>
                <p className="text-slate-400 text-sm">Your Vixcell AI OS is ready. Welcome, {form.admin_name}!</p>
                <button onClick={onComplete} className="btn-primary px-8 py-2.5">
                  Enter Dashboard 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
