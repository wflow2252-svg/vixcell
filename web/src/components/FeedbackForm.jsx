import React, { useState, useRef, useEffect } from 'react'
import { submit } from '../services/submissions'

const T = {
  bg: '#0c0c0e', bg2: '#131316', bg3: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)',
  text: '#e8e8ed', text2: '#a8a8b3', text3: '#6b6b75',
  gold: '#c8a35c', goldH: '#d4b06a', goldDim: 'rgba(200,163,92,0.12)',
  error: '#ef4444',
}

const RATINGS = [
  { value: 5, label: '🤩 ممتاز' },
  { value: 4, label: '😊 كويس' },
  { value: 3, label: '😐 عادي' },
  { value: 2, label: '😕 ضعيف' },
  { value: 1, label: '😞 سيء' },
]

export default function FeedbackForm({ onViewChange }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(null)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'الاسم مطلوب'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'إيميل غير صحيح'
    if (rating == null) e.rating = 'اختار تقييم'
    if (!message.trim() || message.trim().length < 10) e.message = 'اكتبلنا رأيك (10 حروف على الأقل)'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      await submit('feedback', {
        name: name.trim(),
        email: email.trim() || null,
        rating,
        message: message.trim(),
      })
      setSuccess(true)
    } catch (err) {
      setErrors({ submit: 'حصل خطأ. حاول تاني.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={styles.root}>
        <TopBar onBack={() => onViewChange('landing')} />
        <main style={styles.main}>
          <div style={styles.successCard}>
            <div style={styles.checkmark}>♥</div>
            <h1 style={styles.successTitle}>شكراً ليك! 🙏</h1>
            <p style={styles.successText}>
              رأيك وصلنا يا <strong style={{ color: T.text }}>{name}</strong>. كل feedback بيساعدنا نطور خدماتنا.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              <button onClick={() => onViewChange('landing')} style={styles.btnPrimary}>الرجوع للموقع</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <TopBar onBack={() => onViewChange('landing')} />
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={styles.badge}>✦ شاركنا رأيك</div>
            <h1 style={styles.title}>رأيك بيهمنا</h1>
            <p style={styles.subtitle}>
              قولنا رأيك في خدماتنا، اقتراحاتك، أو أي حاجة تحب تشاركنا بيها.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>الاسم <span style={{ color: T.error }}>*</span></label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: حازم محمد"
                disabled={submitting}
                style={input(errors.name)}
              />
              {errors.name && <div style={styles.errMsg}>⚠️ {errors.name}</div>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>
                الإيميل <span style={{ color: T.text3, fontWeight: 400, fontSize: 12 }}>(اختياري)</span>
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
                style={{ ...input(errors.email), textAlign: 'left' }}
              />
              {errors.email && <div style={styles.errMsg}>⚠️ {errors.email}</div>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>التقييم <span style={{ color: T.error }}>*</span></label>
              <div style={styles.ratingRow}>
                {RATINGS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRating(r.value)}
                    disabled={submitting}
                    style={{
                      ...styles.ratingBtn,
                      background: rating === r.value ? T.goldDim : T.bg3,
                      borderColor: rating === r.value ? T.gold : T.border,
                      color: rating === r.value ? T.gold : T.text2,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.rating && <div style={styles.errMsg}>⚠️ {errors.rating}</div>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>رأيك / اقتراحك <span style={{ color: T.error }}>*</span></label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="احكيلنا تجربتك أو اقتراحك بالتفصيل…"
                disabled={submitting}
                rows={5}
                style={{ ...input(errors.message), resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
              />
              {errors.message && <div style={styles.errMsg}>⚠️ {errors.message}</div>}
            </div>

            {errors.submit && (
              <div style={styles.errBanner}>⚠️ {errors.submit}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.btnPrimary,
                width: '100%', padding: '14px',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.spinner} /> جاري الإرسال…
                </span>
              ) : 'إرسال رأيي ←'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

function TopBar({ onBack }) {
  return (
    <header style={styles.topBar}>
      <button onClick={onBack} style={styles.backBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        الرجوع
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/logo.png" alt="VIXCELL" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <span style={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: 14 }}>VIXCELL</span>
      </div>
    </header>
  )
}

function input(err) {
  return {
    width: '100%',
    background: T.bg3,
    border: `1px solid ${err ? T.error : T.border}`,
    borderRadius: 10, padding: '12px 14px',
    color: T.text, fontSize: 14.5, outline: 'none',
    fontFamily: 'inherit', direction: 'rtl',
    transition: 'border-color .15s',
  }
}

const styles = {
  root: { minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, system-ui, sans-serif', direction: 'rtl' },
  topBar: {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${T.border}`,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: 'none',
    color: T.text2, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontFamily: 'inherit',
  },
  main: { maxWidth: 640, margin: '0 auto', padding: '48px 20px 64px' },
  card: { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20, padding: 'clamp(24px, 5vw, 40px)' },
  badge: {
    display: 'inline-block', padding: '5px 14px',
    background: T.goldDim, border: `1px solid rgba(200,163,92,0.3)`,
    borderRadius: 50, color: T.gold,
    fontSize: 12, fontWeight: 700, marginBottom: 14,
  },
  title: { fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' },
  subtitle: { color: T.text2, fontSize: 14.5, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 },
  errMsg: { color: T.error, fontSize: 12, marginTop: 6, fontWeight: 500 },
  errBanner: {
    padding: '10px 14px', borderRadius: 10,
    background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`,
    color: T.error, fontSize: 13, marginBottom: 14,
  },
  ratingRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  ratingBtn: {
    flex: '1 1 auto', minWidth: 90,
    padding: '10px 14px', borderRadius: 10,
    border: `1px solid`, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
  },
  btnPrimary: {
    background: T.gold, color: '#000', border: 'none', borderRadius: 12,
    fontSize: 14.5, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
    fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  successCard: {
    background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20,
    padding: 'clamp(32px, 6vw, 48px) 24px', textAlign: 'center',
  },
  checkmark: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #ec4899, #f97316)',
    color: '#fff', fontSize: 36, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 30px rgba(236,72,153,0.35)',
  },
  successTitle: { fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, marginBottom: 14 },
  successText: { color: T.text2, fontSize: 15, lineHeight: 1.8, maxWidth: 460, margin: '0 auto' },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000',
    borderRadius: '50%', animation: 'vxSpin 0.8s linear infinite',
  },
}
