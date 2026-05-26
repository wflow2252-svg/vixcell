const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

function env() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igId = process.env.META_IG_BUSINESS_ID;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN is missing');
  if (!pageId) throw new Error('META_PAGE_ID is missing');
  return { token, pageId, igId };
}

async function call(path, { method = 'GET', body, token, query } = {}) {
  const url = new URL(`${GRAPH}${path}`);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  if (token && !url.searchParams.has('access_token')) {
    url.searchParams.set('access_token', token);
  }
  const init = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = new Error(json.error?.message || `Graph API ${res.status}`);
    err.details = json.error || json;
    throw err;
  }
  return json;
}

async function postToFacebook({ caption, imageUrl }) {
  const { token, pageId } = env();
  if (imageUrl) {
    const r = await call(`/${pageId}/photos`, {
      method: 'POST',
      token,
      body: { url: imageUrl, caption },
    });
    return { post_id: r.post_id || r.id, photo_id: r.id };
  }
  const r = await call(`/${pageId}/feed`, {
    method: 'POST',
    token,
    body: { message: caption },
  });
  return { post_id: r.id };
}

async function waitForContainer(creationId, token, { tries = 8, delayMs = 1500 } = {}) {
  for (let i = 0; i < tries; i++) {
    const r = await call(`/${creationId}`, { token, query: { fields: 'status_code' } });
    if (r.status_code === 'FINISHED') return;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') {
      throw new Error(`IG container ${r.status_code}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('IG container not ready in time');
}

async function postToInstagram({ caption, imageUrl }) {
  const { token, igId } = env();
  if (!igId) throw new Error('META_IG_BUSINESS_ID is missing');
  if (!imageUrl) throw new Error('Instagram post requires imageUrl');

  const container = await call(`/${igId}/media`, {
    method: 'POST',
    token,
    body: { image_url: imageUrl, caption },
  });

  await waitForContainer(container.id, token);

  const published = await call(`/${igId}/media_publish`, {
    method: 'POST',
    token,
    body: { creation_id: container.id },
  });

  return { post_id: published.id, container_id: container.id };
}

async function getPageInsights({ since, until } = {}) {
  const { token, pageId } = env();
  const r = await call(`/${pageId}/insights`, {
    token,
    query: {
      metric: 'page_post_engagements,page_views_total',
      ...(since && { since }),
      ...(until && { until }),
    },
  });
  return r.data || [];
}

async function getRecentPagePosts({ limit = 25 } = {}) {
  const { token, pageId } = env();
  const r = await call(`/${pageId}/posts`, {
    token,
    query: {
      fields: 'id,message,created_time,permalink_url,reactions.summary(total_count),comments.summary(total_count),shares,insights.metric(post_impressions,post_engaged_users)',
      limit,
    },
  });
  return r.data || [];
}

module.exports = {
  postToFacebook,
  postToInstagram,
  getPageInsights,
  getRecentPagePosts,
};
