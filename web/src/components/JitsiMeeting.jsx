/* ═══════════════════════════════════════════════════
   Vixcell Meetings — powered by Jitsi (free, no key, no setup)

   The custom WebRTC room kept failing cross-network because a peer-to-peer
   call needs a working TURN relay, and the free one was unreliable. Jitsi
   runs its own media + relay servers for free, with no signup — so audio,
   video and screen-share "just work" for the admin and the client, even on
   mobile data / different networks.

   Same contract as before: /meeting?role=admin opens a host room and gives a
   client link /meeting?code=XXXX&role=client.
═══════════════════════════════════════════════════ */
import React, { useEffect, useRef, useState } from 'react'

// Open Jitsi instance that lets people join WITHOUT a login (meet.jit.si now
// forces a Google/email moderator login, which blocks our clients). Freifunk
// München runs a free public instance with no login wall.
const JITSI_DOMAIN = 'meet.ffmuc.net'
const ROOM_PREFIX = 'VixcellMeet'

const C = {
  bg: '#0f0f11', bg2: '#1a1a1e', border: 'rgba(255,255,255,0.08)',
  text: '#e8eaed', text2: '#9aa0a6', blue: '#1a73e8', green: '#34a853',
}
const FONT = "'Cairo','Outfit',sans-serif"

function genCode() {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 9; i++) s += a[Math.floor(Math.random() * a.length)]
  return s
}

function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve()
    const existing = document.getElementById('jitsi-external-api')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('load failed')))
      return
    }
    const s = document.createElement('script')
    s.id = 'jitsi-external-api'
    s.src = `https://${JITSI_DOMAIN}/external_api.js`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Jitsi script failed to load'))
    document.body.appendChild(s)
  })
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch {}
  try {
    const ta = document.createElement('textarea')
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.focus(); ta.select()
    const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok
  } catch { return false }
}

