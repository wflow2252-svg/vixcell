import React, { useEffect, useState, useMemo } from 'react'
import {
  signInWithGoogle, signOutUser, onAuthChange, isFirebaseReady, initFirebase,
} from '../services/firebase'
import {
  listAll, markRead, remove, isAdmin, ADMIN_EMAILS,
} from '../services/submissions'

const T = {
  bg: '#0c0c0e', bg2: '#131316', bg3: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)', borderH: 'rgba(255,255,255,0.16)',
  text: '#e8e8ed', text2: '#a8a8b3', text3: '#6b6b75',
  gold: '#c8a35c', goldH: '#d4b06a', goldDim: 'rgba(200,163,92,0.12)',
  error: '#ef4444', success: '#22c55e',
}

const TYPE_LABELS = {
  project_intake: { label: 'طلب مشروع',  emoji: '🚀', color: T.gold },
  feedback:       { label: 'رأي/تقييم', emoji: '💬', color: '#ec4899' },
}

export default function AdminDashboard({ onViewChange }) {
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signInError, setSignInError] = useState('')

  useEffect(() => {
    initFirebase()
    const unsub = onAuthChange((u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub && unsub()
  }, [])

  // ─── Loading splash ────────────────────────────────────────────
  if (authLoading) {
    return (
      <Shell onBack={() => onViewChange('landing')}>
        <div style={styles.centerCard}>
          <span style={styles.spinner} />
          <p style={{ color: T.text2, marginTop: 16 }}>جاري التحقق...</p>
        </div>
      </Shell>
    )
  }

  // ─── Login required ────────────────────────────────────────────
  if (!user) {
    return (
      <Shell onBack={() => onViewChange('landing')}>
        <div style={styles.centerCard}>
          <div style={styles.lockIcon}>🔒</div>
          <h1 style={styles.h1}>لوحة التحكم</h1>
          <p style={styles.muted}>سجل دخول بحسابك الإداري للوصول.</p>

          {!isFirebaseReady() && (
            <div style={styles.warning}>
              ⚠️ <strong>Firebase مش متظبط لسه.</strong><br/>
              ضيف الـ <code style={styles.code}>VITE_FIREBASE_*</code> env vars في Vercel وعمل redeploy.
            </div>
          )}

          {signInError && <div style={styles.errorBanner}>⚠️ {signInError}</div>}

          <button onClick={handleSignIn} disabled={!isFirebaseReady()} style={{ ...styles.btnPrimary, marginTop: 20 }}>
            <GoogleIcon /> تسجيل دخول بـ Google
          </button>

          <p style={{ ...styles.muted, fontSize: 12, marginTop: 14 }}>
            مسموح بس لـ: <code style={styles.code}>{ADMIN_EMAILS.join(' · ')}</code>
          </p>
        </div>
      </Shell>
    )
  }

  // ─── Signed in but not admin ───────────────────────────────────
  if (!isAdmin(user.email)) {
    return (
      <Shell onBack={() => onViewChange('landing')} user={user}>
        <div style={styles.centerCard}>
          <div style={styles.lockIcon}>⛔</div>
          <h1 style={styles.h1}>غير مصرح بالدخول</h1>
          <p style={styles.muted}>
            الحساب <strong style={{ color: T.text }}>{user.email}</strong> مش admin.
          </p>
          <p style={{ ...styles.muted, fontSize: 12, marginTop: 8 }}>
            سجل خروج وادخل بالحساب الصحيح.
          </p>
          <button onClick={signOutUser} style={{ ...styles.btnGhost, marginTop: 20 }}>
            تسجيل خروج
          </button>
        </div>
      </Shell>
    )
  }

  // ─── Admin view ────────────────────────────────────────────────
  return <AdminView user={user} onBack={() => onViewChange('landing')} />

  async function handleSignIn() {
    setSignInError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setSignInError(err?.message || 'فشل تسجيل الدخول')
    }
  }
}

