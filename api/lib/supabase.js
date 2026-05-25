const { createClient } = require('@supabase/supabase-js');

let cached = null;

function getAdminClient() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

async function getRecentTopics({ language, days = 14, limit = 14 }) {
  const supabase = getAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('social_posts')
    .select('topic, caption')
    .eq('language', language)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function logPost(entry) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('social_posts')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function uploadImageBuffer(buffer, filename, contentType = 'image/png') {
  const supabase = getAdminClient();
  const bucket = process.env.SUPABASE_BUCKET || 'social-media';

  // Bucket is pre-created by migration; skip createBucket (anon key can't create).
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, { contentType, upsert: true });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

async function saveMarketReport(report) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('market_reports')
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  getAdminClient,
  getRecentTopics,
  logPost,
  uploadImageBuffer,
  saveMarketReport,
};
