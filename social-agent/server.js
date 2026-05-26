// VIXCELL Social Agent — local HTTP + WebSocket server.
// Drives Gemini Web UI via Playwright and posts to social media.
//
// Run with:   npm start
// Dashboard:  Add this to web/.env.local:
//               VITE_SOCIAL_AGENT_URL=http://localhost:3001
//               VITE_SOCIAL_AGENT_TOKEN=<same as AGENT_TOKEN in .env>

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const browser = require('./lib/browser');

const PORT = parseInt(process.env.PORT || '3001', 10);
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);

if (!AGENT_TOKEN || AGENT_TOKEN === 'change-me-to-a-random-string') {
  console.error('❌ AGENT_TOKEN not set in .env. Set a random string before running.');
  process.exit(1);
}

// ─── Recipe registry ───────────────────────────────────────────────
const recipes = {
  'daily-post-ar': () => require('./recipes/daily-post').run({ language: 'ar', log }),
  'daily-post-en': () => require('./recipes/daily-post').run({ language: 'en', log }),
  'market-analysis': () => require('./recipes/market-analysis').run({ log }),
};

// ─── State ────────────────────────────────────────────────────────
let currentJob = null;
const wsClients = new Set();
let screenshotTimer = null;

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const ws of wsClients) {
    try { if (ws.readyState === 1) ws.send(data); } catch (_) {}
  }
}

function log(...args) {
  const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  console.log('[agent]', text);
  broadcast({ type: 'log', text, ts: Date.now() });
}

async function startScreenshotStream() {
  if (screenshotTimer) return;
  screenshotTimer = setInterval(async () => {
    if (wsClients.size === 0) { stopScreenshotStream(); return; }
    try {
      const buf = await browser.screenshot();
      broadcast({ type: 'screenshot', data: buf.toString('base64'), ts: Date.now() });
    } catch (e) {
      // Browser not ready yet — silent.
    }
  }, 1000);
}

function stopScreenshotStream() {
  if (screenshotTimer) {
    clearInterval(screenshotTimer);
    screenshotTimer = null;
  }
}

// ─── HTTP server ──────────────────────────────────────────────────
const app = express();

// Private Network Access preflight — Chrome 113+ blocks requests from HTTPS
// origins (vixcell.com) to private networks (localhost) unless the server
// explicitly opts in by responding to the preflight with
// `Access-Control-Allow-Private-Network: true`. This middleware MUST run
// before cors() and before the WebSocketServer upgrade handler.
//   https://developer.chrome.com/blog/private-network-access-preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowedOrigin = origin && ALLOWED.some(a => origin === a || origin.startsWith(a));

  // Set PNA header on every response from an allowed origin (cheap, harmless).
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }

  // Answer PNA preflights directly so the cors() middleware doesn't reject them.
  if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) {
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-agent-token');
      res.setHeader('Access-Control-Max-Age', '7200');
      return res.status(204).end();
    }
    return res.status(403).end();
  }
  next();
});

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED.some(a => origin === a || origin.startsWith(a))) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());

function auth(req, res, next) {
  const token = req.headers['x-agent-token'] || req.query.token;
  if (token !== AGENT_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Friendly landing page so the admin can confirm the server is up by just
// visiting http://localhost:3001 in a browser.
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<html dir="rtl" lang="ar"><meta charset="utf-8"><title>VIXCELL Social Agent</title>
<style>
  body { background:#0c0c0e; color:#e8e8ed; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .card { max-width:520px; padding:32px; text-align:center; }
  h1 { color:#c8a35c; margin:0 0 16px; }
  .dot { display:inline-block; width:10px; height:10px; border-radius:50%; background:#22c55e; margin-inline-end:6px; }
  code { background:#1a1a1f; color:#c8a35c; padding:3px 8px; border-radius:5px; font-size:13px; }
  a { color:#c8a35c; }
  ul { text-align:start; line-height:2; }
</style>
<div class="card">
  <h1>🤖 VIXCELL Social Agent</h1>
  <p><span class="dot"></span> السيرفر شغّال على المنفذ ${PORT}</p>
  <p>الـ Recipes المتاحة: <code>${Object.keys(recipes).join('</code>, <code>')}</code></p>
  <p>الحالة: <code>${currentJob ? 'مهمة شغالة: '+currentJob.recipe : 'في انتظار أمر من الداش بورد'}</code></p>
  <hr style="border-color:#1a1a1f; margin:24px 0;">
  <p>عشان تتحكم فيه:</p>
  <ul>
    <li>روح <a href="https://vixcell.com/admin">vixcell.com/admin</a></li>
    <li>سجّل دخول بـ Google</li>
    <li>اضغط تاب <strong>🤖 Social Agent</strong></li>
    <li>اضغط <strong>⚙️ إعدادات</strong> وحط الـ AGENT_TOKEN</li>
  </ul>
</div>
</html>`);
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    version: '1.0.0',
    recipes: Object.keys(recipes),
    job: currentJob ? { id: currentJob.id, recipe: currentJob.recipe, startedAt: currentJob.startedAt } : null,
  });
});

app.post('/run/:recipe', auth, async (req, res) => {
  const recipe = req.params.recipe;
  if (!recipes[recipe]) return res.status(404).json({ error: `Unknown recipe: ${recipe}` });
  if (currentJob) return res.status(409).json({ error: 'A job is already running', job: currentJob });

  const jobId = `${recipe}-${Date.now()}`;
  currentJob = { id: jobId, recipe, startedAt: new Date().toISOString() };
  res.status(202).json({ jobId, recipe });

  log(`▶️ Starting ${recipe} (job ${jobId})`);
  await startScreenshotStream();

  try {
    const result = await recipes[recipe]();
    log(`✅ ${recipe} completed`);
    broadcast({ type: 'done', jobId, recipe, result });
  } catch (err) {
    console.error('[agent] recipe failed:', err);
    log(`❌ ${recipe} failed: ${err.message}`);
    broadcast({ type: 'error', jobId, recipe, error: err.message, details: err.details || null });
  } finally {
    currentJob = null;
  }
});

app.post('/stop', auth, async (req, res) => {
  if (!currentJob) return res.json({ ok: true, message: 'No job running' });
  log('🛑 Stop requested — closing browser');
  await browser.close();
  currentJob = null;
  res.json({ ok: true });
});

app.get('/screenshot', auth, async (req, res) => {
  try {
    const buf = await browser.screenshot();
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── WebSocket ────────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('token') !== AGENT_TOKEN) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', recipes: Object.keys(recipes), job: currentJob }));
  log(`Dashboard connected (${wsClients.size} client${wsClients.size === 1 ? '' : 's'})`);

  ws.on('close', () => {
    wsClients.delete(ws);
    if (wsClients.size === 0) stopScreenshotStream();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 VIXCELL Social Agent running on http://localhost:${PORT}`);
  console.log(`   Allowed origins: ${ALLOWED.join(', ')}`);
  console.log(`   Recipes: ${Object.keys(recipes).join(', ')}`);
  console.log('');
  console.log('   First run: a Chromium window will open — sign in to Gemini once,');
  console.log('   then the session persists for future runs.');
});

process.on('SIGINT', async () => {
  console.log('\n[agent] Shutting down…');
  await browser.close();
  process.exit(0);
});
