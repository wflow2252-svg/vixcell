const { generatePost, composeCaption } = require('./content');
const { generateAndStoreImage } = require('./image');
const { postToFacebook, postToInstagram } = require('./meta');
const { getRecentTopics, logPost } = require('./supabase');

async function runDailyPost({ language }) {
  const recentPosts = await getRecentTopics({ language, days: 14, limit: 14 });
  const generated = await generatePost({ language, recentPosts });

  const slug = `${language}-${generated.topic_tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const image = await generateAndStoreImage({ prompt: generated.image_prompt, slug });

  const caption = composeCaption({
    caption: generated.caption,
    hashtags: generated.hashtags,
  });

  const results = { language, topic: generated.topic_tag, image_url: image.url };

  try {
    const fb = await postToFacebook({ caption, imageUrl: image.url });
    results.facebook = { ok: true, post_id: fb.post_id };
    await logPost({
      platform: 'facebook',
      language,
      caption,
      hashtags: generated.hashtags,
      image_url: image.url,
      topic: generated.topic_tag,
      external_post_id: fb.post_id,
      status: 'published',
      posted_at: new Date().toISOString(),
    });
  } catch (e) {
    results.facebook = { ok: false, error: e.message, details: e.details };
    await logPost({
      platform: 'facebook',
      language,
      caption,
      hashtags: generated.hashtags,
      image_url: image.url,
      topic: generated.topic_tag,
      status: 'failed',
      error: e.message,
    });
  }

  try {
    const ig = await postToInstagram({ caption, imageUrl: image.url });
    results.instagram = { ok: true, post_id: ig.post_id };
    await logPost({
      platform: 'instagram',
      language,
      caption,
      hashtags: generated.hashtags,
      image_url: image.url,
      topic: generated.topic_tag,
      external_post_id: ig.post_id,
      status: 'published',
      posted_at: new Date().toISOString(),
    });
  } catch (e) {
    results.instagram = { ok: false, error: e.message, details: e.details };
    await logPost({
      platform: 'instagram',
      language,
      caption,
      hashtags: generated.hashtags,
      image_url: image.url,
      topic: generated.topic_tag,
      status: 'failed',
      error: e.message,
    });
  }

  return results;
}

module.exports = { runDailyPost };
