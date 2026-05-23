import React, { useState, useRef, useEffect } from 'react'
import DotPixelIcon from './DotPixelIcon'
import { sendMessage, resetChat } from '../services/vixAi'

export default function ClientDashboard({ onViewChange, user, onLogout }) {
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('technical')
  const [ticketMessage, setTicketMessage] = useState('')
  const [tickets, setTickets] = useState([
    { id: 'T-849', subject: 'Integrate Stripe Sandbox API', category: 'Integration', status: 'In Progress', date: 'May 21, 2026' }
  ])
  const [successMsg, setSuccessMsg] = useState('')

  // AI Chat State
  const [aiMessages, setAiMessages] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedHTML, setGeneratedHTML] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTab, setPreviewTab] = useState('preview')
  const [logoFile, setLogoFile] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const chatStarted = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  useEffect(() => {
    if (aiPanelOpen && !chatStarted.current) {
      chatStarted.current = true
      setAiMessages([{ role: 'ai', text: 'مرحباً! 👋 أنا Vix — مساعدك البرمجي الذكي.\n\nعايز تبني إيه النهاردة؟ قولي اسم المشروع ونوعه وهبدأ فوراً 💪' }])
    }
  }, [aiPanelOpen])

  async function handleAiSend(e) {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    const userMsg = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setAiLoading(true)

    const result = await sendMessage(userMsg, logoUrl)

    if (result.html) {
      const finalHTML = logoUrl
        ? result.html.replace(/CLIENT_LOGO/g, logoUrl)
        : result.html
      setGeneratedHTML(finalHTML)
      setShowPreview(true)
    }

    setAiMessages(prev => [...prev, { role: 'ai', text: result.text }])
    setAiLoading(false)
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setLogoUrl(dataUrl)
      setAiMessages(prev => [...prev, { role: 'user', text: '📎 تم رفع اللوجو' }])
      setAiLoading(true)
      sendMessage('[LOGO_UPLOADED]', dataUrl).then(result => {
        if (result.html) setGeneratedHTML(result.html)
        setShowPreview(true)
        setAiMessages(prev => [...prev, { role: 'ai', text: result.text }])
        setAiLoading(false)
      })
    }
    reader.readAsDataURL(file)
  }

  async function handleAiReset() {
    await resetChat()
    setAiMessages([])
    setGeneratedHTML(null)
    setShowPreview(false)
    setLogoFile(null)
    setLogoUrl(null)
    chatStarted.current = false
    setAiPanelOpen(false)
  }

  function handleDownload() {
    if (!generatedHTML) return
    const blob = new Blob([generatedHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-website.html'
    a.click()
  }

  const handleTicketSubmit = (e) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketMessage.trim()) return
    const newTicket = {
      id: `T-${Math.floor(Math.random() * 900) + 100}`,
      subject: ticketSubject,
      category: ticketCategory,
      status: 'Open',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    setTickets([newTicket, ...tickets])
    setTicketSubject('')
    setTicketMessage('')
    setSuccessMsg('Support ticket submitted successfully!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const kpis = [
    { title: 'Active Projects', value: '2', change: 'On schedule', icon: 'enterprise' },
    { title: 'Automation Hours Saved', value: '142.5 hrs', change: '+12.4 hrs this week', icon: 'ai' },
    { title: 'Open Tickets', value: '1', change: 'Last reply 2h ago', icon: 'chat' },
    { title: 'Server Uptime', value: '99.98%', change: 'All nodes healthy', icon: 'cloud' }
  ]

  const projects = [
    { name: 'Vixcell Core Platform', description: 'Main client hub and automated web building engine.', status: 'Development', progress: 74, color: 'var(--primary)' },
    { name: 'Mobile Client Application', description: 'Companion application for portal access and updates.', status: 'Design Review', progress: 40, color: '#A0AEC0' }
  ]

  const devLogs = [
    { date: 'May 22, 10:14 AM', message: 'Database schema migration and Index optimization completed.', user: 'Omar S.' },
    { date: 'May 21, 04:30 PM', message: 'Stripe webhook listener test successfully verified.', user: 'Hazem A.' },
    { date: 'May 20, 11:15 AM', message: 'UI/UX high-fidelity mockups reviewed & signed off.', user: 'Sarah L.' }
  ]

  const invoices = [
    { id: 'INV-2026-004', description: 'Sprint 3 Milestone Payment', amount: '$4,500.00', date: 'May 15, 2026', status: 'Paid' },
    { id: 'INV-2026-003', description: 'Sprint 2 Milestone Payment', amount: '$4,500.00', date: 'May 01, 2026', status: 'Paid' },
    { id: 'INV-2026-005', description: 'Sprint 4 Retainer Payment', amount: '$2,500.00', date: 'Jun 01, 2026', status: 'Pending' }
  ]

  return (
    <div className="dashboard-container">
      {/* Top Banner / Breadcrumb */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <button className="back-studio-btn" onClick={() => onViewChange('landing')}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>
              <DotPixelIcon name="arrowRightPixel" size={14} color="var(--primary)" />
            </span>
            <span>Back to Studio</span>
          </button>
          <h1 className="dashboard-title">Client Portal</h1>
        </div>
        <div className="dashboard-header-right">
          <div className="client-badge">
            <span className="client-avatar">{user?.name?.[0] || 'V'}</span>
            <div className="client-meta">
              <span className="client-name">{user?.name || 'Vixcell Admin'}</span>
              <span className="client-tier">Enterprise Client</span>
            </div>
          </div>
          <button className="dashboard-logout-btn" onClick={onLogout}>تسجيل خروج</button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid kpis">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="dashboard-card kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">{kpi.title}</span>
              <DotPixelIcon name={kpi.icon} size={20} color="var(--primary)" />
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-change">{kpi.change}</div>
          </div>
        ))}
      </div>

      {/* AI Builder Quick Access */}
      <div className="dashboard-ai-bar">
        <div className="ai-bar-info">
          <span className="ai-bar-icon">🤖</span>
          <span>Vix AI — Website Builder الذكي بتاعك</span>
        </div>
        <button className="ai-bar-btn" onClick={() => setAiPanelOpen(!aiPanelOpen)}>
          {aiPanelOpen ? '❌ إغلاق' : '🚀 افتح Vix AI'}
        </button>
      </div>

      {/* AI Chat Panel */}
      {aiPanelOpen && (
        <div className="dashboard-ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <img src="/logo.png" alt="Vix" style={{ height: '24px', marginLeft: '8px' }} />
              Vix <span className="ai-badge-small">AI</span>
            </div>
            <div className="ai-panel-actions">
              <button className="ai-panel-action-btn" onClick={handleAiReset} title="Reset">↺</button>
            </div>
          </div>

          <div className="ai-panel-body" style={{ display: 'flex', gap: 0, height: '400px' }}>
            {/* Chat Column */}
            <div className="ai-panel-chat" style={{ flex: showPreview ? '0 0 40%' : '1', display: 'flex', flexDirection: 'column', borderRight: showPreview ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="ai-panel-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role === 'ai' ? 'ai' : 'user'}`}>
                    {msg.role === 'ai' && (
                      <div className="chat-avatar"><img src="/logo.png" alt="Vix" /></div>
                    )}
                    <div className={`chat-bubble ${msg.role === 'ai' ? 'ai-bubble' : 'user-bubble'}`}>
                      {msg.text.split('\n').map((line, j) => (
                        <p key={j} style={{ margin: '0.2rem 0' }}>{renderText(line)}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="chat-message ai">
                    <div className="chat-avatar"><img src="/logo.png" alt="Vix" /></div>
                    <div className="chat-bubble ai-bubble typing-bubble">
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="ai-panel-input" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                <button className="ai-upload-btn-sm" onClick={() => fileInputRef.current?.click()} title="رفع لوجو">
                  {logoFile ? '🖼️' : '📎'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                <form onSubmit={handleAiSend} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="ai-chat-input-sm"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    placeholder="قولي عايز إيه..."
                    disabled={aiLoading}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="ai-send-btn-sm" disabled={aiLoading || !aiInput.trim()}>↑</button>
                </form>
              </div>
            </div>

            {/* Preview Column */}
            {showPreview && generatedHTML && (
              <div className="ai-panel-preview" style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column' }}>
                <div className="preview-tabs" style={{ display: 'flex', padding: '0.5rem 1rem', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <button className={`preview-tab-sm ${previewTab === 'preview' ? 'active' : ''}`} onClick={() => setPreviewTab('preview')}>Preview</button>
                  <button className={`preview-tab-sm ${previewTab === 'code' ? 'active' : ''}`} onClick={() => setPreviewTab('code')}>Code</button>
                  <button className="preview-download-btn" onClick={handleDownload}>⬇ تحميل</button>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {previewTab === 'preview' ? (
                    <iframe srcDoc={generatedHTML} title="Preview" sandbox="allow-scripts allow-same-origin" style={{ width: '100%', height: '100%', border: 'none' }} />
                  ) : (
                    <pre style={{ padding: '1rem', fontSize: '0.8rem', overflow: 'auto', height: '100%', background: '#0d0d0d', color: '#e2e8f0' }}><code>{generatedHTML}</code></pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Panel Content: Grid of 2 Columns */}
      <div className="dashboard-row">
        {/* Left Column: Projects and Log */}
        <div className="dashboard-column main-col">
          {/* Projects Card */}
          <div className="dashboard-card project-panel-card">
            <h2 className="dashboard-card-title">Project Progress</h2>
            <div className="projects-list">
              {projects.map((proj, idx) => (
                <div key={idx} className="project-item">
                  <div className="project-item-header">
                    <div>
                      <h3 className="project-name">{proj.name}</h3>
                      <p className="project-desc">{proj.description}</p>
                    </div>
                    <span className={`status-badge ${proj.status.toLowerCase().replace(' ', '-')}`}>{proj.status}</span>
                  </div>
                  <div className="project-progress-wrapper">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${proj.progress}%`, backgroundColor: proj.color }} />
                    </div>
                    <span className="progress-percentage">{proj.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs Card */}
          <div className="dashboard-card logs-panel-card">
            <h2 className="dashboard-card-title">Development Activity Logs</h2>
            <div className="logs-list">
              {devLogs.map((log, idx) => (
                <div key={idx} className="log-item">
                  <div className="log-dot" />
                  <div className="log-content">
                    <div className="log-header">
                      <span className="log-date">{log.date}</span>
                      <span className="log-user">{log.user}</span>
                    </div>
                    <p className="log-message">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Billing and Tickets */}
        <div className="dashboard-column side-col">
          {/* Billing & Invoice Summary */}
          <div className="dashboard-card invoices-card">
            <h2 className="dashboard-card-title">Invoices</h2>
            <div className="invoices-list">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="inv-id">{inv.id}</div>
                        <div className="inv-date">{inv.date}</div>
                      </td>
                      <td className="inv-amount">{inv.amount}</td>
                      <td><span className={`invoice-status-tag ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Support Ticket Submission */}
          <div className="dashboard-card support-card">
            <h2 className="dashboard-card-title">Create Support Ticket</h2>
            {successMsg && <div className="success-banner">{successMsg}</div>}
            <form onSubmit={handleTicketSubmit} className="dashboard-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="subject">Subject</label>
                  <input id="subject" type="text" required value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="e.g. Stripe webhook failing..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="category">Category</label>
                  <select id="category" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Invoices</option>
                    <option value="integration">AI & API Integration</option>
                    <option value="general">General Inquiries</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" required rows={4} value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="Describe the issue or request details..." />
                </div>
              </div>
              <button type="submit" className="submit-ticket-btn">
                <span>Submit Ticket</span>
                <DotPixelIcon name="send" size={14} color="white" />
              </button>
            </form>
            {tickets.length > 0 && (
              <div className="submitted-tickets-list">
                <h4 className="sub-title">Your Recent Tickets</h4>
                {tickets.map((t, idx) => (
                  <div key={idx} className="submitted-ticket-item">
                    <div className="ticket-meta">
                      <span className="ticket-id">{t.id}</span>
                      <span className="ticket-date">{t.date}</span>
                    </div>
                    <div className="ticket-subject">{t.subject}</div>
                    <div className="ticket-status-row">
                      <span className="ticket-cat">{t.category}</span>
                      <span className={`ticket-status ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
