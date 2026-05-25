import React, { useEffect, useRef, useState } from 'react'
import DotPixelIcon from './DotPixelIcon'

const T = {
  bg: '#0c0c0e', bg2: '#131316', bg3: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)', borderH: 'rgba(255,255,255,0.16)',
  text: '#e8e8ed', text2: '#a8a8b3', text3: '#6b6b75',
  gold: '#c8a35c', goldH: '#d4b06a', goldDim: 'rgba(200,163,92,0.12)',
  error: '#ef4444', success: '#22c55e',
}

const AGENT_URL = import.meta.env.VITE_SOCIAL_AGENT_URL || 'http://localhost:3001'
const AGENT_TOKEN = import.meta.env.VITE_SOCIAL_AGENT_TOKEN || ''

const RECIPES = [
  { id: 'daily-post-ar', label: 'بوست عربي', emoji: '🇸🇦', desc: 'بوست عربي + صورة على فيسبوك' },
  { id: 'daily-post-en', label: 'English post', emoji: '🌍', desc: 'English post + image on Facebook' },
  { id: 'market-analysis', label: 'تحليل سوق', emoji: '📊', desc: 'تقرير سوق أسبوعي' },
]

export default function SocialAgent() {
  const [connected, setConnected] = useState(false)
  const [job, setJob] = useState(null)
  const [logs, setLogs] = useState([])
  const [screenshot, setScreenshot] = useState(null)
  const [error, setError] = useState('')
  const wsRef = useRef(null)
  const logRef = useRef(null)

  // ─── WebSocket connection ────────────────────────────────────
  useEffect(() => {
    if (!AGENT_TOKEN) {
      setError('VITE_SOCIAL_AGENT_TOKEN غير معرّف في .env')
      return
    }

    let cancelled = false
    let reconnectTimer = null

    function connect() {
      const wsUrl = AGENT_URL.replace(/^http/, 'ws') + `/ws?token=${encodeURIComponent(AGENT_TOKEN)}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled) { ws.close(); return }
        setConnected(true)
        setError('')
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'connected') {
            setJob(msg.job || null)
          } else if (msg.type === 'log') {
            setLogs(prev => [...prev.slice(-199), { text: msg.text, ts: msg.ts }])
          } else if (msg.type === 'screenshot') {
            setScreenshot(`data:image/jpeg;base64,${msg.data}`)
          } else if (msg.type === 'done') {
            setJob(null)
            setLogs(prev => [...prev, { text: `✅ ${msg.recipe} completed`, ts: Date.now(), kind: 'success' }])
          } else if (msg.type === 'error') {
            setJob(null)
            setLogs(prev => [...prev, { text: `❌ ${msg.recipe}: ${msg.error}`, ts: Date.now(), kind: 'error' }])
          }
        } catch (_) {}
      }

      ws.onerror = () => { /* handled by onclose */ }
      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  // ─── Recipe trigger ──────────────────────────────────────────
  async function runRecipe(recipe) {
    if (job) {
      alert('في مهمة شغالة دلوقتي. استنّى تخلص الأول.')
      return
    }
    setLogs([])
    setJob({ recipe })
    try {
      const res = await fetch(`${AGENT_URL}/run/${recipe}`, {
        method: 'POST',
        headers: { 'x-agent-token': AGENT_TOKEN, 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      // Server confirmed start — actual updates come via WS.
    } catch (err) {
      setJob(null)
      setError(err.message)
      setLogs(prev => [...prev, { text: `❌ ${err.message}`, ts: Date.now(), kind: 'error' }])
    }
  }

  async function stopJob() {
    if (!job) return
    try {
      await fetch(`${AGENT_URL}/stop`, {
        method: 'POST',
        headers: { 'x-agent-token': AGENT_TOKEN },
      })
    } catch (err) {
      setError(err.message)
    }
  }

  // ─── UI ──────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.h2}>🤖 Social Agent</h2>
          <p style={styles.muted}>
            بيشغّل Gemini Web UI من جهازك ويولّد محتوى. شغّل <code style={styles.code}>npm start</code> في <code style={styles.code}>social-agent/</code> الأول.
          </p>
        </div>
        <div style={styles.statusBox}>
          <span style={{ ...styles.statusDot, background: connected ? T.success : T.error }} />
          <span style={{ fontSize: 13, color: connected ? T.success : T.error, fontWeight: 600 }}>
            {connected ? 'متصل' : 'مفصول'}
          </span>
        </div>
      </div>

      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      {!connected && (
        <div style={styles.helpBox}>
          <strong>الـ Agent مش شغّال. عشان تشغّله:</strong>
          <ol style={{ margin: '8px 0', paddingInlineStart: 20, lineHeight: 1.8 }}>
            <li>افتح PowerShell في <code style={styles.code}>F:\vixcell\social-agent</code></li>
            <li>أول مرة بس: <code style={styles.code}>npm install</code></li>
            <li>دايماً: <code style={styles.code}>npm start</code></li>
            <li>المتصفح هيفتح — سجّل دخول في Gemini مرة واحدة</li>
          </ol>
        </div>
      )}

      <div style={styles.grid}>
        {/* Left: recipes + logs */}
        <div style={styles.col}>
          <h3 style={styles.h3}>المهام</h3>
          <div style={styles.recipes}>
            {RECIPES.map(r => (
              <button
                key={r.id}
                onClick={() => runRecipe(r.id)}
                disabled={!connected || !!job}
                style={{
                  ...styles.recipeBtn,
                  opacity: (!connected || !!job) ? 0.4 : 1,
                  cursor: (!connected || !!job) ? 'not-allowed' : 'pointer',
                }}
                title={r.desc}
              >
                <div style={{ fontSize: 22 }}>{r.emoji}</div>
                <div style={{ fontWeight: 600, marginTop: 6 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{r.desc}</div>
              </button>
            ))}
          </div>

          {job && (
            <div style={styles.runningBox}>
              <span style={styles.spinner} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>شغّال: {job.recipe}</div>
                <div style={{ fontSize: 11, color: T.text3 }}>اتنوّع شوية — Gemini بيرد</div>
              </div>
              <button onClick={stopJob} style={styles.stopBtn}>إيقاف</button>
            </div>
          )}

          <h3 style={{ ...styles.h3, marginTop: 24 }}>السجل</h3>
          <div ref={logRef} style={styles.logBox}>
            {logs.length === 0 ? (
              <div style={{ color: T.text3, textAlign: 'center', padding: 20 }}>
                مفيش logs — اضغط على مهمة فوق
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{
                  ...styles.logLine,
                  color: l.kind === 'error' ? T.error : l.kind === 'success' ? T.success : T.text2,
                }}>
                  <span style={{ color: T.text3, fontSize: 10, marginInlineEnd: 8 }}>
                    {new Date(l.ts).toLocaleTimeString('ar-EG', { hour12: false })}
                  </span>
                  {l.text}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: live browser screenshot */}
        <div style={styles.col}>
          <h3 style={styles.h3}>المتصفح المباشر</h3>
          <div style={styles.browserFrame}>
            {screenshot ? (
              <img src={screenshot} alt="Live browser" style={styles.browserImg} />
            ) : (
              <div style={styles.browserEmpty}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🖥️</div>
                <div style={{ color: T.text3 }}>
                  {connected
                    ? 'لسه مفيش مهمة شغالة. شغّل واحدة من اليمين.'
                    : 'اتصل بالـ agent عشان تشوف المتصفح.'}
                </div>
              </div>
            )}
          </div>
          <p style={{ ...styles.muted, marginTop: 8, fontSize: 11 }}>
            ⓘ الـ screenshot بيتحدّث كل ثانية لما في مهمة شغالة. تقدر تتدخّل يدوياً في نافذة Chromium المفتوحة على جهازك.
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: { padding: 24, maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  h2: { margin: '0 0 4px', color: T.text, fontSize: 24, fontWeight: 700 },
  h3: { margin: '0 0 12px', color: T.text, fontSize: 15, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  muted: { color: T.text2, margin: 0, fontSize: 13, lineHeight: 1.5 },
  code: { background: T.bg3, padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', color: T.gold },
  statusBox: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8 },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  errorBox: { padding: 12, background: 'rgba(239,68,68,0.1)', border: `1px solid ${T.error}`, borderRadius: 8, color: T.error, marginBottom: 16, fontSize: 13 },
  helpBox: { padding: 16, background: T.goldDim, border: `1px solid ${T.gold}`, borderRadius: 8, color: T.text, marginBottom: 24, fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 },
  col: { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 },
  recipes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  recipeBtn: { background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, color: T.text, textAlign: 'center', transition: 'all 0.15s' },
  runningBox: { display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: T.goldDim, border: `1px solid ${T.gold}`, borderRadius: 8 },
  spinner: { display: 'inline-block', width: 16, height: 16, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'vxSpin 0.8s linear infinite' },
  stopBtn: { background: T.error, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  logBox: { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, direction: 'ltr', textAlign: 'left' },
  logLine: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  browserFrame: { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  browserImg: { width: '100%', height: '100%', objectFit: 'contain' },
  browserEmpty: { textAlign: 'center', padding: 40 },
}
