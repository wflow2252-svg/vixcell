import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Icon from './Icon'
import { voiceAPI, dashboardAPI, leadsAPI, aiAPI } from '@/api/client'
import { useAppStore } from '@/store'

type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking'

const PAGE_NAMES_AR: Record<string, string> = {
  '/dashboard': 'لوحة التحكم', '/leads': 'العملاء المحتملين', '/crm': 'إدارة العلاقات',
  '/social': 'التواصل الاجتماعي', '/content': 'إنشاء المحتوى', '/analytics': 'التحليلات',
  '/knowledge': 'قاعدة المعرفة', '/flows': 'الأتمتة', '/ai-models': 'نماذج الذكاء', '/settings': 'الإعدادات',
}

// ── Text-to-speech ────────────────────────────────────────────────────────────
// Primary: server TTS (neural male Egyptian voice, disk-cached). Fallback:
// browser SpeechSynthesis preferring a male Arabic system voice.
let currentAudio: HTMLAudioElement | null = null

function stopSpeaking() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
  window.speechSynthesis?.cancel()
}

// Known male Arabic Windows/Chrome voices (Hoda/Salma are female)
const MALE_VOICE_HINTS = ['hamed', 'naayf', 'shakir', 'male']

function speakBrowser(text: string, lang = 'ar-EG'): Promise<void> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window) || !text) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const arVoices = voices.filter(v => v.lang.startsWith('ar'))
    const male = arVoices.find(v => MALE_VOICE_HINTS.some(h => v.name.toLowerCase().includes(h)))
    const arVoice = male || arVoices[0]
    if (lang.startsWith('ar') && arVoice) u.voice = arVoice
    u.lang = arVoice && lang.startsWith('ar') ? arVoice.lang : lang
    u.rate = 1.05
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

async function speakServer(text: string): Promise<boolean> {
  try {
    const res = await voiceAPI.speak(text)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'audio/mpeg' }))
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url)
      currentAudio = audio
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('audio playback failed')) }
      audio.play().catch(reject)
    })
    return true
  } catch {
    return false // offline / edge-tts missing → caller falls back to browser voice
  }
}

async function speak(text: string, lang = 'ar-EG'): Promise<void> {
  if (!text) return
  const ok = await speakServer(text)
  if (!ok) await speakBrowser(text, lang)
}

