// Facebook posting helper (Instagram intentionally skipped per user request).

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

function env() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return null;
  return { token, pageId };
}

async function postToFacebook({ caption, imageUrl }) {
  const e = env();
  if (!e) return { skipped: true, reason: 'META_PAGE_ACCESS_TOKEN or META_PAGE_ID not set' };

  const url = new URL(`${GRAPH}/${e.pageId}/${imageUrl ? 'photos' : 'feed'}`);
  url.searchParams.set('access_token', e.token);
  const body = imageUrl ? { url: imageUrl, caption } : { message: caption };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = new Error(json.error?.message || `Graph API ${res.status}`);
    err.details = json.error || json;
    throw err;
  }
  return { post_id: json.post_id || json.id, photo_id: json.id };
}

module.exports = { postToFacebook };
