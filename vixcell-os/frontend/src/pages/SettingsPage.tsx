import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore, useAppStore } from '@/store'
import { settingsAPI, voiceAPI, aiAPI } from '@/api/client'
import {
  Settings, HardDrive, Globe, Shield, Bell,
  Building2, Users, Key, Database, FolderOpen, Save,
  Cpu, Mic, Volume2, CheckCircle2, XCircle, ChevronDown, ExternalLink
} from 'lucide-react'

interface IntegrationItem {
  provider: string
  label: string
  icon: string
  help: string
  fields: { key: string; label: string; secret: boolean }[]
  enabled: boolean
  configured: boolean
  config: Record<string, any>
}

const tabs = [
  { id:'general',  label:'General',     icon:Settings },
  { id:'storage',  label:'Storage',     icon:HardDrive },
  { id:'security', label:'Security',    icon:Shield },
  { id:'integrations', label:'Integrations', icon:Globe },
  { id:'team',     label:'Team & RBAC', icon:Users },
  { id:'billing',  label:'Billing',     icon:Key },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const { language, setLanguage } = useAppStore()
  const { user } = useAuthStore()

  // ── Integrations (real, persisted) ──────────────────────────────────────────
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [intLoading, setIntLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [intForm, setIntForm] = useState<Record<string, string>>({})
  const [intSaving, setIntSaving] = useState(false)
  const [engines, setEngines] = useState<{ ollama?: any; voice?: any } | null>(null)

  useEffect(() => {
    if (activeTab !== 'integrations') return
    setIntLoading(true)
    settingsAPI.integrations()
      .then(res => setIntegrations(res.data.items))
      .catch(err => toast.error(err?.response?.data?.detail || 'Failed to load integrations'))
      .finally(() => setIntLoading(false))
    // Engine status is best-effort — each card just shows unavailable on failure
    voiceAPI.status()
      .then(res => setEngines(e => ({ ...e, voice: res.data })))
      .catch(() => setEngines(e => ({ ...e, voice: null })))
    aiAPI.status()
      .then(res => setEngines(e => ({ ...e, ollama: res.data })))
      .catch(() => setEngines(e => ({ ...e, ollama: null })))
  }, [activeTab])

  const openIntegration = (item: IntegrationItem) => {
    if (expanded === item.provider) { setExpanded(null); return }
    setExpanded(item.provider)
    const initial: Record<string, string> = {}
    item.fields.forEach(f => { initial[f.key] = item.config?.[f.key] || '' })
    setIntForm(initial)
  }

  const saveIntegration = async (item: IntegrationItem) => {
    setIntSaving(true)
    try {
      const res = await settingsAPI.updateIntegration(item.provider, { enabled: true, config: intForm })
      setIntegrations(list => list.map(x =>
        x.provider === item.provider
          ? { ...x, configured: res.data.configured, enabled: res.data.enabled, config: { ...intForm } }
          : x
      ))
      toast.success(res.data.configured
        ? (language === 'ar' ? `تم ربط ${item.label} بنجاح` : `${item.label} connected`)
        : (language === 'ar' ? 'تم الحفظ — في حقول ناقصة لسه' : 'Saved — some fields still missing'))
      if (res.data.configured) setExpanded(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setIntSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your Vixcell AI OS system</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`sidebar-item w-full text-left ${activeTab === id ? 'active' : ''}`}
            >
              <Icon size={16} className="flex-shrink-0" />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">General Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Business Name</label>
                  <input className="input-field" defaultValue={user?.full_name || 'My Company'} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Business Email</label>
                  <input className="input-field" type="email" defaultValue={user?.email || ''} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Language / اللغة</label>
                  <select className="input-field" value={language} onChange={e => setLanguage(e.target.value as 'ar'|'en')}>
                    <option value="ar">العربية (Arabic)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Timezone</label>
                  <select className="input-field">
                    <option>Africa/Cairo (UTC+2)</option>
                    <option>Asia/Dubai (UTC+4)</option>
                    <option>Europe/London (UTC+0)</option>
                    <option>America/New_York (UTC-5)</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary flex items-center gap-2 text-sm"><Save size={14}/>Save Changes</button>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Storage Configuration</h2>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                <HardDrive size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">AI models and data are stored on non-system drives</p>
                  <p className="text-xs text-slate-400 mt-1">This prevents filling up your C: drive. Recommended: D:\ or E:\</p>
                </div>
              </div>
              {[
                { label:'Storage Root',    path:'D:\\VixcellAI' },
                { label:'Models Path',     path:'D:\\VixcellAI\\models' },
                { label:'Database Path',   path:'D:\\VixcellAI\\database' },
                { label:'Uploads Path',    path:'D:\\VixcellAI\\uploads' },
                { label:'Backups Path',    path:'D:\\VixcellAI\\backups' },
                { label:'Logs Path',       path:'D:\\VixcellAI\\logs' },
              ].map(({ label, path }) => (
                <div key={label}>
                  <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                    <FolderOpen size={11}/>{label}
                  </label>
                  <div className="flex gap-2">
                    <input className="input-field flex-1 font-mono text-xs" defaultValue={path} />
                    <button className="btn-ghost text-xs px-3">Browse</button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button className="btn-primary text-sm flex items-center gap-2"><Save size={14}/>Save Paths</button>
                <button className="btn-ghost text-sm flex items-center gap-2"><Database size={14}/>Backup Now</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Security Settings</h2>
              {[
                { label:'Change Password', type:'password', placeholder:'New password' },
                { label:'Confirm New Password', type:'password', placeholder:'Confirm password' },
              ].map(({ label, type, placeholder }) => (
                <div key={label}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                  <input className="input-field" type={type} placeholder={placeholder} />
                </div>
              ))}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-700/50 border border-brand-500/10">
                <div>
                  <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-400 mt-0.5">Add extra security with TOTP authenticator</p>
                </div>
                <button className="btn-primary text-xs px-4">Enable 2FA</button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-700/50 border border-brand-500/10">
                <div>
                  <p className="text-sm font-medium text-white">Session Timeout</p>
                  <p className="text-xs text-slate-400 mt-0.5">Auto-logout after inactivity</p>
                </div>
                <select className="input-field w-36 text-xs">
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>8 hours</option>
                  <option>Never</option>
                </select>
              </div>
              <button className="btn-primary text-sm flex items-center gap-2"><Save size={14}/>Save Security Settings</button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-5">
              {/* Local engines — live status so users see what's actually running */}
              <div>
                <h2 className="text-base font-semibold text-white mb-1">System Engines / محركات النظام</h2>
                <p className="text-xs text-slate-400 mb-3">الحالة الفعلية للمحركات اللي شغالة على جهازك</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'AI Engine (Ollama)', Ico: Cpu,
                      ok: !!engines?.ollama?.running,
                      detail: engines?.ollama?.running ? `v${engines.ollama.version}` : 'مش شغال — شغّله من صفحة نماذج الذكاء',
                    },
                    {
                      label: 'Speech-to-Text (Whisper)', Ico: Mic,
                      ok: !!engines?.voice?.stt_available,
                      detail: engines?.voice?.stt_available ? `Model: ${engines.voice.model_size}` : 'pip install faster-whisper',
                    },
                    {
                      label: 'Voice (TTS)', Ico: Volume2,
                      ok: !!engines?.voice?.tts_available,
                      detail: engines?.voice?.tts_available ? (engines.voice.default_voice || 'Male Egyptian voice') : 'pip install edge-tts',
                    },
                  ].map(({ label, Ico, ok, detail }) => (
                    <div key={label} className={`p-3 rounded-xl border ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                      <div className="flex items-center gap-2">
                        <Ico size={15} className={ok ? 'text-emerald-400' : 'text-amber-400'} />
                        <p className="text-xs font-medium text-white flex-1">{label}</p>
                        {ok ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 font-mono truncate" title={detail}>{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* External accounts — real saved credentials */}
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connected Accounts / ربط الحسابات</h2>
                <p className="text-xs text-slate-400 mb-3">دوس «ربط» وحط بيانات الخدمة — بتتحفظ على جهازك بس</p>
                {intLoading ? (
                  <div className="flex items-center justify-center py-10 text-slate-500 text-sm gap-2">
                    <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrations.map(item => (
                      <div key={item.provider}
                        className={`rounded-xl border transition-colors ${
                          item.configured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-surface-500 bg-surface-700/30'
                        }`}>
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className={`text-xs ${item.configured ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {item.configured ? 'Connected / متربط' : 'Not Connected / مش متربط'}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => openIntegration(item)}
                            className={`${item.configured ? 'btn-ghost' : 'btn-primary'} text-xs flex items-center gap-1.5`}>
                            {item.configured ? 'Configure / تعديل' : 'Connect / ربط'}
                            <ChevronDown size={13} className={`transition-transform ${expanded === item.provider ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {expanded === item.provider && (
                          <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <ExternalLink size={11} />{item.help}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {item.fields.map(f => (
                                <div key={f.key} className={item.fields.length % 2 && f === item.fields[item.fields.length - 1] ? 'col-span-2' : ''}>
                                  <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                                  <input
                                    className="input-field font-mono text-xs"
                                    dir="ltr"
                                    type={f.secret ? 'password' : 'text'}
                                    value={intForm[f.key] || ''}
                                    onChange={e => setIntForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    placeholder={f.secret ? '••••••••' : f.label}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end">
                              <button onClick={() => saveIntegration(item)} disabled={intSaving}
                                className="btn-primary text-xs flex items-center gap-2">
                                {intSaving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                <Save size={12} />Save / حفظ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Team Members</h2>
                <button className="btn-primary text-xs px-4 flex items-center gap-1.5"><Users size={13}/>Invite Member</button>
              </div>
              <div className="space-y-3">
                {[
                  { name:'Ahmed Hassan',  email:'ahmed@company.com',  role:'admin',   status:'Active' },
                  { name:'Sara Mostafa',  email:'sara@company.com',   role:'manager', status:'Active' },
                  { name:'Omar Khaled',   email:'omar@company.com',   role:'agent',   status:'Active' },
                ].map(({ name, email, role, status }) => (
                  <div key={email} className="flex items-center justify-between p-4 rounded-xl bg-surface-700/50 border border-brand-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white">
                        {name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-slate-400">{email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-purple capitalize">{role}</span>
                      <span className="badge-green">{status}</span>
                      <button className="btn-ghost text-xs px-2">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Billing & License</h2>
              <div className="p-5 rounded-xl bg-brand-gradient flex items-center justify-between">
                <div>
                  <p className="text-xs text-brand-100 font-medium uppercase tracking-wide">Current Plan</p>
                  <p className="text-2xl font-black text-white mt-1">Professional</p>
                  <p className="text-sm text-brand-200 mt-1">Unlimited leads • 10 team members • All AI modules</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">$99</p>
                  <p className="text-sm text-brand-200">/month</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Next Billing Date',  value:'July 10, 2026' },
                  { label:'License Type',       value:'Desktop (1 device)' },
                  { label:'API Calls Used',     value:'84,200 / 500K' },
                  { label:'Storage Used',       value:'7.8 GB / 100 GB' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl bg-surface-700/50 border border-brand-500/10">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-white mt-1">{value}</p>
                  </div>
                ))}
              </div>
              <button className="btn-primary text-sm">Manage Subscription</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