export default function VoiceAssistant() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stateRef = useRef<VoiceState>('idle')
  stateRef.current = state

  // Chrome loads voices async — warm the list so the first speak() finds Arabic
  useEffect(() => { window.speechSynthesis?.getVoices() }, [])

  const say = useCallback(async (text: string) => {
    if (!text) return
    setReply(text)
    setState('speaking')
    await speak(text)
    setState('idle')
  }, [])

  // ── Intent execution ────────────────────────────────────────────────────────
  const execute = useCallback(async (intent: any, heardText: string) => {
    const { action, params } = intent

    if (action === 'stop') {
      stopSpeaking()
      setState('idle')
      return
    }

    if (action === 'help' || action === 'chat') {
      await say(intent.speech || 'تحت أمرك — قولي تعمل إيه')
      return
    }

    if (action === 'navigate' && params?.path) {
      navigate(params.path)
      await say(intent.speech || `فتحتلك ${PAGE_NAMES_AR[params.path] || 'الصفحة'}`)
      return
    }

    if (action === 'find_leads') {
      const what = params?.what?.trim()
      const where = params?.where?.trim()
      if (what && where) {
        await say(intent.speech || `تمام، بدور لك على ${what} في ${where} — ثواني`)
        setState('processing')
        try {
          const res = await leadsAPI.discover({ what, where, limit: 30 })
          const fresh = res.data.items.filter((i: any) => !i.already_exists)
          if (!fresh.length) {
            await say(res.data.items.length
              ? `كل ${what} ${where} اللي لقيتهم موجودين عندك بالفعل`
              : `معلش، ملقتش ${what} في ${where} — جرب نشاط أو مكان تاني`)
            return
          }
          const imp = await leadsAPI.discoverImport(fresh)
          const withPhone = fresh.filter((i: any) => i.phone).length
          navigate('/leads')
          await say(
            `لقيتلك ${imp.data.imported} ${what} في ${where} وضفتهم في العملاء` +
            (withPhone ? `، منهم ${withPhone} برقم تليفون جاهز للاتصال` : '')
          )
        } catch (err: any) {
          await say(err?.response?.data?.detail || 'حصلت مشكلة في البحث — اتأكد إن النت شغال وجرب تاني')
        }
        return
      }
      // Missing what/where → open the Find Leads dialog prefilled
      navigate(`/leads?find=1${what ? `&what=${encodeURIComponent(what)}` : ''}`)
      await say('فتحتلك البحث عن عملاء — اكتب نوع النشاط والمكان، أو قولي مثلًا: هاتلي عملاء مطاعم في القاهرة')
      return
    }

    if (action === 'export_leads') {
      try {
        const res = await leadsAPI.exportCsv()
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
        const a = document.createElement('a')
        a.href = url
        a.download = 'vixcell_leads.csv'
        a.click()
        URL.revokeObjectURL(url)
        await say('تمام، نزلتلك ملف العملاء')
      } catch {
        await say('معلش، مقدرتش أصدّر الملف')
      }
      return
    }

    if (action === 'search_leads') {
      const q = params?.query?.trim()
      navigate(q ? `/leads?search=${encodeURIComponent(q)}` : '/leads')
      await say(q ? `بدور لك على ${q} في العملاء` : 'فتحتلك العملاء')
      return
    }

    if (action === 'read_stats') {
      const res = await dashboardAPI.stats()
      const t = res.data.totals
      navigate('/dashboard')
      await say(
        `عندك ${t.leads} عميل محتمل، منهم ${t.leads_this_month} الشهر ده. ` +
        `${t.active_deals} صفقة نشطة، وإيرادات الشهر ${Math.round(t.revenue_this_month)} دولار. ` +
        `${t.pending_tasks ? `وفيه ${t.pending_tasks} مهمة محتاجة متابعة.` : 'ومفيش مهام متأخرة.'}`
      )
      return
    }

    if (action === 'create_lead') {
      if (params?.name) {
        await leadsAPI.create({ name: params.name, phone: params.phone || null, source: 'Voice', status: 'new' })
        navigate('/leads')
        await say(intent.speech || `تمام، ضفت ${params.name} في العملاء`)
      } else {
        navigate('/leads')
        await say('فتحتلك صفحة العملاء — دوس إضافة عميل')
      }
      return
    }

    if (action === 'generate_content') {
      if (params?.topic) {
        await say(intent.speech || 'تمام، ببدأ أكتب — استنى ثواني')
        setState('processing')
        try {
          const models = await aiAPI.models()
          const names = models.data.models.map((m: any) => m.name)
          const model = names.find((n: string) => n.includes('instruct')) || names[0]
          if (!model) { await say('مفيش نموذج ذكاء مثبت — افتح صفحة النماذج ونزّل واحد'); return }
          const res = await aiAPI.content({
            model,
            content_type: params.content_type || 'facebook_post',
            topic: params.topic,
            language: 'ar-eg',
            tone: 'friendly',
          })
          setReply(res.data.text)
          await navigator.clipboard.writeText(res.data.text).catch(() => {})
          setState('idle')
          toast.success(isAr ? 'المحتوى جاهز ومنسوخ — الصقه في أي مكان' : 'Content ready & copied')
          speak('خلصت! المحتوى جاهز ومنسوخ')
        } catch (err: any) {
          await say('حصلت مشكلة في توليد المحتوى — جرب من صفحة المحتوى')
        }
      } else {
        navigate('/content')
        await say('فتحتلك صفحة المحتوى — اكتب الموضوع واضغط أنشئ')
      }
      return
    }

    await say(`سمعتك بتقول: ${heardText}. بس مفهمتش المطلوب — جرب تقول مثلًا: هاتلي عملاء مطاعم في القاهرة، أو افتح الإحصائيات، أو اكتب منشور عن العروض`)
  }, [navigate, say, isAr])

  // ── Recording flow ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
  }, [])

  const startRecording = useCallback(async () => {
    stopSpeaking() // user pressed mic — assistant yields immediately
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recorderRef.current = rec
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setState('processing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          if (blob.size < 1000) { setState('idle'); return }
          const tr = await voiceAPI.transcribe(blob)
          const text = tr.data.text
          setTranscript(text)
          if (!text) { await say('مسمعتش حاجة واضحة — جرب تاني'); return }
          const cmd = await voiceAPI.command(text)
          await execute(cmd.data, text)
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || 'Voice processing failed')
          setState('idle')
        }
      }
      rec.start()
      setTranscript('')
      setReply('')
      setState('recording')
    } catch {
      toast.error(isAr ? 'مفيش صلاحية مايك — اسمح بالميكروفون' : 'Microphone permission denied')
    }
  }, [execute, say, isAr])

  const toggle = useCallback(() => {
    if (stateRef.current === 'recording') stopRecording()
    else if (stateRef.current === 'idle') startRecording()
    else if (stateRef.current === 'speaking') {
      // interrupt the assistant and listen right away
      stopSpeaking()
      setState('idle')
      startRecording()
    }
  }, [startRecording, stopRecording])

  // Ctrl+Space push-to-talk toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const statusLabel = {
    idle: isAr ? 'اضغط وتكلم (Ctrl+Space)' : 'Tap & speak (Ctrl+Space)',
    recording: isAr ? 'بسمعك... اضغط تاني لما تخلص' : 'Listening... tap to finish',
    processing: isAr ? 'ثواني، بفهم اللي قلته...' : 'Processing...',
    speaking: isAr ? 'برد عليك...' : 'Speaking...',
  }[state]

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-2" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Transcript / reply bubble */}
      {(transcript || reply) && state !== 'recording' && (
        <div className="glass-card max-w-sm p-3 shadow-pop animate-fade-in">
          {transcript && (
            <p className="text-xs text-slate-400 flex items-start gap-1.5">
              <Icon name="hearing" size={14} className="mt-0.5 flex-shrink-0" />
              <span>{transcript}</span>
            </p>
          )}
          {reply && (
            <p className="text-xs text-slate-200 mt-1.5 whitespace-pre-wrap max-h-48 overflow-y-auto flex items-start gap-1.5">
              <Icon name="graphic_eq" size={14} className="mt-0.5 flex-shrink-0 text-brand-400" />
              <span>{reply}</span>
            </p>
          )}
          <button onClick={() => { setTranscript(''); setReply('') }}
            className="text-xs text-slate-500 hover:text-white mt-1.5">
            {isAr ? 'إخفاء' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Status pill */}
      <div className="px-3 py-1 rounded-full bg-surface-700 border border-line text-xs text-slate-400">
        {statusLabel}
      </div>

      {/* Mic button */}
      <button
        onClick={toggle}
        disabled={state === 'processing'}
        title={statusLabel}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-pop ${
          state === 'recording'
            ? 'bg-red-500 animate-pulse-glow scale-110'
            : state === 'processing'
            ? 'bg-surface-600 cursor-wait'
            : 'bg-brand-gradient hover:scale-105'
        }`}
      >
        {state === 'processing'
          ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Icon name={state === 'recording' ? 'stop' : 'mic'} size={26} filled className="text-white" />}
      </button>
    </div>
  )
}