// ─── Admin Dashboard View ──────────────────────────────────────────
function AdminView({ user, onBack }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')   // 'all' | 'project_intake' | 'feedback' | 'unread'
  const [selected, setSelected] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await listAll()
      setSubmissions(data)
    } catch (err) {
      console.error('[Admin] load failed:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (filter === 'all')    return submissions
    if (filter === 'unread') return submissions.filter(s => !s.read)
    return submissions.filter(s => s.type === filter)
  }, [submissions, filter])

  const unreadCount = useMemo(() => submissions.filter(s => !s.read).length, [submissions])

  async function handleMarkRead(s, read) {
    await markRead(s.id, read)
    setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, read } : x))
    if (selected?.id === s.id) setSelected({ ...selected, read })
  }

  async function handleDelete(s) {
    if (!confirm('متأكد عايز تمسح الطلب ده؟')) return
    await remove(s.id)
    setSubmissions(prev => prev.filter(x => x.id !== s.id))
    if (selected?.id === s.id) setSelected(null)
  }

  return (
    <Shell onBack={onBack} user={user}>
      <div style={styles.adminWrap}>
        {/* ── Header strip ── */}
        <div style={styles.adminHeader}>
          <div>
            <h1 style={{ ...styles.h1, marginBottom: 4, textAlign: 'left' }}>الطلبات الواردة</h1>
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>
              {submissions.length} إجمالي · <span style={{ color: T.gold }}>{unreadCount} غير مقروء</span>
            </p>
          </div>
          <button
            onClick={() => { setRefreshing(true); load() }}
            disabled={refreshing}
            style={styles.refreshBtn}
            title="تحديث"
          >
            <RefreshIcon spinning={refreshing} />
            <span>تحديث</span>
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div style={styles.filterRow}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>الكل ({submissions.length})</FilterChip>
          <FilterChip active={filter === 'unread'} onClick={() => setFilter('unread')}>غير مقروء ({unreadCount})</FilterChip>
          <FilterChip active={filter === 'project_intake'} onClick={() => setFilter('project_intake')}>
            🚀 مشاريع ({submissions.filter(s => s.type === 'project_intake').length})
          </FilterChip>
          <FilterChip active={filter === 'feedback'} onClick={() => setFilter('feedback')}>
            💬 آراء ({submissions.filter(s => s.type === 'feedback').length})
          </FilterChip>
        </div>

        {/* ── Body: list + detail ── */}
        {loading ? (
          <div style={styles.centerCard}><span style={styles.spinner} /><p style={{ marginTop: 16, color: T.text2 }}>جاري التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <h3 style={{ margin: '0 0 6px', fontWeight: 700 }}>مفيش طلبات</h3>
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>
              لما حد يبعت من /dashboard أو /feedback، هتلاقي طلبه هنا.
            </p>
          </div>
        ) : (
          <div style={styles.split}>
            {/* List */}
            <div style={styles.list}>
              {filtered.map(s => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  active={selected?.id === s.id}
                  onClick={() => setSelected(s)}
                />
              ))}
            </div>

            {/* Detail panel */}
            <div style={styles.detail}>
              {selected ? (
                <SubmissionDetail
                  s={selected}
                  onMarkRead={() => handleMarkRead(selected, !selected.read)}
                  onDelete={() => handleDelete(selected)}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <div style={styles.detailEmpty}>
                  <p>اختار طلب من القائمة لعرض التفاصيل</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}

// ─── Submission card ───────────────────────────────────────────────
function SubmissionCard({ submission, active, onClick }) {
  const meta = TYPE_LABELS[submission.type] || { label: submission.type, emoji: '📄', color: T.text2 }
  return (
    <div
      onClick={onClick}
      className="vx-sub-card"
      style={{
        ...styles.card,
        background: active ? T.bg3 : T.bg2,
        borderColor: active ? T.gold : (submission.read ? T.border : 'rgba(200,163,92,0.4)'),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ ...styles.typeChip, color: meta.color, borderColor: meta.color + '40', background: meta.color + '15' }}>
              {meta.emoji} {meta.label}
            </span>
            {!submission.read && <span style={styles.unreadDot} />}
          </div>
          <h4 style={styles.cardName}>{submission.name || 'غير محدد'}</h4>
          <p style={styles.cardPreview}>
            {(submission.brief || submission.message || '').slice(0, 90)}
            {(submission.brief || submission.message || '').length > 90 ? '…' : ''}
          </p>
        </div>
      </div>
      <div style={styles.cardFooter}>
        <span>{formatTime(submission.createdAt)}</span>
        {submission.syncedToCloud === false && (
          <span style={{ color: T.text3 }}>• محلي</span>
        )}
      </div>
    </div>
  )
}

// ─── Detail view ───────────────────────────────────────────────────
function SubmissionDetail({ s, onMarkRead, onDelete, onClose }) {
  const meta = TYPE_LABELS[s.type] || { label: s.type, emoji: '📄', color: T.text2 }
  const waLink = s.whatsapp
    ? `https://wa.me/${s.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`أهلاً ${s.name}, شكراً لتواصلك مع Vixcell بخصوص "${(s.brief || '').slice(0, 50)}…"`)}`
    : null

  return (
    <div>
      <div style={styles.detailHeader}>
        <div>
          <span style={{ ...styles.typeChip, color: meta.color, borderColor: meta.color + '40', background: meta.color + '15' }}>
            {meta.emoji} {meta.label}
          </span>
          <h2 style={{ margin: '10px 0 4px', fontSize: 22, fontWeight: 800 }}>{s.name}</h2>
          <p style={{ color: T.text3, fontSize: 12, margin: 0 }}>{formatTime(s.createdAt)}</p>
        </div>
        <button onClick={onClose} style={styles.iconBtn} title="إغلاق">✕</button>
      </div>

      <div style={styles.detailRow}><span style={styles.detailLabel}>الواتس</span>
        <span style={{ ...styles.detailValue, direction: 'ltr' }}>
          {s.whatsapp ? <a href={waLink} target="_blank" rel="noreferrer" style={styles.link}>{s.whatsapp} ↗</a> : '—'}
        </span>
      </div>
      <div style={styles.detailRow}><span style={styles.detailLabel}>الإيميل</span>
        <span style={{ ...styles.detailValue, direction: 'ltr' }}>
          {s.email ? <a href={`mailto:${s.email}`} style={styles.link}>{s.email}</a> : '—'}
        </span>
      </div>
      {s.rating != null && (
        <div style={styles.detailRow}><span style={styles.detailLabel}>التقييم</span>
          <span style={styles.detailValue}>{'⭐'.repeat(s.rating)} ({s.rating}/5)</span>
        </div>
      )}
      <div style={styles.detailRow}><span style={styles.detailLabel}>المصدر</span>
        <span style={{ ...styles.detailValue, color: T.text3, fontFamily: 'monospace', fontSize: 12 }}>{s.source || '—'}</span>
      </div>

      <div style={styles.briefBox}>
        <div style={styles.detailLabel}>{s.type === 'feedback' ? 'الرأي / الاقتراح' : 'تفاصيل المشروع'}</div>
        <p style={styles.briefText}>{s.brief || s.message || '—'}</p>
      </div>

      <div style={styles.detailActions}>
        <button onClick={onMarkRead} style={styles.btnGhost}>
          {s.read ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
        </button>
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" style={{ ...styles.btnPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            💬 رد على واتساب
          </a>
        )}
        <button onClick={onDelete} style={{ ...styles.btnGhost, color: T.error, borderColor: 'rgba(239,68,68,0.3)' }}>
          🗑 حذف
        </button>
      </div>
    </div>
  )
}

// ─── Shell (top bar with user/signout) ─────────────────────────────
function Shell({ children, onBack, user }) {
  return (
    <div style={styles.root}>
      <header style={styles.topBar}>
        <button onClick={onBack} style={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          الرجوع
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="VIXCELL" style={{ width: 24, height: 24, borderRadius: 6 }} />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: 14 }}>VIXCELL</span>
          <span style={{ color: T.text3, fontSize: 12, marginRight: 6 }}>· Admin</span>
        </div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.picture
              ? <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{user.name?.[0] || '?'}</div>
            }
            <button onClick={signOutUser} style={styles.signoutBtn}>خروج</button>
          </div>
        ) : <div />}
      </header>
      <main>{children}</main>
    </div>
  )
}

