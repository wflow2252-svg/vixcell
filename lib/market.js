const { callGemini, VIXCELL_BRIEF } = require('./content');
const { getRecentPagePosts, getPageInsights } = require('./meta');
const { getAdminClient, saveMarketReport } = require('./supabase');

const COMPETITORS = [
  { name: 'Asana', site: 'asana.com', angle: 'enterprise PM' },
  { name: 'ClickUp', site: 'clickup.com', angle: 'feature-loaded all-in-one' },
  { name: 'Monday.com', site: 'monday.com', angle: 'visual + WorkOS positioning' },
  { name: 'Notion', site: 'notion.so', angle: 'docs + DBs hybrid' },
  { name: 'Trello', site: 'trello.com', angle: 'simple kanban' },
  { name: 'Linear', site: 'linear.app', angle: 'fast PM for dev teams' },
];

async function gatherOwnPerformance() {
  const out = { posts: [], insights: [], totals: {} };
  try {
    out.posts = await getRecentPagePosts({ limit: 25 });
  } catch (e) {
    out.postsError = e.message;
  }
  try {
    out.insights = await getPageInsights();
  } catch (e) {
    out.insightsError = e.message;
  }

  let reactions = 0,
    comments = 0,
    shares = 0,
    impressions = 0;
  for (const p of out.posts) {
    reactions += p.reactions?.summary?.total_count || 0;
    comments += p.comments?.summary?.total_count || 0;
    shares += p.shares?.count || 0;
    const imp = p.insights?.data?.find((x) => x.name === 'post_impressions');
    impressions += imp?.values?.[0]?.value || 0;
  }
  out.totals = { reactions, comments, shares, impressions, post_count: out.posts.length };

  out.top = [...out.posts]
    .map((p) => ({
      message: (p.message || '').slice(0, 200),
      url: p.permalink_url,
      engagement:
        (p.reactions?.summary?.total_count || 0) +
        (p.comments?.summary?.total_count || 0) +
        (p.shares?.count || 0),
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return out;
}

async function gatherInternalSignals() {
  try {
    const supabase = getAdminClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: posts } = await supabase
      .from('social_posts')
      .select('platform, language, topic, status, posted_at')
      .gte('created_at', since);
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, created_at')
      .gte('created_at', since)
      .limit(100);
    return {
      automated_posts_last_7d: posts?.length || 0,
      automated_post_failures: posts?.filter((p) => p.status === 'failed').length || 0,
      lead_submissions_last_7d: submissions?.length || 0,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function generateReport({ ownPerf, internal }) {
  const today = new Date();
  const periodEnd = today.toISOString().slice(0, 10);
  const periodStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const prompt = `
You are Vixcell's growth strategist. Produce a weekly market & social analysis in Markdown.

BRAND BRIEF:
${VIXCELL_BRIEF}

PERIOD: ${periodStart} → ${periodEnd}

OWN PAGE PERFORMANCE (last 7 days, may have errors):
${JSON.stringify(ownPerf, null, 2)}

INTERNAL AUTOMATION SIGNALS:
${JSON.stringify(internal, null, 2)}

COMPETITORS (use your knowledge, do not invent fake numbers):
${JSON.stringify(COMPETITORS, null, 2)}

OUTPUT in this exact Markdown structure:

# Vixcell Weekly Market Report — ${periodStart} → ${periodEnd}

## 1. Own Performance Snapshot
- Concise bullets on impressions, engagement trend, top 1-2 posts.

## 2. What's Working / What's Not
- 3 bullets each, drawn from the data above.

## 3. Competitor Pulse
For each competitor: 1 bullet on what they're emphasizing this quarter (positioning, features, content angle).

## 4. Content Opportunities Next Week
- 5 specific post ideas with a one-line hook each. Mix Arabic and English audiences.

## 5. Ad Strategy Recommendations
- 3 concrete recommendations for Meta Ads (audience, creative angle, budget direction).

## 6. Risks & Watch-list
- 2-3 things to monitor.

Keep it tight. No fluff. No emoji.
`;

  const reportMd = await callGemini({ prompt });
  return { reportMd, periodStart, periodEnd };
}

async function runMarketAnalysis() {
  const [ownPerf, internal] = await Promise.all([
    gatherOwnPerformance(),
    gatherInternalSignals(),
  ]);

  const { reportMd, periodStart, periodEnd } = await generateReport({ ownPerf, internal });

  const saved = await saveMarketReport({
    period_start: periodStart,
    period_end: periodEnd,
    report_md: reportMd,
    summary: reportMd.split('\n').slice(0, 8).join('\n'),
    metrics: {
      own_totals: ownPerf.totals,
      internal,
    },
    competitors: COMPETITORS,
  });

  return { report: saved, ownPerf, internal };
}

module.exports = { runMarketAnalysis };
