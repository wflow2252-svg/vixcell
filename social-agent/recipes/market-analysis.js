// Weekly market analysis + campaign strategy — FB-aware version.
//
// Instead of asking Gemini "what are competitors doing?" (which hallucinates),
// we actually visit each competitor's Facebook page via Playwright, scrape
// their recent posts + engagement, then feed REAL data to Gemini so it
// synthesises a grounded report and a week's campaign.

const { sendPrompt, newConversation, ensureGeminiPage } = require('../lib/gemini-web');
const {
  saveMarketReport,
  getBrandConfig,
  getCompetitors,
  saveCampaign,
  thisWeekStart,
  downloadAsBuffer,
} = require('../lib/supabase');
const { readCompetitorPosts } = require('../lib/fb-scrape');
const fs = require('fs');
const path = require('path');
const os = require('os');

function summarisePosts(posts, competitor) {
  if (!posts.length) return '(لم نتمكن من قراءة بوستات)';
  return posts.map((p, i) => {
    const eng = `${p.reactions || 0}❤  ${p.comments || 0}💬  ${p.shares || 0}↪`;
    const imgRef = p._imageRef ? ` [الصورة المرفقة: ${p._imageRef}]` : '';
    return `  ${i + 1}. [${eng}]${imgRef} ${(p.text || '').slice(0, 200)}`;
  }).join('\n');
}

