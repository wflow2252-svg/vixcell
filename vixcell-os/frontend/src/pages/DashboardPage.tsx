import { useEffect, useState } from 'react'
import { useAuthStore, useAppStore, useAICoreStore } from '@/store'
import Icon from '@/components/Icon'
import AIOrb from '@/components/AIOrb'
import { dashboardAPI } from '@/api/client'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const PIPELINE_COLORS: Record<string, string> = {
  Discovery: '#6366f1',
  Proposal: '#8b5cf6',
  Negotiation: '#a855f7',
  Won: '#10b981',
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1c212c', border: '1px solid #232936', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
}

interface Stats {
  totals: {
    leads: number
    leads_this_month: number
    active_deals: number
    revenue_this_month: number
    pending_tasks: number
    conversion_rate: number
  }
  revenue_series: { month: string; revenue: number; leads: number }[]
  pipeline: { stage: string; value: number }[]
  activity: { icon: string; label: string; time: string | null }[]
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { language } = useAppStore()
  const isAr = language === 'ar'
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.stats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

  const fmtTime = (iso: string | null) => {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return isAr ? 'الآن' : 'now'
    if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`
    return isAr ? `منذ ${Math.floor(hours / 24)} يوم` : `${Math.floor(hours / 24)}d ago`
  }

  const t = stats?.totals
  const statCards = [
    {
      label: isAr ? 'إجمالي العملاء المحتملين' : 'Total Leads',
      value: t ? String(t.leads) : '—',
      sub: t ? (isAr ? `+${t.leads_this_month} هذا الشهر` : `+${t.leads_this_month} this month`) : '',
      icon: 'group', color: 'text-blue-400', bg: 'bg-blue-500/10',
    },
    {
      label: isAr ? 'إيرادات الشهر' : 'Revenue This Month',
      value: t ? fmtMoney(t.revenue_this_month) : '—',
      sub: t ? (isAr ? `تحويل ${t.conversion_rate}%` : `${t.conversion_rate}% conversion`) : '',
      icon: 'payments', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    },
    {
      label: isAr ? 'الصفقات النشطة' : 'Active Deals',
      value: t ? String(t.active_deals) : '—',
      sub: isAr ? 'في خط المبيعات' : 'in pipeline',
      icon: 'target', color: 'text-brand-400', bg: 'bg-brand-500/10',
    },
    {
      label: isAr ? 'مهام معلقة' : 'Pending Tasks',
      value: t ? String(t.pending_tasks) : '—',
      sub: isAr ? 'تحتاج متابعة' : 'need follow-up',
      icon: 'task_alt', color: 'text-amber-400', bg: 'bg-amber-500/10',
    },
  ]

  const pipelineData = (stats?.pipeline || [])
    .map(p => ({ ...p, color: PIPELINE_COLORS[p.stage] || '#64748b' }))
  const hasPipeline = pipelineData.some(p => p.value > 0)
  const revenueSeries = stats?.revenue_series || []
  const hasRevenue = revenueSeries.some(r => r.revenue > 0 || r.leads > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAr ? `مرحباً، ${user?.full_name}` : `Welcome back, ${user?.full_name}`}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? 'إليك نظرة عامة على أداء عملك اليوم' : "Here's your business performance overview for today"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-700 border border-line">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">AI OS Running</span>
        </div>
      </div>

      {/* AI Core — the heart: live transcription · Orb · responses */}
      <AICoreHero isAr={isAr} />

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon name={icon} size={20} className={color} />
              </div>
              {loading && <span className="w-3 h-3 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />}
            </div>
            <div>
              <p className="text-2xl font-bold text-white mt-2">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <div className="glass-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">{isAr ? 'الإيرادات والعملاء (٦ أشهر)' : 'Revenue & Leads (6 months)'}</h3>
            <span className="badge-green">Live</span>
          </div>
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f29" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text={isAr ? 'اكسب صفقات لترى الإيرادات هنا' : 'Win deals to see revenue here'} icon="monitoring" />
          )}
        </div>

        {/* Pipeline Pie */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">{isAr ? 'مراحل المبيعات' : 'Sales Pipeline'}</h3>
          {hasPipeline ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pipelineData.filter(p => p.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    paddingAngle={3} dataKey="value">
                    {pipelineData.filter(p => p.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pipelineData.map(({ stage, value, color }) => (
                  <div key={stage} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-slate-400">{stage}</span>
                    </div>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart text={isAr ? 'أضف صفقات من صفحة CRM' : 'Add deals from the CRM page'} icon="handshake" />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Leads trend */}
        <div className="glass-card p-5 col-span-2">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Icon name="person_search" size={16} className="text-brand-400" />
            {isAr ? 'عملاء محتملون جدد شهرياً' : 'New Leads per Month'}
          </h3>
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f29" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} fill="url(#leadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text={isAr ? 'أضف عملاء من صفحة العملاء المحتملين' : 'Add leads from the Leads page'} icon="group_add" />
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Icon name="bolt" size={16} className="text-brand-400" />
            {isAr ? 'النشاط الأخير' : 'Recent Activity'}
          </h3>
          {stats?.activity?.length ? (
            <div className="space-y-3">
              {stats.activity.map(({ icon, label, time }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-600 flex items-center justify-center flex-shrink-0">
                    <Icon name={icon} size={15} className="text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate leading-relaxed">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtTime(time)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart text={isAr ? 'لا نشاط بعد' : 'No activity yet'} icon="history" small />
          )}
        </div>
      </div>
    </div>
  )
}

function AICoreHero({ isAr }: { isAr: boolean }) {
  const { transcript, reply, orb } = useAICoreStore()
  return (
    <div className="glass-card p-5 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
      {/* Left: live transcription (what you said) */}
      <div className="order-2 lg:order-1 min-h-[120px]">
        <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Icon name="hearing" size={14} className="text-emerald-400" />
          {isAr ? 'بتقول' : 'You said'}
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed min-h-[60px] whitespace-pre-wrap">
          {transcript || <span className="text-slate-600">{isAr ? 'اضغط الكورة أو Ctrl+Space واتكلم...' : 'Click the orb or press Ctrl+Space and speak...'}</span>}
        </p>
      </div>

      {/* Center: the Orb */}
      <div className="order-1 lg:order-2 flex justify-center">
        <AIOrb size={190} isAr={isAr} />
      </div>

      {/* Right: AI response */}
      <div className="order-3 min-h-[120px]">
        <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Icon name="graphic_eq" size={14} className="text-brand-400" />
          {isAr ? 'رد المساعد' : 'Assistant'}
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed min-h-[60px] max-h-[140px] overflow-y-auto whitespace-pre-wrap">
          {reply || <span className="text-slate-600">{orb === 'idle' ? (isAr ? 'في انتظار أمرك' : 'Waiting for your command') : '…'}</span>}
        </p>
      </div>
    </div>
  )
}

function EmptyChart({ text, icon, small }: { text: string; icon: string; small?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${small ? 'py-8' : 'py-12'}`}>
      <div className="w-10 h-10 rounded-xl bg-surface-600 flex items-center justify-center">
        <Icon name={icon} size={20} className="text-slate-500" />
      </div>
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  )
}
