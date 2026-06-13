import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { trainingAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface Stats {
  interactions: number; successful: number; by_intent: Record<string, number>
  memories: number; leads: number; tasks: number; meetings: number
}
interface Interaction {
  id: string; channel: string; input?: string; intent?: string
  result?: string; success: boolean; created_at?: string
}

export default function TrainingPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [stats, setStats] = useState<Stats | null>(null)
  const [items, setItems] = useState<Interaction[]>([])
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, i] = await Promise.all([trainingAPI.stats(), trainingAPI.interactions(80)])
      setStats(s.data); setItems(i.data.items)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => { load() }, [load])

  const doExport = async () => {
    setExporting(true)
    try {
      const res = await trainingAPI.export()
      toast.success(isAr ? `اتصدّر ${res.data.rows} سطر للتدريب` : `Exported ${res.data.rows} rows`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل التصدير' : 'Export failed'))
    } finally { setExporting(false) }
  }

  const cards = stats ? [
    { label: isAr ? 'أوامر مسجّلة' : 'Interactions', value: stats.interactions, icon: 'forum', color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: isAr ? 'نجحت' : 'Successful', value: stats.successful, icon: 'check_circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: isAr ? 'معلومات محفوظة' : 'Memories', value: stats.memories, icon: 'psychology', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: isAr ? 'اجتماعات' : 'Meetings', value: stats.meetings, icon: 'record_voice_over', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ] : []

  const intents = stats ? Object.entries(stats.by_intent).sort((a, b) => b[1] - a[1]) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon name="neurology" size={24} className="text-brand-400" />
            {isAr ? 'مركز التدريب' : 'Training Center'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? 'كل أمر بتقوله بيتسجّل — هنا بتراجعه وتصدّره كبيانات لتدريب الذكاء مستقبلًا'
                  : 'Every command is logged — review it and export a fine-tuning dataset'}
          </p>
        </div>
        <button onClick={doExport} disabled={exporting} className="btn-primary text-sm flex items-center gap-2">
          {exporting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="download" size={16} />}
          {isAr ? 'صدّر بيانات التدريب' : 'Export dataset'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
              <Icon name={c.icon} size={20} className={c.color} />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{c.value}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intent breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">{isAr ? 'الأوامر الأكثر استخدامًا' : 'Top intents'}</h3>
          {intents.length === 0 ? (
            <p className="text-slate-500 text-xs py-6 text-center">{isAr ? 'لسه مفيش' : 'None yet'}</p>
          ) : (
            <div className="space-y-2">
              {intents.slice(0, 10).map(([intent, n]) => (
                <div key={intent} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">{intent}</span>
                  <span className="badge badge-blue">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interaction log */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-3">{isAr ? 'سجل الأوامر' : 'Interaction log'}</h3>
          {items.length === 0 ? (
            <p className="text-slate-500 text-xs py-6 text-center">{isAr ? 'اتكلم مع المساعد وهتلاقي الأوامر هنا' : 'Talk to the assistant and commands appear here'}</p>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {items.map(it => (
                <div key={it.id} className="p-2.5 rounded-lg bg-surface-700/40 border border-line">
                  <div className="flex items-center gap-2">
                    <Icon name={it.success ? 'check_circle' : 'error'} size={13}
                      className={it.success ? 'text-emerald-400' : 'text-amber-400'} />
                    <span className="text-xs text-white truncate flex-1">{it.input}</span>
                    {it.intent && <span className="badge badge-purple text-[9px]">{it.intent}</span>}
                  </div>
                  {it.result && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{it.result}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