// Pick up to N best-performing posts (by engagement) that have an image,
// download the top image of each, save to temp file, return the file paths
// plus a labelled mapping so Gemini can reference them in its analysis.
async function downloadTopImages(scraped, { max = 6, onLog = () => {} } = {}) {
  const candidates = [];
  for (const c of scraped) {
    for (const p of c.posts) {
      if (!p.images?.length) continue;
      const score = (p.reactions || 0) + (p.comments || 0) * 2 + (p.shares || 0) * 3;
      candidates.push({ competitor: c.competitor, post: p, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const tmpDir = path.join(os.tmpdir(), `vixcell-fb-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const files = [];
  for (const { competitor, post } of candidates.slice(0, max)) {
    try {
      const buf = await downloadAsBuffer(post.images[0]);
      if (!buf) continue;
      const safeName = competitor.replace(/[^a-z0-9_-]/gi, '_').slice(0, 20);
      const label = `${safeName}-${files.length + 1}`;
      const filePath = path.join(tmpDir, `${label}.jpg`);
      fs.writeFileSync(filePath, buf);
      post._imageRef = label; // so summarisePosts can mention it
      files.push({ path: filePath, label, competitor });
      onLog(`[market] downloaded image: ${label} (${(buf.length / 1024).toFixed(0)}kB)`);
    } catch (e) {
      onLog(`[market] download failed for ${competitor}: ${e.message}`);
    }
  }
  return { files, tmpDir };
}

function buildResearchPrompt(brand, scraped, imageFiles) {
  const blocks = scraped.length
    ? scraped.map((c) => {
        const header = `### ${c.competitor}${c.url ? ` — ${c.url}` : ''}`;
        if (c.note && !c.posts.length) return `${header}\nملاحظة: ${c.note}\n`;
        return `${header}\n${summarisePosts(c.posts, c.competitor)}\n`;
      }).join('\n')
    : '(لا يوجد منافسين متتبعين)';

  const imagesBlock = imageFiles?.length
    ? `\n🖼️ مرفق مع الرسالة دي ${imageFiles.length} صورة من بوستات المنافسين (الأعلى engagement) — اسماء الصور بالترتيب: ${imageFiles.map(f => f.label).join('، ')}. حلل كل صورة من ناحية: الستايل البصري، الألوان، التايبوجرافي، نوع الصورة (3D, photography, illustration)، إيش بيخلي الصورة لافتة للنظر.\n`
    : '';

  return `أنت محلل سوق ومستشار محتوى رقمي لـ ${brand?.brand_name || 'VIXCELL'} — استوديو ديجيتال في مصر/الشرق الأوسط.

${imagesBlock}

📌 الـ Brand:
- الاسم: ${brand?.brand_name || 'VIXCELL'}
- الـ tagline: ${brand?.tagline || '—'}
- الخدمات: ${Array.isArray(brand?.services) ? brand.services.join('، ') : '—'}
- الجمهور: ${brand?.target_audience || 'أصحاب البزنس في مصر و MENA'}

📊 بيانات حقيقية من Facebook لبوستات المنافسين الأخيرة:

${blocks}

🎬 المهمة:
بناءً على البيانات الحقيقية فوق (مش معلوماتك العامة)، حلّل:
1. كل منافس: إيه الـ themes اللي بيركز عليها دلوقتي؟ نقاط القوة (اللي مقاسة بالـ engagement)؟ ضعف أو فرص لينا؟
2. تريندات مشتركة بين المنافسين الأسبوع ده.
3. ثغرات يقدر ${brand?.brand_name || 'VIXCELL'} يستغلها (مواضيع متغطّاش، نبرة مفقودة، إلخ).

ثم اختر **ثيمة الأسبوع** لـ ${brand?.brand_name || 'VIXCELL'} واكتب **٧ مواضيع بوستات يومية** متماشية.

اكتب الرد بالـ Markdown ده بالظبط:

## تحليل بصري للصور المرفقة
- **<اسم الصورة>**: <الستايل + الألوان + التايبوجرافي + إيش بيخلي الصورة شغّالة، ٣ سطور لكل صورة>
- ... (لكل صورة مرفقة)

## تحليل المنافسين (مبني على البيانات الحقيقية)
- **<اسم المنافس>**: <ملخّص نشاطه + ٢-٣ ثيمات شغّال عليها + توصية لينا، ٣-٤ سطور>
- ... (لكل منافس)

## تريندات مشتركة الأسبوع
- <bullet>
- <bullet>
- <bullet>

## ثغرات يقدر ${brand?.brand_name || 'VIXCELL'} يدخلها
- <bullet>
- <bullet>
- <bullet>

## ثيمة الأسبوع
THEME: <جملة قصيرة عن الثيمة>
GOAL: <جملة عن الهدف>
KEY_MESSAGES: <فاصلة بين كل رسالة، ٣-٥ رسائل>

## مواضيع البوستات (٧ أيام)
DAY_1: <موضوع البوست>
DAY_2: <موضوع البوست>
DAY_3: <موضوع البوست>
DAY_4: <موضوع البوست>
DAY_5: <موضوع البوست>
DAY_6: <موضوع البوست>
DAY_7: <موضوع البوست>

## TL;DR
SUMMARY: <جملة واحدة تلخّص أهم نقطة وأهم action>`;
}

function extractSection(text, header) {
  const re = new RegExp(`##\\s*${header}\\s*([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function extractField(text, key) {
  const re = new RegExp(`${key}:\\s*(.+)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function extractDailyPrompts(text) {
  const prompts = [];
  for (let i = 1; i <= 7; i++) {
    const m = text.match(new RegExp(`DAY_${i}:\\s*(.+)`, 'i'));
    if (m) prompts.push(m[1].trim());
  }
  return prompts;
}

async function run({ log = console.log }) {
  log('Loading brand + competitors…');
  const [brand, competitors] = await Promise.all([
    getBrandConfig(),
    getCompetitors(),
  ]);
  log(`Brand: ${brand?.brand_name || '(none)'} · Competitors: ${competitors.length}`);

  if (!competitors.length) {
    throw new Error('مفيش منافسين في قاعدة البيانات. روح Brand tab وضيف منافسين أولاً.');
  }

  // Bring up the persistent browser so the scraper reuses the same context
  await ensureGeminiPage().catch(() => {});

  // Visit each competitor's Facebook page and collect real post data
  log(`Scraping Facebook for ${competitors.length} competitor(s)…`);
  const scraped = [];
  for (const c of competitors) {
    if (!c.fb_page) {
      scraped.push({ competitor: c.name, posts: [], note: 'no fb_page configured' });
      continue;
    }
    const data = await readCompetitorPosts({ fb_page: c.fb_page, name: c.name, max: 6, onLog: log });
    scraped.push(data);
  }

  const totalPosts = scraped.reduce((a, c) => a + c.posts.length, 0);
  log(`Scraped ${totalPosts} post(s) total across ${scraped.length} competitor(s)`);

  // Download the highest-engagement images so Gemini can visually analyse them
  log('Downloading top competitor images for visual analysis…');
  const { files: imageFiles, tmpDir } = await downloadTopImages(scraped, { max: 6, onLog: log });
  log(`Got ${imageFiles.length} image(s) ready to upload to Gemini`);

  // Send the real data + images to Gemini for synthesis
  await newConversation();
  log('Asking Gemini to analyse images + posts and synthesise a strategy…');
  const resp = await sendPrompt(buildResearchPrompt(brand, scraped, imageFiles), {
    onLog: log,
    files: imageFiles.map(f => f.path),
  });

  // Clean up temp images
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  const text = resp.text;
  if (!text || text.length < 200) {
    throw new Error(`Analysis response too short: ${text}`);
  }

  // ─── Parse sections ─────────────────────────────────────
  const competitorAnalysis = extractSection(text, 'تحليل المنافسين.*');
  const trends             = extractSection(text, 'تريندات مشتركة.*');
  const gaps               = extractSection(text, 'ثغرات.*');
  const theme              = extractField(text, 'THEME');
  const goal               = extractField(text, 'GOAL');
  const keyMessages        = extractField(text, 'KEY_MESSAGES').split(/،|,/).map((s) => s.trim()).filter(Boolean);
  const dailyPrompts       = extractDailyPrompts(text);
  const summary            = extractField(text, 'SUMMARY') || text.slice(0, 200);

  const periodEnd   = new Date().toISOString().slice(0, 10);
  const periodStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekStart   = thisWeekStart();

  log('Saving market report…');
  const report = await saveMarketReport({
    period_start: periodStart,
    period_end:   periodEnd,
    summary,
    body:         text,
    generated_at: new Date().toISOString(),
  });
  log(`Report saved: ${report.id}`);

  if (theme) {
    log(`Saving campaign for week ${weekStart} — theme: ${theme}`);
    await saveCampaign({
      weekStart,
      theme,
      goal,
      keyMessages,
      strategyBody: [
        competitorAnalysis,
        trends,
        gaps,
        dailyPrompts.length ? '## مواضيع البوستات\n' + dailyPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n') : '',
      ].filter(Boolean).join('\n\n'),
    });
    log('✅ Campaign saved. Next daily-post will use this theme.');
  } else {
    log('⚠️ No THEME extracted — campaign not saved.');
  }

  return {
    reportId: report.id,
    periodStart,
    periodEnd,
    summary,
    theme,
    goal,
    keyMessages,
    dailyPrompts,
    competitorsScraped: scraped.length,
    postsScraped: totalPosts,
  };
}

module.exports = { run };
