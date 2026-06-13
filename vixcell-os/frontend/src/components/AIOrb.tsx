import { useAICoreStore, type OrbState } from '@/store'

/**
 * The AI Core Orb — the spec's centerpiece. A layered, animated sphere that
 * reflects the live assistant state (idle/listening/thinking/executing/speaking/
 * error). Pure CSS/SVG (no WebGL) so it always renders reliably in Electron.
 * Click to talk (dispatches the same toggle the mic/Ctrl+Space use).
 */
const STATE_META: Record<OrbState, { c1: string; c2: string; label: string; labelAr: string; spin: boolean }> = {
  idle:      { c1: '#6366f1', c2: '#8b5cf6', label: 'Ready',     labelAr: 'جاهز',        spin: false },
  listening: { c1: '#10b981', c2: '#22d3ee', label: 'Listening', labelAr: 'بسمعك',       spin: false },
  thinking:  { c1: '#f59e0b', c2: '#f97316', label: 'Thinking',  labelAr: 'بفكر',        spin: true  },
  executing: { c1: '#3b82f6', c2: '#6366f1', label: 'Executing', labelAr: 'بنفّذ',       spin: true  },
  speaking:  { c1: '#8b5cf6', c2: '#ec4899', label: 'Speaking',  labelAr: 'برد عليك',    spin: false },
  error:     { c1: '#ef4444', c2: '#f97316', label: 'Error',     labelAr: 'في مشكلة',    spin: false },
}

export default function AIOrb({ size = 200, isAr = true }: { size?: number; isAr?: boolean }) {
  const orb = useAICoreStore(s => s.orb)
  const m = STATE_META[orb]
  const active = orb !== 'idle'

  const talk = () => window.dispatchEvent(new CustomEvent('vix-voice-toggle'))

  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ width: size, height: size + 30 }}>
      <button
        onClick={talk}
        title={isAr ? 'اضغط للتكلم' : 'Click to talk'}
        className="relative flex items-center justify-center cursor-pointer group"
        style={{ width: size, height: size }}
      >
        {/* Outer pulse rings */}
        {[0, 1, 2].map(i => (
          <span key={i} className="absolute rounded-full"
            style={{
              width: size, height: size,
              border: `2px solid ${m.c1}`,
              opacity: 0,
              animation: `orbPing ${active ? 1.6 : 3}s cubic-bezier(0,0,0.2,1) infinite`,
              animationDelay: `${i * (active ? 0.45 : 0.9)}s`,
            }} />
        ))}

        {/* Rotating gradient ring (thinking/executing) */}
        <div className="absolute rounded-full"
          style={{
            width: size * 0.86, height: size * 0.86,
            background: `conic-gradient(from 0deg, ${m.c1}, ${m.c2}, ${m.c1})`,
            opacity: m.spin ? 0.55 : 0.18,
            filter: 'blur(6px)',
            animation: m.spin ? 'orbSpin 2.4s linear infinite' : 'orbSpin 14s linear infinite',
          }} />

        {/* Core sphere */}
        <div className="absolute rounded-full"
          style={{
            width: size * 0.66, height: size * 0.66,
            background: `radial-gradient(circle at 35% 30%, ${m.c2}, ${m.c1} 70%, #0b0b14)`,
            boxShadow: `0 0 ${active ? 60 : 30}px ${m.c1}aa, inset 0 0 40px rgba(255,255,255,0.15)`,
            animation: `orbBreathe ${active ? 1.4 : 3.2}s ease-in-out infinite`,
          }} />

        {/* Glossy highlight */}
        <div className="absolute rounded-full pointer-events-none"
          style={{
            width: size * 0.24, height: size * 0.16,
            top: size * 0.2, left: size * 0.28,
            background: 'rgba(255,255,255,0.45)', filter: 'blur(8px)',
          }} />

        {/* Core glyph */}
        <span className="relative text-white font-black tracking-tight"
          style={{ fontSize: size * 0.18, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>V</span>
      </button>

      {/* State label */}
      <div className="mt-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: m.c1, boxShadow: `0 0 8px ${m.c1}` }} />
        <span className="text-sm font-semibold text-white">{isAr ? m.labelAr : m.label}</span>
      </div>

      <style>{`
        @keyframes orbPing { 0% { transform: scale(0.7); opacity: 0.5 } 80%,100% { transform: scale(1.25); opacity: 0 } }
        @keyframes orbSpin { to { transform: rotate(360deg) } }
        @keyframes orbBreathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
      `}</style>
    </div>
  )
}
