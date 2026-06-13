import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { websiteAPI, leadsAPI, whatsappAPI } from '@/api/client'
import { openWhatsApp } from '@/lib/whatsapp'
import { useAppStore } from '@/store'

interface SiteProject {
  id: string; title: string; client?: string; industry?: string; category?: string
  year?: string; description?: string; image?: string; url?: string; featured?: boolean
  tags?: string[]
}
interface Submission {
  id: string; reference?: string; type: string; name?: string; whatsapp?: string
  email?: string; brief?: string; message?: string; rating?: number; read?: boolean
  created_at?: string
}
interface Status {
  site_url?: string; supabase_url?: string; connected?: boolean
  projects?: number; leads?: number | null; needs_admin?: boolean; error?: string
}

const TYPE_META: Record<string, { ar: string; badge: string; icon: string }> = {
  project_intake: { ar: 'طلب مشروع', badge: 'badge-green', icon: 'rocket_launch' },
  contact:        { ar: 'تواصل',     badge: 'badge-blue',  icon: 'mail' },
  feedback:       { ar: 'رأي/تقييم', badge: 'badge-purple', icon: 'reviews' },
}

export default function WebsitePage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [status, setStatus] = useState<Status>({})
  const [projects, setProjects] = useState<SiteProject[]>([])
  const [leads, setLeads] = useState<Submission[]>([])
  const [needsAdmin, setNeedsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [st, pr, sb] = await Promise.allSettled([
        websiteAPI.status(),
        websiteAPI.siteProjects(),
        websiteAPI.submissions(),
      ])
      if (st.status === 'fulfilled') setStatus(st.value.data)
      if (pr.status === 'fulfilled') setProjects(pr.value.data.projects || [])
      if (sb.status === 'fulfilled') {
        setLeads(sb.value.data.items || [])
        setNeedsAdmin(!!sb.value.data.needs_admin)
      }
      if (st.status === 'rejected' && pr.status === 'rejected') {
        toast.error(isAr ? 'مش قادر أوصل للموقع' : 'Could not reach the website')
      }
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => { load() }, [load])

  const importProject = async (p: SiteProject) => {
    setImporting(p.id)
    try {
      await websiteAPI.importProject(p)
      toast.success(isAr ? `تم استيراد "${p.title}" كمشروع` : `Imported "${p.title}"`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل الاستيراد' : 'Import failed'))
    } finally { setImporting(null) }
  }

  const importLead = async (s: Submission) => {
    try {
      await leadsAPI.create({
        name: s.name || (isAr ? 'عميل من الموقع' : 'Website lead'),
        phone: s.whatsapp || undefined,
        email: s.email || undefined,
        source: 'vixcell.com',
        notes: s.brief || s.message || undefined,
        status: 'new',
      })
      toast.success(isAr ? 'تمت إضافته للعملاء المحتملين' : 'Added to leads')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل' : 'Failed'))
    }
  }

  const messageLead = async (s: Submission) => {
    if (!s.whatsapp) { toast.error(isAr ? 'مفيش رقم واتساب' : 'No WhatsApp number'); return }
    try {
      const greeting = isAr
        ? `أهلاً ${s.name || ''}، معاك Vixcell — شكراً لتواصلك من موقعنا 🙏`
        : `Hi ${s.name || ''}, this is Vixcell — thanks for reaching out via our website 🙏`
      const res = await whatsappAPI.send(s.whatsapp, greeting)
      openWhatsApp(res.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل فتح واتساب' : 'WhatsApp failed'))
    }
  }

  const connected = status.connected
  const openLeads = leads.filter(l => !l.read).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'الموقع' : 'Website'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr
              ? `البيانات الحقيقية من ${status.site_url || 'vixcell.com'} — مباشر`
              : `Live data from ${status.site_url || 'vixcell.com'}`}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <Icon name="refresh" size={18} />{isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Connection banner */}
      <div className={`glass-card p-4 flex items-center gap-4 border ${
        connected ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          connected ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          <Icon name={connected ? 'cloud_done' : 'cloud_off'} size={26}
            className={connected ? 'text-emerald-400' : 'text-amber-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {loading
              ? (isAr ? 'بتأكد من الاتصال…' : 'Checking connection…')
              : connected
                ? (isAr ? 'متصل بالموقع ✓' : 'Connected ✓')
                : (isAr ? 'مش متصل' : 'Not connected')}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {connected
              ? (isAr
                  ? `${status.projects ?? 0} مشروع في معرض الأعمال${status.leads != null ? ` • ${status.leads} عميل من الموقع` : ''}`
                  : `${status.projects ?? 0} portfolio projects${status.leads != null ? ` • ${status.leads} website leads` : ''}`)
              : (status.error || (isAr ? 'اتأكد من الإنترنت' : 'Check your internet'))}
          </p>
        </div>
        {connected && (
          <span className="badge badge-green text-[10px] flex items-center gap-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
          </span>
        )}
      </div>

      {/* Leads from the website */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Icon name="inbox" size={16} className="text-brand-400" />
            {isAr ? 'طلبات وعملاء من الموقع' : 'Leads from the website'}
            {openLeads > 0 && <span className="badge badge-green text-[10px]">{openLeads}</span>}
          </h3>
        </div>

        {needsAdmin ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 px-6 text-center">
            <Icon name="lock" size={26} className="text-amber-400" />
            <p className="text-slate-300 text-sm">
              {isAr ? 'طلبات العملاء محمية — محتاجة ربط حساب الأدمن' : 'Client leads are protected'}
            </p>
            <p className="text-slate-500 text-xs max-w-md">
              {isAr
                ? 'حط توكن الأدمن من Supabase في: الإعدادات ← Integrations ← Vixcell Website (admin_token) عشان تشوف طلبات العملاء اللي جاية من الموقع.'
                : 'Add a Supabase admin token in Settings → Integrations → Vixcell Website to read client leads.'}
            </p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Icon name="mark_email_read" size={26} className="text-emerald-400" />
            <p className="text-slate-400 text-sm">{isAr ? 'مفيش طلبات جديدة لسه' : 'No leads yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {leads.map(s => {
              const meta = TYPE_META[s.type] || TYPE_META.contact
              return (
                <div key={s.id} className="flex items-center gap-3 p-4 hover:bg-surface-700/30">
                  <div className="w-9 h-9 rounded-xl bg-surface-600 flex items-center justify-center flex-shrink-0">
                    <Icon name={meta.icon} size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{s.name || (isAr ? 'عميل' : 'Lead')}</p>
                      <span className={`${meta.badge} text-[9px]`}>{isAr ? meta.ar : s.type}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {s.brief || s.message || s.email || s.whatsapp || ''}
                    </p>
                  </div>
                  {s.whatsapp && (
                    <button onClick={() => messageLead(s)} title="WhatsApp"
                      className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 flex-shrink-0">
                      <Icon name="chat" size={18} />
                    </button>
                  )}
                  <button onClick={() => importLead(s)}
                    className="btn-ghost text-[11px] px-2.5 py-1.5 flex-shrink-0 flex items-center gap-1">
                    <Icon name="person_add" size={14} />{isAr ? 'أضف عميل' : 'Add lead'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Portfolio projects */}
      <div>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Icon name="web" size={16} className="text-brand-400" />
          {isAr ? 'معرض أعمال الموقع' : 'Website portfolio'}
          {projects.length > 0 && <span className="text-slate-500 text-xs">({projects.length})</span>}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
            {isAr ? 'بحمّل من الموقع…' : 'Loading…'}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-14 gap-2">
            <Icon name="image_not_supported" size={28} className="text-slate-500" />
            <p className="text-slate-400 text-sm">{isAr ? 'مفيش مشاريع على الموقع' : 'No portfolio projects'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p.id} className="glass-card overflow-hidden flex flex-col">
                {p.image && (
                  <div className="h-32 bg-surface-700 overflow-hidden">
                    <img src={p.image} alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    {p.featured && <Icon name="star" size={14} className="text-amber-400 flex-shrink-0" filled />}
                  </div>
                  {p.client && <p className="text-[11px] text-slate-400 mt-0.5">{p.client}</p>}
                  {p.description && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 flex-1">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.category && <span className="badge badge-blue text-[9px]">{p.category}</span>}
                    {p.year && <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-600 text-slate-400">{p.year}</span>}
                  </div>
                  <button onClick={() => importProject(p)} disabled={importing === p.id}
                    className="btn-ghost text-[11px] px-2.5 py-1.5 mt-3 flex items-center justify-center gap-1.5">
                    {importing === p.id
                      ? <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-brand-500 rounded-full animate-spin" />
                      : <Icon name="download" size={14} />}
                    {isAr ? 'استورد كمشروع' : 'Import as project'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
