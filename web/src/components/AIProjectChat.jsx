import React, { useState, useEffect, useRef } from 'react'
import { sendMessage, startChat, extractHTML, resetChat } from '../services/gemini'

function renderText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function Message({ msg }) {
  const isAI = msg.role === 'ai'
  return (
    <div className={`chat-message ${isAI ? 'ai' : 'user'}`}>
      {isAI && (
        <div className="chat-avatar">
          <img src="/logo.png" alt="Vix" />
        </div>
      )}
      <div className={`chat-bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}>
        {msg.text.split('\n').map((line, i) => (
          <p key={i} style={{ margin: '0.2rem 0' }}>
            {renderText(line)}
          </p>
        ))}
      </div>
    </div>
  )
}

// Simple code highlighter
function CodeView({ html }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Very basic syntax highlight with colors
  const highlighted = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Tags
    .replace(/(&lt;\/?)([\w-]+)/g, '<span style="color:#f97316">$1$2</span>')
    // Attributes
    .replace(/(\s)([\w-]+=)/g, '$1<span style="color:#38bdf8">$2</span>')
    // Strings
    .replace(/"([^"]*)"/g, '"<span style="color:#4ade80">$1</span>"')
    // CSS values in style blocks (simplified)
    .replace(/(#[0-9a-fA-F]{3,6})/g, '<span style="color:#c084fc">$1</span>')

  return (
    <div className="code-view-wrapper">
      <div className="code-view-topbar">
        <div className="code-file-tabs">
          <span className="code-file-tab active">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            index.html
          </span>
        </div>
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <div className="code-view-body">
        <div className="code-line-numbers">
          {html.split('\n').map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre
          className="code-content"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  )
}

export default function AIProjectChat({ user, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [generatedHTML, setGeneratedHTML] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTab, setPreviewTab] = useState('preview') // 'preview' | 'code'
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const chatStarted = useRef(false)

  useEffect(() => {
    if (!chatStarted.current) {
      chatStarted.current = true
      initChat()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initChat() {
    setLoading(true)
    await startChat()
    const greeting = await sendMessage(
      `مرحبا، اسمي ${user?.name || 'العميل'}. أنا مهتم ببناء موقع معك.`
    )
    addAIMessage(greeting)
    setLoading(false)
  }

  function addAIMessage(text) {
    const html = extractHTML(text)
    if (html) {
      // Replace CLIENT_LOGO with actual logo URL (base64 or Blob URL)
      const finalHTML = logoUrl
        ? html.replace(/CLIENT_LOGO/g, logoUrl)
        : html
      setGeneratedHTML(finalHTML)

      // Extract only the message after ===HTML_END===
      const afterHTML = text.split('===HTML_END===')[1]?.trim() || '✅ موقعك جاهز! 🎉'
      setMessages(prev => [...prev, { role: 'ai', text: afterHTML }])
      setShowPreview(true)
      setPreviewTab('preview')
    } else {
      setMessages(prev => [...prev, { role: 'ai', text: text }])
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const response = await sendMessage(userMsg, logoUrl)
    addAIMessage(response)
    setLoading(false)
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const localDataUrl = ev.target.result
      setLogoUrl(localDataUrl)

      setMessages(prev => [...prev, { role: 'user', text: '📎 جاري رفع اللوجو...' }])

      try {
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          headers: { 'Content-Type': file.type, 'x-filename': file.name },
          body: file,
        })
        let uploadedUrl = localDataUrl
        if (res.ok) {
          const data = await res.json()
          uploadedUrl = data.url
          setLogoUrl(uploadedUrl)
        }
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'user', text: '📎 تم رفع اللوجو ✅' }
          return updated
        })
        setLoading(true)
        sendMessage('لقد رفعت اللوجو [LOGO_UPLOADED]', uploadedUrl).then(r => {
          addAIMessage(r)
          setLoading(false)
        })
      } catch {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'user', text: '📎 تم رفع اللوجو ✅' }
          return updated
        })
        setLoading(true)
        sendMessage('لقد رفعت اللوجو [LOGO_UPLOADED]', localDataUrl).then(r => {
          addAIMessage(r)
          setLoading(false)
        })
      }
    }
    reader.readAsDataURL(file)
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

  function handleReset() {
    resetChat()
    setMessages([])
    setLogoFile(null)
    setLogoUrl(null)
    setGeneratedHTML(null)
    setShowPreview(false)
    chatStarted.current = false
    setTimeout(() => { chatStarted.current = true; initChat() }, 100)
  }

  return (
    <div className="ai-chat-page">
      {/* Top Bar */}
      <div className="ai-chat-topbar">
        <div className="ai-chat-topbar-left">
          <img src="/logo.png" alt="Vixcell" className="ai-chat-logo" />
          <div>
            <div className="ai-chat-title">Vix <span className="ai-badge">AI</span></div>
            <div className="ai-chat-subtitle">Website Builder</div>
          </div>
        </div>
        <div className="ai-chat-topbar-right">
          {user && (
            <div className="ai-user-info">
              {user.picture
                ? <img src={user.picture} alt={user.name} className="ai-user-avatar" />
                : <div className="ai-user-avatar-placeholder">{user.name?.[0]}</div>
              }
              <span className="ai-user-name">{user.name}</span>
            </div>
          )}
          <button className="ai-reset-btn" onClick={handleReset} title="Start over">↺</button>
          <button className="ai-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Main Area */}
      <div className={`ai-chat-main ${showPreview ? 'has-preview' : ''}`}>

        {/* Chat Column */}
        <div className="ai-chat-column">
          <div className="ai-messages-area">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
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

          {/* Input Area */}
          <div className="ai-input-area">
            <button
              className={`ai-upload-btn ${logoFile ? 'uploaded' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title={logoFile ? `Logo: ${logoFile.name}` : 'Upload Logo'}
            >
              {logoFile
                ? <img src={logoUrl} alt="logo" style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '4px' }} />
                : '📎'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoUpload}
            />
            <form onSubmit={handleSend} className="ai-form-row">
              <input
                className="ai-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="قولي عايز إيه..."
                disabled={loading}
              />
              <button type="submit" className="ai-send-btn" disabled={loading || !input.trim()}>↑</button>
            </form>
          </div>
        </div>

        {/* Preview Column */}
        {showPreview && (
          <div className="ai-preview-column">
            {/* Preview Header with Tabs */}
            <div className="ai-preview-header">
              <div className="preview-tabs">
                <button
                  className={`preview-tab ${previewTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setPreviewTab('preview')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  Preview
                </button>
                <button
                  className={`preview-tab ${previewTab === 'code' ? 'active' : ''}`}
                  onClick={() => setPreviewTab('code')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                  Code
                </button>
              </div>
              <div className="ai-preview-actions">
                <button className="ai-preview-btn export-btn" onClick={handleDownload}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                </button>
              </div>
            </div>

            {/* Preview/Code Body */}
            <div className="ai-preview-body">
              {previewTab === 'preview' ? (
                <div className="ai-preview-frame">
                  <iframe
                    srcDoc={generatedHTML}
                    title="Generated Website"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                <CodeView html={generatedHTML || ''} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
