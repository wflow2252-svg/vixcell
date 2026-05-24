// ─── Vixcell Core AI ────────────────────────────────────────
// System Identity & Purpose:
// You are "Vixcell Core AI", an elite, ultimate Full-Stack Web Developer, Data Analyst, UI/UX Expert, and Market Strategist working for the digital agency "Vixcell". Your capabilities are limitless, and you operate at the level of a Principal Software Engineer and Lead Data Scientist. 
//
// # Core Objectives
// 1. Act as an expert consultant and implementer for all web development, data analysis, and technical tasks.
// 2. Provide flawless, production-ready, and highly optimized code without skipping any parts. Never use placeholders like "TODO" or "insert code here".
// 3. Understand and analyze visual inputs (images, mockups, UI designs) perfectly and translate them into functional, pixel-perfect code.
// 4. Deliver insights and analysis based on the latest market trends and technical standards.
//
// # Technical Expertise & Directives
//
// ## 1. Full-Stack Development
// - **Front-End:** You are a master of HTML, CSS, JavaScript, and modern UI/UX principles (including advanced techniques like Glassmorphism, high-fidelity layouts, and smooth animations). 
// - **Back-End:** You possess deep, expert-level knowledge of server-side logic, API development, database architecture, and security, utilizing technologies like Node.js and Python.
// - **Workflow:** When asked to build a website, provide the complete architecture, folder structure, and the fully functional code for both the client and server sides. Ensure seamless integration between the front-end and back-end.
//
// ## 2. Data Analysis & Problem Solving
// - When presented with data (raw text, structures, or files), you analyze it deeply and accurately.
// - Write and execute (conceptually or via code interpreter) Python scripts to clean, process, and visualize data.
// - Draw actionable business conclusions from data sets.
//
// ## 3. Multimodal & Vision Capabilities
// - When the user uploads an image (e.g., a website mockup, a database schema, or an error screenshot), analyze every pixel and detail.
// - If it's a design mockup, reverse-engineer it into a complete, responsive HTML/CSS/JS or modern framework equivalent.
// - If it's a technical diagram, translate it into code or architectural documentation.
//
// ## 4. Communication & Tone
// - Communicate in a sharp, professional, yet highly practical and energetic tone.
// - If the user speaks Arabic, reply in clear, professional Arabic while keeping all technical terms and code logic in English.
// - Anticipate the user's next technical need and provide comprehensive solutions before they even ask.
//
// # Strict Rules of Execution
// - **NO PARTIAL CODE:** Always provide complete, working files. 
// - **NO EXCUSES:** Assume you have the capability to solve any coding or analytical problem presented to you.
// - **BEST PRACTICES ONLY:** Always implement security best practices, clean code architecture, and scalable design patterns.

class SiteBuilder {
  constructor(ctx) {
    this.name = ctx.projectName || 'MyProject'
    this.type = ctx.businessType || 'business'
    this.p = ctx.primary || '#6366f1'
    this.logo = ctx.logo || null
    this.lang = 'en'
    this.dir = 'ltr'

    this.typeNames = {
      ecommerce: 'E-Commerce', restaurant: 'Restaurant', blog: 'Blog',
      portfolio: 'Portfolio', business: 'Business', clinic: 'Clinic',
      school: 'School', personal: 'Personal',
    }
    this.typeName = this.typeNames[this.type] || 'Website'
    this.aboutTexts = {
      ecommerce: 'Premium online store offering curated products with seamless checkout, secure payments, and fast worldwide delivery.',
      restaurant: 'A culinary destination serving handcrafted dishes with fresh ingredients in an unforgettable atmosphere.',
      business: 'Full-service digital agency delivering innovative web solutions, brand strategy, and cutting-edge technology.',
      blog: 'Your source for expert insights, tutorials, and thought leadership in tech and business.',
      portfolio: 'Creative portfolio showcasing award-winning projects across web, mobile, and brand design.',
    }
    this.aboutText = this.aboutTexts[this.type] || this.aboutTexts.business
  }

  // Output separate files (index.html, style.css, script.js)
  generateAll() {
    return { html: this.html(), css: this.css(), js: this.js() }
  }

  // Combined single-file for iframe preview
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

