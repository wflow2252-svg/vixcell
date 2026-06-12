import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { websiteAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface WebTask {
  id: number | string
  title: string
  description?: string
  status: 'todo' | 'in progress' | 'review' | 'done' | string
  priority?: 'low' | 'medium' | 'high' | string
  dueDate?: string
  project?: { id: number; name?: string; title?: string }
}

const STATUS_META: Record<string, { ar: string; en: string; badge: string }> = {
  'todo':        { ar: 'جديدة',     en: 'To Do',       badge: 'badge-blue' },
  'in progress': { ar: 'شغالة',     en: 'In Progress', badge: 'badge-yellow' },
  'review':      { ar: 'مراجعة',    en: 'Review',      badge: 'badge-purple' },
  'done':        { ar: 'خلصت',      en: 'Done',        badge: 'badge-green' },
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue',
}

export default function TasksPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [tasks, setTasks] = useState<WebTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')
  const [siteInfo, setSiteInfo] = useState<{ site_url?: string; api_base?: string }>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await websiteAPI.tasks()
      setTasks(res.data.tasks || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || (isAr ? 'مش قادر أوصل للموقع' : 'Could not reach the website'))
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => {
    load()
    websiteAPI.status().then(res => setSiteInfo(res.data)).catch(() => {})
  }, [load])

  const setStatus = async (task: WebTask, status: string) => {
    try {
      await websiteAPI.updateTask(task.id, { status })
      setTasks(list => list.map(t => (t.id === task.id ? { ...t, status } : t)))
      toast.success(status === 'done'
        ? (isAr ? 'تمت المهمة ✅' : 'Task done ✅')
        : (isAr ? 'تم التحديث' : 'Updated'))
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Update failed')
    }
  }

  const visible = tasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.status === 'done' : t.status !== 'done')
  const openCount = tasks.filter(t => t.status !== 'done').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'مهام الموقع' : 'Website Tasks'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr
              ? `شغلك من ${siteInfo.site_url || 'vixcell.com'} — ${openCount} مهمة مفتوحة`
              : `Your work from ${siteInfo.site_url || 'vixcell.com'} — ${openCount} open`}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <Icon name="refresh" size={18} />{isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-1 p-4 border-b border-line">
          {([['open', isAr ? 'المفتوحة' : 'Open'], ['done', isAr ? 'الخالصة' : 'Done'], ['all', isAr ? 'الكل' : 'All']] as const).map(([k, label]) => (
            <button key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === k ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white hover:bg-surface-600'
              }`}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
            {isAr ? 'جارٍ التحميل من الموقع...' : 'Loading from website...'}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-600 flex items-center justify-center">
              <Icon name="cloud_off" size={28} className="text-amber-400" />
            </div>
            <p className="text-slate-300 text-sm">{error}</p>
            <p className="text-slate-500 text-xs max-w-md">
              {isAr
                ? 'اتأكد إن النت شغال، وإن عنوان API الموقع صح في الإعدادات ← Integrations ← Vixcell Website'
                : 'Check your internet and the website API base in Settings → Integrations → Vixcell Website'}
            </p>
            <button onClick={load} className="btn-primary text-xs">{isAr ? 'جرب تاني' : 'Retry'}</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-600 flex items-center justify-center">
              <Icon name="task_alt" size={28} className="text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm">
              {isAr ? 'مفيش مهام هنا — تمام كده 👌' : 'No tasks here — all clear 👌'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {visible.map(task => {
              const meta = STATUS_META[task.status] || STATUS_META['todo']
              return (
                <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-surface-700/30 transition-colors">
                  <button
                    onClick={() => setStatus(task, task.status === 'done' ? 'todo' : 'done')}
                    title={task.status === 'done' ? (isAr ? 'رجعها مفتوحة' : 'Reopen') : (isAr ? 'خلصت' : 'Mark done')}
                    className={`flex-shrink-0 transition-colors ${task.status === 'done' ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}>
                    <Icon name={task.status === 'done' ? 'check_circle' : 'radio_button_unchecked'} size={22} filled={task.status === 'done'} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {task.project?.name || task.project?.title || ''}
                      {task.dueDate ? ` • ${isAr ? 'الاستحقاق' : 'Due'}: ${task.dueDate}` : ''}
                    </p>
                  </div>
                  {task.priority && (
                    <span className={`${PRIORITY_BADGE[task.priority] || 'badge-blue'} text-[10px] capitalize flex-shrink-0`}>
                      {task.priority}
                    </span>
                  )}
                  <span className={`${meta.badge} text-[10px] flex-shrink-0`}>{isAr ? meta.ar : meta.en}</span>
                  {task.status !== 'done' && task.status !== 'in progress' && (
                    <button onClick={() => setStatus(task, 'in progress')}
                      className="btn-ghost text-[10px] px-2 py-1 flex-shrink-0">
                      {isAr ? 'ابدأ' : 'Start'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
