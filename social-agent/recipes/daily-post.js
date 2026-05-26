// Brand-aware, campaign-aware, event-aware daily post.
//
//   1. Load brand_config, current campaign, last 14 posts, upcoming events.
//   2. If an event falls within 2 days AND is "greeting"-eligible, switch to
//      a holiday-greeting post (overrides the campaign theme).
//   3. Otherwise, follow the campaign theme.
//   4. Ask Gemini for: TOPIC, HEADLINE (3-5 Arabic words for the image),
//      SUBHEADING (one line), CAPTION (60-100 words), HASHTAGS, IMAGE_PROMPT.
//   5. Generate the background via Gemini.
//   6. Compose a proper 1080×1080 poster with headline + logo + brand frame.
//   7. Upload, log, post to Facebook.

const { sendPrompt, newConversation } = require('../lib/gemini-web');
const {
  uploadImage,
  logPost,
  getRecentTopics,
  getBrandConfig,
  getCurrentCampaign,
} = require('../lib/supabase');
const { postToFacebook } = require('../lib/meta');
const { buildPoster } = require('../lib/image');
const { getNextEvent, describeToday } = require('../lib/events');
const { buildImagePrompt } = require('../lib/imagePrompts');

function fmtServices(services) {
  if (!services) return '(غير محدد)';
  if (Array.isArray(services)) return services.join('، ');
  return String(services);
}

function buildPrompt({ language, brand, campaign, recent, event, today }) {
  const isAr = language === 'ar';
  const recentList = recent.length
    ? recent.map((r) => `- ${r.topic}`).join('\n')
    : (isAr ? '- (مفيش بوستات قبل كده)' : '- (no previous posts)');

  // Event block — only when an event is within 2 days AND eligible for greeting
  const eventBlock = (event && event.daysUntil <= 2 && event.greeting)
    ? (isAr
        ? `🌟 مناسبة قريبة (مهمة جداً):
- الاسم: ${event.name_ar}
- بُعد: ${event.daysUntil === 0 ? 'اليوم' : event.daysUntil === 1 ? 'بكرا' : `بعد ${event.daysUntil} يوم`}
- النوع: ${event.type}
- اكتب بوست تهنئة بسيط، أنيق، يحط البراند في ملاحظة في الآخر — مش بوست مبيعات`
        : `🌟 Upcoming event (high priority):
- Name: ${event.name_en}
- In: ${event.daysUntil} day(s)
- Type: ${event.type}
- Write a tasteful greeting post — brand mention soft at the end, NOT a sales pitch`)
    : '';

  // Campaign block (only used when no event override)
  const campaignBlock = !eventBlock && campaign
    ? (isAr
        ? `🎯 ثيمة الأسبوع: ${campaign.theme}
الهدف: ${campaign.goal || '—'}
الرسائل المفتاحية: ${(campaign.key_messages || []).join('، ') || '—'}`
        : `🎯 This week's theme: ${campaign.theme}
Goal: ${campaign.goal || '—'}
Key messages: ${(campaign.key_messages || []).join(', ') || '—'}`)
    : (!eventBlock
        ? (isAr
            ? `🎯 مفيش حملة محددة الأسبوع ده — اختار موضوع مفيد متعلق بخدمات ${brand?.brand_name || 'VIXCELL'}`
            : `🎯 No campaign this week — pick a useful topic relevant to ${brand?.brand_name || 'VIXCELL'}'s services`)
        : '');

  const dateBlock = isAr
    ? `📅 اليوم: ${today.arabic_full}${today.isWeekend ? ' (إجازة نهاية الأسبوع)' : ''}`
    : `📅 Today: ${today.english_full}${today.isWeekend ? ' (weekend)' : ''}`;

  if (isAr) {
    return `أنت كاتب محتوى محترف لـ ${brand?.brand_name || 'VIXCELL'} (استوديو ديجيتال في مصر).

${dateBlock}

📌 الـ Brand:
- الاسم: ${brand?.brand_name || 'VIXCELL'}
- الـ tagline: ${brand?.tagline || '—'}
- الخدمات: ${fmtServices(brand?.services)}
- الجمهور: ${brand?.target_audience || 'أصحاب البزنس في مصر'}
- النبرة: ${brand?.tone || 'احترافية، عملية، بدون إيموجي زيادة'}

${eventBlock}
${campaignBlock}

⚠️ تجنّب المواضيع دي (اتعملت آخر ١٤ يوم):
${recentList}

🎬 المهمة:
اكتب بوست عربي احترافي لـ Facebook. مهم جداً تكون الـ HEADLINE قصيرة (٣-٥ كلمات) لأنها هتتكتب على الصورة بخط كبير.

اكتب الرد بالشكل ده بالظبط — مفيش حاجة قبله أو بعده، مفيش markdown:

TOPIC: <كلمتين بالإنجليزي للـ tag>
HEADLINE: <٣-٥ كلمات عربي — العنوان اللي هيتكتب على الصورة، قوي ومباشر>
SUBHEADING: <جملة واحدة عربي قصيرة، تحت العنوان على الصورة>
CAPTION: <البوست كامل ٦٠-١٠٠ كلمة، يبدأ بهوك قوي، فيه قيمة فعلية، CTA ناعمة في الآخر>
HASHTAGS: <٦-٨ هاشتاجات مفصولة بمسافة>
VISUAL_SUBJECT: <١-٣ كلمات بالإنجليزي تصف الـ hero element اللي هيتعرض في وسط الـ poster، مثلاً "metallic dashboard" أو "glass laptop" أو "crescent lantern". هحوّلها لـ prompt احترافي بنفسي>`;
  }

  return `You are a content writer for ${brand?.brand_name || 'VIXCELL'} (digital studio in Egypt).

${dateBlock}

📌 Brand:
- Name: ${brand?.brand_name || 'VIXCELL'}
- Tagline: ${brand?.tagline || '—'}
- Services: ${fmtServices(brand?.services)}
- Audience: ${brand?.target_audience || 'business owners in Egypt/MENA'}
- Tone: ${brand?.tone || 'confident, sharp, modern, no emoji spam'}

${eventBlock}
${campaignBlock}

⚠️ Avoid these topics (covered in last 14 days):
${recentList}

🎬 Task:
Write a professional English Facebook post. IMPORTANT: HEADLINE must be 3-5 words because it goes on the image as large text.

Reply in EXACTLY this format — nothing before/after, no markdown:

TOPIC: <two-word tag>
HEADLINE: <3-5 words — bold image headline>
SUBHEADING: <one short line, sits under headline on image>
CAPTION: <full 60-100 word post: strong hook, real value, soft CTA at the end>
HASHTAGS: <6-8 hashtags separated by spaces>
VISUAL_SUBJECT: <1-3 English words describing the hero element for the poster's center, e.g. "metallic dashboard", "glass laptop", "crescent lantern". I will build the full art-direction prompt myself.>`;
}

