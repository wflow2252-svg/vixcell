// Weekly market analysis recipe.
// Asks Gemini for a market report focused on web/AI agencies in Egypt + MENA,
// saves to market_reports table.

const { sendPrompt, newConversation } = require('../lib/gemini-web');
const { saveMarketReport } = require('../lib/supabase');

const PROMPT = (periodStart, periodEnd) => `أنت محلل سوق لشركة VIXCELL (تصميم وتطوير ويب + AI في مصر/الشرق الأوسط).

اكتب تقرير سوق أسبوعي للفترة من ${periodStart} لـ ${periodEnd}. ركّز على:

1. **التريندات الحالية** في الويب / AI / تطبيقات الموبايل في مصر والمنطقة
2. **منافسين رئيسيين** ايه اللي بيعملوه (أمثلة محددة لو ممكن)
3. **فرص** لـ VIXCELL ممكن تستغلها الأسبوع الجاي
4. **توصيات محتوى** ٣-٥ أفكار لبوستات تحقق engagement عالي

اكتب التقرير بـ Markdown منظم بـ headers (##) واستخدم bullet points. كن محدد ومش عام.

في آخر السطر اكتب على سطر منفصل:
SUMMARY: <جملة واحدة تلخّص أهم نقطة في التقرير>`;

async function run({ log = console.log }) {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 86400000);
  const periodStart = start.toISOString().slice(0, 10);
  const periodEnd = now.toISOString().slice(0, 10);

  log('Loading new Gemini conversation…');
  await newConversation();

  log(`Asking Gemini for market analysis ${periodStart} → ${periodEnd}…`);
  const resp = await sendPrompt(PROMPT(periodStart, periodEnd), { onLog: log });
  const text = resp.text;
  if (!text || text.length < 100) {
    throw new Error(`Market analysis response too short: ${text}`);
  }

  const summaryMatch = text.match(/SUMMARY:\s*(.+)$/);
  const summary = summaryMatch ? summaryMatch[1].trim() : text.slice(0, 200);
  const body = summaryMatch ? text.replace(/SUMMARY:.+$/, '').trim() : text;

  log('Saving market_reports row…');
  const report = await saveMarketReport({
    period_start: periodStart,
    period_end: periodEnd,
    summary,
    body,
    generated_at: now.toISOString(),
  });

  log(`✅ Report saved: ${report.id}`);
  return { reportId: report.id, periodStart, periodEnd, summary };
}

module.exports = { run };
