// Singleton Playwright browser with persistent context.
// User logs into Gemini once; the session persists across runs.

const { chromium } = require('playwright');
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let ctx = null;
let page = null;

// Kill any leftover Playwright Chromium processes from a previous crashed run
// so the persistent profile isn't locked when we launch a new one. Cheap
// to call on every getContext() — only does anything if zombies exist.
function killZombieChromiums() {
  if (process.platform !== 'win32') return; // POSIX cleans up properly via Playwright's own kill
  try {
    // wmic is deprecated in Win11 but still present; use it to filter by path
    const r = spawnSync('wmic', [
      'process', 'where',
      "name='chrome.exe' and executablepath like '%ms-playwright%'",
      'get', 'processid', '/value',
    ], { encoding: 'utf8' });
    const out = (r.stdout || '');
    const pids = [...out.matchAll(/ProcessId=(\d+)/g)].map((m) => m[1]).filter(Boolean);
    for (const pid of pids) {
      try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (_) {}
    }
    if (pids.length) console.log(`[browser] cleaned up ${pids.length} zombie Chromium process(es)`);
  } catch (_) { /* silent — best-effort */ }
}

// Remove the Singleton* lock files Chrome writes into the profile. They're
// supposed to be cleaned up on exit but stick around if the process crashed.
function removeStaleLocks(profileDir) {
  try {
    for (const name of fs.readdirSync(profileDir)) {
      if (name.startsWith('Singleton')) {
        try { fs.unlinkSync(path.join(profileDir, name)); } catch (_) {}
      }
    }
  } catch (_) { /* profile dir might not exist yet */ }
}

async function getContext() {
  if (ctx) return ctx;

  const profileDir = path.resolve(process.env.BROWSER_PROFILE_DIR || './browser-profile');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  // Best-effort cleanup before launch so a crashed previous run doesn't block us.
  killZombieChromiums();
  removeStaleLocks(profileDir);

  ctx = await chromium.launchPersistentContext(profileDir, {
    headless: process.env.HEADED !== 'true',
    viewport: { width: 1280, height: 800 },
    locale: 'ar-EG',
    timezoneId: 'Africa/Cairo',
    args: ['--disable-blink-features=AutomationControlled'],
  });

  ctx.on('close', () => { ctx = null; page = null; });
  return ctx;
}

async function getPage() {
  const c = await getContext();
  if (page && !page.isClosed()) return page;
  page = c.pages()[0] || (await c.newPage());
  return page;
}

async function screenshot() {
  const p = await getPage();
  return p.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
}

async function close() {
  if (ctx) {
    try { await ctx.close(); } catch (_) {}
    ctx = null; page = null;
  }
}

// Make sure we kill the browser when the server shuts down so we don't leave
// zombies for next time.
for (const sig of ['SIGINT', 'SIGTERM', 'beforeExit']) {
  process.once(sig, () => {
    if (ctx) {
      try { ctx.close(); } catch (_) {}
    }
  });
}

module.exports = { getContext, getPage, screenshot, close };