function parseResponse(text) {
  const grab = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`));
    return m ? m[1].trim() : '';
  };
  return {
    topic:         grab('TOPIC'),
    headline:      grab('HEADLINE'),
    subheading:    grab('SUBHEADING'),
    caption:       grab('CAPTION'),
    hashtags:      grab('HASHTAGS').split(/\s+/).filter(Boolean),
    visualSubject: grab('VISUAL_SUBJECT'),
  };
}

async function run({ language, log = console.log }) {
  const today = describeToday();
  const event = getNextEvent({ daysAhead: 5 });
  log(`[${language}] ${today.arabic_full}${event ? ` · next event: ${event.name_ar} (in ${event.daysUntil}d)` : ' · no upcoming events'}`);

  log(`[${language}] Loading brand + campaign + recent posts…`);
  let [brand, campaign, recent] = await Promise.all([
    getBrandConfig(),
    getCurrentCampaign(),
    getRecentTopics({ language, days: 14, limit: 14 }),
  ]);
  log(`[${language}] Brand: ${brand?.brand_name || '(none)'} · Campaign: ${campaign?.theme || '(none)'} · Recent: ${recent.length}`);

  // Auto-generate this week's campaign if missing. Runs at most once a week
  // (the first daily-post of the week triggers it; subsequent posts reuse it).
  if (!campaign) {
    log(`[${language}] 📊 No campaign for this week yet — generating one from competitor FB data first…`);
    try {
      const market = require('./market-analysis');
      await market.run({ log });
      campaign = await getCurrentCampaign();
      log(`[${language}] ✅ Campaign generated: ${campaign?.theme || '(theme unclear)'}`);
    } catch (e) {
      log(`[${language}] ⚠️ Auto-strategy failed (${e.message}). Continuing without campaign.`);
    }
  }

  log(`[${language}] Asking Gemini for headline + caption + visual subject…`);
  await newConversation();
  const step1 = await sendPrompt(
    buildPrompt({ language, brand, campaign, recent, event, today }),
    { onLog: log }
  );
  const parsed = parseResponse(step1.text);
  if (!parsed.caption || !parsed.visualSubject) {
    throw new Error(`Gemini response didn't match expected format. Got: ${step1.text.slice(0, 500)}`);
  }
  log(`[${language}] Topic: ${parsed.topic} · Headline: "${parsed.headline}" · Visual: "${parsed.visualSubject}"`);

  // Build the full art-direction prompt from our curated template library
  // — we don't trust Gemini to art-direct itself.
  const imagePrompt = buildImagePrompt({
    topic:   parsed.topic,
    hook:    parsed.headline,
    subject: parsed.visualSubject,
    accent:  brand?.brand_colors?.primary || '#c8a35c',
  });
  log(`[${language}] Image prompt template: ${imagePrompt.match(/\[Template: ([^\]]+)\]/)?.[1] || 'fallback'}`);

  log(`[${language}] Asking Gemini to generate the background image…`);
  const step2 = await sendPrompt(`Generate an image: ${imagePrompt}`, { onLog: log });

  let imageUrl = null;
  if (step2.images.length > 0) {
    const raw = step2.images[0];
    log(`[${language}] Composing professional poster (headline + logo + frame)…`);
    const useEventBadge = event && event.daysUntil <= 2 && event.greeting;
    const branded = await buildPoster(raw.buffer, {
      headline:   parsed.headline,
      subheading: parsed.subheading,
      eventBadge: useEventBadge ? (language === 'ar' ? event.name_ar : event.name_en) : null,
      eventMotif: useEventBadge ? event.motif : null,
      brandName:  brand?.brand_name || 'VIXCELL',
      tagline:    brand?.tagline,
      services:   Array.isArray(brand?.services) ? brand.services : [],
      contact:    brand?.website || 'vixcell.com',
      logoUrl:    brand?.logo_url,
      accent:     brand?.brand_colors?.primary || '#c8a35c',
    });
    const slug = `${language}-${(parsed.topic || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
    log(`[${language}] Uploading composed poster to Supabase (${slug})…`);
    imageUrl = await uploadImage(branded, slug, 'image/png');
    log(`[${language}] Image URL: ${imageUrl}`);
  } else {
    log(`[${language}] ⚠️ Gemini didn't return an image. Continuing text-only.`);
  }

  const fullCaption = parsed.hashtags.length
    ? `${parsed.caption}\n\n${parsed.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
    : parsed.caption;

  log(`[${language}] Posting to Facebook…`);
  let fbResult;
  try {
    fbResult = await postToFacebook({ caption: fullCaption, imageUrl });
    if (fbResult.skipped) {
      log(`[${language}] FB skipped: ${fbResult.reason}`);
    } else {
      log(`[${language}] FB post_id: ${fbResult.post_id}`);
    }
  } catch (e) {
    log(`[${language}] FB failed: ${e.message}`);
    fbResult = { error: e.message };
  }

  log(`[${language}] Logging to social_posts table…`);
  await logPost({
    platform: 'facebook',
    language,
    caption: fullCaption,
    hashtags: parsed.hashtags,
    image_url: imageUrl,
    topic: parsed.topic,
    external_post_id: fbResult?.post_id || null,
    status: fbResult?.post_id ? 'published' : (fbResult?.skipped ? 'draft' : 'failed'),
    error: fbResult?.error || null,
    posted_at: fbResult?.post_id ? new Date().toISOString() : null,
  });

  log(`[${language}] ✅ Done.`);
  return {
    language,
    topic: parsed.topic,
    headline: parsed.headline,
    caption: fullCaption,
    imageUrl,
    event: event?.name_ar || null,
    campaign: campaign?.theme || null,
    facebook: fbResult,
  };
}

module.exports = { run };
