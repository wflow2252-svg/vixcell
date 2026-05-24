import React, { useState, useRef, useEffect, useMemo } from 'react'
import { getAIResponse, resetSession } from '../services/vixAiClient'

// ─── Theme tokens ───────────────────────────────────────────────────
const T = {
  bg: '#0c0c0e',
  bg2: '#131316',
  bg3: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.16)',
  text: '#e8e8ed',
  text2: '#a8a8b3',
  text3: '#6b6b75',
  accent: '#c8a35c',
  accentHover: '#d4b06a',
  accentDim: 'rgba(200,163,92,0.12)',
  userBubble: '#1f1f25',
  aiText: '#e8e8ed',
}

// ─── Markdown → HTML (kept simple & safe) ───────────────────────────
function esc(s) {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function parseMd(text) {
  if (!text) return ''
  let t = text
  t = t.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim()
  t = esc(t)

  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = 'c' + Math.random().toString(36).slice(2, 8)
    const safeLang = (lang || 'text').toLowerCase()
    return `<div class="vx-code"><div class="vx-code-head"><span class="vx-code-lang">${safeLang}</span><button class="vx-copy-btn" onclick="window.vxCopy('${id}', this)">Copy</button></div><pre id="${id}"><code>${code.trim()}</code></pre></div>`
  })

  t = t.replace(/`([^`\n]+)`/g, '<code class="vx-inline">$1</code>')
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  t = t.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  t = t.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  t = t.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
  t = t.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  t = t.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
  t = t.split(/\n\n+/).map(b => {
    if (/^<(h[123]|ul|ol|pre|blockquote|div)/.test(b.trim())) return b
    return `<p>${b.replace(/\n/g, '<br>')}</p>`
  }).join('\n')
  return t
}

function extractHTML(content) {
  const match = content.match(/===HTML_START===\s*([\s\S]*?)\s*===HTML_END===/)
  return match ? match[1].trim() : null
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ─── Main Component ────────────────────────────────────────────────
export default function ClientDashboard({ onViewChange }) {
  const [convs, setConvs] = useState(() => {
    try {
      const saved = localStorage.getItem('vixcell_convs')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [cur, setCur] = useState(null)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [artifactTab, setArtifactTab] = useState('preview')
  const [stagedFiles, setStagedFiles] = useState([])    // [{ kind, name, dataUrl?, content? }]
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
  const [mobileView, setMobileView] = useState('chat')  // 'chat' | 'preview'

  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  const codeInputRef = useRef(null)
  const textareaRef = useRef(null)

  // ─── Effects ────────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('vixcell_convs', JSON.stringify(convs)) } catch {}
  }, [convs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convs, cur, busy])

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [isDesktop])

  // Global copy handler for code blocks
  useEffect(() => {
    window.vxCopy = async (id, btn) => {
      const el = document.getElementById(id)
      if (!el) return
      try {
        await navigator.clipboard.writeText(el.textContent)
        if (btn) {
          const original = btn.textContent
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = original }, 1500)
        }
      } catch {}
    }
    return () => { delete window.vxCopy }
  }, [])

  // ─── Derived state ──────────────────────────────────────────────
  const activeConv = cur ? convs[cur] : null
  const sortedIds = useMemo(
    () => Object.keys(convs).sort((a, b) => convs[b].ts - convs[a].ts),
    [convs]
  )

  const latestHTML = useMemo(() => {
    if (!activeConv?.messages) return null
    for (let i = activeConv.messages.length - 1; i >= 0; i--) {
      const m = activeConv.messages[i]
      if (m.role === 'assistant') {
        const html = extractHTML(m.content)
        if (html) return html
      }
    }
    return null
  }, [activeConv])

  const showArtifact = !!latestHTML
  const showChatPane = !showArtifact || isDesktop || mobileView === 'chat'
  const showArtifactPane = showArtifact && (isDesktop || mobileView === 'preview')

  // ─── Actions ────────────────────────────────────────────────────
  function newChat() {
    const id = uid()
    setConvs(prev => ({
      ...prev,
      [id]: { title: 'New chat', messages: [], ts: Date.now() }
    }))
    setCur(id)
    setStagedFiles([])
    setInput('')
    setMobileView('chat')
  }

  function openChat(id) {
    setCur(id)
    setMobileView('chat')
    if (!isDesktop) setSidebarOpen(false)
  }

  function deleteConv(id, e) {
    e.stopPropagation()
    const next = { ...convs }
    delete next[id]
    setConvs(next)
    resetSession(id)
    if (cur === id) setCur(null)
  }

  function startWithPrompt(text) {
    const id = uid()
    setConvs(prev => ({
      ...prev,
      [id]: { title: text.slice(0, 40), messages: [], ts: Date.now() }
    }))
    setCur(id)
    setTimeout(() => send(text, id), 60)
  }

  async function send(textToSend = null, idOverride = null) {
    const activeId = idOverride || cur
    if (!activeId) return
    const messageText = textToSend !== null ? textToSend : input.trim()
    if (!messageText && stagedFiles.length === 0) return
    if (busy) return

    // Build message with file references
    let aiMessage = messageText
    let displayMessage = messageText
    let logoDataUrl = null

    for (const f of stagedFiles) {
      if (f.kind === 'image') {
        logoDataUrl = f.dataUrl
        displayMessage = displayMessage ? displayMessage + '\n' : ''
        displayMessage += `🖼️ ${f.name}`
      } else if (f.kind === 'code') {
        aiMessage += `\n\n[Attached file: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``
        displayMessage = displayMessage ? displayMessage + '\n' : ''
        displayMessage += `📄 ${f.name}`
      }
    }

    if (logoDataUrl) aiMessage = '[LOGO_UPLOADED]\n' + aiMessage

    setConvs(prev => {
      const conv = { ...(prev[activeId] || { title: 'New chat', messages: [], ts: Date.now() }) }
      if (conv.messages.length === 0 && messageText) {
        conv.title = messageText.slice(0, 40) + (messageText.length > 40 ? '…' : '')
      }
      conv.messages = [...conv.messages, { role: 'user', content: displayMessage }]
      conv.ts = Date.now()
      return { ...prev, [activeId]: conv }
    })

    setInput('')
    setStagedFiles([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setBusy(true)

    try {
      // Direct local call — no waiting on a backend that may not exist
      await new Promise(r => setTimeout(r, 220))  // brief "thinking" pause
      const res = getAIResponse(activeId, aiMessage)
      let reply = res.text || ''
      if (res.html) {
        reply = `===HTML_START===\n${res.html}\n===HTML_END===\n\n${reply}`
      }
      setConvs(prev => {
        const conv = { ...prev[activeId] }
        conv.messages = [...conv.messages, { role: 'assistant', content: reply }]
        return { ...prev, [activeId]: conv }
      })
    } catch (err) {
      setConvs(prev => {
        const conv = { ...prev[activeId] }
        conv.messages = [...conv.messages, { role: 'assistant', content: '⚠️ Error: ' + (err.message || 'unknown') }]
        return { ...prev, [activeId]: conv }
      })
    } finally {
      setBusy(false)
    }
  }

  function onImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setStagedFiles(prev => [...prev, { kind: 'image', name: file.name, dataUrl: ev.target.result }])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function onCodePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setStagedFiles(prev => [...prev, { kind: 'code', name: file.name, content: ev.target.result }])
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function removeFile(idx) {
    setStagedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!busy && cur) send()
      else if (!busy && !cur && input.trim()) startWithPrompt(input.trim())
    }
  }

  function resizeTextarea(el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  function downloadHTML() {
    if (!latestHTML) return
    const blob = new Blob([latestHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'index.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyHTML() {
    if (!latestHTML) return
    try { await navigator.clipboard.writeText(latestHTML) } catch {}
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <StyleTag />

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTop}>
            <button onClick={() => onViewChange('landing')} style={styles.logoBtn} title="Home">
              <img src="/logo.png" alt="VIXCELL" style={{ width: 24, height: 24, borderRadius: 6 }} />
              <span style={styles.logoText}>VIXCELL</span>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="vx-icon-btn" style={styles.iconBtn} title="Collapse">
              <Icon name="sidebar" />
            </button>
          </div>

          <button onClick={newChat} className="vx-new-chat" style={styles.newChatBtn}>
            <Icon name="plus" size={16} />
            <span>New chat</span>
          </button>

          <div style={styles.convsLabel}>Recent chats</div>
          <div style={styles.convsList}>
            {sortedIds.length === 0 ? (
              <div style={styles.empty}>No conversations yet</div>
            ) : (
              sortedIds.map(id => (
                <div
                  key={id}
                  onClick={() => openChat(id)}
                  className="vx-conv-item"
                  style={{
                    ...styles.convItem,
                    background: cur === id ? T.bg3 : 'transparent',
                  }}
                >
                  <span style={styles.convTitle}>{convs[id].title}</span>
                  <button onClick={(e) => deleteConv(id, e)} className="vx-conv-delete" style={styles.convDelete}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* ── Main Area ── */}
      <main style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="vx-icon-btn" style={styles.iconBtn} title="Open sidebar">
                <Icon name="sidebar" />
              </button>
            )}
            <div style={styles.topTitle}>
              {activeConv ? activeConv.title : 'VIXCELL AI'}
            </div>
            <div style={styles.statusDot}>
              <span style={styles.dot} />
              <span style={{ fontSize: 11, color: T.text3 }}>Local · Online</span>
            </div>
          </div>

          {/* Mobile view toggle */}
          {!isDesktop && showArtifact && (
            <div style={styles.mobileToggle}>
              <button
                onClick={() => setMobileView('chat')}
                style={{
                  ...styles.mobileToggleBtn,
                  background: mobileView === 'chat' ? T.accent : 'transparent',
                  color: mobileView === 'chat' ? '#000' : T.text2,
                }}
              >Chat</button>
              <button
                onClick={() => setMobileView('preview')}
                style={{
                  ...styles.mobileToggleBtn,
                  background: mobileView === 'preview' ? T.accent : 'transparent',
                  color: mobileView === 'preview' ? '#000' : T.text2,
                }}
              >Preview</button>
            </div>
          )}
        </div>

        {/* Content split */}
        <div style={styles.contentSplit}>
          {/* Chat Pane */}
          {showChatPane && (
            <div style={{
              ...styles.chatPane,
              flex: showArtifactPane && isDesktop ? '0 0 46%' : '1',
              borderRight: showArtifactPane && isDesktop ? `1px solid ${T.border}` : 'none',
            }}>
              {/* Messages or empty state */}
              <div style={styles.messages}>
                {!activeConv || activeConv.messages.length === 0 ? (
                  <EmptyState onPick={startWithPrompt} />
                ) : (
                  activeConv.messages.map((m, i) => (
                    <MessageBubble key={i} message={m} />
                  ))
                )}
                {busy && <ThinkingBubble />}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <Composer
                input={input}
                onChange={(v) => { setInput(v); resizeTextarea(textareaRef.current) }}
                onKeyDown={onKeyDown}
                onSend={() => cur ? send() : (input.trim() && startWithPrompt(input.trim()))}
                busy={busy}
                stagedFiles={stagedFiles}
                onRemoveFile={removeFile}
                onPickImage={() => imageInputRef.current?.click()}
                onPickCode={() => codeInputRef.current?.click()}
                textareaRef={textareaRef}
              />

              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImagePick} />
              <input ref={codeInputRef} type="file" accept=".js,.jsx,.ts,.tsx,.html,.css,.py,.json,.txt,.md,.go,.rs,.java,.cs,.php,.rb" style={{ display: 'none' }} onChange={onCodePick} />
            </div>
          )}

          {/* Artifact Pane */}
          {showArtifactPane && (
            <ArtifactPane
              html={latestHTML}
              tab={artifactTab}
              onTab={setArtifactTab}
              onDownload={downloadHTML}
              onCopy={copyHTML}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ─── EmptyState ────────────────────────────────────────────────────
function EmptyState({ onPick }) {
  const suggestions = [
    { icon: '🌐', title: 'Build a website', sub: 'Landing page, dashboard, store',
      prompt: 'Build a modern landing page for a startup called Nebula with glassmorphism design' },
    { icon: '⚛️', title: 'Write React code', sub: 'Components, hooks, forms',
      prompt: 'Write a React modal component with backdrop and escape key support' },
    { icon: '🔧', title: 'Build a backend',  sub: 'Node, Express, JWT, APIs',
      prompt: 'Write a Node.js Express CRUD API with JWT authentication' },
    { icon: '🐍', title: 'Python script',     sub: 'FastAPI, pandas, scraping',
      prompt: 'Write a FastAPI CRUD example for managing users' },
    { icon: '🔍', title: 'Analyze code',      sub: 'Bugs, complexity, security',
      prompt: 'Paste your code and I\'ll analyze it for bugs and improvements' },
    { icon: '📚', title: 'Explain a concept', sub: 'React, async, closures',
      prompt: 'Explain how React useEffect works with examples' },
  ]

  return (
    <div style={styles.empty2}>
      <div style={styles.emptyLogo}>
        <img src="/logo.png" alt="VIXCELL" style={{ width: 48, height: 48, borderRadius: 12 }} />
      </div>
      <h1 style={styles.emptyTitle}>How can I help you today?</h1>
      <p style={styles.emptySubtitle}>
        Full-stack AI architect — websites, code, analysis, learning. Runs 100% locally.
      </p>

      <div style={styles.suggestGrid}>
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onPick(s.prompt)} className="vx-suggest" style={styles.suggestCard}>
            <span style={styles.suggestIcon}>{s.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={styles.suggestTitle}>{s.title}</span>
              <span style={styles.suggestSub}>{s.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── MessageBubble ─────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{ ...styles.msgRow, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div style={styles.avatar}>
          <img src="/logo.png" alt="AI" style={{ width: 28, height: 28, borderRadius: 8 }} />
        </div>
      )}
      <div style={{
        ...styles.bubble,
        background: isUser ? T.userBubble : 'transparent',
        border: isUser ? `1px solid ${T.border}` : 'none',
        padding: isUser ? '10px 14px' : '4px 0',
        maxWidth: isUser ? '75%' : '100%',
      }}>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap', color: T.text, lineHeight: 1.55, fontSize: 14.5 }}>
            {message.content}
          </div>
        ) : (
          <div className="vx-md" dangerouslySetInnerHTML={{ __html: parseMd(message.content) }} />
        )}
      </div>
    </div>
  )
}

// ─── ThinkingBubble ────────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
      <div style={styles.avatar}>
        <img src="/logo.png" alt="AI" style={{ width: 28, height: 28, borderRadius: 8 }} />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={styles.typingDots}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

// ─── Composer ──────────────────────────────────────────────────────
function Composer({ input, onChange, onKeyDown, onSend, busy, stagedFiles, onRemoveFile, onPickImage, onPickCode, textareaRef }) {
  return (
    <div style={styles.composerWrap}>
      <div className="vx-composer" style={styles.composer}>
        {/* Staged files chips */}
        {stagedFiles.length > 0 && (
          <div style={styles.chipsRow}>
            {stagedFiles.map((f, i) => (
              <div key={i} style={styles.fileChip}>
                {f.kind === 'image' ? (
                  <img src={f.dataUrl} alt="" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <span style={{ fontSize: 14 }}>📄</span>
                )}
                <span style={styles.fileChipName}>{f.name}</span>
                <button onClick={() => onRemoveFile(i)} style={styles.fileChipRemove}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={styles.composerInputRow}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask VIXCELL anything…"
            disabled={busy}
            rows={1}
            style={styles.textarea}
          />
        </div>

        {/* Action row */}
        <div style={styles.composerActions}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onPickImage} className="vx-tool-btn" style={styles.toolBtn} title="Attach image">
              <Icon name="image" />
            </button>
            <button onClick={onPickCode} className="vx-tool-btn" style={styles.toolBtn} title="Attach code file">
              <Icon name="paperclip" />
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={busy || (!input.trim() && stagedFiles.length === 0)}
            style={{
              ...styles.sendBtn,
              opacity: (busy || (!input.trim() && stagedFiles.length === 0)) ? 0.4 : 1,
              cursor: (busy || (!input.trim() && stagedFiles.length === 0)) ? 'not-allowed' : 'pointer',
            }}
          >
            <Icon name="send" size={16} color="#000" />
          </button>
        </div>
      </div>
      <div style={styles.footerHint}>
        VIXCELL runs 100% locally · Free · No API keys
      </div>
    </div>
  )
}

// ─── ArtifactPane ──────────────────────────────────────────────────
function ArtifactPane({ html, tab, onTab, onDownload, onCopy }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={styles.artifactPane}>
      <div style={styles.artifactHeader}>
        <div style={styles.artifactTabs}>
          <button
            onClick={() => onTab('preview')}
            style={{
              ...styles.artifactTab,
              background: tab === 'preview' ? T.bg3 : 'transparent',
              color: tab === 'preview' ? T.text : T.text2,
            }}
          >
            <Icon name="eye" size={14} />
            <span>Preview</span>
          </button>
          <button
            onClick={() => onTab('code')}
            style={{
              ...styles.artifactTab,
              background: tab === 'code' ? T.bg3 : 'transparent',
              color: tab === 'code' ? T.text : T.text2,
            }}
          >
            <Icon name="code" size={14} />
            <span>Code</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleCopy} className="vx-art-action" style={styles.artifactAction}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={onDownload} className="vx-art-action" style={styles.artifactAction}>
            <Icon name="download" size={13} /> Download
          </button>
        </div>
      </div>
      <div style={styles.artifactBody}>
        {tab === 'preview' ? (
          <iframe
            srcDoc={html}
            title="VIXCELL Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        ) : (
          <pre style={styles.codeView}>
            <code>{html}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Icon (inline SVGs) ────────────────────────────────────────────
function Icon({ name, size = 18, color = 'currentColor' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'plus':      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>
    case 'sidebar':   return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>
    case 'trash':     return <svg {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
    case 'send':      return <svg {...props}><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    case 'image':     return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
    case 'paperclip': return <svg {...props}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
    case 'eye':       return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'code':      return <svg {...props}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
    case 'download':  return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
    default: return null
  }
}

// ─── Inline styles ─────────────────────────────────────────────────
const styles = {
  root: { display: 'flex', height: '100vh', width: '100vw', background: T.bg, color: T.text, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', overflow: 'hidden' },

  // Sidebar
  sidebar: { width: 260, background: T.bg2, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 8px' },
  logoBtn: { display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  logoText: { color: T.text, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em' },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: T.text2, cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'background .15s' },
  newChatBtn: { display: 'flex', alignItems: 'center', gap: 8, margin: '8px 12px 16px', padding: '10px 12px', background: 'transparent', color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .15s' },
  convsLabel: { padding: '4px 16px', fontSize: 11, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  convsList: { flex: 1, overflowY: 'auto', padding: '4px 8px' },
  empty: { padding: '8px 12px', fontSize: 12, color: T.text3 },
  convItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: T.text2, marginBottom: 2, transition: 'background .15s' },
  convTitle: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convDelete: { background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 2, opacity: 0.6 },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 },
  topTitle: { fontWeight: 600, fontSize: 14, color: T.text },
  statusDot: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.6)' },
  mobileToggle: { display: 'flex', gap: 4, background: T.bg2, padding: 3, borderRadius: 8, border: `1px solid ${T.border}` },
  mobileToggleBtn: { padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },

  contentSplit: { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },

  // Chat
  chatPane: { display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '24px 20px 12px', display: 'flex', flexDirection: 'column', gap: 16 },
  msgRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: T.bg2, border: `1px solid ${T.border}` },
  bubble: { borderRadius: 12, fontSize: 14.5, lineHeight: 1.6 },
  typingDots: { display: 'flex', gap: 4 },

  // Empty
  empty2: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', minHeight: '100%', maxWidth: 720, margin: '0 auto' },
  emptyLogo: { width: 64, height: 64, borderRadius: 16, background: T.bg2, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 8, letterSpacing: '-0.01em' },
  emptySubtitle: { fontSize: 14, color: T.text2, marginBottom: 36, maxWidth: 480 },
  suggestGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, width: '100%', maxWidth: 680 },
  suggestCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all .15s' },
  suggestIcon: { fontSize: 22, flexShrink: 0 },
  suggestTitle: { fontSize: 13, fontWeight: 600, color: T.text },
  suggestSub: { fontSize: 11, color: T.text3 },

  // Composer
  composerWrap: { padding: '12px 20px 16px', flexShrink: 0 },
  composer: { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 8, transition: 'border-color .15s' },
  chipsRow: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 6px 8px' },
  fileChip: { display: 'flex', alignItems: 'center', gap: 6, background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '4px 8px', fontSize: 12, color: T.text2 },
  fileChipName: { maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileChipRemove: { background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1, marginLeft: 2 },
  composerInputRow: { padding: '4px 10px' },
  textarea: { width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: T.text, fontSize: 14.5, lineHeight: 1.5, fontFamily: 'inherit', minHeight: 24, maxHeight: 180, padding: '4px 0' },
  composerActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 2px' },
  toolBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'transparent', border: 'none', color: T.text2, cursor: 'pointer', borderRadius: 6, transition: 'all .15s' },
  sendBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: T.accent, border: 'none', borderRadius: 8, transition: 'all .15s' },
  footerHint: { textAlign: 'center', fontSize: 11, color: T.text3, marginTop: 8 },

  // Artifact
  artifactPane: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.bg, minWidth: 0 },
  artifactHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: T.bg2, flexShrink: 0 },
  artifactTabs: { display: 'flex', gap: 4 },
  artifactTab: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s' },
  artifactAction: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all .15s' },
  artifactBody: { flex: 1, overflow: 'hidden', position: 'relative' },
  codeView: { margin: 0, padding: 16, fontSize: 12, lineHeight: 1.5, fontFamily: 'ui-monospace, "SF Mono", Monaco, Consolas, monospace', color: '#9ece6a', background: '#0a0a0d', height: '100%', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
}

// ─── Embedded CSS (global tweaks via injected <style>) ─────────────
function StyleTag() {
  return (
    <style>{`
@keyframes vxTyping {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.vx-md { color: ${T.aiText}; font-size: 14.5px; line-height: 1.7; }
.vx-md p { margin: 0 0 12px; }
.vx-md p:last-child { margin-bottom: 0; }
.vx-md h1, .vx-md h2, .vx-md h3 { color: ${T.text}; margin: 18px 0 10px; line-height: 1.3; }
.vx-md h1 { font-size: 22px; font-weight: 700; }
.vx-md h2 { font-size: 18px; font-weight: 700; }
.vx-md h3 { font-size: 15px; font-weight: 600; }
.vx-md ul { padding-left: 22px; margin: 8px 0 14px; }
.vx-md li { margin: 4px 0; color: ${T.text2}; }
.vx-md strong { color: ${T.text}; font-weight: 600; }
.vx-md em { color: ${T.text2}; }
.vx-md blockquote { border-left: 3px solid ${T.accent}; padding: 4px 12px; margin: 12px 0; color: ${T.text2}; background: ${T.accentDim}; border-radius: 0 6px 6px 0; }
.vx-md code.vx-inline { background: rgba(200,163,92,0.12); color: ${T.accent}; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; font-family: ui-monospace, "SF Mono", Monaco, Consolas, monospace; }
.vx-code { background: #0a0a0d; border: 1px solid ${T.border}; border-radius: 10px; margin: 12px 0; overflow: hidden; }
.vx-code-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: ${T.bg3}; border-bottom: 1px solid ${T.border}; }
.vx-code-lang { font-size: 11px; color: ${T.text3}; text-transform: lowercase; font-weight: 500; }
.vx-copy-btn { background: transparent; border: 1px solid ${T.border}; color: ${T.text2}; padding: 3px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; transition: all .15s; }
.vx-copy-btn:hover { background: ${T.bg2}; color: ${T.text}; border-color: ${T.borderHover}; }
.vx-code pre { margin: 0; padding: 14px 16px; overflow-x: auto; font-family: ui-monospace, "SF Mono", Monaco, Consolas, monospace; font-size: 12.5px; line-height: 1.6; }
.vx-code code { color: #c9d1d9; background: transparent; padding: 0; }
.typing-dots span, [class*="typingDots"] span { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${T.text3}; margin: 0 2px; animation: vxTyping 1.4s infinite ease-in-out; }
[class*="typingDots"] span:nth-child(2) { animation-delay: 0.2s; }
[class*="typingDots"] span:nth-child(3) { animation-delay: 0.4s; }
.vx-suggest:hover { background: ${T.bg3} !important; border-color: ${T.borderHover} !important; transform: translateY(-1px); }
.vx-conv-item:hover { background: ${T.bg3} !important; color: ${T.text} !important; }
.vx-conv-delete:hover { opacity: 1 !important; color: #ef4444 !important; }
.vx-icon-btn:hover { background: ${T.bg3} !important; color: ${T.text} !important; }
.vx-new-chat:hover { background: ${T.bg3} !important; border-color: ${T.borderHover} !important; }
.vx-tool-btn:hover { background: ${T.bg3} !important; color: ${T.text} !important; }
.vx-composer:focus-within { border-color: ${T.borderHover} !important; }
.vx-art-action:hover { background: ${T.bg2} !important; border-color: ${T.borderHover} !important; }
    `}</style>
  )
}
