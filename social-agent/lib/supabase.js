const { createClient } = require('@supabase/supabase-js');

let cached = null;

function client() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

async function uploadImage(buffer, filename, contentType = 'image/png') {
  const sb = client();
  const bucket = process.env.SUPABASE_BUCKET || 'social-media';
  const { error } = await sb.storage.from(bucket).upload(filename, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

async function logPost(entry) {
  const sb = client();
  const { data, error } = await sb.from('social_posts').insert(entry).select().single();
  if (error) throw error;
  return data;
}

async function saveMarketReport(report) {
  const sb = client();
  const { data, error } = await sb.from('market_reports').insert(report).select().single();
  if (error) throw error;
  return data;
}

async function getRecentTopics({ language, days = 14, limit = 14 }) {
  const sb = client();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await sb
    .from('social_posts')
    .select('topic, caption')
    .eq('language', language)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

module.exports = { client, uploadImage, logPost, saveMarketReport, getRecentTopics };
