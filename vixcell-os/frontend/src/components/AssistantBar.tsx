import { useEffect, useState } from 'react'
import Icon from './Icon'
import { useAppStore } from '@/store'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'
import { useWakeListener } from '@/hooks/useWakeListener'

const eAPI = () => (window as any).electronAPI
const LISTEN_KEY = 'vix_always_listen'

/**
 * The system-wide voice "Dynamic Island" — a black pill pinned to the top
 * center of the screen, above every app (its own Electron window at #/bar).
 * Slim when idle, grows when listening/answering. Summoned by double-clap
 * (hands-free) or Ctrl+Shift+Space. Commands are forwarded to the main
 * window over IPC.
 */
export default function AssistantBar() {
  const { language } = useAppStore()
  const isAr = language === 'ar'
  // Always-listening on by default — the user just talks and it hears.
  const [listenOn, setListenOn] = useState(() => localStorage.getItem(LISTEN_KEY) !== '0')
  const [justWoke, setJustWoke] = useState(false)

  const { state, transcript, reply, level, toggle, startRecording, clear } = useVoiceAssistant({
    navigate: (path: string) => eAPI()?.barNavigate?.(path),
    isAr,
  })

  // Always-on hands-free: continuously listen; the moment you speak, record.
  // Only while idle, so it never hears the assistant's own reply.
  useWakeListener(listenOn && state === 'idle', () => {
    eAPI()?.barShow?.()
    setJustWoke(true)
    setTimeout(() => setJustWoke(false), 1000)
    startRecording()
  })

  const toggleListen = () => {
    setListenOn((v) => {
      const next = !v
      localStorage.setItem(LISTEN_KEY, next ? '1' : '0')
      return next
    })
  }

  // Global shortcut (Ctrl+Shift+Space anywhere in Windows) → toggle the mic
  useEffect(() => {
    const off = eAPI()?.onBarPushToTalk?.(() => toggle())
    return () => { off?.() }
  }, [toggle])

  // Grow the window when there's content / activity; shrink back when idle
  const expanded = state !== 'idle' || Boolean(transcript || reply)
  useEffect(() => { eAPI()?.barSetExpanded?.(expanded) }, [expanded])

  const active = state === 'recording'
  const speaking = state === 'speaking'
  const processing = state === 'processing'

  const hint = listenOn
    ? (isAr ? 'بسمعك — اتكلم على طول' : 'Listening — just speak')
    : (isAr ? 'اضغط الكورة وتكلم' : 'Click the orb to talk')

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}
      className="h-screen w-screen flex flex-col items-center justify-start select-none overflow-hidden">
      {/* The pill */}
      <div
        onClick={() => { if (state === 'idle' || state === 'speaking') toggle() }}
        className="flex items-center gap-2.5 px-3.5 transition-all duration-300 ease-out cursor-pointer"
        style={{
          width: expanded ? 'calc(100vw - 16px)' : 'auto',
          minWidth: 210,
          height: 46,
          marginTop: 2,
          borderRadius: 26,
          background: active
            ? 'linear-gradient(180deg, #2a0d12, #120406)'
            : 'rgba(8, 8, 12, 0.96)',
          border: active ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(120,120,140,0.18)',
          boxShadow: active
            ? `0 8px ${22 + level * 34}px rgba(239,68,68,${0.3 + level * 0.45})`
            : justWoke
            ? '0 8px 30px rgba(99,102,241,0.5)'
            : '0 6px 22px rgba(0,0,0,0.5)',
          WebkitAppRegion: 'drag',
        } as any}
      >
        {/* Left status orb */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {processing ? (
            <span className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
          ) : active ? (
            // Live waveform — bars react to the user's actual voice level
            <div className="flex items-center gap-[2px] h-6 w-7 justify-center">
              {[0.55, 0.85, 1, 0.7, 0.9].map((m, i) => (
                <span key={i} className="w-[3px] rounded-full bg-red-400"
                  style={{ height: `${Math.max(3, Math.min(22, level * 26 * m + (i % 2 ? 3 : 1)))}px`, transition: 'height 70ms linear' }} />
              ))}
            </div>
          ) : speaking ? (
            <div className="flex items-end gap-[2px] h-5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="w-[3px] rounded-full bg-brand-400"
                  style={{ animation: `bounce 0.7s infinite ${i * 0.1}s`, height: `${7 + (i % 3) * 5}px` }} />
              ))}
            </div>
          ) : (
            <span className={`relative flex h-3 w-3 ${justWoke ? '' : ''}`}>
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gradient" />
            </span>
          )}
        </div>

        {/* Center text */}
        <div className="flex-1 min-w-0 leading-tight" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <p className="text-[13px] font-semibold text-white truncate">
            {active && transcript ? transcript
              : active ? (isAr ? 'بسمعك...' : 'Listening...')
              : processing ? (isAr ? 'ثانية بفكر...' : 'Thinking...')
              : speaking ? 'Vixcell'
              : 'Vixcell'}
          </p>
          {!expanded && (
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <Icon name={listenOn ? 'hearing' : 'hearing_disabled'} size={10} className={listenOn ? 'text-emerald-400' : 'text-slate-600'} />
              {hint}
            </p>
          )}
        </div>

        {/* Right controls (idle only, to keep the notch clean) */}
        {state === 'idle' && (
          <div className="flex items-center gap-0.5 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button onClick={(e) => { e.stopPropagation(); toggleListen() }}
              title={listenOn ? (isAr ? 'إيقاف السماع المستمر' : 'Turn off always-listening') : (isAr ? 'تشغيل السماع المستمر' : 'Turn on always-listening')}
              className={`p-1 rounded-full transition-colors ${listenOn ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'}`}>
              <Icon name={listenOn ? 'hearing' : 'hearing_disabled'} size={15} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); eAPI()?.barNavigate?.('/dashboard') }}
              title={isAr ? 'افتح التطبيق' : 'Open app'}
              className="p-1 rounded-full text-slate-500 hover:text-white">
              <Icon name="open_in_new" size={15} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); eAPI()?.barHide?.() }}
              title={isAr ? 'إخفاء' : 'Hide'}
              className="p-1 rounded-full text-slate-500 hover:text-white">
              <Icon name="close" size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded transcript / reply panel */}
      {expanded && (transcript || reply) && (
        <div className="mt-1.5 rounded-2xl border border-line p-3 overflow-y-auto animate-fade-in"
          style={{ width: 'calc(100vw - 16px)', maxHeight: 140, background: 'rgba(8,8,12,0.96)', backdropFilter: 'blur(14px)' }}>
          {transcript && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <Icon name="hearing" size={13} className="mt-0.5 flex-shrink-0" />
              <span>{transcript}</span>
            </p>
          )}
          {reply && (
            <p className="text-[12px] text-slate-100 mt-1 whitespace-pre-wrap flex items-start gap-1.5">
              <Icon name="graphic_eq" size={13} className="mt-0.5 flex-shrink-0 text-brand-400" />
              <span>{reply}</span>
            </p>
          )}
          <button onClick={clear} className="text-[10px] text-slate-500 hover:text-white mt-1.5"
            style={{ WebkitAppRegion: 'no-drag' } as any}>
            {isAr ? 'تمام' : 'Dismiss'}
          </button>
        </div>
      )}
    </div>
  )
}