export default function JitsiMeeting({ isAdmin = false, onViewChange }) {
  const params = new URLSearchParams(window.location.search)
  const urlCode = (params.get('code') || params.get('id') || '').trim()

  const [code] = useState(() => urlCode || (isAdmin ? genCode() : ''))
  const [name, setName] = useState(isAdmin ? 'Vixcell' : '')
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const clientUrl = code ? `${window.location.origin}/meeting?code=${code}&role=client` : ''

  // Keep the URL in sync so the admin's address bar shows the code too
  useEffect(() => {
    if (code) {
      const u = new URL(window.location.href)
      if (u.searchParams.get('code') !== code) {
        u.searchParams.set('code', code)
        window.history.replaceState({}, '', u.toString())
      }
    }
  }, [code])

  if (!code) {
    return (
      <Shell onBack={() => onViewChange && onViewChange('landing')}>
        <Card>
          <h2 style={st.h2}>الرابط مش مكتمل</h2>
          <p style={{ color: C.text2 }}>افتح الميتنج من البرنامج كأدمن، أو استخدم رابط الدعوة اللي وصلك.</p>
        </Card>
      </Shell>
    )
  }

  if (joined) {
    return <JitsiStage code={code} displayName={name || (isAdmin ? 'Host' : 'Guest')}
      onLeave={() => onViewChange && onViewChange('landing')}
      onError={setError} error={error} />
  }

  // ── Pre-join screen ──
  return (
    <Shell onBack={() => onViewChange && onViewChange('landing')}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={st.logo}>V</div>
          <h2 style={st.h2}>{isAdmin ? 'غرفة الاجتماع' : 'انضمام للاجتماع'}</h2>
          <p style={{ color: C.text2, fontSize: 13 }}>
            صوت + فيديو + مشاركة شاشة — شغّال على سيرفرات مجانية، من غير أي إعداد.
          </p>
        </div>

        {isAdmin && (
          <div style={st.inviteCard}>
            <div style={{ color: C.blue, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>رابط الدعوة للعميل</div>
            <div style={st.inviteUrl}>{clientUrl}</div>
            <button style={{ ...st.copyBtn, color: copied ? C.green : C.blue, borderColor: copied ? 'rgba(52,168,83,0.3)' : 'rgba(26,115,232,0.25)' }}
              onClick={async () => { const ok = await copyText(clientUrl); setCopied(ok); if (ok) setTimeout(() => setCopied(false), 2500) }}>
              {copied ? 'تم النسخ ✓' : 'انسخ رابط العميل'}
            </button>
          </div>
        )}

        <label style={st.label}>اسمك في الاجتماع</label>
        <input style={st.input} value={name} onChange={e => setName(e.target.value)}
          placeholder={isAdmin ? 'مثال: محمد' : 'اكتب اسمك'} dir="auto" />

        <button style={st.joinBtn} onClick={() => setJoined(true)} disabled={!name.trim()}>
          دخول الاجتماع
        </button>
        <p style={{ color: C.text2, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
          أول مرة المتصفح هيطلب إذن المايك والكاميرا — اضغط «سماح».
        </p>
      </Card>
    </Shell>
  )
}

function JitsiStage({ code, displayName, onLeave, onError, error }) {
  const ref = useRef(null)
  const apiRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadJitsiScript()
      .then(() => {
        if (cancelled || !ref.current || !window.JitsiMeetExternalAPI) return
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: `${ROOM_PREFIX}_${code}`,
          parentNode: ref.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableClosePage: false,
            disableProfile: true,
            // help connectivity on strict networks
            p2p: { enabled: true },
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            DISABLE_DEEP_LINKING: true,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'chat', 'raisehand',
              'tileview', 'fullscreen', 'settings', 'hangup', 'whiteboard',
            ],
          },
        })
        apiRef.current = api
        api.addEventListener('readyToClose', () => { try { api.dispose() } catch {} ; onLeave && onLeave() })
        api.addEventListener('errorOccurred', (e) => {
          console.warn('[Jitsi] error', e)
        })
      })
      .catch(err => { if (!cancelled) onError && onError('مش قادر أحمّل خدمة الاجتماع — اتأكد من النت وجرّب تاني') })

    return () => {
      cancelled = true
      try { apiRef.current && apiRef.current.dispose() } catch {}
    }
  }, [code, displayName, onLeave, onError])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999 }}>
      {error && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, background: '#7f1d1d', color: '#fff', padding: 12, textAlign: 'center', fontFamily: FONT, fontSize: 14 }}>
          {error}
          <button onClick={onLeave} style={{ marginInlineStart: 12, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>خروج</button>
        </div>
      )}
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ── tiny UI primitives ──
function Shell({ children, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: 20 }}>
      <div style={{ position: 'absolute', top: 16, insetInlineStart: 16 }}>
        <button onClick={onBack} style={{ background: C.bg2, color: C.text2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: FONT }}>
          ← رجوع
        </button>
      </div>
      {children}
    </div>
  )
}
function Card({ children }) {
  return (
    <div style={{ width: '100%', maxWidth: 440, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
      {children}
    </div>
  )
}

const st = {
  h2: { color: C.text, fontFamily: FONT, fontSize: 22, fontWeight: 800, margin: '6px 0' },
  logo: { width: 56, height: 56, borderRadius: 14, margin: '0 auto 10px', background: 'linear-gradient(135deg,#1a73e8,#4a90e2)', color: '#fff', fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  inviteCard: { background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.18)', borderRadius: 12, padding: 14, marginBottom: 18 },
  inviteUrl: { color: C.text, fontSize: 12, wordBreak: 'break-all', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, marginBottom: 8, direction: 'ltr', textAlign: 'left' },
  copyBtn: { width: '100%', background: 'rgba(26,115,232,0.12)', border: '1px solid rgba(26,115,232,0.25)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 13 },
  label: { display: 'block', color: C.text2, fontSize: 12, fontFamily: FONT, marginBottom: 6 },
  input: { width: '100%', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 15, fontFamily: FONT, marginBottom: 16, boxSizing: 'border-box' },
  joinBtn: { width: '100%', background: 'linear-gradient(135deg,#1a73e8,#4a90e2)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' },
}
