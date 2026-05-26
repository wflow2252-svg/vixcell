// Weekly market analysis + campaign strategy.
//
// Loads the brand + competitor list, asks Gemini to research each competitor's
// recent positioning, then synthesise:
//   1. A market report (saved to market_reports)
//   2. The week's campaign — theme + goal + key messages + 7 daily prompts
//      (saved to campaigns; daily-post recipes pick this up automatically)

const { sendPrompt, newConversation } = require('../lib/gemini-web');
const {
  saveMarketReport,
  getBrandConfig,
  getCompetitors,
  saveCampaign,
  thisWeekStart,
} = require('../lib/supabase');

function buildResearchPrompt(brand, competitors) {
  const list = competitors.length
    ? competitors.map((c, i) =>
        `${i + 1}. ${c.name}` +
        (c.url ? `  —  ${c.url}` : '') +
        (c.fb_page ? `  —  fb.com/${c.fb_page}` : '') +
        (c.notes ? `\n   ملاحظات: ${c.notes}` : '')
      ).join('\n')
    : '(مفيش منافسين محددين في قاعدة البيانات)';

  return `أنت محلل سوق ومستشار محتوى رقمي لـ ${brand?.brand_name || 'VIXCELL'} — استوديو ديجيتال في مصر/الشرق الأوسط.

📌 الـ Brand:
- الاسم: ${brand?.brand_name || 'VIXCELL'}
- الـ tagline: ${brand?.tagline || '—'}
- الخدمات: ${Array.isArray(brand?.services) ? brand.services.join('، ') : '—'}
- الجمهور: ${brand?.target_audience || 'أصحاب البزنس في مصر و MENA'}

🏢 المنافسون المعروفون:
${list}

🎬 المهمة:
ابحث (من معرفتك الحالية + أي مصدر معروف) عن:
1. كل منافس: إيه اللي بيركز عليه دلوقتي؟ نقاط قوته؟ ضعفه أو الفرص اللي مش شاغل عليها؟
2. تريندات السوق في الويب/AI/تطبيقات في مصر/MENA الأسبوع/الشهر ده.
3. الـ gaps اللي يقدر ${brand?.brand_name || 'VIXCELL'} يدخلها.

ثم اختر **ثيمة الأسبوع** (تركيز محتوى محدد، مش مجرد "marketing")، واكتب **٧ مواضيع بوستات** يومية متماشية مع الثيمة.

اكتب الرد بالـ Markdown ده بالظبط (لا تضيف نص قبله أو بعده):

## تحليل المنافسين
- **<اسم المنافس>**: <نقاط القوة + الضعف + الفرصة لينا، ٢-٣ سطور لكل واحد>
- ... (لكل منافس)

## تريندات السوق الحالية
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
KEY_MESSAGES: <فاصلة بين كل رسالة وأخرى، ٣-٥ رسائل مفتاحية>

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
  log(`Brand: ${brand?.brand_name || '(none)'} · Competitors tracked: ${competitors.length}`);

  await newConversation();

  log('Asking Gemini for market analysis + weekly strategy…');
  const resp = await sendPrompt(buildResearchPrompt(brand, competitors), { onLog: log });
  const text = resp.text;
  if (!text || text.length < 200) {
    throw new Error(`Market analysis response too short: ${text}`);
  }

  // ─── Parse sections ─────────────────────────────────────
  const competitorAnalysis = extractSection(text, 'تحليل المنافسين');
  const trends             = extractSection(text, 'تريندات السوق الحالية');
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
      strategyBody: [competitorAnalysis, trends, gaps, dailyPrompts.length ? '## مواضيع البوستات\n' + dailyPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n') : ''].filter(Boolean).join('\n\n'),
    });
    log(`✅ Campaign saved. Next daily-post will use this theme automatically.`);
  } else {
    log('⚠️ No THEME extracted from Gemini response — campaign not saved.');
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
  };
}

module.exports = { run };
