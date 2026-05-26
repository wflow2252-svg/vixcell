// Reads recent posts off a public Facebook page using the same persistent
// Playwright context the agent uses for Gemini. The user signs into FB
// once (in the launched Chromium); the session is reused.
//
// We deliberately keep this conservative: we read post text + reaction
// counts + timestamps from a page's mbasic-like markup, scroll a small
// amount, then leave. Per-page hard cap of 6 posts to keep run-time low.

const { getContext } = require('./browser');

const PAGE_TIMEOUT = 30000;

async function readCompetitorPosts({ fb_page, name, max = 6, onLog = () => {} }) {
  if (!fb_page) return { competitor: name, posts: [], note: 'no fb_page configured' };

  const url = `https://www.facebook.com/${fb_page}`;
  const ctx = await getContext();
  const page = await ctx.newPage();

  try {
    onLog(`[fb] opening ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });

    // If FB shows a login wall instead of the public page, bail out clearly
    // so the user knows to log in once in the Chromium window.
    const loginGate = await page.$('input[name="email"], #login_form');
    if (loginGate) {
      return {
        competitor: name,
        url,
        posts: [],
        note: 'FB shows a login wall — sign into Facebook once in the Chromium window so the agent has a session',
      };
    }

    // Let lazy-loaded posts render. Scroll a few times so we capture
    // 4-6 items even on slow networks.
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
      await page.waitForTimeout(1200);
    }

    // FB's class names rotate, so we read by aria-label / role hints instead.
    // Each "post" lives inside a [role="article"] container.
    const posts = await page.evaluate((cap) => {
      const articles = Array.from(document.querySelectorAll('[role="article"]')).slice(0, cap);
      return articles.map((a) => {
        // Visible text (caption)
        const text = (a.innerText || '').trim().split('\n').slice(0, 12).join(' ').slice(0, 500);

        // Engagement: look for reaction count widgets — FB exposes them as
        // labels like "1.2K reactions" or "كذا تفاعلًا"
        let reactions = 0, comments = 0, shares = 0;
        const labels = Array.from(a.querySelectorAll('[aria-label]'))
          .map((el) => el.getAttribute('aria-label') || '')
          .filter(Boolean);
        for (const l of labels) {
          const lc = l.toLowerCase();
          const num = parseInt((l.match(/[\d.,]+/) || ['0'])[0].replace(/[.,]/g, ''), 10) || 0;
          if (lc.includes('reaction') || lc.includes('تفاعل')) reactions = Math.max(reactions, num);
          if (lc.includes('comment') || lc.includes('تعليق'))   comments  = Math.max(comments,  num);
          if (lc.includes('share') || lc.includes('مشاركة'))    shares    = Math.max(shares,    num);
        }

        // Timestamp link
        const time = a.querySelector('a[href*="/posts/"], a[href*="/videos/"], a[href*="/photos/"]');
        const link = time ? time.href : null;

        return { text, reactions, comments, shares, link };
      }).filter((p) => p.text);
    }, max);

    onLog(`[fb] collected ${posts.length} post(s) from ${name}`);
    return { competitor: name, url, posts };
  } catch (e) {
    onLog(`[fb] failed on ${name}: ${e.message}`);
    return { competitor: name, url, posts: [], note: `error: ${e.message}` };
  } finally {
    try { await page.close(); } catch (_) {}
  }
}

module.exports = { readCompetitorPosts };
