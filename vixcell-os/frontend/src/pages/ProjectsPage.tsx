import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { projectsAPI, coreTasksAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface ProjectRow {
  id: string; name: string; status: string; description?: string
  task_count: number; open_tasks: number; asset_count: number
}
interface TaskRow {
  id: string; title: string; status: string; priority: string; source: string
}
interface ProjectDetail {
  id: string; name: string; description?: string; status: string
  assets: { id: string; kind: string; title?: string; url?: string; body?: string }[]
  tasks: TaskRow[]
}

const PRIORITY_BADGE: Record<string, string> = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue' }

export default function ProjectsPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<ProjectDetail | null>(null)
  const [newName, setNewName] = useState('')
  const [genText, setGenText] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await projectsAPI.list()
      setProjects(res.data.items)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to load')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openProject = async (id: string) => {
    try { setOpen((await projectsAPI.get(id)).data) }
    catch { toast.error(isAr ? 'فشل فتح المشروع' : 'Failed to open') }
  }

  const create = async () => {
    if (!newName.trim()) return
    try {
      await projectsAPI.create({ name: newName.trim() })
      setNewName('')
      toast.success(isAr ? 'تم إنشاء المشروع' : 'Project created')
      load()
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Failed') }
  }

  const genTasks = async () => {
    if (!open || !genText.trim()) { toast.error(isAr ? 'الصق المحادثة أو الملاحظات' : 'Paste chat/notes'); return }
    setGenerating(true)
    try {
      const res = await projectsAPI.generateTasks(open.id, genText.trim())
      if (res.data.count === 0) {
        toast(isAr ? 'مفيش مهام واضحة — أو نزّل نموذج ذكاء' : 'No tasks found — or install an AI model')
      } else {
        toast.success(isAr ? `استخرجت ${res.data.count} مهمة` : `Extracted ${res.data.count} tasks`)
      }
      setGenText('')
      openProject(open.id)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل التوليد' : 'Generation failed'))
    } finally { setGenerating(false) }
  }

  const toggleTask = async (t: TaskRow) => {
    const next = t.status === 'done' ? 'todo' : 'done'
    try {
      await coreTasksAPI.update(t.id, { status: next })
      if (open) setOpen({ ...open, tasks: open.tasks.map(x => x.id === t.id ? { ...x, status: next } : x) })
    } catch { toast.error('Failed') }
  }

  // ── Detail view ──
  if (open) {
    const openCount = open.tasks.filter(t => t.status !== 'done').length
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => { setOpen(null); load() }} className="btn-ghost text-sm flex items-center gap-1.5">
          <Icon name="arrow_back" size={16} />{isAr ? 'كل المشاريع' : 'All projects'}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{open.name}</h1>
          {open.description && <p className="text-slate-400 text-sm mt-1">{open.description}</p>}
        </div>

        <div className="glass-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Icon name="auto_awesome" size={16} className="text-brand-400" />
            {isAr ? 'توليد مهام من محادثة أو ملاحظات' : 'Generate tasks from chat/notes'}
          </h3>
          <textarea className="input-field min-h-[90px]" dir="auto" value={genText}
            onChange={e => setGenText(e.target.value)}
            placeholder={isAr ? 'الصق محادثة العميل أو ملخص الاجتماع، والذكاء هيطلّع المهام...' : 'Paste a client chat or meeting notes...'} />
          <button onClick={genTasks} disabled={generating} className="btn-primary text-sm flex items-center gap-2">
            {generating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="auto_awesome" size={16} />}
            {isAr ? 'استخرج المهام' : 'Extract tasks'}
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-line text-sm text-slate-300">
            {isAr ? `${openCount} مهمة مفتوحة من ${open.tasks.length}` : `${openCount} open of ${open.tasks.length}`}
          </div>
          {open.tasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">{isAr ? 'مفيش مهام بعد' : 'No tasks yet'}</p>
          ) : (
            <div className="divide-y divide-line">
              {open.tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3.5 hover:bg-surface-700/30">
                  <button onClick={() => toggleTask(t)}
                    className={t.status === 'done' ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}>
                    <Icon name={t.status === 'done' ? 'check_circle' : 'radio_button_unchecked'} size={20} filled={t.status === 'done'} />
                  </button>
                  <span className={`flex-1 text-sm ${t.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>{t.title}</span>
                  {t.source !== 'manual' && <span className="badge badge-purple text-[9px]">AI</span>}
                  <span className={`${PRIORITY_BADGE[t.priority] || 'badge-blue'} text-[10px] capitalize`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── List view ──
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'المشاريع' : 'Projects'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? 'مساحات التسليم — بتتعمل تلقائيًا لما الصفقة تتكسب' : 'Delivery workspaces — auto-created when a deal is won'}
          </p>
        </div>
      </div>

      <div className="glass-card p-4 flex gap-2">
        <input className="input-field flex-1" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && create()}
          placeholder={isAr ? 'اسم مشروع جديد...' : 'New project name...'} />
        <button onClick={create} className="btn-primary text-sm flex items-center gap-2">
          <Icon name="add" size={16} />{isAr ? 'إنشاء' : 'Create'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
          <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
          {isAr ? 'جارٍ التحميل...' : 'Loading...'}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 gap-3">
          <Icon name="folder_open" size={32} className="text-slate-500" />
          <p className="text-slate-400 text-sm">{isAr ? 'لسه مفيش مشاريع' : 'No projects yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <button key={p.id} onClick={() => openProject(p.id)}
              className="glass-card p-4 text-start hover:border-brand-500/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon name="folder" size={20} className="text-brand-400" />
                <span className="badge badge-green text-[10px] capitalize">{p.status}</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{p.name}</p>
              {p.description && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Icon name="task_alt" size={13} />{p.open_tasks}/{p.task_count}</span>
                <span className="flex items-center gap-1"><Icon name="attach_file" size={13} />{p.asset_count}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
