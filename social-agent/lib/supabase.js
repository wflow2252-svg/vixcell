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

// ─── Brand + campaign helpers ────────────────────────────────────

async function getBrandConfig() {
  const sb = client();
  const { data, error } = await sb.from('brand_config').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function updateBrandConfig(patch) {
  const sb = client();
  const { data, error } = await sb
    .from('brand_config')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', true)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getCompetitors({ activeOnly = true } = {}) {
  const sb = client();
  let q = sb.from('competitors').select('*');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Returns the Monday of the week containing the given date (default: today),
// as a "YYYY-MM-DD" string. Used as the natural key of the campaigns table.
function thisWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

async function getCurrentCampaign() {
  const sb = client();
  const weekStart = thisWeekStart();
  const { data, error } = await sb
    .from('campaigns')
    .select('*')
    .eq('week_start', weekStart)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function saveCampaign({ weekStart, theme, goal, keyMessages, strategyBody }) {
  const sb = client();
  const { data, error } = await sb
    .from('campaigns')
    .upsert({
      week_start: weekStart || thisWeekStart(),
      theme,
      goal,
      key_messages: keyMessages || [],
      strategy_body: strategyBody,
    }, { onConflict: 'week_start' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function downloadAsBuffer(url) {
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

module.exports = {
  client,
  uploadImage,
  logPost,
  saveMarketReport,
  getRecentTopics,
  getBrandConfig,
  updateBrandConfig,
  getCompetitors,
  getCurrentCampaign,
  saveCampaign,
  thisWeekStart,
  downloadAsBuffer,
};
