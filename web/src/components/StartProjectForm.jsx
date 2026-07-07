import React, { useState, useRef, useEffect } from 'react'
import { submit } from '../services/submissions'
import DotPixelIcon from './DotPixelIcon'

const T = {
  bg: '#0c0c0e', bg2: '#131316', bg3: '#1a1a1f',
  border: 'rgba(250, 246, 240,0.08)', borderH: 'rgba(250, 246, 240,0.16)',
  text: '#e8e8ed', text2: '#a8a8b3', text3: '#6b6b75',
  gold: '#c8a35c', goldH: '#d4b06a',
  goldDim: 'rgba(200,163,92,0.12)',
  error: '#ef4444',
  success: '#22c55e',
}

export default function StartProjectForm({ onViewChange }) {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [brief, setBrief] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [reference, setReference] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'الاسم مطلوب'
    const cleanedWa = whatsapp.replace(/[\s-]/g, '')
    if (!cleanedWa) e.whatsapp = 'رقم الواتساب مطلوب'
    else if (!/^\+?\d{8,15}$/.test(cleanedWa)) e.whatsapp = 'رقم غير صحيح (8-15 رقم، اختياري + للدولي)'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'إيميل غير صحيح'
    if (!brief.trim() || brief.trim().length < 10) e.brief = 'اكتبلي شوية تفاصيل (10 حروف على الأقل)'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const result = await submit('project_intake', {
        name: name.trim(),
        whatsapp: whatsapp.replace(/[\s-]/g, ''),
        email: email.trim() || null,
        brief: brief.trim(),
      })
      setReference(result.reference)
      setSuccess(true)
    } catch (err) {
      setErrors({ submit: 'حصل خطأ. حاول تاني.' })
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setName(''); setWhatsapp(''); setEmail(''); setBrief('')
    setErrors({}); setSuccess(false); setReference(null)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  async function copyRef() {
    if (!reference) return
    try { await navigator.clipboard.writeText(reference) } catch {}
  }

  // ─── Success view ────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.root}>
        <TopBar onBack={() => onViewChange('landing')} />
        <main style={styles.main}>
          <div style={styles.successCard}>
            <img src="/logo.png" alt="VIXCELL" style={styles.successLogo} />

            <h1 style={styles.successTitle}>تم استلام طلبك بنجاح</h1>
            <p style={styles.successText}>
              شكراً ليك يا <strong style={{ color: T.text }}>{name}</strong>. هنتواصل معاك على واتساب
              <strong style={{ color: T.gold, direction: 'ltr', display: 'inline-block' }}> {whatsapp} </strong>
              في أقرب وقت.
            </p>

            {reference && (
              <div style={styles.refBox}>
                <div style={styles.refLabel}>رقم تأكيد طلبك</div>
                <button
                  type="button"
                  onClick={copyRef}
                  style={styles.refValue}
                  title="انقر للنسخ"
                >
                  {reference}
                </button>
                <p style={styles.refHint}>احتفظ بالرقم ده — هتحتاجه لو سألت عن مشروعك</p>
              </div>
            )}

            <p style={{ ...styles.successText, fontSize: 13, color: T.text3, marginTop: 20 }}>
              ⚡ فريق Vixcell بيرد عادةً خلال 24 ساعة
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              <button onClick={reset} style={styles.btnGhost}>إرسال طلب تاني</button>
              <button onClick={() => onViewChange('landing')} style={styles.btnPrimary}>الرجوع للموقع</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Form view ───────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <TopBar onBack={() => onViewChange('landing')} />
      <main style={styles.main}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <div style={styles.badge}>✦ ابدأ مشروعك مع Vixcell</div>
            <h1 style={styles.title}>احكيلنا عن مشروعك</h1>
            <p style={styles.subtitle}>
              املأ الفورم وفريقنا هيتواصل معاك على واتساب في أقرب وقت لمناقشة التفاصيل والأسعار.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <Field label="الاسم" required error={errors.name}>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: حازم محمد"
                disabled={submitting}
                style={inputStyle(errors.name)}
              />
            </Field>

            <Field label="رقم الواتساب" required error={errors.whatsapp} hint="مع كود الدولة، مثلاً: +201234567890">
              <input
                type="tel"
                dir="ltr"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+201234567890"
                disabled={submitting}
                style={{ ...inputStyle(errors.whatsapp), textAlign: 'left' }}
              />
            </Field>

            <Field label="الإيميل" error={errors.email} optional>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
                style={{ ...inputStyle(errors.email), textAlign: 'left' }}
              />
            </Field>

            <Field label="نبذة عن المشروع" required error={errors.brief} hint="إيه نوع الموقع/الخدمة، الفئة المستهدفة، أي تفاصيل تفيدنا">
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="مثلاً: عايز موقع لشركتي اللي بتبيع منتجات تجميل، فيه catalog منتجات، نظام طلبات، تصميم عصري…"
                disabled={submitting}
                rows={5}
                style={{ ...inputStyle(errors.brief), resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
              />
              <div style={styles.charCount}>{brief.length} حرف</div>
            </Field>

            {errors.submit && (
              <div style={styles.errorBanner}>⚠️ {errors.submit}</div>
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
              ) : 'إرسال الطلب ←'}
            </button>

            <p style={styles.footer}>
              بإرسال الطلب أنت توافق على أن نتواصل معك حول مشروعك.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────
function TopBar({ onBack }) {
  return (
    <header style={styles.topBar}>
      <button onClick={onBack} style={styles.backBtn} title="الرجوع للموقع">
        <DotPixelIcon name="arrowLeft" size={18} color={T.text2} />
        <span>الرجوع</span>
      </button>
      <img src="/logo.png" alt="VIXCELL" style={styles.topLogo} />
      <div style={{ width: 60 }} />
    </header>
  )
}

function Field({ label, required, optional, error, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={styles.label}>
        <span>
          {label}
          {required && <span style={{ color: T.error, marginRight: 4 }}> *</span>}
          {optional && <span style={{ color: T.text3, fontWeight: 400, marginRight: 6, fontSize: 12 }}> (اختياري)</span>}
        </span>
      </label>
      {children}
      {hint && !error && <div style={styles.hint}>{hint}</div>}
      {error && <div style={styles.errorMsg}>⚠️ {error}</div>}
    </div>
  )
}

function inputStyle(hasError) {
  return {
    width: '100%',
    background: T.bg3,
    border: `1px solid ${hasError ? T.error : T.border}`,
    borderRadius: 10,
    padding: '12px 14px',
    color: T.text,
    fontSize: 14.5,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color .15s',
    direction: 'rtl',
  }
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: '100vh', width: '100%',
    background: T.bg, color: T.text,
    fontFamily: 'Inter, system-ui, sans-serif',
    direction: 'rtl',
  },
  topBar: {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(12,12,14,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${T.border}`,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: 'none',
    color: T.text2, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', padding: '6px 10px', borderRadius: 8,
    fontFamily: 'inherit',
  },
  topLogo: { height: 32, width: 'auto', objectFit: 'contain' },

  main: {
    maxWidth: 640, margin: '0 auto',
    padding: '48px 20px 64px',
  },

  formCard: {
    background: T.bg2,
    border: `1px solid ${T.border}`,
    borderRadius: 20,
    padding: 'clamp(24px, 5vw, 40px)',
  },
  formHeader: { marginBottom: 28, textAlign: 'center' },
  badge: {
    display: 'inline-block', padding: '5px 14px',
    background: T.goldDim, border: `1px solid rgba(200,163,92,0.3)`,
    borderRadius: 50, color: T.gold,
    fontSize: 12, fontWeight: 700,
    marginBottom: 14, letterSpacing: '0.02em',
  },
  title: {
    fontSize: 'clamp(22px, 4vw, 30px)',
    fontWeight: 800, marginBottom: 8,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    color: T.text2, fontSize: 14.5, lineHeight: 1.7,
    maxWidth: 480, margin: '0 auto',
  },

  form: { display: 'block' },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: T.text, marginBottom: 8,
  },
  hint: { color: T.text3, fontSize: 12, marginTop: 6 },
  errorMsg: { color: T.error, fontSize: 12, marginTop: 6, fontWeight: 500 },
  charCount: { color: T.text3, fontSize: 11, marginTop: 4, textAlign: 'left' },
  errorBanner: {
    padding: '10px 14px', borderRadius: 10,
    background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`,
    color: T.error, fontSize: 13, marginBottom: 14,
  },

  btnPrimary: {
    background: T.gold, color: '#000',
    border: 'none', borderRadius: 12,
    padding: '12px 24px',
    fontSize: 14.5, fontWeight: 700,
    cursor: 'pointer', transition: 'all .2s',
    fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnGhost: {
    background: 'transparent', color: T.text,
    border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '12px 24px',
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all .2s',
    fontFamily: 'inherit',
  },
  footer: {
    textAlign: 'center', marginTop: 16,
    color: T.text3, fontSize: 12,
  },

  successCard: {
    background: T.bg2, border: `1px solid ${T.border}`,
    borderRadius: 20, padding: 'clamp(32px, 6vw, 48px) 24px',
    textAlign: 'center',
  },
  successLogo: {
    height: 64, width: 'auto', objectFit: 'contain',
    margin: '0 auto 24px',
    animation: 'vxPop 0.5s cubic-bezier(0.16,1,0.3,1)',
    display: 'block',
  },
  successTitle: {
    fontSize: 'clamp(22px, 4vw, 28px)',
    fontWeight: 800, marginBottom: 14,
  },
  successText: {
    color: T.text2, fontSize: 15, lineHeight: 1.8,
    maxWidth: 460, margin: '0 auto 8px',
  },
  refBox: {
    margin: '24px auto 0', maxWidth: 360,
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(200,163,92,0.10), rgba(200,163,92,0.04))',
    border: `1px solid rgba(200,163,92,0.30)`,
    borderRadius: 14,
  },
  refLabel: {
    fontSize: 11, fontWeight: 700,
    color: T.gold, textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 8,
  },
  refValue: {
    display: 'block', width: '100%',
    background: 'transparent', border: 'none',
    fontSize: 'clamp(20px, 4vw, 26px)',
    fontWeight: 800, color: T.text,
    fontFamily: 'ui-monospace, "SF Mono", Monaco, Consolas, monospace',
    letterSpacing: '0.08em', direction: 'ltr',
    cursor: 'pointer', textAlign: 'center',
    padding: '4px 0',
  },
  refHint: {
    fontSize: 11, color: T.text3,
    margin: '8px 0 0', lineHeight: 1.5,
  },

  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'vxSpin 0.8s linear infinite',
  },
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('vx-startform-keyframes')) {
  const style = document.createElement('style')
  style.id = 'vx-startform-keyframes'
  style.textContent = `
@keyframes vxSpin { to { transform: rotate(360deg) } }
@keyframes vxPop  { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
`
  document.head.appendChild(style)
}
