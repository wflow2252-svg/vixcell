import { useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { automationAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface Step { tool: string; args: Record<string, any>; status: string; result?: any }

const TOOL_LABEL: Record<string, string> = {
  open_app: 'فتح برنامج', open_url: 'فتح موقع', open_folder: 'فتح فولدر',
  search_web: 'بحث', create_task: 'مهمة', create_project: 'مشروع',
  create_lead: 'عميل', analyze_screen: 'تحليل الشاشة',
}

const EXAMPLES = [
  'افتح كلود كود ودوّر على أحدث أخبار الذكاء الاصطناعي',
  'اعملي مشروع اسمه موقع مطعم وضيف مهمة جهّز التصميم',
  'افتح يوتيوب وحلل اللي على الشاشة',
]

export default function AutomationPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'
  const [goal, setGoal] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [message, setMessage] = useState('')

  const run = async () => {
    if (!goal.trim()) { toast.error(isAr ? 'اكتب الهدف' : 'Enter a goal'); return }
    setRunning(true); setSteps(null); setMessage('')
    try {
      const res = await automationAPI.run(goal.trim())
      setSteps(res.data.steps); setMessage(res.data.message)
      if (!res.data.steps.length) toast(isAr ? 'مفيش خطوات للهدف ده' : 'No steps for this goal')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل التنفيذ' : 'Failed'))
    } finally { setRunning(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="smart_toy" size={24} className="text-brand-400" />
          {isAr ? 'الأتمتة الذكية' : 'AI Automation'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? 'اكتب هدف بالكلام والوكيل يقسّمه خطوات وينفّذها بنفسه (يفتح برامج، يدوّر، يضيف عملاء/مهام/مشاريع، يحلل الشاشة)'
                : 'Describe a goal — the agent plans and executes it with the built-in tools'}
        </p>
      </div>

      <div className="glass-card p-5 space-y-3">
        <textarea className="input-field min-h-[90px]" dir="auto" value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder={isAr ? 'مثال: افتح كلود كود ودوّر على أسعار الاستضافة' : 'e.g. open Chrome and search for hosting prices'} />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setGoal(ex)}
                className="badge badge-blue text-[10px] hover:opacity-80">{ex}</button>
            ))}
          </div>
          <button onClick={run} disabled={running} className="btn-primary text-sm flex items-center gap-2">
            {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="play_arrow" size={18} />}
            {isAr ? 'نفّذ' : 'Run'}
          </button>
        </div>
      </div>

      {running && (
        <div className="glass-card p-5 text-sm text-slate-400 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
          {isAr ? 'الوكيل بيخطّط وينفّذ...' : 'Agent planning and executing...'}
        </div>
      )}

      {steps && (
        <div className="glass-card p-5">
          {message && <p className="text-sm text-slate-300 mb-3">{message}</p>}
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-700/40 border border-line">
                <div className="w-7 h-7 rounded-lg bg-surface-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white flex items-center gap-2">
                    {TOOL_LABEL[s.tool] || s.tool}
                    <span className="text-[11px] text-slate-400">{Object.values(s.args || {}).join(' · ')}</span>
                  </p>
                  {s.result && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {s.result.error ? `⚠ ${s.result.error}` : (s.result.text || s.result.opened || s.result.name || s.result.title || JSON.stringify(s.result))}
                    </p>
                  )}
                </div>
                <Icon name={s.status === 'done' ? 'check_circle' : 'error'} size={18}
                  className={s.status === 'done' ? 'text-emerald-400' : 'text-amber-400'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
