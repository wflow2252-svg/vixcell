import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const T = {
  bg: '#0c0c0e', bg2: '#131316', bg3: '#1a1a1f',
  border: 'rgba(250, 246, 240,0.08)', borderH: 'rgba(250, 246, 240,0.16)',
  text: '#e8e8ed', text2: '#a8a8b3', text3: '#6b6b75',
  gold: '#c8a35c', error: '#ef4444', success: '#22c55e',
}

// Monday of the current week as YYYY-MM-DD (matches the social-agent's util)
function thisWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = (day + 6) % 7
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

const blank = {
  theme: '',
  goal: '',
  key_messages: ['', '', ''],
  daily_prompts: ['', '', '', '', '', '', ''],
}

export default function CampaignEditor() {
  const [weekStart, setWeekStart] = useState(thisWeekStart())
  const [campaign, setCampaign] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data, error: e } = await supabase
          .from('campaigns')
          .select('*')
          .eq('week_start', weekStart)
          .maybeSingle()
        if (e) throw e
        if (data) {
          // Try to extract day prompts from strategy_body (saved by market-analysis recipe)
          const daily = []
          if (data.strategy_body) {
            for (let i = 1; i <= 7; i++) {
              const m = data.strategy_body.match(new RegExp(`(?:^|\\n)\\s*${i}\\.\\s*(.+)`))
              if (m) daily.push(m[1].trim())
            }
          }
          setCampaign({
            theme: data.theme || '',
            goal: data.goal || '',
            key_messages: (data.key_messages || []).concat(['', '', '']).slice(0, 5),
            daily_prompts: daily.concat(['', '', '', '', '', '', '']).slice(0, 7),
          })
        } else {
          setCampaign(blank)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [weekStart])

  async function save() {
    setSaving(true)
    setError('')
    try {
      const keyMessages = campaign.key_messages.filter(Boolean)
      const daily = campaign.daily_prompts
      const strategyBody = daily.some(Boolean)
        ? '## مواضيع البوستات اليومية\n' + daily.map((p, i) => `${i + 1}. ${p || '—'}`).join('\n')
        : null

      const { error: upErr } = await supabase
        .from('campaigns')
        .upsert({
          week_start: weekStart,
          theme: campaign.theme,
          goal: campaign.goal,
          key_messages: keyMessages,
          strategy_body: strategyBody,
        }, { onConflict: 'week_start' })

      if (upErr) throw upErr
      setSavedAt(Date.now())
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function updateKeyMessage(i, value) {
    const next = [...campaign.key_messages]
    next[i] = value
    setCampaign({ ...campaign, key_messages: next })
  }

  function updateDaily(i, value) {
    const next = [...campaign.daily_prompts]
    next[i] = value
    setCampaign({ ...campaign, daily_prompts: next })
  }

  if (loading) return <div style={{ padding: 24, color: T.text2 }}>جاري التحميل…</div>

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.h3}>🎯 استراتيجية الأسبوع</h3>
          <p style={styles.muted}>
            بدل ما الـ Agent يخمّن، اكتب أنت ثيمة الأسبوع. كل بوست بيتولّد بعد كده هيكون متماشي مع اللي تكتبه هنا.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            style={{ ...styles.input, width: 160 }}
            dir="ltr"
          />
          {savedAt && (
            <div style={styles.savedPill}>
              ✅ {new Date(savedAt).toLocaleTimeString('ar-EG', { hour12: false })}
            </div>
          )}
        </div>
      </div>

      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <div style={styles.card}>
        <Field label="ثيمة الأسبوع *">
          <input
            value={campaign.theme}
            onChange={(e) => setCampaign({ ...campaign, theme: e.target.value })}
            placeholder="مثلاً: العميل اللي بيختار ديجيتال هوية كاملة، مش بس موقع"
            style={styles.input}
          />
        </Field>

        <Field label="الهدف من الأسبوع">
          <textarea
            value={campaign.goal}
            onChange={(e) => setCampaign({ ...campaign, goal: e.target.value })}
            placeholder="مثلاً: تعريف العميل إن VIXCELL مش وكالة عادية"
            style={{ ...styles.input, minHeight: 70 }}
          />
        </Field>

        <Field label="الرسائل المفتاحية (٣-٥ نقاط)">
          {campaign.key_messages.map((m, i) => (
            <input
              key={i}
              value={m}
              onChange={(e) => updateKeyMessage(i, e.target.value)}
              placeholder={`رسالة #${i + 1}`}
              style={{ ...styles.input, marginBottom: 8 }}
            />
          ))}
        </Field>

        <Field label="مواضيع البوستات (٧ أيام)">
          <p style={{ ...styles.muted, fontSize: 11, marginBottom: 8 }}>
            ⓘ في كل يوم، الـ recipe بياخد التوبيك المناظر هنا ويبني عليه. سيبها فاضية لو عايز الـ Agent يختار التوبيك تلقائي حسب الثيمة.
          </p>
          {campaign.daily_prompts.map((p, i) => {
            const days = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 70, fontSize: 12, color: T.text3, paddingTop: 12 }}>{days[i]}</div>
                <input
                  value={p}
                  onChange={(e) => updateDaily(i, e.target.value)}
                  placeholder="موضوع البوست"
                  style={{ ...styles.input, flex: 1 }}
                />
              </div>
            )
          })}
        </Field>

        <button onClick={save} disabled={saving || !campaign.theme} style={{ ...styles.primaryBtn, marginTop: 16, width: '100%' }}>
          {saving ? 'جاري الحفظ…' : '💾 حفظ الاستراتيجية'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: T.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const styles = {
  wrap: { padding: 24, maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  h3: { margin: '0 0 4px', color: T.text, fontSize: 20, fontWeight: 700 },
  muted: { color: T.text2, margin: 0, fontSize: 13, lineHeight: 1.5 },
  savedPill: { background: 'rgba(34,197,94,0.15)', color: T.success, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  errorBox: { padding: 12, background: 'rgba(239,68,68,0.1)', border: `1px solid ${T.error}`, borderRadius: 8, color: T.error, marginBottom: 16, fontSize: 13 },
  card: { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: T.bg3, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  primaryBtn: { background: T.gold, color: '#000', border: 'none', borderRadius: 8, padding: '12px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
