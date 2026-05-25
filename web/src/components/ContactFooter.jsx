import React, { useState } from 'react'
import { submit } from '../services/submissions'

const SERVICES = [
  'Brand Strategy', 'Web Development', 'Mobile Apps',
  'Enterprise Systems', 'AI Integrations', 'Cloud Architecture',
]

export default function ContactFooter() {
  const [name, setName]         = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail]       = useState('')
  const [brief, setBrief]       = useState('')
  const [selected, setSelected] = useState([])
  const [errors, setErrors]     = useState({})
  const [busy, setBusy]         = useState(false)
  const [success, setSuccess]   = useState(false)
  const [reference, setReference] = useState(null)

  const toggleService = (svc) => {
    setSelected(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc])
  }

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Name is required'
    const cleanWa = whatsapp.replace(/[\s-]/g, '')
    if (!cleanWa) e.whatsapp = 'WhatsApp number is required'
    else if (!/^\+?\d{8,15}$/.test(cleanWa)) e.whatsapp = 'Invalid number (8–15 digits, optional + prefix)'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!brief.trim() || brief.trim().length < 10) e.brief = 'Tell us a bit more about your project'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    try {
      const result = await submit('project_intake', {
        name: name.trim(),
        whatsapp: whatsapp.replace(/[\s-]/g, ''),
        email: email.trim() || null,
        brief: brief.trim(),
        metadata: { services: selected },
      })
      setReference(result.reference)
      setSuccess(true)
    } catch (err) {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function copyRef() {
    if (!reference) return
    try { await navigator.clipboard.writeText(reference) } catch {}
  }

  function reset() {
    setName(''); setWhatsapp(''); setEmail(''); setBrief('')
    setSelected([]); setErrors({}); setSuccess(false); setReference(null)
  }

  return (
    <footer className="footer-section" id="contact">
      <div className="container footer-container">
        <div className="footer-flex-container">

          {/* Left: heading + description */}
          <div className="footer-left">
            <h2 className="footer-title">
              {success ? <>Got it. <span style={{ opacity: 0.5 }}>We'll be in touch.</span></>
                       : <>Ready to <span style={{ opacity: 0.5 }}>get started?</span></>}
            </h2>
            <p className="footer-desc">
              {success
                ? "Your request reached us. We'll WhatsApp you within 24 hours to talk specifics."
                : 'Fill the form or write us directly. We reply on WhatsApp within 24 hours.'}
            </p>

            {success && reference && (
              <div style={refBox}>
                <div style={refLabel}>Your reference</div>
                <button type="button" onClick={copyRef} style={refValue} title="Click to copy">
                  {reference}
                </button>
                <div style={refHint}>Save it — quote this when you ask about your project.</div>
              </div>
            )}
          </div>

          {/* Right: form or success */}
          <div className="footer-right">
            {success ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                <button onClick={reset} className="magnetic-btn" style={{ alignSelf: 'flex-start' }}>
                  Send another request
                </button>
              </div>
            ) : (
              <form className="footer-form" onSubmit={handleSubmit} noValidate>
                <div>
                  <input
                    placeholder="Your Name *"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={busy}
                    className="footer-input"
                    style={errors.name ? errInput : null}
                  />
                  {errors.name && <p style={errMsg}>{errors.name}</p>}
                </div>

                <div>
                  <input
                    placeholder="WhatsApp number * (e.g. +201234567890)"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    disabled={busy}
                    type="tel"
                    dir="ltr"
                    className="footer-input"
                    style={errors.whatsapp ? errInput : null}
                  />
                  {errors.whatsapp && <p style={errMsg}>{errors.whatsapp}</p>}
                </div>

                <div>
                  <input
                    placeholder="Email (Optional)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={busy}
                    type="email"
                    dir="ltr"
                    className="footer-input"
                    style={errors.email ? errInput : null}
                  />
                  {errors.email && <p style={errMsg}>{errors.email}</p>}
                </div>

                <div>
                  <textarea
                    placeholder="Tell us about your project *"
                    value={brief}
                    onChange={e => setBrief(e.target.value)}
                    disabled={busy}
                    className="footer-input footer-textarea"
                    style={errors.brief ? errInput : null}
                  />
                  {errors.brief && <p style={errMsg}>{errors.brief}</p>}
                </div>

                <div>
                  <h4 className="footer-form-title">Services you are interested in</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                    {SERVICES.map((svc, idx) => {
                      const active = selected.includes(svc)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleService(svc)}
                          disabled={busy}
                          style={{
                            padding: '0.8rem 1.5rem',
                            borderRadius: 30,
                            border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                            background: active ? 'var(--primary)' : 'transparent',
                            color: active ? 'white' : 'var(--text-color)',
                            cursor: busy ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            font: 'inherit',
                            fontSize: '0.95rem',
                            opacity: busy ? 0.6 : 1,
                          }}
                        >
                          {svc}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {errors.submit && (
                  <p style={{ ...errMsg, padding: '0.8rem 1rem', background: 'rgba(220,38,38,0.08)',
                              border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8 }}>
                    {errors.submit}
                  </p>
                )}

                <button
                  type="submit"
                  className="magnetic-btn"
                  disabled={busy}
                  style={{ marginTop: '2rem', alignSelf: 'flex-start', opacity: busy ? 0.7 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
                >
                  {busy ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div className="footer-bottom-links">
          <div className="links-wrapper">
            <a href="https://www.instagram.com/vixcell" target="_blank" rel="noreferrer">INSTAGRAM</a>
            <a href="https://www.linkedin.com/company/vixcell" target="_blank" rel="noreferrer">LINKEDIN</a>
            <a href="https://twitter.com/vixcell" target="_blank" rel="noreferrer">TWITTER</a>
          </div>
          <a href="mailto:hello@vixcell.com">HELLO@VIXCELL.COM</a>
        </div>
      </div>

      <div className="footer-large-text">VIXCELL</div>
    </footer>
  )
}

// ─── Inline style helpers (errors + reference box) ─────────────────
const errInput = { borderBottomColor: '#dc2626' }
const errMsg   = { color: '#dc2626', fontSize: '0.85rem', marginTop: '0.4rem' }

const refBox = {
  marginTop: '1.5rem',
  padding: '1.2rem 1.4rem',
  background: 'linear-gradient(135deg, rgba(0,85,255,0.06), rgba(0,85,255,0.02))',
  border: '1px solid rgba(0,85,255,0.20)',
  borderRadius: 14,
  maxWidth: 340,
}
const refLabel = {
  fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
}
const refValue = {
  display: 'block', width: '100%', background: 'transparent', border: 'none',
  fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-color)',
  fontFamily: 'ui-monospace, "SF Mono", Monaco, Consolas, monospace',
  letterSpacing: '0.08em', direction: 'ltr', cursor: 'pointer',
  textAlign: 'left', padding: '0.2rem 0',
}
const refHint = {
  fontSize: '0.78rem', color: 'rgba(17,17,17,0.55)',
  marginTop: '0.5rem', lineHeight: 1.5,
}
