import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { voiceAPI, dashboardAPI, leadsAPI, aiAPI, systemAPI, websiteAPI } from '@/api/client'
import { startMeeting } from '@/lib/meeting'

export type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking'

export const PAGE_NAMES_AR: Record<string, string> = {
  '/dashboard': 'لوحة التحكم', '/leads': 'العملاء المحتملين', '/crm': 'إدارة العلاقات',
  '/social': 'التواصل الاجتماعي', '/content': 'إنشاء المحتوى', '/analytics': 'التحليلات',
  '/knowledge': 'قاعدة المعرفة', '/flows': 'الأتمتة', '/ai-models': 'نماذج الذكاء',
  '/settings': 'الإعدادات', '/tasks': 'مهام الموقع',
}

// ── Text-to-speech ────────────────────────────────────────────────────────────
// Primary: server TTS (neural male Egyptian voice, disk-cached). Fallback:
// browser SpeechSynthesis preferring a male Arabic system voice.
let currentAudio: HTMLAudioElement | null = null

export function stopSpeaking() {
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

export async function speak(text: string, lang = 'ar-EG'): Promise<void> {
  if (!text) return
  const ok = await speakServer(text)
  if (!ok) await speakBrowser(text, lang)
}

interface Options {
  navigate: (path: string) => void
  isAr: boolean
}

// ── The shared assistant brain: record → transcribe → intent → act → speak ──
export function useVoiceAssistant({ navigate, isAr }: Options) {
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

  const execute = useCallback(async (intent: any, heardText: string) => {
    const { action, params } = intent

    if (action === 'stop') {
      stopSpeaking()
      setState('idle')
      return
    }

    if (action === 'help' || action === 'chat' || action === 'remember' || action === 'recall_memory') {
      await say(intent.speech || 'تحت أمرك — قولي تعمل إيه')
      return
    }

    if (action === 'navigate' && params?.path) {
      navigate(params.path)
      await say(intent.speech || `فتحتلك ${PAGE_NAMES_AR[params.path] || 'الصفحة'}`)
      return
    }

    if (action === 'open_app' && params?.target) {
      try {
        const res = await systemAPI.open('app', params.target)
        await say(res.data.kind === 'url' ? 'فتحتهولك في المتصفح' : `فتحتلك ${res.data.opened}`)
      } catch (err: any) {
        await say(err?.response?.data?.detail || `مش لاقي ${params.target} على الجهاز`)
      }
      return
    }

    if (action === 'system_info') {
      try {
        const res = await systemAPI.infoSpeak(params?.topic || 'overview')
        await say(res.data.text)
      } catch {
        await say('معرفتش أقرا حالة الجهاز دلوقتي')
      }
      return
    }

    if (action === 'search_web' && params?.query) {
      try {
        await systemAPI.open('search', params.query)
        await say(intent.speech || `فتحتلك البحث عن ${params.query}`)
      } catch {
        await say('معرفتش أفتح البحث')
      }
      return
    }

    if (action === 'open_meeting') {
      await startMeeting(isAr)
      await say(intent.speech || 'فتحتلك غرفة الميتنج كأدمن، واللينك متنسخ')
      return
    }

    if (action === 'read_tasks') {
      try {
        const res = await websiteAPI.tasks()
        const tasks: any[] = res.data.tasks || []
        const open = tasks.filter(t => t.status !== 'done')
        navigate('/tasks')
        if (!open.length) {
          await say('مفيش مهام مفتوحة على الموقع — كله خالص')
        } else {
          const top = open.slice(0, 3).map(t => t.title).join('، ')
          await say(`عندك ${open.length} مهمة مفتوحة على الموقع. أهمهم: ${top}`)
        }
      } catch (err: any) {
        await say(err?.response?.data?.detail || 'مش قادر أجيب المهام من الموقع — اتأكد من النت وربط الموقع')
      }
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
        } catch {
          await say('حصلت مشكلة في توليد المحتوى — جرب من صفحة المحتوى')
        }
      } else {
        navigate('/content')
        await say('فتحتلك صفحة المحتوى — اكتب الموضوع واضغط أنشئ')
      }
      return
    }

    await say(`سمعتك بتقول: ${heardText}. بس مفهمتش المطلوب — جرب تقول مثلًا: هاتلي عملاء مطاعم في القاهرة، أو افتحلي كلود كود، أو وريني التاسكات`)
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

  const clear = useCallback(() => { setTranscript(''); setReply('') }, [])

  return { state, transcript, reply, toggle, startRecording, stopRecording, clear }
}
