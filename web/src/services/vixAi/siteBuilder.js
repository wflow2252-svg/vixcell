// ─── VIXCELL AI — Website Builder ───────────────────────────────────
// Generates complete HTML/CSS/JS websites from project context.
// Supports multiple business types with adaptive content & styling.

const TYPE_NAMES = {
  ecommerce: 'E-Commerce',
  restaurant: 'Restaurant',
  blog: 'Blog',
  portfolio: 'Portfolio',
  business: 'Business',
  clinic: 'Clinic',
  school: 'School',
  personal: 'Personal',
  landing: 'Landing',
  dashboard: 'Dashboard',
}

const ABOUT_TEXTS = {
  ecommerce: 'Premium online store offering curated products with seamless checkout, secure payments, and fast worldwide delivery.',
  restaurant: 'A culinary destination serving handcrafted dishes with fresh ingredients in an unforgettable atmosphere.',
  business: 'Full-service digital agency delivering innovative web solutions, brand strategy, and cutting-edge technology.',
  blog: 'Your source for expert insights, tutorials, and thought leadership in tech and business.',
  portfolio: 'Creative portfolio showcasing award-winning projects across web, mobile, and brand design.',
  clinic: 'Comprehensive medical care delivered with compassion, expertise, and the latest technology.',
  school: 'Empowering students with knowledge, skills, and the confidence to shape their future.',
  personal: 'A personal space to share ideas, projects, and the journey along the way.',
  landing: 'The ultimate solution to grow your business, engage customers, and drive results.',
  dashboard: 'Real-time insights and analytics to power data-driven decisions.',
}

const SERVICE_SETS = {
  ecommerce: [
    { icon: '🛒', title: 'Easy Shopping', desc: 'Browse curated products with smart filters and seamless cart experience.' },
    { icon: '🔒', title: 'Secure Checkout', desc: 'PCI-compliant payments with multiple options and instant confirmation.' },
    { icon: '🚚', title: 'Fast Delivery', desc: 'Worldwide shipping with real-time tracking and delivery estimates.' },
  ],
  restaurant: [
    { icon: '🍽️', title: 'Fresh Daily', desc: 'Hand-picked ingredients sourced from local farms every morning.' },
    { icon: '👨‍🍳', title: 'Master Chefs', desc: 'Award-winning chefs crafting memorable experiences plate by plate.' },
    { icon: '🥂', title: 'Cozy Ambience', desc: 'Warm interiors designed for unforgettable evenings with loved ones.' },
  ],
  blog: [
    { icon: '✍️', title: 'Expert Writing', desc: 'In-depth tutorials and analyses by industry professionals.' },
    { icon: '📚', title: 'Curated Library', desc: 'Carefully organized topics to grow your knowledge step by step.' },
    { icon: '💡', title: 'Fresh Ideas', desc: 'Stay ahead with weekly drops covering the latest trends.' },
  ],
  portfolio: [
    { icon: '🎨', title: 'Visual Design', desc: 'Striking visuals crafted with pixel-perfect attention to detail.' },
    { icon: '⚡', title: 'Quick Turnaround', desc: 'Fast iterations without compromising on creative excellence.' },
    { icon: '🚀', title: 'Strategic Approach', desc: 'Design that drives results, not just looks good.' },
  ],
  business: [
    { icon: '🎨', title: 'UI/UX Design', desc: 'Beautiful, intuitive interfaces with meticulous attention to every pixel.' },
    { icon: '⚡', title: 'Development', desc: 'Clean, modular code with modern architecture for maximum performance.' },
    { icon: '🚀', title: 'Deployment', desc: 'Zero-downtime deployment with CI/CD pipelines and cloud infrastructure.' },
  ],
  clinic: [
    { icon: '🩺', title: 'Expert Care', desc: 'Certified specialists providing personalized treatment plans.' },
    { icon: '🏥', title: 'Modern Facility', desc: 'State-of-the-art equipment in a welcoming environment.' },
    { icon: '📞', title: '24/7 Support', desc: 'Always reachable when you need us most.' },
  ],
  school: [
    { icon: '📚', title: 'Modern Curriculum', desc: 'Up-to-date programs aligned with industry needs.' },
    { icon: '👩‍🏫', title: 'Expert Faculty', desc: 'Learn from accomplished educators and industry leaders.' },
    { icon: '🌐', title: 'Global Network', desc: 'Connect with peers worldwide through our alumni community.' },
  ],
  personal: [
    { icon: '💼', title: 'My Work', desc: 'Projects I have built, ideas I have explored.' },
    { icon: '📝', title: 'Writing', desc: 'Thoughts on tech, design, and the things I learn.' },
    { icon: '📬', title: 'Get in Touch', desc: 'Always happy to chat about interesting ideas.' },
  ],
  landing: [
    { icon: '⚡', title: 'Fast Setup', desc: 'Get started in minutes, not days. No configuration nightmares.' },
    { icon: '📊', title: 'Real Results', desc: 'Built-in analytics show exactly what is working.' },
    { icon: '💎', title: 'Premium Quality', desc: 'Crafted to the highest standards in every detail.' },
  ],
  dashboard: [
    { icon: '📊', title: 'Live Metrics', desc: 'Real-time data flowing in from all your sources.' },
    { icon: '🎯', title: 'Custom Views', desc: 'Drag, drop, and arrange exactly how you think.' },
    { icon: '🤖', title: 'AI Insights', desc: 'Anomaly detection and predictive analytics built in.' },
  ],
}

