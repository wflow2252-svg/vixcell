const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

async function callGemini({ model = GEMINI_TEXT_MODEL, prompt, json = false }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      ...(json && { responseMimeType: 'application/json' }),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini error: ${data.error?.message || res.status}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return json ? JSON.parse(text) : text;
}

const VIXCELL_BRIEF = `
Vixcell is an AI-powered Project Management dashboard for agencies, freelance devs, and small product teams.
Core value: visualize project status, manage tasks, and use AI to auto-generate websites, briefs, and client communications.
Audience: dev studios, freelance devs, product managers, agencies in MENA + global.
Tone: confident, sharp, modern, slightly playful but always credible. Never cheesy. No emoji spam.
Brand colors: deep purple + electric cyan accents, glassmorphism aesthetic.
Differentiator vs Asana/ClickUp/Monday: AI-native — it doesn't just track work, it *does* work (generates sites, replies to clients, drafts proposals).
`;

const TOPIC_BUCKETS = [
  'productivity tip for dev teams',
  'project management mistake & fix',
  'AI in agencies / freelance workflow',
  'client communication template',
  'feature spotlight (link to Vixcell)',
  'industry insight (PM trends, SaaS market)',
  'mini case study / win moment',
  'behind-the-scenes building Vixcell',
  'comparison vs traditional PM tools',
  'time-saving automation idea',
];

function pickTopic(recent) {
  const recentTopics = new Set(recent.map((r) => (r.topic || '').toLowerCase()));
  const fresh = TOPIC_BUCKETS.filter((t) => !recentTopics.has(t.toLowerCase()));
  const pool = fresh.length ? fresh : TOPIC_BUCKETS;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generatePost({ language, recentPosts = [] }) {
  const topic = pickTopic(recentPosts);
  const recentSummary = recentPosts
    .slice(0, 8)
    .map((p, i) => `${i + 1}. ${(p.caption || '').slice(0, 140)}`)
    .join('\n');

  const lang = language === 'ar' ? 'Arabic (Egyptian, professional)' : 'English';
  const platformNote =
    language === 'ar'
      ? 'Target Arabic-speaking MENA dev community. Keep technical terms in English.'
      : 'Target global indie devs, agencies, and PMs.';

  const prompt = `
You write social posts for Vixcell. Output STRICT JSON only.

BRAND BRIEF:
${VIXCELL_BRIEF}

TODAY'S TOPIC BUCKET: ${topic}
LANGUAGE: ${lang}
${platformNote}

RECENT POSTS (avoid repeating phrasing or angle):
${recentSummary || '(none)'}

REQUIREMENTS:
- caption: 60-110 words, ${language === 'ar' ? 'Arabic prose' : 'English prose'}, 2-3 short paragraphs, one concrete tip or insight, soft CTA in last line that mentions Vixcell.
- hook: first 8-12 words MUST stop the scroll (question, contrarian take, or surprising stat).
- hashtags: 6-8 relevant tags. Mix general (#ProductivityHack) and niche (#FreelanceDev). ${language === 'ar' ? 'Mix Arabic and English hashtags.' : 'English only.'}
- image_prompt: a single-line description for an image generator (English). Subject: a clean modern visual representing the post idea. Style: "Vixcell brand visual — deep purple and electric cyan glassmorphism, 3D abstract shapes, soft glow, clean negative space, 1:1 square, no text, no logos". Be specific about the central visual element.
- topic_tag: 2-4 words label for this post topic (English).

OUTPUT JSON SHAPE:
{
  "caption": "...",
  "hashtags": ["tag1", "tag2", ...],
  "image_prompt": "...",
  "topic_tag": "..."
}
`;

  const result = await callGemini({ prompt, json: true });
  if (!result.caption || !Array.isArray(result.hashtags)) {
    throw new Error('Invalid Gemini output');
  }
  return { ...result, bucket: topic };
}

function composeCaption({ caption, hashtags }) {
  const tags = (hashtags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
  return `${caption.trim()}\n\n${tags}`.trim();
}

module.exports = { generatePost, composeCaption, callGemini, VIXCELL_BRIEF };
