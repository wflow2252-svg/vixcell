import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useAppStore } from '@/store'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'

export default function VoiceAssistant() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const { state, transcript, reply, toggle, clear } = useVoiceAssistant({ navigate, isAr })

  // Ctrl+Space push-to-talk toggle (inside the app window)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // Dashboard Orb (and anything else) can ask to talk via this event
  useEffect(() => {
    const onToggle = () => toggle()
    window.addEventListener('vix-voice-toggle', onToggle)
    return () => window.removeEventListener('vix-voice-toggle', onToggle)
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
          <button onClick={clear}
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
