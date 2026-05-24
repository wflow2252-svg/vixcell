import React, { useState, useRef, useEffect } from 'react'

export default function ClientDashboard({ onViewChange }) {
  // ── STATE ──────────────────────────────────────────────────────
  const [convs, setConvs] = useState(() => {
    try {
      const saved = localStorage.getItem('vixcell_convs')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [cur, setCur] = useState(null)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [screen, setScreen] = useState('home') // 'home' | 'chat'

  // Staged attachments states (Claude-style queue)
  const [stagedLogoUrl, setStagedLogoUrl] = useState(null)
  const [stagedLogoName, setStagedLogoName] = useState('')
  const [stagedCodeContent, setStagedCodeContent] = useState(null)
  const [stagedCodeName, setStagedCodeName] = useState('')
  const [logoUrl, setLogoUrl] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const codeFileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vixcell_convs', JSON.stringify(convs))
    } catch {}
  }, [convs])

  // Scroll chat messages thread to bottom
  useEffect(() => {
    if (screen === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [convs, cur, screen, busy])

  // Map copy function to global window context for markdown pre-wrap blocks
  useEffect(() => {
    window.cpCode = async (id) => {
      const el = document.getElementById(id)
      if (!el) return
      await navigator.clipboard.writeText(el.textContent).catch(() => {})
      const btn = el.parentElement.querySelector('.copy-btn')
      if (btn) {
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
      }
    }
    return () => {
      delete window.cpCode
    }
  }, [])

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  }

  // ── NAVIGATION ─────────────────────────────────────────────────
  function goHome() {
    setScreen('home')
  }

  function openChat(id) {
    setCur(id)
    setScreen('chat')
  }

  function newChat() {
    const id = uid()
    setConvs(prev => ({
      ...prev,
      [id]: { title: 'New conversation', messages: [], ts: Date.now() }
    }))
    setCur(id)
    setScreen('chat')
  }

  function startChat(text) {
    const id = uid()
    setConvs(prev => ({
      ...prev,
      [id]: { title: text.slice(0, 30) + (text.length > 30 ? '...' : ''), messages: [], ts: Date.now() }
    }))
    setCur(id)
    setScreen('chat')
    
    // Trigger send in next tick
    setTimeout(() => {
      send(text, id)
    }, 50)
  }

  // ── SEND ───────────────────────────────────────────────────────
  async function send(textToSend = null, idToSend = null) {
    const activeId = idToSend || cur
    const messageText = textToSend !== null ? textToSend : input.trim()
    if (!messageText && !stagedLogoUrl && !stagedCodeName) return
    if (busy) return

    let finalMsg = messageText
    let displayMsg = messageText

    // Bundle queued code content
    if (stagedCodeContent) {
      finalMsg += `\n\n[الملف المرفق: ${stagedCodeName}]\n\`\`\`\n${stagedCodeContent}\n\`\`\``
      displayMsg += `\n📄 [ملف الكود المرفق: ${stagedCodeName}]`
    }

    const conv = convs[activeId]
    if (!conv) return

    // Update conversation title if first message
    if (conv.messages.length === 0) {
      conv.title = messageText.slice(0, 40) + (messageText.length > 40 ? '…' : '')
    }

    conv.ts = Date.now()
    conv.messages.push({ role: 'user', content: displayMsg })

    // Store staged image data locally to send, then clear states
    const activeLogoUrl = stagedLogoUrl || logoUrl
    if (stagedLogoUrl) {
      setLogoUrl(stagedLogoUrl)
    }

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Clear staged states immediately
    setStagedLogoUrl(null)
    setStagedLogoName('')
    setStagedCodeContent(null)
    setStagedCodeName('')

    setBusy(true)

    try {
      const res = await fetch('/api/vix-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMsg,
          logoDataUrl: activeLogoUrl,
          sessionId: activeId
        })
      })

      const data = await res.json()
      
      if (data.success && data.data) {
        let reply = data.data.text || ''
        if (data.data.html) {
          reply = `===HTML_START===\n${data.data.html}\n===HTML_END===\n\n${reply}`
        }
        conv.messages.push({ role: 'assistant', content: reply })
      } else {
        throw new Error(data.message || 'API error')
      }
    } catch (err) {
      console.error('VIXCELL AI error:', err)
      conv.messages.push({ role: 'assistant', content: '⚠️ Error: ' + err.message })
    }

    setBusy(false)
  }

  function handleSend() {
    send()
  }

  // Logo upload callback - stages the file
  function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setStagedLogoName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setStagedLogoUrl(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Code file upload callback - stages the file
  function handleCodeFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setStagedCodeName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setStagedCodeContent(ev.target.result)
    }
    reader.readAsText(file)
  }

  // ── MARKDOWN PARSER ────────────────────────────────────────────
  function parseMd(text) {
    let t = esc(text)
    
    // Strip raw Vercel HTML split brackets inside conversation bubbles
    t = t.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim()

    // Fenced Code Blocks
    t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const id = 'c' + uid()
      return `<div class="pre-wrap"><button class="copy-btn" onclick="cpCode('${id}')">Copy</button><pre id="${id}"><code>${code.trim()}</code></pre></div>`
    })

    t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>')
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>')
    t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    t = t.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    t = t.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    t = t.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    t = t.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    t = t.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    t = t.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    
    t = t.split(/\n\n+/).map(b => {
      if (/^<(h[123]|ul|ol|pre|blockquote|div)/.test(b.trim())) return b
      return `<p>${b.replace(/\n/g, '<br>')}</p>`
    }).join('\n')

    return t
  }

  function esc(s) {
    if (!s) return ''
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function resizeTextarea(el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!busy) send()
    }
  }

  const activeConv = cur ? convs[cur] : null
  const sortedConvIds = Object.keys(convs).sort((a, b) => convs[b].ts - convs[a].ts)

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>
      
      {/* ═══ SCREEN 1: HOME SCREEN ═══ */}
      <div id="screen-home" className={screen === 'chat' ? 'hidden' : ''}>
        <div id="home-header">
          <div className="logo-row">
            <div className="logo-icon">
              <img src="/logo.png" alt="VIXCELL" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="new-btn" onClick={newChat} title="دردشة جديدة">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="new-btn" onClick={() => onViewChange('landing')} title="العودة للموقع الرئيسي">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
        </div>

        <div id="home-scroll">
          {/* Welcome Card */}
          <div className="welcome-card">
            <div className="wc-top">
              <div className="wc-icon">
                <img src="/logo.png" alt="VIXCELL" />
              </div>
              <div>
                <div className="wc-title">Hello, I'm <span>VIXCELL</span></div>
              </div>
            </div>
            <div className="wc-desc">Full-Stack AI مدمج بالكامل — بعمل مواقع، بكتب كود بأي لغة، بحلل data، وبعمل chatbots. نبني إيه النهارده؟</div>
          </div>

          {/* Suggestions Chips */}
          <div className="section-label">ابدأ من هنا</div>
          <div className="chips-wrap">
            <div className="chip" onClick={() => startChat('اعمل لي landing page كاملة بـ HTML و CSS و JavaScript مع animations وديزاين عصري')}>
              <div className="chip-icon" style={{ background: '#1a1a2e' }}>⚡</div>
              <div className="chip-body">
                <div className="chip-title">اعمل موقع</div>
                <div className="chip-sub">Landing page, dashboard, web app</div>
              </div>
              <svg className="chip-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>

            <div className="chip" onClick={() => startChat('اكتب لي REST API كامل بـ Node.js و Express مع PostgreSQL و JWT authentication')}>
              <div className="chip-icon" style={{ background: '#0d1f0d' }}>🔧</div>
              <div className="chip-body">
                <div className="chip-title">Backend API</div>
                <div className="chip-sub">Node.js, Python, PHP, Laravel</div>
              </div>
              <svg className="chip-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>

            <div className="chip" onClick={() => startChat('ساعدني أحلل data بـ Python، اكتب كود Pandas كامل مع visualizations وشرح النتائج')}>
              <div className="chip-icon" style={{ background: '#1a0d00' }}>📊</div>
              <div className="chip-body">
                <div className="chip-title">تحليل البيانات</div>
                <div className="chip-sub">Python, SQL, Pandas, Plotly</div>
              </div>
              <svg className="chip-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>

            <div className="chip" onClick={() => startChat('اعمل لي chatbot ذكي بـ JavaScript مع conversation memory و intent detection وwidget للموقع')}>
              <div className="chip-icon" style={{ background: '#0d0d1f' }}>🤖</div>
              <div className="chip-body">
                <div className="chip-title">AI Chatbot</div>
                <div className="chip-sub">Web, WhatsApp, Telegram</div>
              </div>
              <svg className="chip-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>

            <div className="chip" onClick={() => startChat('فاهم كل لغات البرمجة؟ اشرح لي الفرق بين React و Vue و Angular وامتى أستخدم كل واحدة')}>
              <div className="chip-icon" style={{ background: '#1f1a0d' }}>📚</div>
              <div className="chip-body">
                <div className="chip-title">تعلم البرمجة</div>
                <div className="chip-sub">شرح، مقارنة، best practices</div>
              </div>
              <svg className="chip-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </div>

          {/* Recent list */}
          <div className="section-label">المحادثات الأخيرة</div>
          <div id="recent-list">
            {sortedConvIds.length === 0 ? (
              <div className="empty-convs">لا توجد محادثات بعد</div>
            ) : (
              sortedConvIds.map(id => (
                <div key={id} className="conv-item" onClick={() => openChat(id)}>
                  <div className="conv-dot"></div>
                  <div className="conv-title">{convs[id].title}</div>
                  <div className="conv-time">now</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══ CHAT SCREEN ═══ */}
      <div id="screen-chat" className={screen === 'chat' ? 'active' : ''}>
        <div id="chat-header">
          <div id="back-btn" onClick={goHome} title="العودة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <div id="chat-title-wrap">
            <div id="chat-title">{activeConv ? activeConv.title : 'VIXCELL'}</div>
            <div id="chat-sub">
              <div className="online-dot"></div>
              Full-Stack AI · جاهز
            </div>
          </div>
          <div 
            onClick={() => onViewChange('landing')} 
            title="العودة للموقع الرئيسي" 
            style={{ 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--gold)', 
              cursor: 'pointer', 
              borderRadius: '8px', 
              transition: 'background .15s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            className="chat-home-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        <div id="messages">
          {activeConv && activeConv.messages.map((m, idx) => (
            <div key={idx} className="msg-group">
              <div className={`msg-row ${m.role === 'user' ? 'user' : 'ai'}`}>
                <div className={`avatar-sm ${m.role === 'user' ? 'user' : 'ai'}`}>
                  {m.role === 'ai' ? (
                    <img src="/logo.png" alt="VIXCELL" />
                  ) : 'U'}
                </div>
                <div className={`bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
                  {m.role === 'ai' ? (
                    <div dangerouslySetInnerHTML={{ __html: parseMd(m.content) }} />
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking bubble animated */}
          {busy && (
            <div className="msg-group" id="thinking">
              <div className="msg-row">
                <div className="avatar-sm ai">
                  <img src="/logo.png" alt="VIXCELL" />
                </div>
                <div className="thinking-bubble">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR WITH INTEGRATED QUEUED UPLOADS */}
        <div id="input-bar">
          
          {/* Staged uploads cards list row */}
          {(stagedLogoUrl || stagedCodeName) && (
            <div className="vix-mob-staged-row">
              {stagedLogoUrl && (
                <div className="vix-staged-card">
                  <img src={stagedLogoUrl} alt="logo review" className="vix-staged-thumb" />
                  <span className="truncate max-w-[100px]">{stagedLogoName}</span>
                  <button 
                    className="vix-staged-remove-btn" 
                    onClick={() => {
                      setStagedLogoUrl(null)
                      setStagedLogoName('')
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {stagedCodeName && (
                <div className="vix-staged-card">
                  <span>📄</span>
                  <span className="truncate max-w-[100px]">{stagedCodeName}</span>
                  <button 
                    className="vix-staged-remove-btn" 
                    onClick={() => {
                      setStagedCodeContent(null)
                      setStagedCodeName('')
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          <div id="input-row">
            {/* Stage attachments upload actions on Left Inside Input Box */}
            <div style={{ display: 'flex', gap: '0.45rem', marginRight: '6px', alignSelf: 'center' }}>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '18px' }}
                title="أضف لوجو"
              >
                📎
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />

              <button 
                onClick={() => codeFileInputRef.current?.click()} 
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '16px' }}
                title="أضف ملف كود"
              >
                📄
              </button>
              <input ref={codeFileInputRef} type="file" accept=".html,.css,.js,.jsx,.ts,.tsx,.txt" style={{ display: 'none' }} onChange={handleCodeFileUpload} />
            </div>

            <textarea 
              ref={textareaRef}
              id="txt" 
              rows={1} 
              value={input}
              onChange={e => {
                setInput(e.target.value)
                resizeTextarea(e.target)
              }}
              onKeyDown={onKey}
              placeholder="اسأل VIXCELL أي حاجة…" 
              disabled={busy}
            />
            
            <button 
              id="send" 
              onClick={handleSend}
              disabled={busy || (!input.trim() && !stagedLogoUrl && !stagedCodeName)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
