// Minimal, safe markdown → HTML renderer for AI bubbles.

function esc(s: string): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function parseMd(text: string): string {
  if (!text) return ''
  // Strip our HTML markers — they go to the artifact pane, not the bubble
  let t = text.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim()
  // Also strip incomplete (still-streaming) HTML
  t = t.replace(/===HTML_START===[\s\S]*$/, '').trim()
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

export function extractHTML(content: string): { html: string; streaming: boolean } | null {
  const full = content.match(/===HTML_START===\s*([\s\S]*?)\s*===HTML_END===/)
  if (full) return { html: full[1].trim(), streaming: false }
  const partial = content.match(/===HTML_START===\s*([\s\S]*)/)
  if (partial && partial[1].trim().length > 10) return { html: partial[1].trim(), streaming: true }
  return null
}
