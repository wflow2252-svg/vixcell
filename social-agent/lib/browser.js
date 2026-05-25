// Singleton Playwright browser with persistent context.
// User logs into Gemini once; the session persists across runs.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

let ctx = null;
let page = null;

async function getContext() {
  if (ctx) return ctx;

  const profileDir = path.resolve(process.env.BROWSER_PROFILE_DIR || './browser-profile');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

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

module.exports = { getContext, getPage, screenshot, close };
