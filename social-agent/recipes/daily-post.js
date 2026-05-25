// Daily post recipe: ask Gemini for caption + hashtags + image, save to Supabase,
// optionally post to Facebook.

const { sendPrompt, newConversation } = require('../lib/gemini-web');
const { uploadImage, logPost, getRecentTopics } = require('../lib/supabase');
const { postToFacebook } = require('../lib/meta');

const PROMPTS = {
  ar: (recent) => `أنت كاتب محتوى لشركة VIXCELL — شركة تصميم وتطوير مواقع ويب وتطبيقات وحلول AI.

اكتب بوست عربي قصير لـ Facebook (٥٠-٨٠ كلمة) يجذب أصحاب البزنس. الموضوع: أي حاجة مفيدة عن الويب/تطبيقات/AI/تحويل رقمي.

⚠️ المواضيع اللي اتعملت قبل كده (تجنّبها):
${recent.length ? recent.map(r => `- ${r.topic}`).join('\n') : '- (مفيش)'}

اكتب الرد بالشكل ده بالظبط:
TOPIC: <كلمتين عن الموضوع>
CAPTION: <البوست هنا>
HASHTAGS: <٥-٧ هاشتاجات مفصولة بمسافة>
IMAGE_PROMPT: <وصف صورة احترافي بالإنجليزي لـ Imagen — clean, modern, minimal, brand-safe>

ولا تكتب أي شرح إضافي.`,

  en: (recent) => `You are a content writer for VIXCELL — a web/app development and AI solutions agency.

Write a short English Facebook post (50-80 words) targeting business owners. Topic: anything useful about web/apps/AI/digital transformation.

⚠️ Previously covered topics (avoid):
${recent.length ? recent.map(r => `- ${r.topic}`).join('\n') : '- (none)'}

Reply in EXACTLY this format:
TOPIC: <two words about the topic>
CAPTION: <the post here>
HASHTAGS: <5-7 hashtags separated by space>
IMAGE_PROMPT: <professional image description for Imagen — clean, modern, minimal, brand-safe>

Do not add any other text.`,
};

function parseResponse(text) {
  const grab = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`));
    return m ? m[1].trim() : '';
  };
  return {
    topic: grab('TOPIC'),
    caption: grab('CAPTION'),
    hashtags: grab('HASHTAGS').split(/\s+/).filter(Boolean),
    imagePrompt: grab('IMAGE_PROMPT'),
  };
}

async function run({ language, log = console.log }) {
  log(`[${language}] Loading recent topics from Supabase…`);
  const recent = await getRecentTopics({ language, days: 14, limit: 14 });
  log(`[${language}] Found ${recent.length} recent post(s) to avoid repeating.`);

  log(`[${language}] Asking Gemini for caption + image prompt…`);
  await newConversation();
  const step1 = await sendPrompt(PROMPTS[language](recent), { onLog: log });
  const parsed = parseResponse(step1.text);
  if (!parsed.caption || !parsed.imagePrompt) {
    throw new Error(`Gemini response didn't match expected format. Got: ${step1.text.slice(0, 500)}`);
  }
  log(`[${language}] Topic: ${parsed.topic}`);

  log(`[${language}] Asking Gemini to generate the image…`);
  const imageReq = `Generate an image: ${parsed.imagePrompt}`;
  const step2 = await sendPrompt(imageReq, { onLog: log });

  let imageUrl = null;
  if (step2.images.length > 0) {
    const img = step2.images[0];
    const slug = `${language}-${parsed.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
    log(`[${language}] Uploading image to Supabase (${slug})…`);
    imageUrl = await uploadImage(img.buffer, slug, img.contentType);
    log(`[${language}] Image URL: ${imageUrl}`);
  } else {
    log(`[${language}] ⚠️ Gemini didn't return an image. Continuing with text-only post.`);
  }

  const fullCaption = parsed.hashtags.length
    ? `${parsed.caption}\n\n${parsed.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`
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
    facebook: fbResult,
  };
}

module.exports = { run };
