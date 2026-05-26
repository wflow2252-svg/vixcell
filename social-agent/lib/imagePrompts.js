// Curated art-direction templates for poster backgrounds.
//
// The daily-post recipe USED to ask Gemini "write me an image prompt", then
// pass that back to Gemini to render — Gemini wrote vague prompts and the
// images came out generic. Instead, we now pick one of these templates
// based on the post topic, fill in the placeholders, and feed the result
// to Imagen. Each template is engineered to produce a poster-grade hero
// visual against a dark cinematic background that composes well with our
// SVG headline + bottom service strip.
//
// Templates are deliberately specific about lighting, materials, focal
// length, render engine, etc. — that's what gets Imagen out of "generic
// stock photo" mode.

const ACCENT_PLACEHOLDER = '{{ACCENT}}';
const SUBJECT_PLACEHOLDER = '{{SUBJECT}}';

const BASE_NEGATIVES = `No text, no words, no letters, no numbers, no logos, no UI mockups, no people, no human faces. Leave the top 25% and bottom 25% of the frame dimmer and emptier so headline and service-list overlays read cleanly. Portrait 4:5 aspect ratio (1080×1350).`;

const TEMPLATES = [
  // 1. Floating premium product on a dark stage (think Apple Vision keynote)
  {
    id: 'product-stage',
    keywords: ['product', 'launch', 'feature', 'app', 'platform', 'web', 'website', 'site', 'tool', 'service'],
    style: `Premium product photography of {{SUBJECT}} floating on a polished black stage, single soft key light from upper-right with subtle {{ACCENT}} rim lighting, depth-of-field blur on the background, faint volumetric haze, deep charcoal backdrop with a thin {{ACCENT}} horizon line, octane render quality, 8k, cinematic, like an Apple keynote slide.`,
  },

  // 2. 3D metallic abstract shapes (great for "speed", "performance", abstract concepts)
  {
    id: 'metallic-shapes',
    keywords: ['speed', 'performance', 'fast', 'power', 'strong', 'efficient', 'automation', 'سرعة', 'قوة', 'كفاءة'],
    style: `3D rendered abstract metallic forms floating in dark space, polished {{ACCENT}} chrome surfaces with mirror-like reflections, soft pink and blue rim lights, deep black background, motion blur on the edges, ultra-detailed, Behance-grade abstract art, premium agency style.`,
  },

  // 3. Glass / crystal cube containing content
  {
    id: 'glass-cube',
    keywords: ['bundle', 'package', 'suite', 'all-in-one', 'integration', 'ai', 'data', 'باقة', 'حزمة'],
    style: `Photorealistic glass cube with iridescent rainbow refractions floating on a dark obsidian floor, soft {{ACCENT}} glow from inside the cube, {{SUBJECT}} symbol or icon visible inside, faint light beams cutting through the air, deep black-to-charcoal gradient background, octane render, photographic lighting.`,
  },

  // 4. Neon outlined wireframe device
  {
    id: 'neon-wireframe',
    keywords: ['mobile', 'app', 'design', 'ux', 'ui', 'interface', 'تطبيق', 'تصميم'],
    style: `Glowing neon wireframe of {{SUBJECT}}, thin {{ACCENT}} outlines against a deep black void, particles drifting, soft bloom, slight chromatic aberration on the edges, cyber-aesthetic, 4k, premium tech advertising look.`,
  },

  // 5. Holographic display / monitor
  {
    id: 'holographic-display',
    keywords: ['dashboard', 'analytics', 'data', 'report', 'insights', 'ai', 'تحليل', 'تقرير'],
    style: `Floating holographic display panel showing abstract {{SUBJECT}} data visualization (no readable text), thin {{ACCENT}} accent lines, dark studio backdrop, subtle reflections on a glossy floor, slight haze, premium product photography, futuristic but elegant — not cheesy sci-fi.`,
  },

  // 6. Liquid metal / molten flow (great for "transformation", "change")
  {
    id: 'liquid-metal',
    keywords: ['transformation', 'change', 'evolution', 'upgrade', 'tحول', 'تطور'],
    style: `Slow-motion macro shot of liquid {{ACCENT}} metal flowing and pooling against a black stage, light catching the surface tension, viscous reflective texture, deep black background, single soft rim light, photographic, Cinema 4D + Octane quality.`,
  },

  // 7. Stacked premium gift / package (great for offers, deals, holidays)
  {
    id: 'gift-stack',
    keywords: ['offer', 'deal', 'sale', 'gift', 'holiday', 'eid', 'ramadan', 'عيد', 'رمضان', 'عرض'],
    style: `Beautifully wrapped premium gift box in matte black with a {{ACCENT}} silk ribbon, sitting on a polished dark surface, soft top-down spotlight, faint ornamental motif in the deep background (geometric Islamic pattern or seasonal motif fitting the theme: {{SUBJECT}}), warm cinematic mood, product photography, no clutter.`,
  },

  // 8. Floating typography sculpture (great for thought leadership posts)
  {
    id: 'typography-sculpture',
    keywords: ['idea', 'mindset', 'principle', 'wisdom', 'lesson', 'فكرة', 'درس', 'تعلم'],
    style: `3D sculptural rendering of a single abstract symbol or geometric form representing {{SUBJECT}}, sitting on a polished black plinth in a dark studio, soft volumetric light from above, {{ACCENT}} rim light along one edge, museum-piece aesthetic, octane render.`,
  },

  // 9. Crescent moon + lanterns (Ramadan/Eid specific)
  {
    id: 'eid-ornament',
    keywords: ['eid', 'ramadan', 'fitr', 'adha', 'mubarak', 'عيد', 'رمضان', 'فطر', 'أضحى'],
    style: `Elegant crescent moon and a single ornate lantern, polished {{ACCENT}} metal, glowing softly against a deep navy-to-black night sky, scattered stars and bokeh, faint Arabic geometric pattern in the very dark background, premium festive photography, tasteful and minimalist (NOT busy).`,
  },

  // 10. Patriotic minimalism (Egyptian national days)
  {
    id: 'patriotic',
    keywords: ['egypt', 'national', 'revolution', 'army', 'sinai', '23 july', 'oct 6', 'مصر', 'وطن', 'ثورة'],
    style: `Minimalist art piece: stylized Egyptian flag silk fabric flowing in slow motion on a deep black background, illuminated by warm cinematic light, faint architectural silhouette of {{SUBJECT}} in the very far background, subtle {{ACCENT}} highlights, dignified, no clichés.`,
  },
];

