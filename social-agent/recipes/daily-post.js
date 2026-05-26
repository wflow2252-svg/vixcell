// Daily post recipe — brand-aware, campaign-aware version.
//
// Loads brand_config + current week's campaign + the last 14 posts, builds
// a rich prompt for Gemini, scrapes the response, generates an image,
// composites the brand logo onto it, uploads everything to Supabase, and
// (optionally) posts to Facebook.

const { sendPrompt, newConversation } = require('../lib/gemini-web');
const {
  uploadImage,
  logPost,
  getRecentTopics,
  getBrandConfig,
  getCurrentCampaign,
} = require('../lib/supabase');
const { postToFacebook } = require('../lib/meta');
const { applyBrandFinish } = require('../lib/image');

function fmtServices(services) {
  if (!services) return '(غير محدد)';
  if (Array.isArray(services)) return services.join('، ');
  return String(services);
}

function buildPrompt({ language, brand, campaign, recent }) {
  const isAr = language === 'ar';
  const recentList = recent.length
    ? recent.map((r) => `- ${r.topic}`).join('\n')
    : (isAr ? '- (مفيش بوستات قبل كده)' : '- (no previous posts)');

  const campaignBlock = campaign
    ? (isAr
        ? `🎯 ثيمة الأسبوع: ${campaign.theme}
الهدف: ${campaign.goal || '(غير محدد)'}
الرسائل المفتاحية: ${(campaign.key_messages || []).join('، ') || '(غير محدد)'}`
        : `🎯 This week's theme: ${campaign.theme}
Goal: ${campaign.goal || '(unspecified)'}
Key messages: ${(campaign.key_messages || []).join(', ') || '(unspecified)'}`)
    : (isAr
        ? `🎯 ثيمة الأسبوع: مفيش حملة محددة — اختار موضوع متعلق بخدمات ${brand?.brand_name || 'VIXCELL'}`
        : `🎯 This week's theme: no campaign set — pick a topic relevant to ${brand?.brand_name || 'VIXCELL'}'s services`);

  if (isAr) {
    return `أنت كاتب محتوى محترف لـ ${brand?.brand_name || 'VIXCELL'}.

📌 الـ Brand:
- الاسم: ${brand?.brand_name || 'VIXCELL'}
- الـ tagline: ${brand?.tagline || '—'}
- الوصف: ${brand?.description || '—'}
- الخدمات: ${fmtServices(brand?.services)}
- الجمهور المستهدف: ${brand?.target_audience || '—'}
- النبرة: ${brand?.tone || 'احترافية، حادة، عملية'}
- الموقع: ${brand?.website || 'vixcell.com'}

${campaignBlock}

⚠️ المواضيع اللي اتعملت آخر ١٤ يوم (تجنّبها):
${recentList}

🎬 المهمة:
اكتب بوست عربي قصير لـ Facebook (٦٠-٩٠ كلمة) يجذب أصحاب البزنس في مصر والشرق الأوسط، متماشي مع ثيمة الأسبوع.

اكتب الرد بالشكل ده بالظبط (مفيش حاجة قبله أو بعده):

TOPIC: <كلمتين عن الموضوع بالإنجليزي للـ tag>
HOOK: <جملة افتتاح قوية، ٨-١٢ كلمة>
CAPTION: <البوست هنا — هوك في الأول + معلومة قيمة + CTA ناعمة في الآخر تذكر ${brand?.brand_name || 'VIXCELL'}>
HASHTAGS: <٦-٨ هاشتاجات مفصولة بمسافة، خليط عربي وإنجليزي>
IMAGE_PROMPT: <prompt احترافي بالإنجليزي للصورة — clean modern, brand-safe, no text in image, square 1:1، يعكس ثيمة الأسبوع ولون البراند الأساسي ${brand?.brand_colors?.primary || '#c8a35c'} على خلفية داكنة>`;
  }

  // English
  return `You are a content writer for ${brand?.brand_name || 'VIXCELL'}.

📌 Brand:
- Name: ${brand?.brand_name || 'VIXCELL'}
- Tagline: ${brand?.tagline || '—'}
- Description: ${brand?.description || '—'}
- Services: ${fmtServices(brand?.services)}
- Target audience: ${brand?.target_audience || '—'}
- Tone: ${brand?.tone || 'confident, sharp, modern, no emoji spam'}
- Website: ${brand?.website || 'vixcell.com'}

${campaignBlock}

⚠️ Previously covered (avoid repeating):
${recentList}

🎬 Task:
Write a short English Facebook post (60-90 words) for business owners in Egypt/MENA, aligned with this week's theme.

Reply in EXACTLY this format (nothing else):

TOPIC: <two words about the topic>
HOOK: <strong opening, 8-12 words>
CAPTION: <hook + valuable insight + soft CTA mentioning ${brand?.brand_name || 'VIXCELL'} at the end>
HASHTAGS: <6-8 hashtags separated by spaces>
IMAGE_PROMPT: <professional image prompt — clean modern, brand-safe, no text in image, square 1:1, reflects this week's theme and the brand's primary color ${brand?.brand_colors?.primary || '#c8a35c'} on a dark background>`;
}

function parseResponse(text) {
  const grab = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`));
    return m ? m[1].trim() : '';
  };
  return {
    topic:       grab('TOPIC'),
    hook:        grab('HOOK'),
    caption:     grab('CAPTION'),
    hashtags:    grab('HASHTAGS').split(/\s+/).filter(Boolean),
    imagePrompt: grab('IMAGE_PROMPT'),
  };
}

async function run({ language, log = console.log }) {
  log(`[${language}] Loading brand config + current campaign…`);
  const [brand, campaign, recent] = await Promise.all([
    getBrandConfig(),
    getCurrentCampaign(),
    getRecentTopics({ language, days: 14, limit: 14 }),
  ]);
  log(`[${language}] Brand: ${brand?.brand_name || '(none)'} · Campaign: ${campaign?.theme || '(no campaign — generic post)'} · Recent: ${recent.length}`);

  log(`[${language}] Asking Gemini for caption + image prompt…`);
  await newConversation();
  const step1 = await sendPrompt(buildPrompt({ language, brand, campaign, recent }), { onLog: log });
  const parsed = parseResponse(step1.text);
  if (!parsed.caption || !parsed.imagePrompt) {
    throw new Error(`Gemini response didn't match expected format. Got: ${step1.text.slice(0, 500)}`);
  }
  log(`[${language}] Topic: ${parsed.topic} · Hook: ${parsed.hook.slice(0, 60)}…`);

  log(`[${language}] Asking Gemini to generate the image…`);
  const step2 = await sendPrompt(`Generate an image: ${parsed.imagePrompt}`, { onLog: log });

  let imageUrl = null;
  if (step2.images.length > 0) {
    const raw = step2.images[0];
    log(`[${language}] Applying brand finish (logo + accent border)…`);
    const branded = await applyBrandFinish(raw.buffer, {
      logoUrl: brand?.logo_url,
      accent: brand?.brand_colors?.primary || '#c8a35c',
    });
    const slug = `${language}-${(parsed.topic || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
    log(`[${language}] Uploading branded image to Supabase (${slug})…`);
    imageUrl = await uploadImage(branded, slug, 'image/png');
    log(`[${language}] Image URL: ${imageUrl}`);
  } else {
    log(`[${language}] ⚠️ Gemini didn't return an image. Continuing with text-only post.`);
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
    caption: fullCaption,
    imageUrl,
    campaign: campaign?.theme || null,
    facebook: fbResult,
  };
}

module.exports = { run };
