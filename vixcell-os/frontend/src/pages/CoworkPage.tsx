import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { automationAPI, voiceAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface Step { tool: string; args: Record<string, any>; status?: string; result?: any }

// Friendly label + icon per tool the agent can run.
const TOOL_META: Record<string, { label: string; icon: string }> = {
  open_app:        { label: 'فتح برنامج',     icon: 'open_in_new' },
  open_url:        { label: 'فتح موقع',        icon: 'language' },
  open_folder:     { label: 'فتح فولدر',       icon: 'folder' },
  search_web:      { label: 'بحث في جوجل',     icon: 'search' },
  create_task:     { label: 'إضافة مهمة',      icon: 'task_alt' },
  create_project:  { label: 'إنشاء مشروع',     icon: 'folder_special' },
  create_lead:     { label: 'إضافة عميل',      icon: 'person_add' },
  analyze_screen:  { label: 'تحليل الشاشة',    icon: 'screenshot_monitor' },
  scroll:          { label: 'تمرير الشاشة',    icon: 'swap_vert' },
  press_key:       { label: 'ضغط زرار',        icon: 'keyboard' },
  type_text:       { label: 'كتابة نص',        icon: 'edit' },
  send_whatsapp:   { label: 'إرسال واتساب',    icon: 'send' },
  generate_content:{ label: 'كتابة محتوى',     icon: 'auto_awesome' },
  wait:            { label: 'انتظار',          icon: 'schedule' },
}

const EXAMPLES = [
  'افتحلي واتساب وابعت لأحمد: تمام يا فندم، اتفقنا',
  'هاتلي عملاء مطاعم في القاهرة',
  'اكتبلي منشور فيسبوك عن عرض الشهر',
  'افتح يوتيوب ودوّر على أغنية',
]

function argText(s: Step): string {
  const a = s.args || {}
  return a.text || a.query || a.topic || a.target || a.name || a.title || a.to ||
    (a.keys ? `زر: ${a.keys}` : '') || (a.question || '') || ''
}

export default function CoworkPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [goal, setGoal] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [phase, setPhase] = useState<'idle' | 'planning' | 'review' | 'running' | 'done'>('idle')
  const [resultMsg, setResultMsg] = useState('')
  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [fileResult, setFileResult] = useState<{ name: string; analysis: string } | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ── Voice input: record → Whisper transcribe → fill the goal ──
  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recRef.current = rec
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size < 1000) return
        const t = toast.loading(isAr ? 'بسمعك...' : 'Transcribing...')
        try {
          const res = await voiceAPI.transcribe(blob)
          const txt = res.data.text
          if (txt) setGoal(g => (g ? g + ' ' : '') + txt)
          toast.dismiss(t)
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || (isAr ? 'مش قادر أسمع — جرّب تاني' : 'Transcribe failed'), { id: t })
        }
      }
      rec.start(); setRecording(true)
    } catch {
      toast.error(isAr ? 'مفيش صلاحية مايك' : 'Mic permission denied')
    }
  }
  const stopVoice = () => {
    if (recRef.current?.state === 'recording') recRef.current.stop()
    setRecording(false)
  }
  const toggleVoice = () => (recording ? stopVoice() : startVoice())

  // ── File analysis: upload → AI (vision for images, LLM for text) ──
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setAnalyzing(true); setFileResult(null)
    const t = toast.loading(isAr ? 'بحلّل الملف...' : 'Analyzing...')
    try {
      const res = await automationAPI.analyzeFile(f, goal.trim())
      setFileResult({ name: res.data.name || f.name, analysis: res.data.analysis || '' })
      toast.dismiss(t)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل تحليل الملف' : 'Analyze failed'), { id: t })
    } finally {
      setAnalyzing(false)
      if (e.target) e.target.value = ''
    }
  }

  const makePlan = async () => {
    if (!goal.trim()) { toast.error(isAr ? 'اكتب اللي عايزه' : 'Type a goal'); return }
    setPhase('planning'); setSteps([]); setResultMsg('')
    try {
      const res = await automationAPI.plan(goal.trim())
      const s: Step[] = res.data.steps || []
      setSteps(s)
      setPhase(s.length ? 'review' : 'idle')
      if (!s.length) toast(isAr ? 'مش لاقي خطوات للهدف ده — جرّب صيغة تانية' : 'No steps found')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل التخطيط' : 'Planning failed'))
      setPhase('idle')
    }
  }

  const execute = async () => {
    setPhase('running')
    try {
      const res = await automationAPI.runSteps(goal.trim(), steps)
      setSteps(res.data.steps || [])
      setResultMsg(res.data.message || '')
      setPhase('done')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل التنفيذ' : 'Execution failed'))
      setPhase('review')
    }
  }

  const reset = () => { setSteps([]); setPhase('idle'); setResultMsg(''); setGoal('') }

  const busy = phase === 'planning' || phase === 'running'

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="smart_toy" size={26} className="text-brand-400" />
          Cowork
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? 'قوله اللي عايزه بالعربي — يعملك خطة، توافق، وينفّذها بنفسه في البرنامج وعلى جهازك.'
                : 'Tell it your goal — it plans, you approve, it executes across the app & your computer.'}
        </p>
      </div>

      {/* Goal input */}
      <div className="glass-card p-4 space-y-3">
        <textarea
          className="input-field min-h-[90px]" dir="auto" value={goal}
          onChange={e => setGoal(e.target.value)}
          disabled={busy}
          placeholder={isAr ? 'مثال: افتحلي واتساب وابعت لأحمد إن الاجتماع اتأجل لبكرة' : 'e.g. Open WhatsApp and message Ahmed...'} />
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleVoice} title={isAr ? 'اتكلّم بدل ما تكتب' : 'Speak'}
            className={`btn-ghost text-sm flex items-center gap-2 ${recording ? 'border border-red-500/50 text-red-300' : ''}`}>
            <Icon name={recording ? 'stop_circle' : 'mic'} size={16} />
            {recording ? (isAr ? 'بسمعك… اقفل' : 'Listening… stop') : (isAr ? 'بالصوت' : 'Speak')}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={analyzing}
            title={isAr ? 'ارفع ملف/صورة والذكاء يحلّلها' : 'Analyze a file'}
            className="btn-ghost text-sm flex items-center gap-2">
            {analyzing ? <span className="w-4 h-4 border-2 border-slate-500 border-t-brand-500 rounded-full animate-spin" /> : <Icon name="attach_file" size={16} />}
            {isAr ? 'حلّل ملف' : 'Analyze file'}
          </button>
          <input ref={fileInputRef} type="file" onChange={onFile} className="hidden"
            accept="image/*,.txt,.md,.csv,.json,.log" />
          {(phase === 'idle' || phase === 'review' || phase === 'done') && (
            <button onClick={makePlan} disabled={busy} className="btn-primary text-sm flex items-center gap-2">
              <Icon name="auto_awesome" size={16} />{isAr ? 'اعمل خطة' : 'Plan'}
            </button>
          )}
          {phase === 'planning' && (
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
              {isAr ? 'بفكّر في الخطة...' : 'Planning...'}
            </span>
          )}
          {(steps.length > 0 || goal) && !busy && (
            <button onClick={reset} className="btn-ghost text-xs">{isAr ? 'مسح' : 'Clear'}</button>
          )}
        </div>

        {/* Examples */}
        {phase === 'idle' && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setGoal(ex)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-surface-700 text-slate-300 hover:bg-surface-600 border border-line">
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* File analysis result */}
      {fileResult && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Icon name="description" size={16} className="text-brand-400" />
            {isAr ? 'تحليل الملف' : 'File analysis'}:
            <span className="text-slate-400 font-normal truncate">{fileResult.name}</span>
          </h3>
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed" dir="auto">{fileResult.analysis}</p>
        </div>
      )}

      {/* Plan / execution */}
      {steps.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Icon name="checklist" size={16} className="text-brand-400" />
              {phase === 'review' ? (isAr ? 'الخطة — راجعها' : 'Plan — review')
                : phase === 'running' ? (isAr ? 'بينفّذ...' : 'Running...')
                : (isAr ? 'النتيجة' : 'Result')}
            </h3>
            <span className="text-xs text-slate-500">{steps.length} {isAr ? 'خطوة' : 'steps'}</span>
          </div>

          <div className="divide-y divide-line">
            {steps.map((s, i) => {
              const meta = TOOL_META[s.tool] || { label: s.tool, icon: 'bolt' }
              const at = argText(s)
              const err = s.status === 'error'
              const done = s.status === 'done'
              return (
                <div key={i} className="flex items-start gap-3 p-3.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    err ? 'bg-red-500/15' : done ? 'bg-emerald-500/15' : 'bg-surface-600'}`}>
                    <Icon name={err ? 'error' : done ? 'check' : meta.icon} size={16}
                      className={err ? 'text-red-400' : done ? 'text-emerald-400' : 'text-brand-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="text-slate-500 me-1">{i + 1}.</span>{meta.label}
                      {at && <span className="text-slate-400"> — {at}</span>}
                    </p>
                    {s.result && (s.result.content || s.result.text || s.result.error) && (
                      <p className={`text-[11px] mt-1 line-clamp-3 ${err ? 'text-red-400' : 'text-slate-400'}`} dir="auto">
                        {s.result.error || s.result.content || s.result.text}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-line flex items-center gap-2">
            {phase === 'review' && (
              <>
                <button onClick={execute} className="btn-primary text-sm flex items-center gap-2">
                  <Icon name="play_arrow" size={18} />{isAr ? 'نفّذ الخطة' : 'Run plan'}
                </button>
                <span className="text-[11px] text-slate-500">{isAr ? 'مش هينفّذ غير لما توافق' : 'Nothing runs until you approve'}</span>
              </>
            )}
            {phase === 'running' && (
              <span className="text-slate-400 text-sm flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
                {isAr ? 'بنفّذ الخطوات...' : 'Executing...'}
              </span>
            )}
            {phase === 'done' && (
              <>
                <span className="text-emerald-400 text-sm flex items-center gap-1.5">
                  <Icon name="check_circle" size={16} />{resultMsg}
                </span>
                <button onClick={reset} className="btn-ghost text-xs ms-auto">{isAr ? 'هدف جديد' : 'New goal'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
