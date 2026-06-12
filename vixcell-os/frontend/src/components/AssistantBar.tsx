import { useEffect } from 'react'
import Icon from './Icon'
import { useAppStore } from '@/store'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'

const eAPI = () => (window as any).electronAPI

/**
 * The system-wide floating voice bar — a slim always-on-top window pinned
 * to the top of the screen (its own Electron window at #/bar).
 * Navigation commands are forwarded to the main app window over IPC.
 */
export default function AssistantBar() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const { state, transcript, reply, toggle, clear } = useVoiceAssistant({
    // bar window doesn't navigate itself — it drives the main window
    navigate: (path: string) => eAPI()?.barNavigate?.(path),
    isAr,
  })

  // Global shortcut (Ctrl+Shift+Space anywhere in Windows) → toggle the mic
  useEffect(() => {
    const off = eAPI()?.onBarPushToTalk?.(() => toggle())
    return () => { off?.() }
  }, [toggle])

  // Expand the window when there's content to show, shrink back when cleared
  const expanded = Boolean((transcript || reply) && state !== 'recording')
  useEffect(() => { eAPI()?.barSetExpanded?.(expanded) }, [expanded])

  const statusLabel = {
    idle: isAr ? 'Vixcell — اتكلم (Ctrl+Shift+Space)' : 'Vixcell — speak (Ctrl+Shift+Space)',
    recording: isAr ? 'بسمعك...' : 'Listening...',
    processing: isAr ? 'ثواني...' : 'Processing...',
    speaking: isAr ? 'برد عليك...' : 'Speaking...',
  }[state]

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="h-screen w-screen flex flex-col items-stretch p-1.5 select-none">
      {/* Pill bar */}
      <div
        className="flex items-center gap-3 px-3 h-[58px] rounded-2xl border border-brand-500/30 shadow-pop"
        style={{
          background: 'rgba(15, 15, 26, 0.92)',
          backdropFilter: 'blur(14px)',
          WebkitAppRegion: 'drag',
        } as any}
      >
        {/* Mic */}
        <button
          onClick={toggle}
          disabled={state === 'processing'}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            state === 'recording'
              ? 'bg-red-500 animate-pulse-glow scale-110'
              : state === 'processing'
              ? 'bg-surface-600 cursor-wait'
              : 'bg-brand-gradient hover:scale-105'
          }`}
        >
          {state === 'processing'
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Icon name={state === 'recording' ? 'stop' : 'mic'} size={20} filled className="text-white" />}
        </button>

        {/* Status / live transcript */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-white truncate">
            {state === 'recording' && transcript ? transcript : statusLabel}
          </p>
          <p className="text-[10px] text-slate-500 truncate">
            {isAr ? 'مساعد فيكسيل — شغال على كل الجهاز' : 'Vixcell assistant — system-wide'}
          </p>
        </div>

        {/* Equalizer while speaking */}
        {state === 'speaking' && (
          <div className="flex items-end gap-0.5 h-5 flex-shrink-0">
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="w-1 bg-brand-400 rounded-full"
                style={{ animation: `bounce 0.8s infinite ${i * 0.12}s`, height: `${8 + (i % 3) * 5}px` }} />
            ))}
          </div>
        )}

        {/* Open main app */}
        <button
          onClick={() => eAPI()?.barNavigate?.('/dashboard')}
          title={isAr ? 'افتح التطبيق' : 'Open app'}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 flex-shrink-0"
        >
          <Icon name="open_in_new" size={16} />
        </button>

        {/* Hide bar */}
        <button
          onClick={() => eAPI()?.barHide?.()}
          title={isAr ? 'إخفاء (Ctrl+Shift+Space للرجوع)' : 'Hide (Ctrl+Shift+Space to return)'}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 flex-shrink-0"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Expanded transcript / reply panel */}
      {expanded && (
        <div className="mt-1.5 rounded-2xl border border-line p-3 overflow-y-auto animate-fade-in"
          style={{ background: 'rgba(15, 15, 26, 0.94)', backdropFilter: 'blur(14px)', maxHeight: 130 }}>
          {transcript && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <Icon name="hearing" size={13} className="mt-0.5 flex-shrink-0" />
              <span>{transcript}</span>
            </p>
          )}
          {reply && (
            <p className="text-[11px] text-slate-200 mt-1 whitespace-pre-wrap flex items-start gap-1.5">
              <Icon name="graphic_eq" size={13} className="mt-0.5 flex-shrink-0 text-brand-400" />
              <span>{reply}</span>
            </p>
          )}
          <button onClick={clear} className="text-[10px] text-slate-500 hover:text-white mt-1">
            {isAr ? 'إخفاء' : 'Dismiss'}
          </button>
        </div>
      )}
    </div>
  )
}
