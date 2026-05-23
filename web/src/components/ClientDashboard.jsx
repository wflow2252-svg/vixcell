import React, { useState, useRef, useEffect } from 'react'
import { getAIResponse, resetSession } from '../services/vixAiClient'

export default function ClientDashboard({ onViewChange }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [generatedHTML, setGeneratedHTML] = useState(null)
  const [generatedFiles, setGeneratedFiles] = useState(null)
  const [activeCodeFile, setActiveCodeFile] = useState('html')
  const [analyzedFile, setAnalyzedFile] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const codeFileInputRef = useRef(null)
  const chatStarted = useRef(false)
  const [sessionId] = useState(() => 'vix_' + Date.now())

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!chatStarted.current) {
      chatStarted.current = true
      const g = getAIResponse(sessionId, 'مرحبا')
      setMessages([{ role: 'ai', text: g.text }])
    }
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const result = await new Promise(r => setTimeout(() => r(getAIResponse(sessionId, userMsg)), 300))
    if (result.html) setGeneratedHTML(result.html)
    if (result.files) setGeneratedFiles(result.files)
    setMessages(prev => [...prev, { role: 'ai', text: result.text }])
    setLoading(false)
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setLogoUrl(dataUrl)
      setMessages(prev => [...prev, { role: 'user', text: '📎 تم رفع الصورة' }])
      setLoading(true)
      const result = await new Promise(r => setTimeout(() => r(getAIResponse(sessionId, '[LOGO_UPLOADED]')), 300))
      if (result.html) setGeneratedHTML(result.html)
      if (result.files) setGeneratedFiles(result.files)
      setMessages(prev => [...prev, { role: 'ai', text: result.text }])
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  function handleCodeFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setAnalyzedFile(file)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const code = ev.target.result
      setMessages(prev => [...prev, { role: 'user', text: `📄 رفعت ملف: ${file.name}\n\`\`\`\n${code.substring(0, 300)}${code.length > 300 ? '\n...' : ''}\n\`\`\`` }])
      setLoading(true)
      const result = await new Promise(r => setTimeout(() => r(getAIResponse(sessionId, `حلل هذا الكود:\n\`\`\`\n${code}\n\`\`\``)), 500))
      setMessages(prev => [...prev, { role: 'ai', text: result.text }])
      setLoading(false)
    }
    reader.readAsText(file)
  }

  function handleDownload(type) {
    if (type === 'combined' && generatedHTML) {
      const blob = new Blob([generatedHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'my-website.html'
      a.click()
      return
    }
    if (!generatedFiles || !generatedFiles[type]) return
    const filenames = { html: 'index.html', css: 'style.css', js: 'script.js' }
    const mimes = { html: 'text/html', css: 'text/css', js: 'text/javascript' }
    const content = generatedFiles[type]
    const blob = new Blob([content], { type: mimes[type] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filenames[type]
    a.click()
  }

  function handleReset() {
    resetSession(sessionId)
    setMessages([])
    setLogoFile(null)
    setLogoUrl(null)
    setGeneratedHTML(null)
    setGeneratedFiles(null)
    setActiveCodeFile('html')
    setAnalyzedFile(null)
    chatStarted.current = false
    setActiveTab('chat')
  }

  return (
    <div className="ai-dashboard">
      {/* Top Bar */}
      <div className="ai-dashboard-topbar">
        <div className="ai-dashboard-topbar-left">
          <img src="/logo.png" alt="Vixcell" className="ai-dashboard-logo" />
          <div>
            <div className="ai-dashboard-title">Vix <span className="ai-badge-dash">AI</span></div>
            <div className="ai-dashboard-subtitle">مساعدك البرمجي الذكي</div>
          </div>
        </div>
        <div className="ai-dashboard-topbar-right">
          <button className="ai-dashboard-btn" onClick={handleReset}>↺ جديد</button>
          <button className="ai-dashboard-btn secondary" onClick={() => onViewChange('landing')}>الرئيسية</button>
        </div>
      </div>

      {/* Main Area */}
      <div className="ai-dashboard-main">
        {/* Tabs */}
        <div className="ai-dashboard-tabs">
          <button className={`ai-dash-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>💬 المحادثة</button>
          <button className={`ai-dash-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')} disabled={!generatedHTML}>👁️ المعاينة</button>
          <button className={`ai-dash-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')} disabled={!generatedHTML}>📝 الكود</button>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="ai-dash-chat">
            <div className="ai-dash-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role === 'ai' ? 'ai' : 'user'}`}>
                  {msg.role === 'ai' && (
                    <div className="chat-avatar"><img src="/logo.png" alt="Vix" /></div>
                  )}
                  <div className={`chat-bubble ${msg.role === 'ai' ? 'ai-bubble' : 'user-bubble'}`}>
                    {msg.text.split('\n').map((line, j) => (
                      <p key={j} style={{ margin: '0.15rem 0' }}>{renderText(line)}</p>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-message ai">
                  <div className="chat-avatar"><img src="/logo.png" alt="Vix" /></div>
                  <div className="chat-bubble ai-bubble typing-bubble">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-dash-input-bar">
              <button className="ai-upload-btn-sm" onClick={() => fileInputRef.current?.click()} title="رفع صورة">
                {logoFile ? '🖼️' : '📎'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />

              <button className="ai-upload-btn-sm" onClick={() => codeFileInputRef.current?.click()} title="رفع كود للتحليل">
                📄
              </button>
              <input ref={codeFileInputRef} type="file" accept=".html,.js,.ts,.css,.py,.dart,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.jsx,.tsx,.txt" style={{ display: 'none' }} onChange={handleCodeFileUpload} />

              <form onSubmit={handleSend} className="ai-dash-form">
                <input
                  className="ai-dash-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="قولي عايز إيه... (ابني موقع، حلل كود، عدل على موقع)"
                  disabled={loading}
                />
                <button type="submit" className="ai-send-btn-dash" disabled={loading || !input.trim()}>↑</button>
              </form>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && generatedHTML && (
          <div className="ai-dash-preview">
            <div className="ai-preview-header-bar">
              <div className="ai-preview-header-left">
                <span className="ai-preview-url">index.html</span>
              </div>
              <button className="ai-download-btn" onClick={() => handleDownload('combined')}>⬇ تحميل</button>
            </div>
            <iframe
              srcDoc={generatedHTML}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
              className="ai-preview-iframe"
            />
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && generatedHTML && (
          <div className="ai-dash-code">
            <div className="ai-preview-header-bar">
              <div className="ai-preview-header-left">
                <div className="ai-code-file-tabs">
                  <button
                    className={`ai-code-file-tab ${activeCodeFile === 'html' ? 'active' : ''}`}
                    onClick={() => setActiveCodeFile('html')}
                  >index.html</button>
                  <button
                    className={`ai-code-file-tab ${activeCodeFile === 'css' ? 'active' : ''}`}
                    onClick={() => setActiveCodeFile('css')}
                  >style.css</button>
                  <button
                    className={`ai-code-file-tab ${activeCodeFile === 'js' ? 'active' : ''}`}
                    onClick={() => setActiveCodeFile('js')}
                  >script.js</button>
                </div>
              </div>
              <div className="ai-preview-header-right">
                <button className="ai-download-btn" onClick={() => handleDownload(activeCodeFile)}>⬇ تحميل</button>
              </div>
            </div>
            <pre className="ai-code-pre"><code>{(generatedFiles && generatedFiles[activeCodeFile]) || generatedHTML}</code></pre>
          </div>
        )}
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
