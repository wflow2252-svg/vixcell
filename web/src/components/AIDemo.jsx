import React, { useState } from 'react'
import axios from 'axios'

export default function AIDemo() {
  const [loading, setLoading] = useState(false)
  const [demoUrl, setDemoUrl] = useState('')
  const [form, setForm] = useState({
    businessName: '', businessType: 'restaurant', description: '', primaryColor: '#6C63FF', language: 'ar'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('https://api.vixcell.com/api/ai/generate-demo', form)
      setDemoUrl('https://api.vixcell.com' + res.data.data.htmlUrl)
    } catch (err) {
      alert('Error generating demo')
    }
    setLoading(false)
  }

  return (
    <section id="ai" className="ai-section">
      <div className="container">
        <h2 className="ai-title">
          See Your Vision <span style={{color: 'var(--primary)'}}>Instantly.</span>
        </h2>
        
        <div className="ai-flex-container">
          <form onSubmit={handleSubmit} className="ai-form">
            <div className="ai-form-group">
              <label>Business Name</label>
              <input required value={form.businessName} onChange={e=>setForm({...form, businessName: e.target.value})} className="ai-input" />
            </div>
            
            <div className="ai-form-group">
              <label>Industry</label>
              <select value={form.businessType} onChange={e=>setForm({...form, businessType: e.target.value})} className="ai-input">
                <option value="corporate">Corporate / Agency</option>
                <option value="saas">SaaS / Tech</option>
                <option value="ecommerce">E-commerce</option>
                <option value="realestate">Real Estate</option>
                <option value="medical">Medical / Clinic</option>
              </select>
            </div>

            <div className="ai-form-group">
              <label>Project Description</label>
              <textarea required value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="ai-input ai-textarea" />
            </div>

            <button type="submit" className="magnetic-btn" disabled={loading} style={{marginTop: '1rem', width: '100%'}}>
              {loading ? 'Generating Model...' : 'Generate Demo'}
            </button>
          </form>

          <div className="ai-preview-panel">
            {demoUrl ? (
              <iframe src={demoUrl} width="100%" height="100%" style={{border: 'none', backgroundColor: 'white'}} title="AI Generated Demo"></iframe>
            ) : (
              <div style={{textAlign: 'center', opacity: 0.4}}>
                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>✨</div>
                <p style={{fontFamily: 'Outfit', fontSize: '1.2rem'}}>Your AI-generated preview will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
