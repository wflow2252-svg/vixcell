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
