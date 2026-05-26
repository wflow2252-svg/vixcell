import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import DotPixelIcon from './DotPixelIcon'

const T = {
  bg: '#0c0c0e', bg2: '#131316', bg3: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)', borderH: 'rgba(255,255,255,0.16)',
  text: '#e8e8ed', text2: '#a8a8b3', text3: '#6b6b75',
  gold: '#c8a35c', goldH: '#d4b06a', goldDim: 'rgba(200,163,92,0.12)',
  error: '#ef4444', success: '#22c55e',
}

const emptyCompetitor = { name: '', url: '', fb_page: '', notes: '' }

export default function BrandSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState('')

  const [brand, setBrand] = useState(null)
  const [services, setServices] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  const [competitors, setCompetitors] = useState([])
  const [newComp, setNewComp] = useState(emptyCompetitor)

  // ─── Load on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [b, c] = await Promise.all([
          supabase.from('brand_config').select('*').eq('id', true).maybeSingle(),
          supabase.from('competitors').select('*').order('created_at'),
        ])
        if (b.error) throw b.error
        if (c.error) throw c.error
        setBrand(b.data || { brand_name: 'VIXCELL', services: [], brand_colors: {} })
        setServices((b.data?.services || []).join(', '))
        setLogoPreview(b.data?.logo_url || null)
        setCompetitors(c.data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ─── Save brand_config ────────────────────────────────────
  async function saveBrand(e) {
    e?.preventDefault?.()
    setSaving(true)
    setError('')
    try {
      let logoUrl = brand?.logo_url || null

      if (logoFile) {
        const ext = (logoFile.name.split('.').pop() || 'png').toLowerCase()
        const path = `logo-${Date.now()}.${ext}`
        const up = await supabase.storage.from('brand-assets').upload(path, logoFile, {
          upsert: true,
          contentType: logoFile.type || 'image/png',
        })
        if (up.error) throw up.error
        const { data: pub } = supabase.storage.from('brand-assets').getPublicUrl(path)
        logoUrl = pub.publicUrl
      }

      const servicesArr = services
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean)

      const patch = {
        brand_name:      brand.brand_name,
        tagline:         brand.tagline,
        description:     brand.description,
        services:        servicesArr,
        tone:            brand.tone,
        target_audience: brand.target_audience,
        website:         brand.website,
        contact_email:   brand.contact_email,
        logo_url:        logoUrl,
        brand_colors:    brand.brand_colors || {},
        updated_at:      new Date().toISOString(),
      }

      const { data, error: upErr } = await supabase
        .from('brand_config')
        .update(patch)
        .eq('id', true)
        .select()
        .single()
      if (upErr) throw upErr

      setBrand(data)
      setLogoFile(null)
      setLogoPreview(data.logo_url)
      setSavedAt(Date.now())
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Competitor CRUD ─────────────────────────────────────
  async function addCompetitor(e) {
    e.preventDefault()
    if (!newComp.name.trim()) return
    const { data, error: insErr } = await supabase
      .from('competitors')
      .insert({ ...newComp, name: newComp.name.trim(), is_active: true })
      .select()
      .single()
    if (insErr) { setError(insErr.message); return }
    setCompetitors((prev) => [...prev, data])
    setNewComp(emptyCompetitor)
  }

  async function removeCompetitor(id) {
    if (!confirm('متأكد من حذف المنافس ده؟')) return
    const { error: delErr } = await supabase.from('competitors').delete().eq('id', id)
    if (delErr) { setError(delErr.message); return }
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  async function toggleCompetitor(c) {
    const { data, error: upErr } = await supabase
      .from('competitors')
      .update({ is_active: !c.is_active })
      .eq('id', c.id)
      .select()
      .single()
    if (upErr) { setError(upErr.message); return }
    setCompetitors((prev) => prev.map((x) => (x.id === c.id ? data : x)))
  }

  // ─── Logo file selection ─────────────────────────────────
  function handleLogoChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={{ textAlign: 'center', padding: 40, color: T.text2 }}>جاري التحميل…</div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.h2}>🎨 Brand Settings</h2>
          <p style={styles.muted}>
            القيم اللي هنا بيقرأها الـ Social Agent قبل ما يولّد أي بوست. غيّر هنا، الـ recipe بيستخدم القيم الجديدة على طول.
          </p>
        </div>
        {savedAt && (
          <div style={{ ...styles.savedPill }}>
            ✅ اتحفظ {new Date(savedAt).toLocaleTimeString('ar-EG', { hour12: false })}
          </div>
        )}
      </div>

      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <div style={styles.grid}>
        {/* ─── Brand Identity ───────────────────────────── */}
        <form onSubmit={saveBrand} style={styles.card}>
          <h3 style={styles.h3}>هوية البراند</h3>

          <Field label="اسم البراند">
            <input value={brand.brand_name || ''} onChange={(e) => setBrand({ ...brand, brand_name: e.target.value })} style={styles.input} dir="ltr" />
          </Field>

          <Field label="Tagline">
            <input value={brand.tagline || ''} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} style={styles.input} placeholder="جملة قصيرة عن البراند" />
          </Field>

          <Field label="الوصف">
            <textarea value={brand.description || ''} onChange={(e) => setBrand({ ...brand, description: e.target.value })} style={{ ...styles.input, minHeight: 80 }} placeholder="جملتين تلاتة بيوصفوا البراند ومنتجاته" />
          </Field>

          <Field label="الخدمات (مفصولة بفاصلة)">
            <input value={services} onChange={(e) => setServices(e.target.value)} style={styles.input} placeholder="Web Development, Mobile Apps, AI Solutions" />
          </Field>

          <Field label="الجمهور المستهدف">
            <textarea value={brand.target_audience || ''} onChange={(e) => setBrand({ ...brand, target_audience: e.target.value })} style={{ ...styles.input, minHeight: 60 }} placeholder="مين العميل المثالي بتاعك؟" />
          </Field>

          <Field label="النبرة (Tone)">
            <input value={brand.tone || ''} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} style={styles.input} placeholder="مثلاً: احترافية، حادة، عملية، بدون إيموجي" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Website">
              <input value={brand.website || ''} onChange={(e) => setBrand({ ...brand, website: e.target.value })} style={styles.input} dir="ltr" />
            </Field>
            <Field label="Contact Email">
              <input value={brand.contact_email || ''} onChange={(e) => setBrand({ ...brand, contact_email: e.target.value })} style={styles.input} dir="ltr" />
            </Field>
          </div>

          <Field label="اللون الأساسي">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={brand.brand_colors?.primary || '#c8a35c'}
                onChange={(e) => setBrand({ ...brand, brand_colors: { ...(brand.brand_colors || {}), primary: e.target.value } })}
                style={{ width: 50, height: 38, padding: 0, border: `1px solid ${T.border}`, borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
              />
              <input
                value={brand.brand_colors?.primary || '#c8a35c'}
                onChange={(e) => setBrand({ ...brand, brand_colors: { ...(brand.brand_colors || {}), primary: e.target.value } })}
                style={{ ...styles.input, flex: 1 }}
                dir="ltr"
              />
            </div>
          </Field>

          <Field label="اللوجو (PNG/SVG/JPG)">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={styles.logoPreview}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  : <span style={{ fontSize: 11, color: T.text3 }}>مفيش لوجو</span>}
              </div>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoChange} style={{ ...styles.input, padding: 8 }} />
            </div>
          </Field>

          <button type="submit" disabled={saving} style={{ ...styles.primaryBtn, marginTop: 16, width: '100%' }}>
            {saving ? 'جاري الحفظ…' : '💾 حفظ التغييرات'}
          </button>
        </form>

        {/* ─── Competitors ──────────────────────────────── */}
        <div style={styles.card}>
          <h3 style={styles.h3}>المنافسين ({competitors.length})</h3>

          <form onSubmit={addCompetitor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 16 }}>
            <input value={newComp.name} onChange={(e) => setNewComp({ ...newComp, name: e.target.value })} placeholder="اسم المنافس *" style={styles.input} required />
            <input value={newComp.url} onChange={(e) => setNewComp({ ...newComp, url: e.target.value })} placeholder="https://…" style={styles.input} dir="ltr" />
            <input value={newComp.fb_page} onChange={(e) => setNewComp({ ...newComp, fb_page: e.target.value })} placeholder="fb page slug" style={styles.input} dir="ltr" />
            <button type="submit" style={styles.primaryBtn}>+ ضيف</button>
          </form>

          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {competitors.length === 0 ? (
              <div style={{ color: T.text3, textAlign: 'center', padding: 20 }}>مفيش منافسين متضافين لسه</div>
            ) : competitors.map((c) => (
              <div key={c.id} style={{
                ...styles.competitorRow,
                opacity: c.is_active ? 1 : 0.4,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.text3, direction: 'ltr', textAlign: 'left' }}>
                    {c.url && <span>{c.url}</span>}
                    {c.fb_page && <span> · fb/{c.fb_page}</span>}
                  </div>
                  {c.notes && <div style={{ fontSize: 11, color: T.text2, marginTop: 4 }}>{c.notes}</div>}
                </div>
                <button onClick={() => toggleCompetitor(c)} style={styles.smallBtn} title="فعّل/عطّل">
                  {c.is_active ? '👁️' : '🚫'}
                </button>
                <button onClick={() => removeCompetitor(c.id)} style={{ ...styles.smallBtn, color: T.error }} title="حذف">
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <p style={{ ...styles.muted, fontSize: 11, marginTop: 12, color: T.text3 }}>
            ⓘ تشغيل recipe <code style={styles.code}>market-analysis</code> هيستخدم القائمة دي للبحث، يكتب تقرير، ويولّد استراتيجية الأسبوع.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  )
}

const styles = {
  wrap: { padding: 24, maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  h2: { margin: '0 0 4px', color: T.text, fontSize: 24, fontWeight: 700 },
  h3: { margin: '0 0 16px', color: T.text, fontSize: 16, fontWeight: 700 },
  muted: { color: T.text2, margin: 0, fontSize: 13, lineHeight: 1.5 },
  code: { background: T.bg3, padding: '2px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: T.gold },
  savedPill: { background: 'rgba(34,197,94,0.15)', color: T.success, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  errorBox: { padding: 12, background: 'rgba(239,68,68,0.1)', border: `1px solid ${T.error}`, borderRadius: 8, color: T.error, marginBottom: 16, fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 },
  card: { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 },
  label: { display: 'block', color: T.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: T.bg3, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  primaryBtn: { background: T.gold, color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  smallBtn: { background: 'transparent', border: 'none', color: T.text2, cursor: 'pointer', fontSize: 14, padding: 6, borderRadius: 4 },
  logoPreview: { width: 70, height: 70, background: T.bg3, border: `1px dashed ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  competitorRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 13 },
}
