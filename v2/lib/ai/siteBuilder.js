// ─── VIXCELL AI — Composable Website Generator ──────────────────────
// NOT a template. A composer that picks from a library of section
// variants based on the user's request + a per-project seed, so the
// same prompt never produces the same site twice unless you ask for it.

// ─── Seedable RNG (mulberry32) ──────────────────────────────────────
function makeRng(seedString) {
  let h = 1779033703 ^ seedString.length
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
const maybe = (rng, prob = 0.5) => rng() < prob

// ─── Palettes (8 distinct themes) ───────────────────────────────────
const PALETTES = [
  { name: 'midnight',  bg: '#07070a', surface: 'rgba(255,255,255,0.04)', text: '#e2e8f0', muted: 'rgba(255,255,255,0.55)', primary: '#6366f1', accent: '#8b5cf6' },
  { name: 'aurora',    bg: '#0a0e1a', surface: 'rgba(255,255,255,0.04)', text: '#e0e7ff', muted: 'rgba(224,231,255,0.55)', primary: '#22d3ee', accent: '#a855f7' },
  { name: 'forest',    bg: '#0a1410', surface: 'rgba(255,255,255,0.04)', text: '#dcfce7', muted: 'rgba(220,252,231,0.55)', primary: '#10b981', accent: '#14b8a6' },
  { name: 'sunset',    bg: '#1a0a0a', surface: 'rgba(255,255,255,0.04)', text: '#fde6d8', muted: 'rgba(253,230,216,0.55)', primary: '#f97316', accent: '#ef4444' },
  { name: 'royal',     bg: '#0a0a1a', surface: 'rgba(255,255,255,0.04)', text: '#e9d5ff', muted: 'rgba(233,213,255,0.55)', primary: '#a855f7', accent: '#ec4899' },
  { name: 'minimal',   bg: '#ffffff', surface: 'rgba(0,0,0,0.03)',       text: '#0f172a', muted: 'rgba(15,23,42,0.55)',     primary: '#0f172a', accent: '#64748b' },
  { name: 'cream',     bg: '#fdfbf7', surface: 'rgba(0,0,0,0.03)',       text: '#1c1917', muted: 'rgba(28,25,23,0.55)',     primary: '#dc7626', accent: '#a16207' },
  { name: 'ocean',     bg: '#03182a', surface: 'rgba(255,255,255,0.04)', text: '#dbeafe', muted: 'rgba(219,234,254,0.55)', primary: '#3b82f6', accent: '#06b6d4' },
]

// ─── Font pairings ──────────────────────────────────────────────────
const FONT_PAIRS = [
  { name: 'inter',  head: 'Inter',          body: 'Inter',          weight: '900', google: 'Inter:wght@300;400;500;600;700;800;900' },
  { name: 'serif',  head: 'Playfair Display', body: 'Inter',         weight: '800', google: 'Playfair+Display:wght@500;700;900&family=Inter:wght@400;500;600' },
  { name: 'modern', head: 'Space Grotesk', body: 'Inter',          weight: '700', google: 'Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500' },
  { name: 'sleek',  head: 'Manrope',       body: 'Manrope',        weight: '800', google: 'Manrope:wght@300;400;500;600;700;800' },
  { name: 'tech',   head: 'JetBrains Mono', body: 'Inter',          weight: '700', google: 'JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500' },
]

// ─── Request analyzer — what features did the user ask for? ─────────
function analyzeRequest(text) {
  const t = (text || '').toLowerCase()
  return {
    wantGallery:      /gallery|معرض|صور|اعمال|أعمال/.test(t),
    wantTestimonials: /testimonial|review|آراء|ريفيو|تقييم/.test(t),
    wantPricing:      /pricing|price|أسعار|سعر|اشتراك|باقات/.test(t),
    wantFaq:          /faq|سؤال|أسئلة|اسئلة/.test(t),
    wantTeam:         /team|فريق|اعضاء|أعضاء/.test(t),
    wantStats:        /stats|arqam|أرقام|احصائيات/.test(t),
    wantCta:          /cta|اشتراك|تواصل|ابدأ|sign\s*up/.test(t),
    wantBlog:         /blog|أخبار|مدونة|articles/.test(t),
    wantContact:      /contact|تواصل|اتصل|email/.test(t),
    styleMinimal:     /minimal|بسيط|نظيف/.test(t),
    styleLuxury:      /luxury|فخم|فاخر|راقي|premium/.test(t),
    styleModern:      /modern|عصري|حديث|trendy/.test(t),
    styleClassic:     /classic|كلاسيك|تقليدي/.test(t),
    styleBold:        /bold|قوي|جريء|striking/.test(t),
  }
}

// ─── Helpers ────────────────────────────────────────────────────────
function darken(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) - amount)
  const g = Math.max(0, ((num >> 8) & 0xff) - amount)
  const b = Math.max(0, (num & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function lighten(hex, amount) {
  return darken(hex, -amount)
}

function alpha(hex, a) {
  const num = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(num >> 16) & 0xff},${(num >> 8) & 0xff},${num & 0xff},${a})`
}

// ─── Content packs by business type ─────────────────────────────────
const CONTENT = {
  ecommerce: {
    tagline: 'Curated products, secure checkout, fast delivery',
    headlines: ['Shop the Future', 'Designed to Delight', 'Where Style Meets Quality', 'Discover. Browse. Own.'],
    descriptions: [
      'A premium online store offering carefully curated products with seamless checkout, secure payments, and fast worldwide delivery.',
      'Every item hand-picked for quality. Every order shipped with care. Welcome to a better way to shop.',
    ],
    services: [
      { icon: '🛒', title: 'Easy Shopping',   desc: 'Browse curated products with smart filters and seamless cart experience.' },
      { icon: '🔒', title: 'Secure Checkout', desc: 'PCI-compliant payments with multiple options and instant confirmation.' },
      { icon: '🚚', title: 'Fast Delivery',   desc: 'Worldwide shipping with real-time tracking and delivery estimates.' },
      { icon: '↩️', title: 'Easy Returns',    desc: '30-day no-questions-asked returns on everything we sell.' },
    ],
    ctaPrimary: 'Shop Now', ctaSecondary: 'Browse Collection',
  },
  restaurant: {
    tagline: 'Fresh ingredients, master chefs, unforgettable taste',
    headlines: ['A Taste Above', 'Where Flavor Lives', 'Crafted by Master Chefs', 'Reserve Your Table'],
    descriptions: [
      'A culinary destination serving handcrafted dishes with fresh ingredients in an unforgettable atmosphere.',
      'Each plate tells a story. Every visit becomes a memory. Reserve your seat and let us take care of the rest.',
    ],
    services: [
      { icon: '🍽️', title: 'Fresh Daily',    desc: 'Ingredients sourced from local farms every single morning.' },
      { icon: '👨‍🍳', title: 'Master Chefs',  desc: 'Award-winning chefs crafting memorable experiences plate by plate.' },
      { icon: '🥂', title: 'Cozy Ambience',  desc: 'Warm interiors designed for unforgettable evenings with loved ones.' },
      { icon: '🎵', title: 'Live Music',     desc: 'Acoustic sets every Friday and Saturday evening.' },
    ],
    ctaPrimary: 'Reserve a Table', ctaSecondary: 'View Menu',
  },
  blog: {
    tagline: 'Expert insights, fresh perspectives, every week',
    headlines: ['Stories Worth Reading', 'Ideas. Decoded.', 'Read. Learn. Repeat.', 'Where Curious Minds Meet'],
    descriptions: [
      'Your source for expert insights, tutorials, and thought leadership across tech, business, and design.',
      'Long-form essays and tight takes from working practitioners. New articles weekly.',
    ],
    services: [
      { icon: '✍️', title: 'Expert Writing',   desc: 'In-depth tutorials and analyses by industry professionals.' },
      { icon: '📚', title: 'Curated Library',  desc: 'Carefully organized topics to grow your knowledge step by step.' },
      { icon: '💡', title: 'Fresh Ideas',      desc: 'Stay ahead with weekly drops covering the latest trends.' },
      { icon: '🔔', title: 'Newsletter',       desc: 'Best of the week delivered to your inbox every Sunday.' },
    ],
    ctaPrimary: 'Subscribe', ctaSecondary: 'Browse Articles',
  },
  portfolio: {
    tagline: 'Selected work, considered craft, real impact',
    headlines: ['Selected Work', 'Crafted with Care', 'A Portfolio of Curiosity', 'Things I Have Made'],
    descriptions: [
      'A creative portfolio showcasing award-winning projects across web, mobile, and brand design.',
      'I design and build digital products with intention. Here are a few I am proud of.',
    ],
    services: [
      { icon: '🎨', title: 'Visual Design',    desc: 'Striking visuals crafted with pixel-perfect attention to detail.' },
      { icon: '⚡', title: 'Quick Turnaround', desc: 'Fast iterations without compromising on creative excellence.' },
      { icon: '🚀', title: 'Strategic Approach', desc: 'Design that drives results, not just looks good.' },
    ],
    ctaPrimary: 'Hire Me', ctaSecondary: 'View Projects',
  },
  business: {
    tagline: 'Full-stack solutions, modern tools, real results',
    headlines: ['Building What Matters', 'Smart Tech. Real Impact.', 'Solutions Built to Last', 'Engineering Excellence'],
    descriptions: [
      'A full-service digital agency delivering innovative web solutions, brand strategy, and cutting-edge technology.',
      'We partner with ambitious teams to build software that scales. From discovery to launch and beyond.',
    ],
    services: [
      { icon: '🎨', title: 'UI/UX Design',    desc: 'Beautiful, intuitive interfaces with meticulous attention to every pixel.' },
      { icon: '⚡', title: 'Development',     desc: 'Clean, modular code with modern architecture for maximum performance.' },
      { icon: '🚀', title: 'Deployment',      desc: 'Zero-downtime deployment with CI/CD pipelines and cloud infrastructure.' },
      { icon: '📊', title: 'Analytics',       desc: 'Data-driven insights to guide every product decision.' },
    ],
    ctaPrimary: 'Start a Project', ctaSecondary: 'Our Process',
  },
  clinic: {
    tagline: 'Expert care, modern facilities, personal attention',
    headlines: ['Care You Can Trust', 'Health, Reimagined', 'Where Healing Begins', 'Your Health, Our Mission'],
    descriptions: [
      'Comprehensive medical care delivered with compassion, expertise, and the latest medical technology.',
      'Board-certified specialists. Modern facilities. Personalized treatment plans for every patient.',
    ],
    services: [
      { icon: '🩺', title: 'Expert Care',     desc: 'Certified specialists providing personalized treatment plans.' },
      { icon: '🏥', title: 'Modern Facility', desc: 'State-of-the-art equipment in a welcoming environment.' },
      { icon: '📞', title: '24/7 Support',    desc: 'Always reachable when you need us most.' },
      { icon: '🧪', title: 'On-site Lab',     desc: 'Same-day results for most diagnostic tests.' },
    ],
    ctaPrimary: 'Book Appointment', ctaSecondary: 'Our Doctors',
  },
  school: {
    tagline: 'Modern curriculum, expert faculty, global network',
    headlines: ['Learn. Grow. Lead.', 'Education for the Future', 'Knowledge in Motion', 'Where Minds Take Flight'],
    descriptions: [
      'Empowering students with knowledge, skills, and the confidence to shape their future.',
      'A modern learning institution combining proven pedagogy with cutting-edge technology.',
    ],
    services: [
      { icon: '📚', title: 'Modern Curriculum', desc: 'Up-to-date programs aligned with industry needs.' },
      { icon: '👩‍🏫', title: 'Expert Faculty',   desc: 'Learn from accomplished educators and industry leaders.' },
      { icon: '🌐', title: 'Global Network',    desc: 'Connect with peers worldwide through our alumni community.' },
      { icon: '💼', title: 'Career Support',    desc: 'Internships, mentorship, and job placement after graduation.' },
    ],
    ctaPrimary: 'Apply Now', ctaSecondary: 'Explore Programs',
  },
  landing: {
    tagline: 'Built to convert, designed to delight',
    headlines: ['The Better Way', 'Designed for Results', 'Built for Growth', 'Get Started in Minutes'],
    descriptions: [
      'The ultimate solution to grow your business, engage customers, and drive measurable results.',
      'Stop guessing what works. Our platform gives you the tools and insights to win — without the bloat.',
    ],
    services: [
      { icon: '⚡', title: 'Lightning Fast',  desc: 'Sub-second load times powered by edge infrastructure.' },
      { icon: '📊', title: 'Real Analytics',  desc: 'Know exactly what is working with built-in dashboards.' },
      { icon: '🔌', title: 'Plug & Play',     desc: 'Integrations with 200+ tools — no engineers needed.' },
      { icon: '🔐', title: 'Enterprise Grade', desc: 'SOC 2 certified. GDPR compliant. Bank-grade encryption.' },
    ],
    ctaPrimary: 'Start Free Trial', ctaSecondary: 'Watch Demo',
  },
  dashboard: {
    tagline: 'Live data, custom views, AI insights',
    headlines: ['Your Data, Visualized', 'Insights at a Glance', 'Decisions, Powered by Data', 'See Everything'],
    descriptions: [
      'Real-time insights and analytics to power data-driven decisions across your entire organization.',
      'One unified view of every metric that matters. Filterable, exportable, sharable.',
    ],
    services: [
      { icon: '📊', title: 'Live Metrics',  desc: 'Real-time data flowing in from all your connected sources.' },
      { icon: '🎯', title: 'Custom Views',  desc: 'Drag, drop, and arrange exactly how you think.' },
      { icon: '🤖', title: 'AI Insights',   desc: 'Anomaly detection and predictive analytics built in.' },
      { icon: '📤', title: 'Export Ready',  desc: 'CSV, Excel, PDF, or scheduled email reports.' },
    ],
    ctaPrimary: 'Open Dashboard', ctaSecondary: 'See a Demo',
  },
  personal: {
    tagline: 'Hi, I am a person on the internet',
    headlines: ['Hello, I Am Me', 'A Small Corner of the Internet', 'Welcome In', 'Just Some Thoughts'],
    descriptions: [
      'A personal space to share ideas, projects, and the journey along the way.',
      'No tracking, no ads, no nonsense. Just things I find interesting.',
    ],
    services: [
      { icon: '💼', title: 'My Work',     desc: 'Projects I have built, ideas I have explored.' },
      { icon: '📝', title: 'Writing',     desc: 'Thoughts on tech, design, and the things I learn.' },
      { icon: '📬', title: 'Get in Touch', desc: 'Always happy to chat about interesting ideas.' },
    ],
    ctaPrimary: 'Say Hi', ctaSecondary: 'Read the Blog',
  },
}

// ─── HERO VARIANTS ─────────────────────────────────────────────────
function heroCentered(p, c, rng, head) {
  return `<section class="hero" id="hero">
  <div class="hero-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  <div class="hero-content fade-in">
    <div class="badge">✦ ${p.tagline}</div>
    <h1>${head}</h1>
    <p class="hero-desc">${pick(rng, c.descriptions)}</p>
    <div class="hero-cta">
      <a href="#cta" class="btn btn-primary">${c.ctaPrimary} <span class="arrow">→</span></a>
      <a href="#about" class="btn btn-ghost">${c.ctaSecondary}</a>
    </div>
  </div>
</section>`
}

function heroSplit(p, c, rng, head) {
  const initial = (p.name[0] || 'V').toUpperCase()
  return `<section class="hero hero-split" id="hero">
  <div class="split-left fade-in">
    <div class="badge">${p.tagline}</div>
    <h1>${head}</h1>
    <p class="hero-desc">${pick(rng, c.descriptions)}</p>
    <div class="hero-cta">
      <a href="#cta" class="btn btn-primary">${c.ctaPrimary} <span class="arrow">→</span></a>
      <a href="#about" class="btn btn-ghost">${c.ctaSecondary}</a>
    </div>
  </div>
  <div class="split-right fade-in">
    <div class="visual-card">
      <div class="visual-glow"></div>
      <div class="visual-letter">${initial}</div>
      <div class="visual-tag">${p.name}</div>
    </div>
  </div>
</section>`
}

function heroAsymmetric(p, c, rng, head) {
  return `<section class="hero hero-asym" id="hero">
  <div class="asym-bg"></div>
  <div class="asym-content">
    <span class="asym-label">// ${p.name.toUpperCase()}</span>
    <h1 class="asym-title">${head}</h1>
    <p class="hero-desc">${pick(rng, c.descriptions)}</p>
    <div class="hero-cta">
      <a href="#cta" class="btn btn-primary">${c.ctaPrimary} <span class="arrow">→</span></a>
      <a href="#features" class="btn btn-ghost">${c.ctaSecondary}</a>
    </div>
  </div>
  <div class="asym-corner">
    <div class="corner-grid"></div>
  </div>
</section>`
}

function heroSpotlight(p, c, rng, head) {
  return `<section class="hero hero-spotlight" id="hero">
  <div class="spotlight"></div>
  <div class="hero-content fade-in" style="text-align:center;">
    <div class="badge pulse">✦ ${pick(rng, ['New', 'Launched', 'Live Now', 'Featured'])}</div>
    <h1 class="gradient-title">${head}</h1>
    <p class="hero-desc" style="margin:auto;">${pick(rng, c.descriptions)}</p>
    <div class="hero-cta">
      <a href="#cta" class="btn btn-primary big">${c.ctaPrimary} <span class="arrow">→</span></a>
    </div>
    <div class="trust-row">
      <span>Trusted by teams at</span>
      <strong>NEXUS</strong> · <strong>ATLAS</strong> · <strong>VERTEX</strong> · <strong>HELIX</strong>
    </div>
  </div>
</section>`
}

// ─── FEATURES / SERVICES VARIANTS ──────────────────────────────────
function featuresGrid(p, c, rng) {
  const items = c.services.slice(0, pick(rng, [3, 4]))
  return `<section class="section" id="features">
  <div class="section-head">
    <span class="section-tag">What We Offer</span>
    <h2>${pick(rng, ['Built for Real Work', 'Everything You Need', 'Designed to Deliver', 'Made to Matter'])}</h2>
    <p>${pick(rng, ['End-to-end solutions crafted with care.', 'Tools that work the way you do.', 'No bloat. Just what matters.'])}</p>
  </div>
  <div class="grid grid-${items.length}">
    ${items.map(s => `<div class="feature-card">
      <div class="feature-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>`).join('\n    ')}
  </div>
</section>`
}

function featuresAlternating(p, c, rng) {
  const items = c.services.slice(0, 3)
  return `<section class="section section-alt" id="features">
  <div class="section-head">
    <span class="section-tag">Features</span>
    <h2>${pick(rng, ['How It Works', 'What Makes Us Different', 'Built Differently'])}</h2>
  </div>
  <div class="alt-stack">
    ${items.map((s, i) => `<div class="alt-row ${i % 2 ? 'reverse' : ''}">
      <div class="alt-visual"><div class="alt-icon">${s.icon}</div></div>
      <div class="alt-text">
        <span class="alt-num">${String(i + 1).padStart(2, '0')}</span>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>
    </div>`).join('\n    ')}
  </div>
</section>`
}

function featuresIconList(p, c, rng) {
  const items = c.services
  return `<section class="section" id="features">
  <div class="section-head">
    <span class="section-tag">Capabilities</span>
    <h2>${pick(rng, ['Why People Pick Us', 'Built for Teams', 'Everything Included'])}</h2>
  </div>
  <div class="icon-list">
    ${items.map(s => `<div class="icon-item">
      <span class="icon-dot">${s.icon}</span>
      <div><strong>${s.title}</strong><p>${s.desc}</p></div>
    </div>`).join('\n    ')}
  </div>
</section>`
}

// ─── OPTIONAL SECTIONS ──────────────────────────────────────────────
function statsSection(p, c, rng) {
  const stats = [
    { num: pick(rng, ['50+', '120+', '200+', '500+']),       label: 'Projects' },
    { num: pick(rng, ['30+', '80+', '150+', '300+']),        label: 'Happy Clients' },
    { num: pick(rng, ['5+', '8+', '10+', '12+']),            label: 'Years' },
    { num: pick(rng, ['99%', '98%', '4.9★', '24/7']),         label: pick(rng, ['Satisfaction', 'Rating', 'Support']) },
  ]
  return `<section class="section stats" id="stats">
  <div class="stats-row">
    ${stats.map(s => `<div class="stat-item"><span class="stat-num">${s.num}</span><span class="stat-label">${s.label}</span></div>`).join('\n    ')}
  </div>
</section>`
}

function gallerySection(p, c, rng) {
  const items = Array.from({ length: 6 }, (_, i) => ({
    bg: `linear-gradient(${135 + i * 40}deg, ${p.primary}, ${p.accent})`,
    label: pick(rng, ['Project', 'Work', 'Case', 'Piece']) + ' ' + String(i + 1).padStart(2, '0'),
  }))
  return `<section class="section" id="gallery">
  <div class="section-head">
    <span class="section-tag">Selected Work</span>
    <h2>Recent Highlights</h2>
  </div>
  <div class="gallery-grid">
    ${items.map(it => `<div class="gallery-item" style="background:${it.bg}">
      <div class="gallery-overlay"><span>${it.label}</span></div>
    </div>`).join('\n    ')}
  </div>
</section>`
}

function testimonialsSection(p, c, rng) {
  const quotes = [
    { text: `Working with ${p.name} was a game-changer. Everything was on-spec, on-budget, and shipped early.`,
      who: 'Sarah K.', role: 'Founder, NorthStar' },
    { text: `The attention to detail blew me away. Every pixel, every interaction — considered.`,
      who: 'Adel M.',  role: 'Product Lead, Mosaic' },
    { text: `Communicative, fast, technically sharp. Easy 10 out of 10. Would work with again instantly.`,
      who: 'Jordan T.', role: 'CTO, Hexagon Labs' },
  ]
  return `<section class="section" id="testimonials">
  <div class="section-head">
    <span class="section-tag">Kind Words</span>
    <h2>${pick(rng, ['Loved by Teams', 'What People Say', 'From the Folks We Serve'])}</h2>
  </div>
  <div class="testimonials">
    ${quotes.map(q => `<div class="quote-card">
      <p>"${q.text}"</p>
      <div class="quote-author"><strong>${q.who}</strong><span>${q.role}</span></div>
    </div>`).join('\n    ')}
  </div>
</section>`
}

function pricingSection(p, c, rng) {
  const plans = [
    { name: 'Starter', price: '0',  unit: '/mo', highlight: false, features: ['Up to 3 users', 'Basic features', 'Email support'] },
    { name: 'Pro',     price: '29', unit: '/mo', highlight: true,  features: ['Unlimited users', 'All features', 'Priority support', 'Advanced analytics'] },
    { name: 'Scale',   price: '99', unit: '/mo', highlight: false, features: ['Everything in Pro', 'Custom integrations', 'Dedicated manager', 'SLA'] },
  ]
  return `<section class="section" id="pricing">
  <div class="section-head">
    <span class="section-tag">Pricing</span>
    <h2>Simple, Honest Pricing</h2>
    <p>No surprises. Cancel anytime.</p>
  </div>
  <div class="pricing-grid">
    ${plans.map(pl => `<div class="price-card ${pl.highlight ? 'featured' : ''}">
      ${pl.highlight ? '<span class="featured-badge">Most Popular</span>' : ''}
      <h3>${pl.name}</h3>
      <div class="price"><span class="amount">$${pl.price}</span><span class="unit">${pl.unit}</span></div>
      <ul>${pl.features.map(f => `<li>✓ ${f}</li>`).join('')}</ul>
      <a href="#cta" class="btn ${pl.highlight ? 'btn-primary' : 'btn-ghost'}">Get Started</a>
    </div>`).join('\n    ')}
  </div>
</section>`
}

function faqSection(p, c, rng) {
  const faqs = [
    { q: `How do I get started with ${p.name}?`, a: 'Just hit the button at the top. We will guide you the rest of the way.' },
    { q: 'Is there a free trial?',                 a: 'Yes — 14 days, no credit card required. Cancel anytime.' },
    { q: 'What kind of support do you offer?',     a: 'Email support for everyone. Pro plans get priority response within 4 hours.' },
    { q: 'Can I cancel anytime?',                  a: 'Always. No long-term contracts, no cancellation fees, no questions asked.' },
  ]
  return `<section class="section" id="faq">
  <div class="section-head">
    <span class="section-tag">FAQ</span>
    <h2>Common Questions</h2>
  </div>
  <div class="faq-list">
    ${faqs.map(f => `<details class="faq-item">
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join('\n    ')}
  </div>
</section>`
}

function teamSection(p, c, rng) {
  const members = [
    { name: 'Sarah K.', role: 'CEO',         init: 'S' },
    { name: 'Adel M.',  role: 'CTO',         init: 'A' },
    { name: 'Jordan T.', role: 'Designer',    init: 'J' },
    { name: 'Maya R.',   role: 'Engineer',    init: 'M' },
  ]
  return `<section class="section" id="team">
  <div class="section-head">
    <span class="section-tag">The Team</span>
    <h2>People Behind ${p.name}</h2>
  </div>
  <div class="team-grid">
    ${members.map(m => `<div class="member-card">
      <div class="member-avatar">${m.init}</div>
      <h4>${m.name}</h4>
      <span>${m.role}</span>
    </div>`).join('\n    ')}
  </div>
</section>`
}

function ctaSection(p, c, rng) {
  return `<section class="section cta-section" id="cta">
  <div class="cta-card">
    <h2>${pick(rng, ['Ready to Start?', "Let's Build Something", 'Get in Touch', 'Try It Today'])}</h2>
    <p>${pick(rng, ['Join thousands who already made the switch.', 'It only takes a minute.', 'Free to start. Easy to scale.'])}</p>
    <div class="hero-cta" style="justify-content:center;">
      <a href="#contact" class="btn btn-primary big">${c.ctaPrimary} <span class="arrow">→</span></a>
    </div>
  </div>
</section>`
}

function contactSection(p, c, rng) {
  const domain = p.name.toLowerCase().replace(/\s/g, '')
  return `<section class="section" id="contact">
  <div class="section-head">
    <span class="section-tag">Get In Touch</span>
    <h2>Say Hello</h2>
  </div>
  <div class="contact-grid">
    <div class="contact-card"><div class="contact-emoji">📧</div><div class="c-label">Email</div><div class="c-val">hello@${domain}.com</div></div>
    <div class="contact-card"><div class="contact-emoji">📞</div><div class="c-label">Phone</div><div class="c-val">+20 100 000 0000</div></div>
    <div class="contact-card"><div class="contact-emoji">📍</div><div class="c-label">Where</div><div class="c-val">Cairo, Egypt</div></div>
  </div>
</section>`
}

function footerSection(p) {
  return `<footer class="footer">
  <div class="footer-inner">
    <p>© ${new Date().getFullYear()} ${p.name}. All rights reserved.</p>
    <p>Crafted with ⚡ by VIXCELL</p>
  </div>
</footer>`
}

function navbar(p, c, rng, sectionIds) {
  const links = sectionIds.filter(id => !['hero', 'cta'].includes(id)).slice(0, 5)
  const linkLabels = { features: 'Features', services: 'Services', stats: 'Stats', gallery: 'Work', testimonials: 'Reviews', pricing: 'Pricing', faq: 'FAQ', team: 'Team', about: 'About', contact: 'Contact' }
  const logoMarkup = p.logo
    ? `<img src="${p.logo}" alt="${p.name}" class="nav-logo">`
    : `<span class="nav-brand-text">${p.name}</span>`
  return `<nav class="navbar">
  <div class="nav-inner">
    <a href="#hero" class="nav-brand">${logoMarkup}</a>
    <div class="nav-links">
      ${links.map(id => `<a href="#${id}">${linkLabels[id] || id}</a>`).join('\n      ')}
    </div>
    <a href="#cta" class="nav-cta">${c.ctaPrimary}</a>
  </div>
</nav>`
}

// ─── SECTION REGISTRY ─────────────────────────────────────────────
const HERO_VARIANTS = [heroCentered, heroSplit, heroAsymmetric, heroSpotlight]
const FEATURE_VARIANTS = [featuresGrid, featuresAlternating, featuresIconList]

// ─── CSS BUILDER (responds to palette + font) ───────────────────────
function buildCSS(palette, font) {
  const p = palette.primary
  const isLight = palette.bg === '#ffffff' || palette.bg === '#fdfbf7'
  const dimmer = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const dimmerHover = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.16)'

  return `
/* ─── Reset + Base ─── */
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'${font.body}',system-ui,-apple-system,sans-serif;background:${palette.bg};color:${palette.text};overflow-x:hidden;line-height:1.6;-webkit-font-smoothing:antialiased}
::selection{background:${alpha(p, 0.3)};color:${palette.text}}
:root{--primary:${p};--primary-dark:${darken(p, 30)};--accent:${palette.accent};--surface:${palette.surface};--border:${dimmer};--border-h:${dimmerHover};--text:${palette.text};--muted:${palette.muted};--radius:16px;--ease:cubic-bezier(0.16,1,0.3,1)}

/* ─── Animations ─── */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,40px)}}
@keyframes float3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(0,0) scale(1.1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
@keyframes spotMove{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,30px)}}
.fade-in{animation:fadeUp 0.8s var(--ease) both}
.pulse{animation:pulse 2s infinite}

/* ─── Navbar ─── */
.navbar{position:fixed;top:0;width:100%;z-index:100;background:${alpha(palette.bg, 0.85)};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:68px}
.nav-brand{display:flex;align-items:center;gap:0.6rem;text-decoration:none;color:var(--text)}
.nav-brand-text{font-family:'${font.head}';font-size:1.3rem;font-weight:${font.weight};letter-spacing:-0.02em}
.nav-logo{height:36px;width:auto;object-fit:contain}
.nav-links{display:flex;gap:2rem}
.nav-links a{color:var(--muted);text-decoration:none;font-size:0.88rem;font-weight:500;transition:color .25s}
.nav-links a:hover{color:var(--text)}
.nav-cta{background:var(--primary);color:#fff;padding:0.5rem 1.3rem;border-radius:50px;text-decoration:none;font-size:0.85rem;font-weight:600;transition:transform .2s, box-shadow .2s}
.nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px ${alpha(p, 0.4)}}

/* ─── Buttons ─── */
.btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.85rem 2rem;border-radius:50px;text-decoration:none;font-weight:600;font-size:0.95rem;transition:all .25s var(--ease);border:none;cursor:pointer}
.btn-primary{background:linear-gradient(135deg, var(--primary), var(--primary-dark));color:#fff;box-shadow:0 8px 24px ${alpha(p, 0.35)}}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 32px ${alpha(p, 0.5)}}
.btn-primary.big{padding:1.1rem 2.6rem;font-size:1.05rem}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border)}
.btn-ghost:hover{background:var(--surface);border-color:var(--border-h)}
.arrow{transition:transform .2s}
.btn:hover .arrow{transform:translateX(4px)}

/* ─── Badges ─── */
.badge{display:inline-block;padding:0.3rem 1rem;background:${alpha(p, 0.12)};border:1px solid ${alpha(p, 0.3)};color:var(--primary);border-radius:50px;font-size:0.78rem;font-weight:600;margin-bottom:1.5rem;letter-spacing:0.02em}

/* ─── Section header ─── */
.section{padding:6rem 2rem;max-width:1200px;margin:0 auto}
.section-alt{background:var(--surface);max-width:100%;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.section-alt > *{max-width:1200px;margin-left:auto;margin-right:auto}
.section-head{text-align:center;margin-bottom:4rem}
.section-tag{display:inline-block;padding:0.25rem 0.9rem;background:${alpha(p, 0.1)};border:1px solid ${alpha(p, 0.2)};color:var(--primary);border-radius:50px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1rem}
.section-head h2{font-family:'${font.head}';font-size:clamp(2rem, 4vw, 3rem);font-weight:${font.weight};letter-spacing:-0.02em;margin-bottom:0.8rem}
.section-head p{color:var(--muted);font-size:1.05rem;max-width:500px;margin:0 auto}

/* ─── Hero (centered) ─── */
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:7rem 2rem 4rem;position:relative;overflow:hidden}
.hero-content{max-width:760px;text-align:center;position:relative;z-index:2}
.hero h1{font-family:'${font.head}';font-size:clamp(2.6rem, 6.5vw, 5rem);font-weight:${font.weight};line-height:1.05;letter-spacing:-0.04em;margin-bottom:1.5rem;color:var(--text)}
.hero-desc{font-size:1.15rem;color:var(--muted);margin-bottom:2.5rem;max-width:580px;margin-left:auto;margin-right:auto;line-height:1.7}
.hero-cta{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.hero-orbs{position:absolute;inset:0;pointer-events:none;z-index:0}
.orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.4}
.orb-1{width:480px;height:480px;background:var(--primary);top:-100px;left:-100px;animation:float1 14s ease-in-out infinite}
.orb-2{width:360px;height:360px;background:var(--accent);bottom:-100px;right:-100px;animation:float2 16s ease-in-out infinite}
.orb-3{width:300px;height:300px;background:var(--primary);top:40%;left:50%;animation:float3 12s ease-in-out infinite}

/* ─── Hero (split) ─── */
.hero-split{display:grid;grid-template-columns:1.1fr 1fr;align-items:center;max-width:1280px;margin:0 auto;text-align:left}
.split-left h1{font-family:'${font.head}';font-size:clamp(2.4rem, 5vw, 4rem);font-weight:${font.weight};line-height:1.1;letter-spacing:-0.03em;margin-bottom:1.5rem}
.split-left .hero-desc{margin-left:0}
.split-left .hero-cta{justify-content:flex-start}
.split-right{display:flex;justify-content:center;align-items:center}
.visual-card{position:relative;width:380px;height:380px;border-radius:32px;background:linear-gradient(135deg, var(--primary), var(--accent));display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;box-shadow:0 30px 80px ${alpha(p, 0.4)}}
.visual-glow{position:absolute;inset:-40px;background:linear-gradient(135deg, var(--primary), var(--accent));filter:blur(60px);opacity:0.5;z-index:-1;border-radius:32px}
.visual-letter{font-family:'${font.head}';font-size:11rem;font-weight:900;line-height:1;letter-spacing:-0.05em}
.visual-tag{font-size:1.1rem;font-weight:600;letter-spacing:0.05em;margin-top:0.5rem;opacity:0.9}

/* ─── Hero (asymmetric) ─── */
.hero-asym{display:grid;grid-template-columns:1.4fr 1fr;align-items:center;max-width:1280px;margin:0 auto;text-align:left}
.asym-bg{position:absolute;top:0;right:0;width:55%;height:100%;background:linear-gradient(135deg, ${alpha(p, 0.1)}, transparent);z-index:0}
.asym-content{position:relative;z-index:2}
.asym-label{display:inline-block;font-family:'JetBrains Mono', monospace;color:var(--primary);font-size:0.85rem;margin-bottom:1rem;letter-spacing:0.05em}
.asym-title{font-family:'${font.head}';font-size:clamp(3rem, 7vw, 5.5rem);font-weight:${font.weight};line-height:0.95;letter-spacing:-0.04em;margin-bottom:1.5rem}
.asym-corner{position:relative;z-index:1;display:flex;justify-content:flex-end}
.corner-grid{width:280px;height:280px;background-image:linear-gradient(${dimmer} 1px, transparent 1px), linear-gradient(90deg, ${dimmer} 1px, transparent 1px);background-size:24px 24px;border-radius:24px;border:1px solid var(--border);position:relative}
.corner-grid::after{content:'';position:absolute;inset:60px;background:linear-gradient(135deg, var(--primary), var(--accent));border-radius:16px;opacity:0.8}

/* ─── Hero (spotlight) ─── */
.hero-spotlight{background:radial-gradient(circle at 50% 30%, ${alpha(p, 0.15)}, transparent 60%)}
.spotlight{position:absolute;width:600px;height:600px;background:radial-gradient(circle, ${alpha(p, 0.4)}, transparent 70%);top:0;left:50%;transform:translateX(-50%);animation:spotMove 8s ease-in-out infinite;z-index:0;filter:blur(60px)}
.gradient-title{font-family:'${font.head}';background:linear-gradient(135deg, var(--text) 30%, var(--primary) 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.trust-row{margin-top:3rem;color:var(--muted);font-size:0.85rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;align-items:center}
.trust-row strong{color:var(--text);font-weight:700;letter-spacing:0.1em}

/* ─── Grid layouts ─── */
.grid{display:grid;gap:1.6rem}
.grid-3{grid-template-columns:repeat(3, 1fr)}
.grid-4{grid-template-columns:repeat(4, 1fr)}
@media(max-width:900px){.grid-3,.grid-4{grid-template-columns:1fr}}

/* ─── Feature card ─── */
.feature-card{padding:2.4rem 2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);transition:all .3s var(--ease)}
.feature-card:hover{transform:translateY(-6px);border-color:var(--border-h);box-shadow:0 20px 50px ${alpha(p, 0.15)}}
.feature-icon{font-size:2.4rem;margin-bottom:1.2rem;display:inline-block;line-height:1}
.feature-card h3{font-family:'${font.head}';font-size:1.25rem;font-weight:700;margin-bottom:0.7rem}
.feature-card p{color:var(--muted);font-size:0.94rem;line-height:1.7}

/* ─── Alternating ─── */
.alt-stack{display:flex;flex-direction:column;gap:5rem}
.alt-row{display:grid;grid-template-columns:1fr 1.4fr;gap:3rem;align-items:center}
.alt-row.reverse{grid-template-columns:1.4fr 1fr}
.alt-row.reverse .alt-visual{order:2}
.alt-visual{background:linear-gradient(135deg, var(--primary), var(--accent));aspect-ratio:1;border-radius:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px ${alpha(p, 0.3)}}
.alt-icon{font-size:5rem;color:#fff}
.alt-num{font-family:'${font.head}';color:var(--primary);font-size:3rem;font-weight:${font.weight};line-height:1;display:block;margin-bottom:1rem;opacity:0.5}
.alt-text h3{font-family:'${font.head}';font-size:1.8rem;font-weight:700;margin-bottom:1rem}
.alt-text p{color:var(--muted);font-size:1.05rem;line-height:1.8}
@media(max-width:900px){.alt-row,.alt-row.reverse{grid-template-columns:1fr}.alt-row.reverse .alt-visual{order:0}}

/* ─── Icon list ─── */
.icon-list{display:grid;grid-template-columns:repeat(2, 1fr);gap:1.5rem;max-width:900px;margin:0 auto}
.icon-item{display:flex;gap:1.2rem;padding:1.6rem;background:var(--surface);border:1px solid var(--border);border-radius:14px;transition:all .25s var(--ease)}
.icon-item:hover{border-color:var(--border-h);transform:translateX(4px)}
.icon-dot{flex-shrink:0;width:44px;height:44px;background:linear-gradient(135deg, var(--primary), var(--accent));color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem}
.icon-item strong{display:block;font-family:'${font.head}';font-size:1.05rem;margin-bottom:0.3rem}
.icon-item p{color:var(--muted);font-size:0.9rem;line-height:1.6}
@media(max-width:700px){.icon-list{grid-template-columns:1fr}}

/* ─── Stats ─── */
.stats{padding:4rem 2rem}
.stats-row{display:flex;justify-content:space-around;gap:2rem;max-width:900px;margin:0 auto;padding:2.5rem;background:var(--surface);border:1px solid var(--border);border-radius:24px;flex-wrap:wrap}
.stat-item{text-align:center}
.stat-num{display:block;font-family:'${font.head}';font-size:clamp(2rem, 4vw, 3rem);font-weight:${font.weight};background:linear-gradient(135deg, var(--primary), var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
.stat-label{display:block;font-size:0.88rem;color:var(--muted);margin-top:0.4rem;text-transform:uppercase;letter-spacing:0.05em}

/* ─── Gallery ─── */
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.2rem}
.gallery-item{aspect-ratio:1;border-radius:16px;position:relative;overflow:hidden;cursor:pointer;transition:transform .3s}
.gallery-item:hover{transform:scale(1.03)}
.gallery-overlay{position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.7), transparent 50%);display:flex;align-items:flex-end;padding:1.5rem;color:#fff;font-weight:600;font-size:1.1rem}

/* ─── Testimonials ─── */
.testimonials{display:grid;grid-template-columns:repeat(auto-fit, minmax(290px, 1fr));gap:1.5rem}
.quote-card{padding:2rem;background:var(--surface);border:1px solid var(--border);border-radius:16px}
.quote-card p{font-size:1.05rem;line-height:1.7;margin-bottom:1.5rem;color:var(--text);font-style:italic}
.quote-author strong{display:block;font-weight:700}
.quote-author span{color:var(--muted);font-size:0.85rem}

/* ─── Pricing ─── */
.pricing-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:1.5rem;max-width:1000px;margin:0 auto}
.price-card{padding:2.5rem 2rem;background:var(--surface);border:1px solid var(--border);border-radius:20px;text-align:center;position:relative;transition:all .25s}
.price-card.featured{border-color:var(--primary);box-shadow:0 20px 60px ${alpha(p, 0.25)};transform:scale(1.04)}
.price-card:hover:not(.featured){transform:translateY(-4px);border-color:var(--border-h)}
.featured-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;padding:0.3rem 1rem;border-radius:50px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
.price-card h3{font-family:'${font.head}';font-size:1.4rem;font-weight:700;margin-bottom:1rem}
.price{margin:1rem 0 1.5rem}
.price .amount{font-family:'${font.head}';font-size:3.5rem;font-weight:${font.weight};line-height:1}
.price .unit{color:var(--muted);font-size:1rem;margin-left:0.3rem}
.price-card ul{list-style:none;text-align:left;margin:1.5rem 0;padding:0}
.price-card li{padding:0.5rem 0;color:var(--muted);font-size:0.95rem}
.price-card .btn{width:100%;justify-content:center}
@media(max-width:900px){.pricing-grid{grid-template-columns:1fr}.price-card.featured{transform:none}}

/* ─── FAQ ─── */
.faq-list{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:0.8rem}
.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.2rem 1.6rem;cursor:pointer;transition:all .2s}
.faq-item:hover{border-color:var(--border-h)}
.faq-item summary{font-weight:600;font-family:'${font.head}';font-size:1rem;list-style:none;display:flex;justify-content:space-between;align-items:center}
.faq-item summary::after{content:'+';color:var(--primary);font-size:1.5rem;line-height:1;transition:transform .25s}
.faq-item[open] summary::after{transform:rotate(45deg)}
.faq-item p{margin-top:1rem;color:var(--muted);line-height:1.7}

/* ─── Team ─── */
.team-grid{display:grid;grid-template-columns:repeat(4, 1fr);gap:1.5rem}
.member-card{padding:1.8rem;background:var(--surface);border:1px solid var(--border);border-radius:16px;text-align:center;transition:all .25s}
.member-card:hover{transform:translateY(-4px);border-color:var(--border-h)}
.member-avatar{width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg, var(--primary), var(--accent));margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.8rem;font-weight:700}
.member-card h4{font-family:'${font.head}';font-size:1.1rem;font-weight:700;margin-bottom:0.3rem}
.member-card span{color:var(--muted);font-size:0.88rem}
@media(max-width:900px){.team-grid{grid-template-columns:repeat(2, 1fr)}}

/* ─── CTA ─── */
.cta-section{padding:5rem 2rem}
.cta-card{max-width:780px;margin:0 auto;padding:4rem 2.5rem;text-align:center;background:linear-gradient(135deg, ${alpha(p, 0.12)}, ${alpha(palette.accent, 0.12)});border:1px solid ${alpha(p, 0.25)};border-radius:28px}
.cta-card h2{font-family:'${font.head}';font-size:clamp(1.8rem, 4vw, 2.6rem);font-weight:${font.weight};margin-bottom:1rem;letter-spacing:-0.02em}
.cta-card p{color:var(--muted);font-size:1.1rem;margin-bottom:2rem}

/* ─── Contact ─── */
.contact-grid{display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap}
.contact-card{padding:2rem 2.5rem;text-align:center;background:var(--surface);border:1px solid var(--border);border-radius:16px;min-width:220px;transition:all .25s}
.contact-card:hover{border-color:var(--border-h);transform:translateY(-4px)}
.contact-emoji{font-size:2rem;margin-bottom:0.8rem}
.c-label{font-size:0.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.4rem}
.c-val{font-family:'${font.head}';font-weight:700;font-size:1.05rem}

/* ─── Footer ─── */
.footer{padding:2.5rem 2rem;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:0.88rem}
.footer-inner{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem}
@media(max-width:600px){.footer-inner{justify-content:center;flex-direction:column}}

/* ─── Mobile ─── */
@media(max-width:768px){
  .nav-links{display:none}
  .nav-cta{display:none}
  .hero{padding:5rem 1.2rem 3rem;min-height:auto}
  .hero-split,.hero-asym{grid-template-columns:1fr;text-align:center}
  .split-right{display:none}
  .asym-corner{display:none}
  .section{padding:4rem 1.2rem}
  .section-head{margin-bottom:2.5rem}
  .stats-row{padding:1.5rem}
  .visual-card{width:280px;height:280px}
  .visual-letter{font-size:8rem}
}`
}

// ─── JS BUILDER (lightweight runtime: scroll, observer, FAQ) ────────
function buildJS() {
  return `'use strict';

// Smooth scroll for in-page links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const t = document.getElementById(id);
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// Reveal-on-scroll for elements
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.feature-card, .quote-card, .price-card, .member-card, .alt-row, .gallery-item, .contact-card, .faq-item, .stats-row, .cta-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  io.observe(el);
});

// Navbar shadow on scroll
const nav = document.querySelector('.navbar');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    else nav.style.boxShadow = 'none';
  });
}`
}

// ─── Main Builder ──────────────────────────────────────────────────
export class SiteBuilder {
  constructor(ctx, requestText = '') {
    this.name = ctx.projectName || 'MyProject'
    this.type = ctx.businessType || 'business'
    this.logo = ctx.logo || null
    this.lang = ctx.lang || 'en'

    // Seed RNG with project name so the same project always looks the same,
    // but different projects look different.
    this.rng = makeRng(this.name + '|' + this.type)
    this.req = analyzeRequest(requestText)

    // Pick palette & font, respecting style hints
    const candidatePalettes = this.req.styleMinimal
      ? PALETTES.filter(p => p.name === 'minimal' || p.name === 'cream')
      : this.req.styleLuxury
        ? PALETTES.filter(p => ['royal', 'midnight', 'ocean'].includes(p.name))
        : this.req.styleBold
          ? PALETTES.filter(p => ['sunset', 'aurora', 'forest'].includes(p.name))
          : PALETTES

    this.palette = ctx.primary
      ? { ...pick(this.rng, candidatePalettes), primary: ctx.primary }
      : pick(this.rng, candidatePalettes)

    this.font = this.req.styleLuxury ? FONT_PAIRS.find(f => f.name === 'serif')
              : this.req.styleMinimal ? FONT_PAIRS.find(f => f.name === 'inter')
              : pick(this.rng, FONT_PAIRS)

    this.content = CONTENT[this.type] || CONTENT.business
    this.headline = pick(this.rng, this.content.headlines)

    this.projectMeta = { name: this.name, logo: this.logo, tagline: this.content.tagline, primary: this.palette.primary, accent: this.palette.accent }
  }

  pickSections() {
    // Always include: hero, features, contact, footer
    // Optionally include based on type + request + randomness
    const sections = []

    const heroFn = pick(this.rng, HERO_VARIANTS)
    sections.push({ id: 'hero', fn: heroFn })

    const featuresFn = pick(this.rng, FEATURE_VARIANTS)
    sections.push({ id: 'features', fn: featuresFn })

    // Decide on extras
    const wantStats = this.req.wantStats || maybe(this.rng, 0.5)
    const wantGallery = this.req.wantGallery || (this.type === 'portfolio' || (maybe(this.rng, 0.3) && ['business', 'restaurant'].includes(this.type)))
    const wantTestimonials = this.req.wantTestimonials || maybe(this.rng, 0.5)
    const wantPricing = this.req.wantPricing || (this.type === 'landing' && maybe(this.rng, 0.7))
    const wantTeam = this.req.wantTeam || (['business', 'clinic', 'school'].includes(this.type) && maybe(this.rng, 0.5))
    const wantFaq = this.req.wantFaq || maybe(this.rng, 0.4)

    if (wantStats) sections.push({ id: 'stats', fn: statsSection })
    if (wantGallery) sections.push({ id: 'gallery', fn: gallerySection })
    if (wantTestimonials) sections.push({ id: 'testimonials', fn: testimonialsSection })
    if (wantPricing) sections.push({ id: 'pricing', fn: pricingSection })
    if (wantTeam) sections.push({ id: 'team', fn: teamSection })
    if (wantFaq) sections.push({ id: 'faq', fn: faqSection })

    sections.push({ id: 'cta', fn: ctaSection })
    sections.push({ id: 'contact', fn: contactSection })

    return sections
  }

  html() {
    const sections = this.pickSections()
    const sectionIds = sections.map(s => s.id)
    const nav = navbar(this.projectMeta, this.content, this.rng, sectionIds)
    const body = sections.map(s => s.fn(this.projectMeta, this.content, this.rng, this.headline)).join('\n\n')
    const foot = footerSection(this.projectMeta)
    return [nav, body, foot].join('\n\n')
  }

  css() {
    return buildCSS(this.palette, this.font)
  }

  js() {
    return buildJS()
  }

  generateAll() {
    return { html: this.html(), css: this.css(), js: this.js() }
  }

  generatePreview() {
    return `<!DOCTYPE html>
<html lang="${this.lang}" dir="${this.lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${this.font.google}&display=swap" rel="stylesheet">
<style>${this.css()}</style>
</head>
<body>
${this.html()}
<script>${this.js()}</script>
</body>
</html>`
  }

  // Useful for the chat UI to show what was actually picked
  generateMeta() {
    return {
      palette: this.palette.name,
      font: this.font.name,
      sectionCount: this.pickSections().length,
      headline: this.headline,
    }
  }
}