export class SiteBuilder {
  constructor(ctx) {
    this.name = ctx.projectName || 'MyProject'
    this.type = ctx.businessType || 'business'
    this.p = ctx.primary || '#6366f1'
    this.logo = ctx.logo || null
    this.lang = ctx.lang || 'en'
    this.dir = this.lang === 'ar' ? 'rtl' : 'ltr'

    this.typeName = TYPE_NAMES[this.type] || 'Website'
    this.aboutText = ABOUT_TEXTS[this.type] || ABOUT_TEXTS.business
    this.services = SERVICE_SETS[this.type] || SERVICE_SETS.business
  }

  generateAll() {
    return { html: this.html(), css: this.css(), js: this.js() }
  }

  generatePreview() {
    return `<!DOCTYPE html>
<html lang="${this.lang}" dir="${this.dir}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${this.css()}</style>
</head><body>
${this.html()}
<script>${this.js()}</script>
</body></html>`
  }

  html() {
    const logoSpan = this.logo
      ? `<img src="${this.logo}" alt="logo" class="nav-logo">`
      : `<span class="brand-text">${this.name}</span>`

    const services = this.services.map(s => `    <div class="card-3d-wrapper">
      <div class="card glass-card card-inner">
        <div class="card-icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>
    </div>`).join('\n')

    return `<nav class="navbar">
  <div class="nav-inner">
    <a href="#" class="nav-brand">${logoSpan}</a>
    <div class="nav-links">
      <a href="#services">Services</a>
      <a href="#dashboard">Highlights</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </div>
    <button class="nav-cta" onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">Get Started</button>
  </div>
</nav>

<section class="hero" id="hero">
  <div class="hero-bg-shapes">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
  </div>
  <div class="hero-content glass-card">
    <div class="hero-badge">✦ ${this.typeName} Platform</div>
    <h1>Welcome to <span class="gradient-text">${this.name}</span></h1>
    <p>${this.aboutText}</p>
    <div class="hero-actions">
      <button class="btn-primary" onclick="document.getElementById('services').scrollIntoView({behavior:'smooth'})">🚀 Explore</button>
      <button class="btn-ghost" onclick="document.getElementById('about').scrollIntoView({behavior:'smooth'})">Learn More →</button>
    </div>
  </div>
</section>

<section class="section" id="services">
  <div class="section-header">
    <span class="section-badge">What We Offer</span>
    <h2>Our Services</h2>
    <p>End-to-end solutions crafted with cutting-edge technology</p>
  </div>
  <div class="cards-grid" id="cards3dContainer">
${services}
  </div>
</section>

<section class="section section-alt" id="dashboard">
  <div class="section-header">
    <span class="section-badge">Highlights</span>
    <h2>By the Numbers</h2>
    <p>Real metrics that matter</p>
  </div>
  <div class="excel-table-wrapper">
    <table class="excel-table">
      <thead>
        <tr><th>Metric</th><th>Value</th><th>Change</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>Revenue</td><td>$128,430</td><td class="up">+12.5%</td><td><span class="status-badge active">Growing</span></td></tr>
        <tr><td>Users</td><td>24,891</td><td class="up">+8.3%</td><td><span class="status-badge active">Active</span></td></tr>
        <tr><td>Conversion</td><td>3.42%</td><td class="down">-0.8%</td><td><span class="status-badge warn">Needs Review</span></td></tr>
        <tr><td>Page Load</td><td>1.2s</td><td class="up">+15%</td><td><span class="status-badge active">Optimal</span></td></tr>
        <tr><td>Bounce Rate</td><td>32.1%</td><td class="down">+2.1%</td><td><span class="status-badge warn">Monitor</span></td></tr>
        <tr><td>Active Sessions</td><td>1,847</td><td class="up">+22%</td><td><span class="status-badge active">Growing</span></td></tr>
      </tbody>
    </table>
  </div>
</section>

<section class="section" id="about">
  <div class="section-header">
    <span class="section-badge">About</span>
    <h2>Why ${this.name}?</h2>
  </div>
  <div class="about-grid">
    <div class="about-text glass-card">
      <p>${this.aboutText}</p>
      <p>We combine technical excellence with creative vision to deliver results that exceed expectations. Every project is crafted with precision, care, and cutting-edge technology.</p>
      <div class="stats-row">
        <div class="stat"><span class="stat-num">50+</span><span class="stat-label">Projects</span></div>
        <div class="stat"><span class="stat-num">30+</span><span class="stat-label">Clients</span></div>
        <div class="stat"><span class="stat-num">5+</span><span class="stat-label">Years</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="contact">
  <div class="section-header">
    <span class="section-badge">Get In Touch</span>
    <h2>Let's Talk</h2>
    <p>Ready to start something great? Reach out.</p>
  </div>
  <div class="contact-grid">
    <div class="contact-card glass-card">
      <div class="contact-emoji">📧</div>
      <div class="contact-label">Email</div>
      <div class="contact-value">hello@${this.name.toLowerCase().replace(/\s/g,'')}.com</div>
    </div>
    <div class="contact-card glass-card">
      <div class="contact-emoji">📞</div>
      <div class="contact-label">Phone</div>
      <div class="contact-value">+20 100 000 0000</div>
    </div>
    <div class="contact-card glass-card">
      <div class="contact-emoji">📍</div>
      <div class="contact-label">Location</div>
      <div class="contact-value">Cairo, Egypt</div>
    </div>
  </div>
</section>

<footer class="footer">
  <div class="footer-inner">
    <p>© ${new Date().getFullYear()} ${this.name}. All rights reserved. Built with ⚡</p>
  </div>
</footer>`
  }

