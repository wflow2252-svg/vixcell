'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { getAIResponse, resetSession } from '@/lib/ai'
import Icon from './Icon'
import { parseMd, extractHTML } from './markdown'

type Msg = { role: 'user' | 'assistant'; content: string }
type Conv = { title: string; messages: Msg[]; ts: number }
type StagedFile = { kind: 'image' | 'code'; name: string; dataUrl?: string; content?: string }

const STORAGE_KEY = 'vixcell_v2_convs'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function Builder() {
  const [convs, setConvs] = useState<Record<string, Conv>>({})
  const [cur, setCur] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [artifactTab, setArtifactTab] = useState<'preview' | 'code'>('preview')
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [isDesktop, setIsDesktop] = useState(true)
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef  = useRef<HTMLInputElement>(null)
  const codeInputRef   = useRef<HTMLInputElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const handledPromptRef = useRef(false)
  const searchParams = useSearchParams()

  // ─── Restore conversations from localStorage on mount ──────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setConvs(JSON.parse(saved))
    } catch {}
    setIsDesktop(window.innerWidth >= 1024)
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs)) } catch {}
  }, [convs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convs, cur, busy])

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [isDesktop])

  // Auto-start a chat if ?prompt= is in the URL (e.g. from /templates)
  useEffect(() => {
    if (handledPromptRef.current) return
    const promptParam = searchParams?.get('prompt')
    if (promptParam && promptParam.trim()) {
      handledPromptRef.current = true
      // Clear the query param so refresh doesn't re-trigger
      const url = new URL(window.location.href)
      url.searchParams.delete('prompt')
      window.history.replaceState({}, '', url.toString())
      startWithPrompt(promptParam.trim())
    }
  }, [searchParams])

  // Global copy handler for code blocks rendered inside AI messages
  useEffect(() => {
    ;(window as any).vxCopy = async (id: string, btn: HTMLButtonElement) => {
      const el = document.getElementById(id)
      if (!el) return
      try {
        await navigator.clipboard.writeText(el.textContent || '')
        if (btn) {
          const original = btn.textContent
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = original }, 1500)
        }
      } catch {}
    }
    return () => { delete (window as any).vxCopy }
  }, [])

  // ─── Derived state ─────────────────────────────────────────────
  const activeConv = cur ? convs[cur] : null
  const sortedIds = useMemo(
    () => Object.keys(convs).sort((a, b) => convs[b].ts - convs[a].ts),
    [convs]
  )

  const latestArtifact = useMemo(() => {
    if (!activeConv?.messages) return null
    for (let i = activeConv.messages.length - 1; i >= 0; i--) {
      const m = activeConv.messages[i]
      if (m.role === 'assistant') {
        const r = extractHTML(m.content)
        if (r) return r
      }
    }
    return null
  }, [activeConv])

  const latestHTML = latestArtifact?.html || null
  const isStreaming = latestArtifact?.streaming || false
  const showArtifact = !!latestHTML
  const showChatPane = !showArtifact || isDesktop || mobileView === 'chat'
  const showArtifactPane = showArtifact && (isDesktop || mobileView === 'preview')

  // Auto-switch to code tab during streaming
  useEffect(() => {
    if (isStreaming) setArtifactTab('code')
  }, [isStreaming])

  // ─── Actions ───────────────────────────────────────────────────
  function newChat() {
    const id = uid()
    setConvs(prev => ({ ...prev, [id]: { title: 'New chat', messages: [], ts: Date.now() } }))
    setCur(id)
    setStagedFiles([])
    setInput('')
    setMobileView('chat')
  }

  function openChat(id: string) {
    setCur(id)
    setMobileView('chat')
    if (!isDesktop) setSidebarOpen(false)
  }

  function deleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setConvs(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    resetSession(id)
    if (cur === id) setCur(null)
  }

  function startWithPrompt(text: string) {
    const id = uid()
    setConvs(prev => ({ ...prev, [id]: { title: text.slice(0, 40), messages: [], ts: Date.now() } }))
    setCur(id)
    setTimeout(() => send(text, id), 60)
  }

  async function send(textToSend: string | null = null, idOverride: string | null = null) {
    const activeId = idOverride || cur
    if (!activeId) return
    const messageText = textToSend !== null ? textToSend : input.trim()
    if (!messageText && stagedFiles.length === 0) return
    if (busy) return

    let aiMessage = messageText
    let displayMessage = messageText
    let logoDataUrl: string | null = null

    for (const f of stagedFiles) {
      if (f.kind === 'image') {
        logoDataUrl = f.dataUrl || null
        displayMessage += (displayMessage ? '\n' : '') + `🖼️ ${f.name}`
      } else if (f.kind === 'code') {
        aiMessage += `\n\n[Attached file: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``
        displayMessage += (displayMessage ? '\n' : '') + `📄 ${f.name}`
      }
    }
    if (logoDataUrl) aiMessage = '[LOGO_UPLOADED]\n' + aiMessage

    setConvs(prev => {
      const conv: Conv = { ...(prev[activeId] || { title: 'New chat', messages: [], ts: Date.now() }) }
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
      await new Promise(r => setTimeout(r, 220))
      const res: any = getAIResponse(activeId, aiMessage)
      const fullText = res.text || ''
      const fullHtml = res.html || ''

      // Empty assistant placeholder
      setConvs(prev => {
        const conv: Conv = { ...prev[activeId] }
        conv.messages = [...conv.messages, { role: 'assistant', content: '' }]
        return { ...prev, [activeId]: conv }
      })

      // Stream text
      await streamInto((partial) => {
        setConvs(prev => {
          const conv: Conv = { ...prev[activeId] }
          const msgs = [...conv.messages]
          msgs[msgs.length - 1] = { role: 'assistant', content: partial }
          conv.messages = msgs
          return { ...prev, [activeId]: conv }
        })
      }, fullText, { chunkSize: 4, intervalMs: 12 })

      // Stream HTML if present
      if (fullHtml) {
        const finalText = fullText
        await streamInto((partialHtml) => {
          setConvs(prev => {
            const conv: Conv = { ...prev[activeId] }
            const msgs = [...conv.messages]
            msgs[msgs.length - 1] = {
              role: 'assistant',
              content: `===HTML_START===\n${partialHtml}\n===HTML_END===\n\n${finalText}`,
            }
            conv.messages = msgs
            return { ...prev, [activeId]: conv }
          })
        }, fullHtml, { chunkSize: 80, intervalMs: 12 })
      }
    } catch (err: any) {
      setConvs(prev => {
        const conv: Conv = { ...prev[activeId] }
        const msgs = [...conv.messages]
        if (msgs.length && msgs[msgs.length - 1].role === 'assistant' && msgs[msgs.length - 1].content === '') msgs.pop()
        msgs.push({ role: 'assistant', content: '⚠️ Error: ' + (err.message || 'unknown') })
        conv.messages = msgs
        return { ...prev, [activeId]: conv }
      })
    } finally {
      setBusy(false)
    }
  }

  function streamInto(onUpdate: (partial: string) => void, full: string, opts: { chunkSize?: number; intervalMs?: number } = {}) {
    const { chunkSize = 3, intervalMs = 12 } = opts
    return new Promise<void>((resolve) => {
      let i = 0
      const tick = () => {
        i = Math.min(full.length, i + chunkSize)
        onUpdate(full.slice(0, i))
        if (i < full.length) setTimeout(tick, intervalMs)
        else resolve()
      }
      tick()
    })
  }

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setStagedFiles(prev => [...prev, { kind: 'image', name: file.name, dataUrl: ev.target?.result as string }])
    reader.readAsDataURL(file); e.target.value = ''
  }
  function onCodePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setStagedFiles(prev => [...prev, { kind: 'code', name: file.name, content: ev.target?.result as string }])
    reader.readAsText(file); e.target.value = ''
  }
  function removeFile(idx: number) { setStagedFiles(prev => prev.filter((_, i) => i !== idx)) }
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!busy && cur) send()
      else if (!busy && !cur && input.trim()) startWithPrompt(input.trim())
    }
  }
  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  // ZIP export — calls API route
  async function downloadZip() {
    if (!latestHTML) return
    const projectName = activeConv?.title || 'vixcell-site'
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: latestHTML, projectName }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. See console for details.')
    }
  }

  async function copyHTML() {
    if (!latestHTML) return
    try { await navigator.clipboard.writeText(latestHTML) } catch {}
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-screen bg-brand-bg text-brand-text overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-[260px] bg-brand-bg2 border-r border-brand-border flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between p-3.5">
            <Link href="/" className="flex items-center gap-2.5 p-1">
              <Image src="/logo.png" alt="VIXCELL" width={24} height={24} className="rounded-md" />
              <span className="font-extrabold text-sm tracking-wide">VIXCELL</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded text-brand-text2 hover:bg-brand-bg3 hover:text-brand-text transition-all" title="Collapse">
              <Icon name="sidebar" />
            </button>
          </div>

          <button onClick={newChat} className="mx-3 mb-4 px-3 py-2.5 rounded-lg border border-brand-border text-brand-text text-[13px] font-medium hover:bg-brand-bg3 hover:border-brand-borderH flex items-center gap-2 transition-all">
            <Icon name="plus" size={16} />
            <span>New chat</span>
          </button>

          <div className="px-4 text-[11px] text-brand-text3 uppercase tracking-wider font-semibold">Recent chats</div>
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {sortedIds.length === 0 ? (
              <div className="px-3 py-2 text-xs text-brand-text3">No conversations yet</div>
            ) : (
              sortedIds.map(id => (
                <div
                  key={id}
                  onClick={() => openChat(id)}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-[13px] mb-0.5 transition-all ${
                    cur === id ? 'bg-brand-bg3 text-brand-text' : 'text-brand-text2 hover:bg-brand-bg3 hover:text-brand-text'
                  }`}
                >
                  <span className="flex-1 truncate">{convs[id].title}</span>
                  <button onClick={(e) => deleteConv(id, e)} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 transition-all" title="Delete">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded text-brand-text2 hover:bg-brand-bg3 hover:text-brand-text" title="Open sidebar">
                <Icon name="sidebar" />
              </button>
            )}
            <div className="font-semibold text-sm">{activeConv ? activeConv.title : 'VIXCELL AI'}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[11px] text-brand-text3">Local · Online</span>
            </div>
          </div>

          {!isDesktop && showArtifact && (
            <div className="flex gap-1 bg-brand-bg2 p-0.5 rounded-lg border border-brand-border">
              <button onClick={() => setMobileView('chat')} className={`px-3 py-1 rounded text-xs font-semibold ${mobileView === 'chat' ? 'bg-brand-gold text-black' : 'text-brand-text2'}`}>Chat</button>
              <button onClick={() => setMobileView('preview')} className={`px-3 py-1 rounded text-xs font-semibold ${mobileView === 'preview' ? 'bg-brand-gold text-black' : 'text-brand-text2'}`}>Preview</button>
            </div>
          )}
        </div>

        {/* Split */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {showChatPane && (
            <div className={`flex flex-col overflow-hidden min-w-0 ${showArtifactPane && isDesktop ? 'basis-[46%] flex-shrink-0 border-r border-brand-border' : 'flex-1'}`}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {!activeConv || activeConv.messages.length === 0 ? (
                  <EmptyState onPick={startWithPrompt} />
                ) : (
                  activeConv.messages.map((m, i) => <MessageBubble key={i} message={m} />)
                )}
                {busy && <ThinkingBubble />}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="px-5 pb-4 flex-shrink-0">
                <div className="bg-brand-bg2 border border-brand-border rounded-2xl p-2 focus-within:border-brand-borderH transition-colors">
                  {stagedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1.5 pb-2">
                      {stagedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-brand-bg3 border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text2">
                          {f.kind === 'image' ? (
                            <img src={f.dataUrl} alt="" className="w-6 h-6 object-cover rounded" />
                          ) : (
                            <span className="text-sm">📄</span>
                          )}
                          <span className="max-w-[140px] truncate">{f.name}</span>
                          <button onClick={() => removeFile(i)} className="text-brand-text3 hover:text-brand-text text-base leading-none ml-1">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); resizeTextarea(e.target) }}
                    onKeyDown={onKeyDown}
                    placeholder="Ask VIXCELL anything…"
                    disabled={busy}
                    rows={1}
                    className="w-full bg-transparent border-none outline-none resize-none text-brand-text text-[14.5px] leading-snug px-2.5 py-1 min-h-[24px] max-h-[180px]"
                  />

                  <div className="flex items-center justify-between px-1.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => imageInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-md text-brand-text2 hover:bg-brand-bg3 hover:text-brand-text" title="Attach image">
                        <Icon name="image" />
                      </button>
                      <button onClick={() => codeInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-md text-brand-text2 hover:bg-brand-bg3 hover:text-brand-text" title="Attach code file">
                        <Icon name="paperclip" />
                      </button>
                    </div>
                    <button
                      onClick={() => cur ? send() : (input.trim() && startWithPrompt(input.trim()))}
                      disabled={busy || (!input.trim() && stagedFiles.length === 0)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-gold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-goldH transition-all"
                    >
                      <Icon name="send" size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-center text-[11px] text-brand-text3 mt-2">VIXCELL runs 100% locally · Free · No API keys</p>
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={onImagePick} />
              <input ref={codeInputRef}  type="file" accept=".js,.jsx,.ts,.tsx,.html,.css,.py,.json,.txt,.md,.go,.rs,.java,.cs,.php,.rb" hidden onChange={onCodePick} />
            </div>
          )}

          {showArtifactPane && latestHTML && (
            <ArtifactPane
              html={latestHTML}
              tab={artifactTab}
              setTab={setArtifactTab}
              streaming={isStreaming}
              onDownload={downloadZip}
              onCopy={copyHTML}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────
function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  const suggestions = [
    { icon: '🌐', title: 'Build a website',  sub: 'Landing page, dashboard, store',
      prompt: 'Build a modern landing page for a startup called Nebula with glassmorphism design' },
    { icon: '⚛️', title: 'Write React code',  sub: 'Components, hooks, forms',
      prompt: 'Write a React modal component with backdrop and escape key support' },
    { icon: '🔧', title: 'Build a backend',   sub: 'Node, Express, JWT, APIs',
      prompt: 'Write a Node.js Express CRUD API with JWT authentication' },
    { icon: '🐍', title: 'Python script',     sub: 'FastAPI, pandas, scraping',
      prompt: 'Write a FastAPI CRUD example for managing users' },
    { icon: '🔍', title: 'Analyze code',      sub: 'Bugs, complexity, security',
      prompt: 'Paste your code and I\'ll analyze it for bugs and improvements' },
    { icon: '📚', title: 'Explain a concept', sub: 'React, async, closures',
      prompt: 'Explain how React useEffect works with examples' },
  ]

  return (
    <div className="flex flex-col items-center justify-center text-center px-5 py-10 min-h-full max-w-3xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-brand-bg2 border border-brand-border flex items-center justify-center mb-6">
        <Image src="/logo.png" alt="VIXCELL" width={48} height={48} className="rounded-xl" />
      </div>
      <h1 className="text-3xl font-bold mb-2 tracking-tight">How can I help you today?</h1>
      <p className="text-sm text-brand-text2 mb-9 max-w-[480px]">
        Full-stack AI architect — websites, code, analysis, learning. Runs 100% locally.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-[680px]">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s.prompt)}
            className="flex items-center gap-3 p-3.5 bg-brand-bg2 border border-brand-border rounded-xl text-left hover:bg-brand-bg3 hover:border-brand-borderH hover:-translate-y-0.5 transition-all"
          >
            <span className="text-[22px] flex-shrink-0">{s.icon}</span>
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-[13px] font-semibold text-brand-text">{s.title}</span>
              <span className="text-[11px] text-brand-text3">{s.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Msg }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-brand-bg2 border border-brand-border flex items-center justify-center flex-shrink-0">
          <Image src="/logo.png" alt="AI" width={28} height={28} className="rounded-md" />
        </div>
      )}
      <div className={isUser
        ? 'rounded-xl px-3.5 py-2.5 max-w-[75%] bg-brand-bg3 border border-brand-border'
        : 'rounded-xl py-1 max-w-full'
      }>
        {isUser ? (
          <div className="whitespace-pre-wrap text-brand-text text-[14.5px] leading-relaxed">{message.content}</div>
        ) : (
          <div className="vx-md" dangerouslySetInnerHTML={{ __html: parseMd(message.content) }} />
        )}
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-lg bg-brand-bg2 border border-brand-border flex items-center justify-center flex-shrink-0">
        <Image src="/logo.png" alt="AI" width={28} height={28} className="rounded-md" />
      </div>
      <div className="px-4 py-3 flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-text3 animate-typingDot" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-text3 animate-typingDot" style={{ animationDelay: '0.2s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-text3 animate-typingDot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

function ArtifactPane({
  html, tab, setTab, streaming, onDownload, onCopy,
}: {
  html: string
  tab: 'preview' | 'code'
  setTab: (t: 'preview' | 'code') => void
  streaming: boolean
  onDownload: () => void
  onCopy: () => void
}) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (streaming && codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight
  }, [html, streaming])

  async function handleCopy() {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-brand-bg min-w-0">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-brand-border bg-brand-bg2 flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('preview')}
            disabled={streaming}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${tab === 'preview' ? 'bg-brand-bg3 text-brand-text' : 'text-brand-text2 hover:text-brand-text'} ${streaming ? 'opacity-50' : ''}`}
          >
            <Icon name="eye" size={14} /> Preview
          </button>
          <button
            onClick={() => setTab('code')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${tab === 'code' ? 'bg-brand-bg3 text-brand-text' : 'text-brand-text2 hover:text-brand-text'}`}
          >
            <Icon name="code" size={14} /> Code
            {streaming && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-blink ml-1" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {streaming && (
            <span className="flex items-center gap-1.5 text-[11px] text-brand-text2 font-medium mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-blink" />
              writing…
            </span>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 bg-brand-bg3 border border-brand-border rounded-md text-brand-text text-[11px] font-medium hover:bg-brand-bg2 hover:border-brand-borderH transition-all">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={onDownload} className="flex items-center gap-1 px-3 py-1.5 bg-brand-bg3 border border-brand-border rounded-md text-brand-text text-[11px] font-medium hover:bg-brand-bg2 hover:border-brand-borderH transition-all">
            <Icon name="download" size={13} /> ZIP
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {tab === 'preview' ? (
          <iframe
            srcDoc={html}
            title="VIXCELL Preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-none bg-white"
          />
        ) : (
          <pre ref={codeRef} className="m-0 p-4 text-[12px] leading-snug font-mono text-emerald-300 bg-[#0a0a0d] h-full overflow-y-auto whitespace-pre-wrap break-words">
            <code>{html}</code>
            {streaming && <span className="inline-block w-2 h-3.5 bg-brand-gold ml-px align-middle animate-blink" />}
          </pre>
        )}
      </div>
    </div>
  )
}
