import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { meetingsAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface MeetingRow {
  id: string; title: string; summary?: string
  decisions?: string[]; action_items?: string[]; created_at?: string
}

export default function MeetingsPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [open, setOpen] = useState<MeetingRow | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const load = useCallback(async () => {
    try { setMeetings((await meetingsAPI.list()).data.items) } catch { /* ignore */ }
  }, [])
  useEffect(() => { load() }, [load])

  const fromNotes = async () => {
    if (!notes.trim()) { toast.error(isAr ? 'الصق نص الاجتماع' : 'Paste meeting notes'); return }
    setBusy(true)
    try {
      const res = await meetingsAPI.fromText(notes.trim(), title.trim())
      toast.success(isAr ? `جاهز — ${res.data.tasks_created} مهمة اتعملت` : `Done — ${res.data.tasks_created} tasks`)
      setNotes(''); setTitle(''); setOpen(res.data); load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل التلخيص' : 'Failed'))
    } finally { setBusy(false) }
  }

  const toggleRecord = async () => {
    if (recording) { recRef.current?.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recRef.current = rec
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size < 2000) { toast.error(isAr ? 'التسجيل قصير' : 'Recording too short'); return }
        setBusy(true)
        try {
          const res = await meetingsAPI.transcribe(blob, title.trim())
          toast.success(isAr ? `جاهز — ${res.data.tasks_created} مهمة` : `Done — ${res.data.tasks_created} tasks`)
          setTitle(''); setOpen(res.data); load()
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || (isAr ? 'فشل التفريغ' : 'Transcription failed'))
        } finally { setBusy(false) }
      }
      rec.start()
      setRecording(true)
    } catch {
      toast.error(isAr ? 'مفيش صلاحية مايك' : 'Mic permission denied')
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try {
      const res = await meetingsAPI.transcribe(file, title.trim() || file.name)
      toast.success(isAr ? `جاهز — ${res.data.tasks_created} مهمة` : `Done — ${res.data.tasks_created} tasks`)
      setOpen(res.data); load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل المعالجة' : 'Failed'))
    } finally { setBusy(false); e.target.value = '' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="record_voice_over" size={24} className="text-brand-400" />
          {isAr ? 'محاضر الاجتماعات الذكية' : 'Meeting Intelligence'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? 'سجّل أو ارفع صوت الاجتماع أو الصق ملاحظاته — يطلّع ملخص وقرارات ومهام تلقائيًا'
                : 'Record/upload meeting audio or paste notes — get a summary, decisions and tasks'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <input className="input-field" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={isAr ? 'عنوان الاجتماع (اختياري)' : 'Meeting title (optional)'} />

          <div className="flex gap-2 flex-wrap">
            <button onClick={toggleRecord} disabled={busy}
              className={`text-sm flex items-center gap-2 ${recording ? 'btn-primary bg-red-500' : 'btn-ghost'}`}>
              <Icon name={recording ? 'stop' : 'mic'} size={16} />
              {recording ? (isAr ? 'إيقاف وتفريغ' : 'Stop & process') : (isAr ? 'سجّل الاجتماع' : 'Record')}
            </button>
            <label className="btn-ghost text-sm flex items-center gap-2 cursor-pointer">
              <Icon name="upload_file" size={16} />{isAr ? 'ارفع ملف صوت' : 'Upload audio'}
              <input type="file" accept="audio/*,video/webm" className="hidden" onChange={onFile} disabled={busy} />
            </label>
          </div>

          <div className="border-t border-line pt-3">
            <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'أو الصق ملاحظات/نص الاجتماع' : 'Or paste notes'}</label>
            <textarea className="input-field min-h-[120px]" dir="auto" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isAr ? 'الصق المحادثة أو ملاحظات الاجتماع هنا...' : 'Paste the meeting transcript or notes...'} />
            <button onClick={fromNotes} disabled={busy} className="btn-primary text-sm mt-2 flex items-center gap-2">
              {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="auto_awesome" size={16} />}
              {isAr ? 'لخّص واستخرج المهام' : 'Summarize & extract tasks'}
            </button>
          </div>

          {busy && <p className="text-xs text-slate-500">{isAr ? 'بشتغل... التفريغ والتلخيص ممكن ياخدوا دقيقة' : 'Working... transcription + summary may take a minute'}</p>}

          {open && (
            <div className="border-t border-line pt-4 space-y-3 animate-fade-in">
              <h3 className="text-sm font-bold text-white">{open.title}</h3>
              {open.summary && <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{open.summary}</p>}
              {!!open.decisions?.length && (
                <div>
                  <p className="text-xs font-semibold text-brand-400 mb-1">{isAr ? 'القرارات' : 'Decisions'}</p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc ps-5">
                    {open.decisions.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
              {!!open.action_items?.length && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">{isAr ? 'المهام المستخرجة (اتحفظت)' : 'Action items (saved as tasks)'}</p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc ps-5">
                    {open.action_items.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Icon name="history" size={16} />{isAr ? 'الاجتماعات السابقة' : 'Past meetings'}
          </h3>
          {meetings.length === 0 ? (
            <p className="text-slate-500 text-xs py-6 text-center">{isAr ? 'لسه مفيش' : 'None yet'}</p>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {meetings.map(m => (
                <button key={m.id} onClick={() => setOpen(m)}
                  className="w-full text-start p-2.5 rounded-lg bg-surface-700/40 border border-line hover:border-brand-500/40">
                  <p className="text-xs text-white font-medium truncate">{m.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{m.summary || '—'}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{(m.action_items?.length || 0)} {isAr ? 'مهمة' : 'tasks'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