// ─── Tiny helpers ──────────────────────────────────────────────────
function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.chip,
        background: active ? T.gold : T.bg2,
        color: active ? '#000' : T.text2,
        borderColor: active ? T.gold : T.border,
      }}
    >{children}</button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function RefreshIcon({ spinning }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round"
         style={spinning ? { animation: 'vxSpin 1s linear infinite' } : {}}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return 'الآن'
  if (diff < 3600_000) return `قبل ${Math.floor(diff / 60_000)} دقيقة`
  if (diff < 86_400_000) return `قبل ${Math.floor(diff / 3_600_000)} ساعة`
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = {
  root: { minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, system-ui, sans-serif', direction: 'rtl' },
  topBar: {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${T.border}`,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: 'none',
    color: T.text2, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontFamily: 'inherit',
  },
  signoutBtn: {
    background: 'transparent', border: `1px solid ${T.border}`,
    color: T.text2, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', padding: '5px 10px', borderRadius: 8, fontFamily: 'inherit',
  },

  centerCard: {
    maxWidth: 480, margin: '64px auto', padding: '40px 32px',
    background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20, textAlign: 'center',
  },
  lockIcon: { fontSize: 48, marginBottom: 12 },
  h1: { fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' },
  muted: { color: T.text2, fontSize: 14, lineHeight: 1.7, margin: 0 },
  warning: {
    background: 'rgba(250,204,21,0.1)', border: `1px solid rgba(250,204,21,0.3)`,
    color: '#fde68a', padding: '12px 14px', borderRadius: 10,
    fontSize: 13, lineHeight: 1.6, marginTop: 16, textAlign: 'right',
  },
  errorBanner: {
    background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`,
    color: T.error, padding: '10px 14px', borderRadius: 10,
    fontSize: 13, marginTop: 16,
  },
  code: { background: T.bg3, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 },

  adminWrap: { maxWidth: 1200, margin: '0 auto', padding: '28px 20px 64px' },
  adminHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 16, marginBottom: 20, flexWrap: 'wrap',
  },
  refreshBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: T.bg2, border: `1px solid ${T.border}`, color: T.text,
    padding: '8px 14px', borderRadius: 10,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all .15s',
  },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  chip: {
    padding: '6px 14px', borderRadius: 50,
    border: `1px solid`, fontSize: 12.5, fontWeight: 600,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
  },

  split: { display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) 1fr', gap: 16, alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' },
  detail: {
    position: 'sticky', top: 84,
    background: T.bg2, border: `1px solid ${T.border}`,
    borderRadius: 16, padding: 24, minHeight: 240,
  },
  detailEmpty: { color: T.text3, textAlign: 'center', padding: '40px 0' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: `1px solid ${T.border}`,
    fontSize: 13,
  },
  detailLabel: { color: T.text3, fontWeight: 600 },
  detailValue: { color: T.text, fontWeight: 500 },
  link: { color: T.gold, textDecoration: 'none' },
  briefBox: {
    marginTop: 20, padding: 16,
    background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12,
  },
  briefText: { color: T.text, fontSize: 14, lineHeight: 1.7, margin: '8px 0 0', whiteSpace: 'pre-wrap' },
  detailActions: { display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' },

  card: {
    border: `1px solid`, borderRadius: 12, padding: 14,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
  },
  typeChip: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 50,
    fontSize: 10.5, fontWeight: 700,
    border: `1px solid`,
  },
  cardName: { fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 4px' },
  cardPreview: { fontSize: 12, color: T.text3, margin: 0, lineHeight: 1.5 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: T.text3 },
  unreadDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.gold, boxShadow: `0 0 6px ${T.gold}` },

  emptyState: { textAlign: 'center', padding: '80px 20px', color: T.text2 },
  iconBtn: {
    background: 'transparent', border: 'none', color: T.text3,
    cursor: 'pointer', fontSize: 18, padding: 4, borderRadius: 6,
    fontFamily: 'inherit',
  },

  btnPrimary: {
    background: T.gold, color: '#000', border: 'none', borderRadius: 10,
    padding: '10px 18px', fontSize: 13.5, fontWeight: 700,
    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  btnGhost: {
    background: 'transparent', color: T.text, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
  },

  spinner: {
    display: 'inline-block', width: 24, height: 24,
    border: '2px solid rgba(255,255,255,0.1)', borderTopColor: T.gold,
    borderRadius: '50%', animation: 'vxSpin 0.8s linear infinite',
  },
}

if (typeof document !== 'undefined' && !document.getElementById('vx-admin-keyframes')) {
  const style = document.createElement('style')
  style.id = 'vx-admin-keyframes'
  style.textContent = `
@keyframes vxSpin { to { transform: rotate(360deg) } }
.vx-sub-card:hover { border-color: rgba(255,255,255,0.16) !important; }
@media (max-width: 900px) {
  .vx-admin-split { grid-template-columns: 1fr !important; }
}
`
  document.head.appendChild(style)
}