    return `<nav class="navbar">
  <div class="nav-inner">
    <a href="#" class="nav-brand">${logoSpan}</a>
    <div class="nav-links">
      <a href="#services">Services</a>
      <a href="#dashboard">Dashboard</a>
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
    <h1>We Build <span class="gradient-text">${this.name}</span></h1>
    <p>${this.aboutText}</p>
    <div class="hero-actions">
      <button class="btn-primary" onclick="document.getElementById('dashboard').scrollIntoView({behavior:'smooth'})">🚀 Explore Dashboard</button>
      <button class="btn-ghost" onclick="document.getElementById('services').scrollIntoView({behavior:'smooth'})">Learn More →</button>
    </div>
  </div>
</section>

<section class="section" id="services">
  <div class="section-header">
    <span class="section-badge">What We Offer</span>
    <h2>Premium Services</h2>
    <p>End-to-end solutions crafted with cutting-edge technology</p>
  </div>
  <div class="cards-grid" id="cards3dContainer">
    <div class="card-3d-wrapper">
      <div class="card glass-card card-inner">
        <div class="card-icon">🎨</div>
        <h3>UI/UX Design</h3>
        <p>Beautiful, intuitive interfaces with meticulous attention to every pixel and user flow.</p>
      </div>
    </div>
    <div class="card-3d-wrapper">
      <div class="card glass-card card-inner">
        <div class="card-icon">⚡</div>
        <h3>Development</h3>
        <p>Clean, modular code with modern architecture for maximum performance.</p>
      </div>
    </div>
    <div class="card-3d-wrapper">
      <div class="card glass-card card-inner">
        <div class="card-icon">🚀</div>
        <h3>Deployment</h3>
        <p>Zero-downtime deployment with CI/CD pipelines and cloud infrastructure.</p>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="dashboard">
  <div class="section-header">
    <span class="section-badge">Analytics</span>
    <h2>Performance Dashboard</h2>
    <p>Real-time metrics and data at your fingertips</p>
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
    <span class="section-badge">About Us</span>
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
    <h2>Let's Work Together</h2>
    <p>Ready to start your next project? Reach out to us.</p>
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
    <p>© 2026 ${this.name}. All rights reserved. Built with ⚡</p>
  </div>
</footer>

<!-- Chat Input with Image Upload (thumbnail ABOVE textarea) -->
<div class="chat-upload-demo">
  <div class="chat-input-wrapper glass-card" id="chatInputWrapper">
    <div class="chat-thumbnails" id="chatThumbnails"></div>
    <div class="chat-input-row">
      <button class="chat-upload-btn" id="chatUploadBtn" onclick="document.getElementById('chatFileInput').click()">📎</button>
      <input type="file" id="chatFileInput" accept="image/*" hidden>
      <textarea class="chat-textarea" id="chatTextarea" placeholder="Type your message..." rows="2"></textarea>
      <button class="chat-send-btn" id="chatSendBtn">↑</button>
    </div>
  </div>
</div>`
  }

  css() {
    return `/* ─── Reset & Base ──────────────────────────────────── */
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:#07070a;color:#e2e8f0;overflow-x:hidden;line-height:1.6}
::selection{background:${this.p}50;color:#fff}

/* ─── Custom Properties ───────────────────────────────── */
:root{--primary:${this.p};--primary-dark:${this.darken(40)};--glass-bg:rgba(255,255,255,0.04);--glass-border:rgba(255,255,255,0.08);--radius:20px;--transition:all 0.35s cubic-bezier(0.16,1,0.3,1)}

/* ─── Glassmorphism Utility ───────────────────────────── */
.glass-card{background:var(--glass-bg);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid var(--glass-border);border-radius:var(--radius);transition:var(--transition)}
.glass-card:hover{border-color:rgba(255,255,255,0.15);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.3)}

/* ─── Navbar ─────────────────────────────────────────── */
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

/* ─── Hero ───────────────────────────────────────────── */
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

/* ─── Sections ───────────────────────────────────────── */
.section{padding:6rem 2rem;max-width:1200px;margin:0 auto}
.section-alt{padding:6rem 2rem;background:rgba(255,255,255,0.015);max-width:100%}
.section-alt>div{max-width:1200px;margin:0 auto}
.section-header{text-align:center;margin-bottom:4rem}
.section-badge{display:inline-block;padding:0.3rem 1rem;background:${this.p}12;border:1px solid ${this.p}25;border-radius:50px;font-size:0.75rem;font-weight:600;color:var(--primary);margin-bottom:1rem;letter-spacing:0.05em}
.section-header h2{font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;margin-bottom:0.8rem;letter-spacing:-0.02em}
.section-header p{color:rgba(255,255,255,0.45);font-size:1.05rem;max-width:480px;margin:0 auto}

/* ─── 3D Cards Grid ──────────────────────────────────── */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.8rem;perspective:1200px}
.card-3d-wrapper{perspective:1200px}
.card-inner{transform-style:preserve-3d;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);will-change:transform}
.card-3d-wrapper:hover .card-inner{transform:rotateX(6deg) rotateY(12deg) translateZ(10px);box-shadow:0 25px 60px rgba(0,0,0,0.4)}
.card{padding:2.5rem 2rem;text-align:center}
.card-icon{font-size:2.8rem;margin-bottom:1.2rem;display:block}
.card h3{font-size:1.2rem;font-weight:700;margin-bottom:0.6rem}
.card p{color:rgba(255,255,255,0.5);font-size:0.92rem;line-height:1.7}

/* ─── Excel Data Table ───────────────────────────────── */
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

/* ─── About ──────────────────────────────────────────── */
.about-grid{display:grid;grid-template-columns:1fr;max-width:700px;margin:0 auto}
.about-text{padding:2.5rem}
.about-text p{color:rgba(255,255,255,0.6);line-height:1.9;margin-bottom:1.2rem;font-size:1.02rem}
.stats-row{display:flex;justify-content:center;gap:3rem;margin-top:2rem;flex-wrap:wrap}
.stat{text-align:center}
.stat-num{font-size:2rem;font-weight:900;background:linear-gradient(135deg,var(--primary),var(--primary-dark));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{font-size:0.82rem;color:rgba(255,255,255,0.45);margin-top:0.2rem}

/* ─── Contact ────────────────────────────────────────── */
.contact-grid{display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap}
.contact-card{padding:1.8rem 2.2rem;text-align:center;min-width:200px}
.contact-emoji{font-size:1.8rem;margin-bottom:0.5rem}
.contact-label{font-size:0.78rem;color:rgba(255,255,255,0.4);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.06em}
.contact-value{font-weight:700;font-size:1rem}

/* ─── Footer ─────────────────────────────────────────── */
.footer{background:rgba(0,0,0,0.3);border-top:1px solid rgba(255,255,255,0.05);padding:2rem;text-align:center}
.footer-inner{max-width:1200px;margin:0 auto}
.footer p{color:rgba(255,255,255,0.3);font-size:0.85rem}

/* ─── Chat Upload (thumbnail ABOVE textarea) ─────────── */
.chat-upload-demo{max-width:580px;margin:3rem auto;padding:0 2rem}
.chat-input-wrapper{padding:1rem 1.2rem}
.chat-thumbnails{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;min-height:0;transition:all 0.3s}
.chat-thumbnails.has-image{min-height:56px}
.chat-thumbnails img{height:52px;width:52px;object-fit:cover;border-radius:10px;border:2px solid rgba(255,255,255,0.1);animation:fadeIn 0.3s;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
.chat-input-row{display:flex;align-items:flex-end;gap:0.6rem}
.chat-upload-btn{background:${this.p}15;border:1px solid ${this.p}25;color:var(--primary);width:40px;height:40px;border-radius:12px;font-size:1.1rem;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.chat-upload-btn:hover{background:${this.p}25}
.chat-textarea{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:0.7rem 1rem;color:#e2e8f0;font-family:'Inter',sans-serif;font-size:0.88rem;resize:none;outline:none;transition:var(--transition);line-height:1.5}
.chat-textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px ${this.p}20}
.chat-textarea::placeholder{color:rgba(255,255,255,0.25)}
.chat-send-btn{background:var(--primary);color:#fff;border:none;width:40px;height:40px;border-radius:12px;font-size:1.2rem;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.chat-send-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px ${this.p}40}

@keyframes fadeIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}

/* ─── Responsive ─────────────────────────────────────── */
@media(max-width:768px){
  .nav-links,.nav-cta{display:none}
  .hero-content{padding:2.5rem 1.5rem}
  .hero h1{font-size:2rem}
  .section{padding:4rem 1.5rem}
  .cards-grid{grid-template-columns:1fr}
  .contact-grid{flex-direction:column;align-items:center}
  .chat-upload-demo{padding:0 1rem}
  .excel-table-wrapper{border-radius:12px}
  .excel-table th,.excel-table td{padding:0.6rem 0.8rem;font-size:0.78rem}
}`
  }

  js() {
    return `// ─── Vix AI — Generated Site ──────────────────────────
'use strict';

// ─── 3D Tilt Effect on Cards ───────────────────────────
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

// ─── Smooth scroll for anchor links ────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ─── File Upload with Thumbnail ABOVE textarea ─────────
var chatFileInput = document.getElementById('chatFileInput');
var thumbnailsContainer = document.getElementById('chatThumbnails');
var chatTextarea = document.getElementById('chatTextarea');
var chatSendBtn = document.getElementById('chatSendBtn');

if (chatFileInput && thumbnailsContainer) {
  chatFileInput.addEventListener('change', function(e) {
    var files = Array.from(e.target.files);
    files.forEach(function(file) {
      if (!file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = document.createElement('img');
        img.src = ev.target.result;
        img.alt = file.name;
        img.title = file.name;
        thumbnailsContainer.classList.add('has-image');
        thumbnailsContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

// Send button demo
if (chatSendBtn && chatTextarea) {
  chatSendBtn.addEventListener('click', function() {
    var msg = chatTextarea.value.trim();
    if (msg || thumbnailsContainer.children.length > 0) {
      alert('Message sent: "' + (msg || '(with attachments)') + '"');
      chatTextarea.value = '';
      thumbnailsContainer.innerHTML = '';
      thumbnailsContainer.classList.remove('has-image');
    }
  });
  chatTextarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatSendBtn.click();
    }
  });
}

// ─── Intersection Observer for fade-in ─────────────────
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

// ─── Intent Detection ────────────────────────────────────

const INTENTS = { GREETING: 'g', BUILD: 'b', MODIFY: 'm', ANALYZE: 'a', HELP: 'h', UNKNOWN: 'u' }

function detectIntent(text) {
  const t = text.toLowerCase()
  if (/^(hello|hi|hey|مرحبا|السلام|أهلا|اهلا)/.test(t)) return INTENTS.GREETING
  if (/(help|مساعدة|what can|what do|ماذا|تقدر|powered|guide)/.test(t)) return INTENTS.HELP
  if (/(build|create|make|new|website|site|landing|app|web|موقع|ابني|اعمل|ebni|aamil|page|صفحة|متجر|store|shop|شركة|company|business|ecommerce)/.test(t)) return INTENTS.BUILD
  if (/(modify|edit|change|update|تعديل|عدل|غير|add|ضيف|زود)/.test(t)) return INTENTS.MODIFY
  if (/(analyze|review|explain|شرح|حلل|تحليل|understand|فهم|fix|bug|خطأ|error|code|كود|debug)/.test(t)) return INTENTS.ANALYZE
  return INTENTS.UNKNOWN
}

function extractInfo(text) {
  const info = { name: '', type: '', color: '' }
  // Name extraction
  const patterns = [
    /(?:called|named|for)\s+["']?([\w\u0600-\u06FF\s]{2,30})["']?/i,
    /(?:company|business|project|brand)\s+["']?([\w\u0600-\u06FF\s]{2,30})["']?/i,
    /(?:اسمي|اسم|شركة)\s+["']?([\w\u0600-\u06FF\s]{2,30})["']?/i,
    /(?:website|site)\s+(?:for|of)\s+["']?([\w\u0600-\u06FF\s]{2,30})["']?/i,
    /(["'])([\w\u0600-\u06FF\s]{2,30})\1/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1] && m[1].trim().length > 1) { info.name = m[1].trim().split(/\s+/).slice(0, 3).join(' '); break }
  }
  // Type
  if (/(ecommerce|store|shop|متجر)/i.test(text)) info.type = 'ecommerce'
  else if (/(restaurant|cafe|مطعم)/i.test(text)) info.type = 'restaurant'
  else if (/(blog|مدونة)/i.test(text)) info.type = 'blog'
  else if (/(portfolio|أعمال)/i.test(text)) info.type = 'portfolio'
  else if (/(clinic|عيادة)/i.test(text)) info.type = 'clinic'
  else if (/(school|مدرسة)/i.test(text)) info.type = 'school'
  else if (/(business|company|شركة|agency)/i.test(text)) info.type = 'business'
  // Color
  if (/(blue|أزرق)/i.test(text)) info.color = '#3b82f6'
  else if (/(green|أخضر)/i.test(text)) info.color = '#22c55e'
  else if (/(red|أحمر)/i.test(text)) info.color = '#ef4444'
  else if (/(purple|violet|بنفسجي)/i.test(text)) info.color = '#8b5cf6'
  else if (/(orange|برتقالي)/i.test(text)) info.color = '#f97316'
  else if (/(pink|وردي)/i.test(text)) info.color = '#ec4899'
  else if (/(yellow|gold|أصفر|ذهبي)/i.test(text)) info.color = '#eab308'
  return info
}

function analyzeCode(code) {
    const lang = detectLanguage(code)
    const lines = code.split('\n').length
    const lineArray = code.split('\n')
    
    // Enhanced language detection
    const isReact = /useState|useEffect|useContext|useReducer|useMemo|useCallback|import\s+React|from\s+["']react["']/i.test(code)
    const isJsx = /<\s*\w+[^>]*>[^<]*<\/\s*\w+\s*>|<\s*\w+[^>]*\/\s*>/.test(code)
    const isTs = /:[\w\s\<\>\[\]]+\s*[=;:]|\||\&lt\;|\&gt\;/i.test(code) && /interface\s+\w+|type\s+\w+\s*=/.test(code)
    const isVue = /createApp|ref\(|reactive\(|computed\(|watch\(|<\s*template\s*>/.test(code)
    
    // Basic structure checks
    const hasFunc = /function\s+\w+\s*\(|def\s+\w+\s*\(|fn\s+\w+\s*\(|=>|async\s+function|const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(code)
    const hasClass = /class\s+\w+/i.test(code)
    const hasLoop = /for\s*\(|while\s*\(|do\s*\{|\.forEach|\.map\(|\.filter\(|\.reduce\(|for\s+\w+\s+in|for\s*\(\s*(?:let|const|var)\s+\w+\s+/.test(code)
    const hasCond = /if\s*\(|else\s+if|else\s*\{|switch\s*\(|\?\s*:/.test(code)
    const hasAsync = /async\s+function|await|\.then\(|\.catch\(|Promise\s+\(|async\s+\(/i.test(code)
    const hasError = /\b(err|error|exception|throw|try\s*\{|catch\s*\(|finally\s*\{\s*\})/i.test(code)
    const hasComment = /\/\/|\/\*|\*\/\|#\s|--\s|<!--|-->/.test(code)
    
    // Advanced metrics
    const commentLines = code.match(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm) || []
    const commentRatio = commentLines.length / Math.max(lineArray.length, 1)
    
    // Estimate cyclomatic complexity (simplified)
    const decisionPoints = (code.match(/if\s*\(|else\s+if|case\s+|&&|\|\||\?\s*:|while\s*\(|for\s*\(/g) || []).length
    const estimatedComplexity = decisionPoints + 1
    
    // Detect common patterns/issues
    const hasMagicNumbers = /\b\d{2,}\b(?![\w\.])/.test(code) && !/version|^[\d\.\-]+$|padding|margin|width|height|font-size|border|z-index/i.test(code)
    const hasLongFunction = /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{100,}\}/.test(code)
    const hasDeepNesting = /(\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{[\s\S]*?\{)/.test(code)
    const hasConsoleLog = /console\.(log|debug|info|warn|error)/.test(code)
    const hasVarKeyword = /\bvar\s+\w+\s*=/.test(code)
    const hasStringConcat = /['"]\s*\+\s*[^+]+\s*\+\s*['"]/.test(code)
    
    // Framework-specific
    const hasUseEffectWithoutDeps = /useEffect\s*\(\s*[^,)]+\s*\)\s*(?!\[)/.test(code)
    const hasUseStateInitialization = /useState\s*\(\s*[^,)]+\s*\)/.test(code)

    let analysis = `📄 **Code Analysis** — ${lang}${isReact ? ' (React)' : ''}${isTs ? ' (TypeScript)' : ''}${isVue ? ' (Vue)' : ''}${isJsx ? ' (JSX)' : ''}\n`
    analysis += `**Lines:** ${lineArray.length} real, ${lines} total\n`
    analysis += `**Comments:** ${commentLines.length} lines (${Math.floor(commentRatio * 100)}%)\n\n`
    
    analysis += `**Structure & Quality:**\n`
    analysis += `${hasFunc ? '✅' : '❌'} Functions/methods\n`
    analysis += `${hasClass ? '✅' : '❌'} Classes\n`
    analysis += `${hasLoop ? '✅' : '❌'} Loops\n`
    analysis += `${hasCond ? '✅' : '❌'} Conditionals\n`
    analysis += `${hasAsync ? '✅' : '❌'} Async operations\n`
    analysis += `${hasError ? '✅' : '❌'} Error handling\n`
    analysis += `${hasComment ? '✅' : '❌'} Comments present\n`
    analysis += `${commentRatio > 0.2 ? '✅' : '❌'} Comment ratio (>20% ideal)\n\n`
    
    analysis += `**Complexity & Metrics:**\n`
    analysis += `**Estimated Complexity:** ${estimatedComplexity} (1-10 simple, 11-20 moderate, 21+ complex)\n`
    if (hasMagicNumbers) analysis += `🔢 **Magic numbers** detected — consider named constants\n`
    if (hasLongFunction) analysis += `⏳ **Long function** detected — consider breaking down\n`
    if (hasDeepNesting) analysis += `🔺 **Deep nesting** (>4 levels) — consider early returns or refactoring\n`
    if (hasConsoleLog) analysis += `📝 **Console.log** present — remove before production\n`
    if (hasVarKeyword) analysis += `📛 **var keyword** found — use let/const instead\n`
    if (hasStringConcat) analysis += `🔗 **String concatenation** — consider template literals\n`
    if (hasUseEffectWithoutDeps) analysis += `⚠️ **useEffect without dependencies** — may cause infinite loops\n`
    
    analysis += `\n**Recommendations:**\n`
    
    if (estimatedComplexity > 20) {
        analysis += `- 🔴 **High complexity** — break into smaller functions/modules\n`
    } else if (estimatedComplexity > 10) {
        analysis += `- 🟡 **Moderate complexity** — consider refactoring complex sections\n`
    }
    
    if (!hasFunc && lines > 15) {
        analysis += `- 🔧 Consider extracting logic into reusable functions\n`
    }
    
    if (!hasClass && lines > 50) {
        analysis += `- 🏗️ Consider using classes or modules for better organization\n`
    }
    
    if (commentRatio < 0.1) {
        analysis += `- 💬 Add more comments to explain complex logic\n`
    } else if (commentRatio > 0.4) {
        analysis += `- 📝 Consider reducing comments — code should be self-documenting where possible\n`
    }
    
    if (hasMagicNumbers) {
        analysis += `- 🔢 Replace magic numbers with named constants (e.g., const MAX_ITEMS = 100)\n`
    }
    
    if (hasLongFunction) {
        analysis += `- ⏳ Split long functions (>50 lines) into smaller, focused functions\n`
    }
    
    if (hasDeepNesting) {
        analysis += `- 🔺 Reduce nesting depth — use early returns, guard clauses, or split functions\n`
    }
    
    if (hasConsoleLog) {
        analysis += `- 📝 Remove console.log statements before production deployment\n`
    }
    
    if (hasVarKeyword) {
        analysis += `- 📛 Replace 'var' with 'let' (for reassignment) or 'const' (for constants)\n`
    }
    
    if (hasStringConcat) {
        analysis += `- 🔗 Use template literals (\`text {variable} more text\`) instead of string concatenation\n`
    }
    
    if (hasUseEffectWithoutDeps) {
        analysis += `- ⚠️ Add dependency array to useEffect: useEffect(() => {}, [deps])\n`
    }
    
    if (!hasError && (hasAsync || /fetch|axios|\$.ajax/i.test(code))) {
        analysis += `- ⚠️ Add error handling for async operations (try/catch or .catch())\n`
    }
    
    if (lines > 300) {
        analysis += `- 📦 Consider splitting this file into multiple modules/files\n`
    }
    
    // Language-specific advice
    if (lang === 'JavaScript' || lang === 'React/JSX') {
        if (!/const\s+|let\s+/.test(code)) {
            analysis += `- 📛 Prefer const/let over var for variable declarations\n`
        }
        if (!/^[{\[]/.test(code.trim()) && !/function\s+\w+\s*\(|=>/.test(code)) {
            analysis += `- 💡 Consider using arrow functions for simple callbacks\n`
        }
    }
    
    if (lang === 'Python') {
        if (!/if\s+__name__\s*==\s*["']__main__["']:/i.test(code)) {
            analysis += `- 🐍 Consider adding if __name__ == \"__main__\": guard for standalone execution\n`
        }
        if (!/def\s+\w+\s*\([^)]*\):/i.test(code) && lines > 20) {
            analysis += `- 🐍 Consider organizing code into functions\n`
        }
    }
    
    analysis += `\n**Positive Findings:**\n`
    if (hasFunc && hasComment) analysis += `✅ Functions with comments — good documentation practice\n`
    if (hasClass && hasFunc) analysis += `✅ Classes with methods — good encapsulation\n`
    if (hasError && hasAsync) analysis += `✅ Async operations with error handling — robust\n`
    if (commentRatio > 0.25 && commentRatio < 0.4) analysis += `✅ Healthy comment density\n`
    if (!hasMagicNumbers && !hasVarKeyword && !hasStringConcat) analysis += `✅ Clean code practices observed\n`
    
    analysis += `\n**Next Steps:**\n`
    analysis += `- Need help with a specific section? Point me to it!\n`
    analysis += `- Want me to suggest refactoring for any part? Just ask!\n`
    analysis += `- Need help writing tests for this code? I can help with that too!\n`
    
    return analysis
}

function detectLanguage(code) {
    // Remove comments and strings for more accurate detection
    const cleanedCode = code
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
        .replace(/\/\/.*/g, '')           // Remove line comments
        .replace(/["'`]([\s\S]*?)["'`]/g, '') // Remove string literals
    
    if (/<html|<div|<body|<head|<script/i.test(code)) return 'HTML'
    if (/def\s+\w+\s*\(|^import\s+[\w\s,]+from|^from\s+\w+\s+import/i.test(code)) return 'Python'
    if (/function\s+\w+\s*\(|=>|async\s+function|const\s+\w+\s*=\s*\([^)]*\)\s*=>|let\s+\w+\s*=\s*\([^)]*\)\s*=>/i.test(code)) {
        if (/import\s+React|from\s+["']react["']|useState|useEffect|useContext|useReducer|useMemo|useCallback/i.test(code)) {
            return 'React/JSX'
        }
        if (/import\s+["']vue["']|createApp|ref\(|reactive\(/i.test(code)) {
            return 'Vue.js'
        }
        return 'JavaScript'
    }
    if (/public\s+class|private\s+class|protected\s+class|extends\s+\w+|implements\s+[\w\s,]+/i.test(code)) {
        if (/package\s+[\w\.]+;/i.test(code)) return 'Java'
        if (/using\s+System;/i.test(code)) return 'C#'
    }
    if (/struct\s+\w+|impl\s+\w+|fn\s+\w+\s*\(|let\s+\w+\s*:/i.test(code)) return 'Rust'
    if (/func\s+\w+\s*\(|var\s+\w+\s*:|package\s+\w+/i.test(code)) {
        if (/import\s+["']fmt["']|func\s+main/i.test(code)) return 'Go'
    }
    if (/class\s+\w+|def\s+\w+|@\w+|::|new\s+\w+/i.test(code)) {
        if (/puts\s+|print\s+|require\s+|gem\s+/i.test(code)) return 'Ruby'
    }
    if (/@interface|#import|@implementation|\..*\[\]|NSString|NSArray/i.test(code)) return 'Objective-C'
    if (/@\w+|\.swift|func\s+\w+\s*\(|var\s+\w+\s*:|let\s+\w+\s*:/i.test(code)) return 'Swift'
    if (/namespace\s+\w+|using\s+[\w\.]+;|Console\.Write/i.test(code)) {
        if (/System\.Drawing\.|Windows\.Forms\./i.test(code)) return 'C# (Windows Forms)'
        if (/Aspose\.|TestClass/i.test(code)) return 'C#'
    }
    if (/<\?php|function\s+\w+\s*\(|class\s+\w+|extends\s+\w+|implements\s+[\w\s,]+/i.test(code)) return 'PHP'
    if (/#include\s+[<"]\w+[">]|int\s+main\s*\(|std::\w+|::/i.test(code)) {
        if (/class\s+\w+|public\s+|private\s+|protected\s+/i.test(code)) return 'C++'
        return 'C'
    }
    if (/#\s*\w+|\$\(|Write-Host|\[CmdletBinding\]/i.test(code)) return 'PowerShell'
    if (/sql|select\s+|insert\s+|update\s+|delete\s+from/i.test(code)) return 'SQL'
    return 'Unknown'
}

// ─── Sessions & Context ──────────────────────────────────

const sessions = {}

function getSession(id) {
  if (!sessions[id]) {
    sessions[id] = {
      stage: 'start',
      context: { projectName: '', businessType: '', primary: '#6366f1', logo: null },
      generatedFiles: null,
    }
  }
  return sessions[id]
}

// ─── Main AI Response ────────────────────────────────────

export function getAIResponse(sessionId, message) {
  const session = getSession(sessionId)
  const ctx = session.context
  const intent = detectIntent(message)

  // Deep requirement analysis — extract info silently
  const info = extractInfo(message)
  if (info.name) ctx.projectName = info.name
  if (info.type) ctx.businessType = info.type
  if (info.color) ctx.primary = info.color

  // Logo upload
  if (message.includes('[LOGO_UPLOADED]')) {
    ctx.logo = true
    session.stage = 'building'
    const builder = new SiteBuilder(ctx)
    session.generatedFiles = builder.generateAll()
    const preview = builder.generatePreview()
    return {
      text: `✅ Logo received! Generating your **${ctx.projectName || 'site'}** now... 🚀\n\n**Files generated:**\n• \`index.html\` — Semantic HTML5 structure\n• \`style.css\` — Glassmorphism UI with CSS Grid/Flexbox\n• \`script.js\` — Modular ES6+ with upload preview\n\nCheck the Preview tab! 👀`,
      html: preview,
      files: session.generatedFiles,
    }
  }

  // Code analysis
  if (intent === INTENTS.ANALYZE || message.includes('```')) {
    const codeMatch = message.match(/```[\w]*\n?([\s\S]*?)```/)
    const code = codeMatch ? codeMatch[1].trim() : message
    if (code.length > 15) {
      return { text: analyzeCode(code), html: null }
    }
    return { text: '📄 Upload a code file or paste your code between triple backticks (\\`\\`\\`) and I\'ll analyze it.', html: null }
  }

  // Greeting
  if (intent === INTENTS.GREETING) {
    session.stage = 'collecting'
    return {
      text: `أهلاً بك. أنا **VIXCELL** — المساعد الذكي الخبير في التطوير المتكامل وتصميم الـ UI/UX وتجهيز البنى التحتية. 🚀

يمكنني مساعدتك في:
🌐 **بناء مواقع ويب كاملة ومتكاملة** (ملفات منفصلة: HTML + CSS + JS) بتصميم عصري فخم.
📊 **تحليل وهندسة الأكواد البرمجية** واكتشاف الأخطاء بدقة.
🎨 **تصميم واجهات احترافية وممتازة** تعتمد على Glassmorphism و CSS Grid/Flexbox.
🖼️ **معاينة ورفع الشعار والصور** لربطها فوراً بمشروعك.

**كل ما عليك هو إخباري بطلبك مباشرة، مثل:**
> "ابني موقعاً لشركة التقنية الذكية باسم **TechCorp**"
> "أنشئ متجراً إلكترونياً للعطور باسم **Scents**"
> "حلل هذا الكود البرمجي واقترح تحسينات"`,
      html: null,
    }
  }

  // Help
  if (intent === INTENTS.HELP) {
    return {
      text: `🎯 **VIXCELL — دليل القدرات والتشغيل**

🌐 **بناء المواقع وتصميم الواجهات**
أقوم بتوليد ملفات منفصلة ونظيفة (\`index.html\`, \`style.css\`, \`script.js\`) مجهزة بأعلى معايير الـ SEO والأداء المتجاوب.

📄 **تحليل الأكواد والتدقيق البرمجي**
ارفع أي ملف كود أو اكتبه بين \`\`\` وسأقوم بفحصه وتحليله والكشف عن الثغرات الأمنية والأخطاء فوراً.

🎨 **التطوير المستمر والتعديل**
يمكنك أن تطلب مني تغيير الألوان، أو إضافة أقسام جديدة، أو تعديل المحتوى والنصوص بعد البناء.

**أمثلة للأوامر السريعة:**
> "أنشئ صفحة هبوط لشركة **StartupX**"
> "ابني موقع مطعم برجر باسم **FlameBurger**"
> "اجعل اللون الأساسي **أزرق داكن**" (بعد بناء الموقع)`,
      html: null,
    }
  }

  // Build website
  if (intent === INTENTS.BUILD) {
    if (!ctx.projectName || !ctx.businessType) {
      session.stage = 'collecting'
      let q = `🎯 **دعني أحلل متطلبات مشروعك.**

للبدء في البناء، أحتاج إلى معرفة التفاصيل التالية:

`
      if (!ctx.projectName) q += `1️⃣ **اسم المشروع أو الشركة** — ماذا تريد أن تسميه؟\n`
      if (!ctx.businessType) q += `2️⃣ **فئة النشاط** — متجر إلكتروني، بورتفوليو، مطعم، شركة، عيادة؟\n`
      q += `\n> مثال: "ابني موقع مطعم باسم **TasteLab**"\n\nبمجرد تزويدي بهذه البيانات، سأبدأ فوراً في توليد كود نظيف ومتكامل بأسلوب Glassmorphism الأنيق! 🚀`
      return { text: q, html: null }
    }

    // Deep requirement analysis complete — build
    const builder = new SiteBuilder(ctx)
    session.generatedFiles = builder.generateAll()
    const preview = builder.generatePreview()

    const typeDisp = ctx.businessType.charAt(0).toUpperCase() + ctx.businessType.slice(1)
    return {
      text: `✅ **Requirement analysis complete.** Generating **${ctx.projectName}** (${typeDisp})...\n\n**📁 Output Files:**\n\`\`\`\nproject/\n├── index.html    — Semantic HTML5 structure\n├── style.css     — Glassmorphism UI with Custom Properties\n└── script.js     — Modular ES6+ (upload preview, animations)\n\`\`\`\n\n**✨ Features:**\n• Glassmorphism design with backdrop blur\n• CSS Grid & Flexbox layout\n• Responsive (mobile/tablet/desktop)\n• File upload with thumbnail preview\n• Smooth scroll & intersection animations\n\nCheck the **Preview** tab to see it live! 👀\n\nWant to modify something? Just tell me:\n> "Change the color to **blue**"\n> "Add a **gallery** section"`,
      html: preview,
      files: session.generatedFiles,
    }
  }

  // Modify existing site
  if (session.generatedFiles && (intent === INTENTS.MODIFY || message.includes('color') || message.includes('change') || message.includes('add') || message.includes('غير') || message.includes('لون') || message.includes('ضيف'))) {
    const colorMap = {
      'blue|أزرق': '#3b82f6', 'green|أخضر': '#22c55e', 'red|أحمر': '#ef4444',
      'purple|violet|بنفسجي': '#8b5cf6', 'orange|برتقالي': '#f97316',
      'pink|وردي': '#ec4899', 'yellow|gold|أصفر|ذهبي': '#eab308',
      'indigo': '#6366f1', 'teal': '#14b8a6', 'cyan': '#06b6d4',
    }
    for (const [pattern, color] of Object.entries(colorMap)) {
      if (new RegExp(pattern, 'i').test(message)) {
        ctx.primary = color
        break
      }
    }
    const builder = new SiteBuilder(ctx)
    const preview = builder.generatePreview()
    session.generatedFiles = builder.generateAll()
    return { text: `✅ Updated! New accent color applied 🎨\n\nCheck the **Preview** tab to see the changes.`, html: preview, files: session.generatedFiles }
  }

  // Collecting info / unknown
  if (session.stage === 'collecting' || intent === INTENTS.UNKNOWN) {
    if (message.length > 4 && !ctx.projectName) {
      // Try to use the message itself as project name
      const words = message.trim().split(/\s+/)
      if (words.length <= 5) {
        ctx.projectName = message.trim()
        ctx.businessType = ctx.businessType || 'business'
        const builder = new SiteBuilder(ctx)
        session.generatedFiles = builder.generateAll()
        const preview = builder.generatePreview()
        return {
          text: `✅ Got it! Building **${ctx.projectName}**... 🚀\n\n**Output:** \`index.html\`, \`style.css\`, \`script.js\` — separate files with modern Glassmorphism design.\n\nCheck the **Preview** tab! 👀`,
          html: preview,
          files: session.generatedFiles,
        }
      }
    }
    return {
      text: `I'm here to help! 🎯\n\n**To build a website:**\n> "Build a site for **MyCompany**"\n> "Create an **e-commerce store** called **ShopName**"\n\n**To analyze code:** Upload a file or paste it with triple backticks.\n\nWhat would you like to do? 🚀`,
      html: null,
    }
  }

  return {
    text: `How can I help you? 🚀\n\n**Build:** "Create a website for **BusinessName**"\n**Analyze:** Upload a code file\n**Modify:** "Change color to blue" (after site is built)`,
    html: null,
  }
}

export function resetSession(id) {
  delete sessions[id]
}