const FALLBACK = {
  id: 'fallback',
  style: `Premium 3D abstract composition representing {{SUBJECT}}, polished metallic shapes with {{ACCENT}} accents floating in a dark cinematic space, soft rim lighting, photographic depth-of-field, octane render quality, Behance-grade premium agency style.`,
};

/**
 * Picks a template by scoring its keywords against the post topic + hook.
 * Returns a fully-built English prompt ready to feed to Imagen.
 */
function buildImagePrompt({ topic = '', hook = '', subject = '', accent = '#c8a35c' } = {}) {
  const corpus = `${topic} ${hook} ${subject}`.toLowerCase();
  let best = FALLBACK;
  let bestScore = 0;
  for (const t of TEMPLATES) {
    let score = 0;
    for (const k of t.keywords) {
      if (corpus.includes(k.toLowerCase())) score++;
    }
    if (score > bestScore) { best = t; bestScore = score; }
  }

  const subjectText = subject || topic || 'a premium service';
  const filled = best.style
    .replaceAll(ACCENT_PLACEHOLDER, accent)
    .replaceAll(SUBJECT_PLACEHOLDER, subjectText);

  return `${filled}\n\n${BASE_NEGATIVES}\n\n[Template: ${best.id}]`;
}

module.exports = { buildImagePrompt, TEMPLATES };