  css() {
    return `*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:#07070a;color:#e2e8f0;overflow-x:hidden;line-height:1.6}
::selection{background:${this.p}50;color:#fff}

:root{--primary:${this.p};--primary-dark:${this.darken(40)};--glass-bg:rgba(255,255,255,0.04);--glass-border:rgba(255,255,255,0.08);--radius:20px;--transition:all 0.35s cubic-bezier(0.16,1,0.3,1)}

.glass-card{background:var(--glass-bg);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid var(--glass-border);border-radius:var(--radius);transition:var(--transition)}
.glass-card:hover{border-color:rgba(255,255,255,0.15);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.3)}

.navbar{position:fixed;top:0;width:100%;z-index:1000;padding:0 2rem;background:rgba(7,7,10,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06)}
.nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px}
.nav-brand{display:flex;align-items:center;gap:0.6rem;text-decoration:none}
.brand-text{font-size:1.4rem;font-weight:800;background:linear-gradient(135deg,#fff,var(--primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-logo{height:36px;width:auto;object-fit:contain}
.nav-links{display:flex;gap:2rem}
.nav-links a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:0.88rem;font-weight:500;transition:color .25s;position:relative}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--primary);transition:width .3s}
.nav-links a:hover{color:#fff}
.nav-links a:hover::after{width:100%}
.nav-cta{background:var(--primary);color:#fff;border:none;padding:0.55rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:600;cursor:pointer;transition:var(--transition)}
.nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 25px ${this.p}50}

.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:6rem 2rem;position:relative;overflow:hidden}
.hero-bg-shapes{position:absolute;inset:0;pointer-events:none}
.shape{position:absolute;border-radius:50%;opacity:0.08}
.shape-1{width:600px;height:600px;background:var(--primary);top:-200px;right:-100px;animation:float1 8s ease-in-out infinite}
.shape-2{width:400px;height:400px;background:var(--primary);bottom:-150px;left:-100px;animation:float2 10s ease-in-out infinite}
.shape-3{width:300px;height:300px;background:var(--primary);top:50%;left:50%;animation:float3 12s ease-in-out infinite}
@keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-40px)}}
@keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,30px)}}
@keyframes float3{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.15)}}
.hero-content{max-width:720px;width:100%;text-align:center;padding:3.5rem 3rem;position:relative;z-index:1}
.hero-badge{display:inline-block;padding:0.35rem 1.2rem;background:${this.p}15;border:1px solid ${this.p}30;border-radius:50px;font-size:0.78rem;font-weight:600;color:var(--primary);margin-bottom:1.5rem;letter-spacing:0.02em}
.hero h1{font-size:clamp(2.5rem,6vw,4.2rem);font-weight:900;margin-bottom:1.2rem;line-height:1.15;letter-spacing:-0.03em}
.gradient-text{background:linear-gradient(135deg,#fff 30%,var(--primary) 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.1rem;color:rgba(255,255,255,0.55);margin-bottom:2.5rem;max-width:550px;margin-left:auto;margin-right:auto;line-height:1.8}
.hero-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border:none;padding:0.9rem 2.2rem;border-radius:50px;font-size:0.95rem;font-weight:700;cursor:pointer;transition:var(--transition);box-shadow:0 8px 30px ${this.p}40}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px ${this.p}60}
.btn-ghost{background:transparent;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.12);padding:0.9rem 2.2rem;border-radius:50px;font-size:0.95rem;font-weight:600;cursor:pointer;transition:var(--transition)}
.btn-ghost:hover{background:rgba(255,255,255,0.06);color:#fff}

.section{padding:6rem 2rem;max-width:1200px;margin:0 auto}
.section-alt{padding:6rem 2rem;background:rgba(255,255,255,0.015);max-width:100%}
.section-alt>div{max-width:1200px;margin:0 auto}
.section-header{text-align:center;margin-bottom:4rem}
.section-badge{display:inline-block;padding:0.3rem 1rem;background:${this.p}12;border:1px solid ${this.p}25;border-radius:50px;font-size:0.75rem;font-weight:600;color:var(--primary);margin-bottom:1rem;letter-spacing:0.05em}
.section-header h2{font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;margin-bottom:0.8rem;letter-spacing:-0.02em}
.section-header p{color:rgba(255,255,255,0.45);font-size:1.05rem;max-width:480px;margin:0 auto}

.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.8rem;perspective:1200px}
.card-3d-wrapper{perspective:1200px}
.card-inner{transform-style:preserve-3d;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);will-change:transform}
.card-3d-wrapper:hover .card-inner{transform:rotateX(6deg) rotateY(12deg) translateZ(10px);box-shadow:0 25px 60px rgba(0,0,0,0.4)}
.card{padding:2.5rem 2rem;text-align:center}
.card-icon{font-size:2.8rem;margin-bottom:1.2rem;display:block}
.card h3{font-size:1.2rem;font-weight:700;margin-bottom:0.6rem}
.card p{color:rgba(255,255,255,0.5);font-size:0.92rem;line-height:1.7}

.excel-table-wrapper{overflow-x:auto;border-radius:var(--radius);border:1px solid var(--glass-border);background:rgba(255,255,255,0.02)}
.excel-table{width:100%;border-collapse:collapse;font-size:0.88rem}
.excel-table th{padding:0.9rem 1.2rem;text-align:left;font-weight:600;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.04);border-bottom:2px solid rgba(255,255,255,0.08);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em}
.excel-table td{padding:0.8rem 1.2rem;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.65);transition:all 0.2s}
.excel-table tbody tr{transition:all 0.2s;cursor:pointer}
.excel-table tbody tr:hover{background:rgba(255,255,255,0.04)}
.excel-table tbody tr:hover td{color:#fff}
.excel-table td.up{color:#22c55e}
.excel-table td.down{color:#ef4444}
.status-badge{display:inline-block;padding:0.2rem 0.7rem;border-radius:50px;font-size:0.72rem;font-weight:600}
.status-badge.active{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)}
.status-badge.warn{background:rgba(250,204,21,0.15);color:#eab308;border:1px solid rgba(250,204,21,0.3)}

.about-grid{display:grid;grid-template-columns:1fr;max-width:700px;margin:0 auto}
.about-text{padding:2.5rem}
.about-text p{color:rgba(255,255,255,0.6);line-height:1.9;margin-bottom:1.2rem;font-size:1.02rem}
.stats-row{display:flex;justify-content:center;gap:3rem;margin-top:2rem;flex-wrap:wrap}
.stat{text-align:center}
.stat-num{font-size:2rem;font-weight:900;background:linear-gradient(135deg,var(--primary),var(--primary-dark));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{font-size:0.82rem;color:rgba(255,255,255,0.45);margin-top:0.2rem}

.contact-grid{display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap}
.contact-card{padding:1.8rem 2.2rem;text-align:center;min-width:200px}
.contact-emoji{font-size:1.8rem;margin-bottom:0.5rem}
.contact-label{font-size:0.78rem;color:rgba(255,255,255,0.4);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.06em}
.contact-value{font-weight:700;font-size:1rem}

.footer{background:rgba(0,0,0,0.3);border-top:1px solid rgba(255,255,255,0.05);padding:2rem;text-align:center}
.footer-inner{max-width:1200px;margin:0 auto}
.footer p{color:rgba(255,255,255,0.3);font-size:0.85rem}

@media(max-width:768px){
  .nav-links,.nav-cta{display:none}
  .hero-content{padding:2.5rem 1.5rem}
  .hero h1{font-size:2rem}
  .section{padding:4rem 1.5rem}
  .cards-grid{grid-template-columns:1fr}
  .contact-grid{flex-direction:column;align-items:center}
  .excel-table-wrapper{border-radius:12px}
  .excel-table th,.excel-table td{padding:0.6rem 0.8rem;font-size:0.78rem}
}`
  }

  js() {
    return `'use strict';

document.querySelectorAll('.card-3d-wrapper').forEach(function(wrapper) {
  var card = wrapper.querySelector('.card-inner');
  wrapper.addEventListener('mousemove', function(e) {
    var rect = this.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var centerX = rect.width / 2;
    var centerY = rect.height / 2;
    var rotateX = ((y - centerY) / centerY) * -8;
    var rotateY = ((x - centerX) / centerX) * 12;
    card.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(10px)';
  });
  wrapper.addEventListener('mouseleave', function() {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
  });
});

document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.glass-card').forEach(function(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});`
  }

  darken(amount) {
    const num = parseInt(this.p.replace('#', ''), 16)
    const r = Math.max(0, ((num >> 16) & 0xff) - amount)
    const g = Math.max(0, ((num >> 8) & 0xff) - amount)
    const b = Math.max(0, (num & 0xff) - amount)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
}
