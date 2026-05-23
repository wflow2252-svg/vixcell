class WebsiteGenerator {
  constructor(context) {
    this.ctx = context;
    this.p = context.colors.primary || '#ff6b35';
    this.bg = context.colors.bg || '#0a0a0a';
    this.textColor = context.colors.text || '#ffffff';
    this.isDark = this.bg !== '#ffffff';
    this.cardBg = this.isDark ? '#141414' : '#f8f8f8';
    this.sectionBg = this.isDark ? '#0d0d0d' : '#f5f5f5';
    this.borderColor = this.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    this.mutedText = this.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    this.headingColor = this.isDark ? '#fff' : '#1a1a1a';
    this.logoHtml = this.ctx.logo
      ? `<img src="${this.ctx.logo}" alt="logo" style="height:45px;object-fit:contain">`
      : `<span style="font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,${this.headingColor},${this.p});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${this.ctx.projectName || 'Vixcell'}</span>`;
    this.name = this.ctx.projectName || 'Vixcell';
    this.type = this.ctx.businessType || 'business';
    this.logoInHero = this.ctx.logo
      ? `<img src="${this.ctx.logo}" alt="logo" style="width:90px;height:90px;object-fit:contain;margin-bottom:1.5rem;border-radius:16px;box-shadow:0 0 40px rgba(0,0,0,0.3);animation:float 3s ease-in-out infinite">`
      : '';
    this.lang = 'ar';
    this.dir = 'rtl';
  }

  generate() {
    const html = `<!DOCTYPE html>
<html lang="${this.lang}" dir="${this.dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Cairo',sans-serif;background:${this.bg};color:${this.textColor};overflow-x:hidden}
nav{position:fixed;top:0;width:100%;padding:1.2rem 5%;display:flex;justify-content:space-between;align-items:center;background:rgba(10,10,10,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:1000;border-bottom:1px solid ${this.p}22}
.logo{display:flex;align-items:center}
.nav-links{display:flex;gap:2rem;list-style:none}
.nav-links a{color:${this.mutedText};text-decoration:none;font-size:0.95rem;font-weight:600;transition:all 0.3s;position:relative}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:${this.p};transition:width 0.3s}
.nav-links a:hover::after,.nav-links a:hover{width:100%;color:${this.p}}
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:5px}
.hamburger span{width:25px;height:2px;background:${this.textColor};transition:all 0.3s}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 50% 0%,${this.p}15 0%,${this.bg} 60%);padding:8rem 2rem 4rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,${this.p}15 0%,transparent 60%);border-radius:50%;top:-150px;animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.hero-content{position:relative;z-index:1;max-width:800px}
.hero-badge{display:inline-block;padding:0.4rem 1.2rem;background:${this.p}20;border:1px solid ${this.p}50;border-radius:50px;font-size:0.85rem;color:${this.p};margin-bottom:1.5rem}
.hero h1{font-size:clamp(2.2rem,6vw,4.5rem);font-weight:900;margin-bottom:1rem;line-height:1.2}
.hero h1 span{background:linear-gradient(135deg,${this.headingColor} 30%,${this.p} 70%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:${this.mutedText};margin-bottom:2.5rem;line-height:1.8;max-width:600px;margin-left:auto;margin-right:auto}
.btn-primary{display:inline-flex;align-items:center;gap:0.6rem;background:linear-gradient(135deg,${this.p},${this.darken(this.p, 30)});color:#fff;padding:1rem 2.5rem;border-radius:50px;font-size:1rem;font-weight:700;text-decoration:none;transition:all 0.35s;box-shadow:0 8px 30px ${this.p}50;border:none;cursor:pointer}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px ${this.p}80}
.btn-secondary{display:inline-flex;align-items:center;gap:0.6rem;background:rgba(255,255,255,0.07);color:${this.headingColor};padding:1rem 2.5rem;border-radius:50px;font-size:1rem;font-weight:700;text-decoration:none;border:1px solid ${this.borderColor};transition:all 0.35s;margin-${this.dir === 'rtl' ? 'right' : 'left'}:1rem}
.btn-secondary:hover{background:rgba(255,255,255,0.12);transform:translateY(-3px)}
.hero-buttons{margin-top:2.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
section{padding:6rem 5%}
.section-title{text-align:center;font-size:2.2rem;font-weight:800;margin-bottom:0.8rem;color:${this.headingColor}}
.section-subtitle{text-align:center;color:${this.mutedText};margin-bottom:4rem;font-size:1.05rem;max-width:500px;margin-left:auto;margin-right:auto}
.content-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1100px;margin:0 auto}
.card{background:${this.cardBg};padding:2.5rem 2rem;border-radius:20px;border:1px solid ${this.borderColor};transition:all 0.4s;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${this.p},${this.darken(this.p, 30)});transform:scaleX(0);transform-origin:left;transition:transform 0.4s}
.card:hover::before{transform:scaleX(1)}
.card:hover{transform:translateY(-8px);border-color:${this.p}40;box-shadow:0 20px 50px rgba(0,0,0,0.3)}
.card-icon{font-size:2.5rem;margin-bottom:1.2rem;display:block}
.card h3{font-size:1.2rem;margin-bottom:0.6rem;font-weight:700;color:${this.headingColor}}
.card p{color:${this.mutedText};line-height:1.8;font-size:0.92rem}
.about-section{background:${this.bg}}
.about-content{max-width:800px;margin:0 auto;text-align:center}
.about-content p{color:${this.mutedText};line-height:2;font-size:1.05rem;margin-bottom:1.5rem}
.stats-row{display:flex;justify-content:center;gap:4rem;margin-top:3rem;flex-wrap:wrap}
.stat-item{text-align:center}
.stat-number{font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,${this.p},${this.darken(this.p, 30)});-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{color:${this.mutedText};font-size:0.9rem;margin-top:0.3rem}
.contact-section{background:${this.sectionBg};text-align:center}
.contact-grid{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-top:2rem}
.contact-card{background:${this.cardBg};padding:1.5rem 2rem;border-radius:16px;border:1px solid ${this.borderColor};min-width:200px;transition:all 0.3s}
.contact-card:hover{border-color:${this.p}50;transform:translateY(-4px)}
.contact-card .label{color:${this.mutedText};font-size:0.85rem;margin-bottom:0.3rem}
.contact-card .value{color:${this.headingColor};font-weight:600;font-size:1.05rem}
footer{background:${this.isDark ? '#060606' : '#e5e5e5'};padding:2rem 5%;text-align:center;border-top:1px solid ${this.borderColor}}
footer p{color:${this.mutedText};font-size:0.88rem}
.whatsapp-float{position:fixed;bottom:20px;${this.dir === 'rtl' ? 'left' : 'right'}:20px;background:#25D366;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.4);z-index:999;transition:all 0.3s;cursor:pointer}
.whatsapp-float:hover{transform:scale(1.1);box-shadow:0 8px 30px rgba(37,211,102,0.5)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@media(max-width:768px){
  nav{padding:1rem 5%}
  .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:${this.bg};flex-direction:column;padding:1rem;border-bottom:1px solid ${this.borderColor}}
  .nav-links.open{display:flex}
  .hamburger{display:flex}
  .hero h1{font-size:2rem}
  .hero{padding:6rem 1.5rem 3rem}
  section{padding:4rem 1.5rem}
  .content-grid{grid-template-columns:1fr}
  .stats-row{gap:2rem}
  .hero-buttons{flex-direction:column;align-items:center}
  .btn-secondary{margin-${this.dir === 'rtl' ? 'right' : 'left'}:0}
}
</style>
</head>
<body>
<nav>
  <div class="logo">${this.logoHtml}</div>
  <ul class="nav-links" id="navLinks">
    <li><a href="#services">${this.lang === 'ar' ? 'خدماتنا' : 'Services'}</a></li>
    <li><a href="#about">${this.lang === 'ar' ? 'من نحن' : 'About'}</a></li>
    <li><a href="#contact">${this.lang === 'ar' ? 'اتصل بنا' : 'Contact'}</a></li>
  </ul>
  <button class="hamburger" onclick="document.getElementById('navLinks').classList.toggle('open')">
    <span></span><span></span><span></span>
  </button>
</nav>

<section class="hero">
  <div class="hero-content">
    ${this.logoInHero ? `<div>${this.logoInHero}</div>` : `<div class="hero-badge">⚡ ${this.lang === 'ar' ? 'وكالة رقمية متكاملة' : 'Digital Agency'}</div>`}
    <h1>${this.lang === 'ar' ? `<span>${this.name}</span> — نبني مستقبلك الرقمي` : `Build Your Digital Future with <span>${this.name}</span>`}</h1>
    <p>${this.getHeroSubtitle()}</p>
    <div class="hero-buttons">
      <a href="#contact" class="btn-primary">🚀 ${this.lang === 'ar' ? 'ابدأ مشروعك' : 'Start Your Project'}</a>
      <a href="#services" class="btn-secondary">${this.lang === 'ar' ? 'تعرف علينا' : 'Learn More'}</a>
    </div>
  </div>
</section>

${this.generateContentSection()}

${this.generateAboutSection()}

<section class="contact-section" id="contact">
  <h2 class="section-title">${this.lang === 'ar' ? 'اتصل بنا' : 'Contact Us'}</h2>
  <p class="section-subtitle">${this.lang === 'ar' ? 'نحن هنا لمساعدتك' : "We're here to help"}</p>
  <div class="contact-grid">
    <div class="contact-card">
      <div class="label">📧 ${this.lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</div>
      <div class="value">hello@${this.name.toLowerCase().replace(/\s+/g, '')}.com</div>
    </div>
    <div class="contact-card">
      <div class="label">📞 ${this.lang === 'ar' ? 'الهاتف' : 'Phone'}</div>
      <div class="value">+20 100 000 0000</div>
    </div>
    <div class="contact-card">
      <div class="label">📍 ${this.lang === 'ar' ? 'العنوان' : 'Address'}</div>
      <div class="value">${this.lang === 'ar' ? 'مصر — القاهرة' : 'Cairo, Egypt'}</div>
    </div>
  </div>
</section>

<footer>
  <p>© 2026 ${this.name} — ${this.lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}. Made with ⚡</p>
</footer>

<a href="https://wa.me/201000000000" class="whatsapp-float" target="_blank">
  <svg width="28" height="28" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>
</body>
</html>`;
    return html;
  }

  getHeroSubtitle() {
    const subtitles = {
      ecommerce: 'نقدم أفضل الحلول الرقمية لتسوق إلكتروني احترافي — تجربة مستخدم استثنائية ومنتجات لا تُضاهى',
      restaurant: 'أشهى الأطباق وأجواء لا تُنسى — نقدم لك تجربة طعام استثنائية في كل زيارة',
      business: 'نحول أفكارك إلى حلول رقمية متكاملة — من التصميم إلى النشر باحترافية عالية',
      blog: 'نشاركك المعرفة والإلهام — محتوى مميز في عالم التقنية والأعمال',
      portfolio: 'نبني هويتك الرقمية بإبداع — نعرض أعمالك بأفضل صورة',
      clinic: 'نقدم الرعاية الصحية بمعايير عالمية — عيادات متكاملة بأحدث التقنيات',
      school: 'نبني جيل المستقبل — تعليم متميز بأساليب عصرية',
      personal: 'هويتك الرقمية الشخصية — اعرض نفسك ومهاراتك بأفضل صورة',
    };
    return subtitles[this.type] || subtitles.business;
  }

  generateContentSection() {
    const sectionId = 'services';
    let title, subtitle, items;

    switch (this.type) {
      case 'ecommerce':
        title = 'منتجاتنا';
        subtitle = 'أفضل المنتجات بأسعار منافسة';
        items = [
          { icon: '🛍️', title: 'منتج 1', desc: 'وصف المنتج الأول — جودة عالية وسعر ممتاز' },
          { icon: '👕', title: 'منتج 2', desc: 'أحدث التصاميم والعروض الحصرية' },
          { icon: '📦', title: 'منتج 3', desc: 'توصيل سريع وآمن لكل أنحاء الجمهورية' },
        ];
        break;
      case 'restaurant':
        title = 'قائمة الطعام';
        subtitle = 'أشهى الأطباق الطازجة';
        items = [
          { icon: '🍕', title: 'طبق 1', desc: 'وصف الطبق الشهي — مكونات طازجة وطعم لا يُقاوم' },
          { icon: '🥗', title: 'طبق 2', desc: 'وجبات صحية ولذيذة محضرة بأيدي أمهر الطهاة' },
          { icon: '🍰', title: 'طبق 3', desc: 'الحلويات والمشروبات الطازجة' },
        ];
        break;
      case 'blog':
        title = 'أحدث المقالات';
        subtitle = 'محتوى مميز في عالم التقنية والأعمال';
        items = [
          { icon: '📝', title: 'مقال 1', desc: 'موضوع شيق ومفيد في عالم البرمجة والتقنية' },
          { icon: '💡', title: 'مقال 2', desc: 'نصائح وحيل لتطوير أعمالك الرقمية' },
          { icon: '📊', title: 'مقال 3', desc: 'تحليلات وإحصائيات عن سوق التقنية' },
        ];
        break;
      case 'portfolio':
        title = 'أعمالنا';
        subtitle = 'نماذج من مشاريعنا المتميزة';
        items = [
          { icon: '🖥️', title: 'مشروع 1', desc: 'موقع متكامل لشركة رائدة في المجال التقني' },
          { icon: '📱', title: 'مشروع 2', desc: 'تطبيق جوال مبتكر بواجهات مستخدم سلسة' },
          { icon: '🎨', title: 'مشروع 3', desc: 'تصميم هوية بصرية متكاملة لعلامة تجارية' },
        ];
        break;
      default:
        title = 'خدماتنا';
        subtitle = 'نقدم حلولاً رقمية متكاملة';
        items = [
          { icon: '🌐', title: 'تصميم مواقع', desc: 'مواقع احترافية متجاوبة بأحدث التقنيات وتجربة مستخدم استثنائية' },
          { icon: '📱', title: 'تطبيقات جوال', desc: 'تطبيقات iOS و Android بأعلى معايير الجودة والأداء' },
          { icon: '🤖', title: 'حلول AI', desc: 'ذكاء اصطناعي مخصص — أتمتة، تحليل بيانات، وشات بوت ذكي' },
          { icon: '📊', title: 'تسويق رقمي', desc: 'إعلانات موجهة، SEO، وإدارة حسابات التواصل الاجتماعي' },
        ];
    }

    return `<section class="about-section" id="${sectionId}">
  <h2 class="section-title">${title}</h2>
  <p class="section-subtitle">${subtitle}</p>
  <div class="content-grid">
${items.map(item => `    <div class="card">
      <span class="card-icon">${item.icon}</span>
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
    </div>`).join('\n')}
  </div>
</section>`;
  }

  generateAboutSection() {
    return `<section class="about-section" id="about">
  <div class="about-content">
    <h2 class="section-title">${this.lang === 'ar' ? 'من نحن' : 'About Us'}</h2>
    <p class="section-subtitle">${this.lang === 'ar' ? 'فريق من المبدعين والتقنيين' : 'A team of creatives and technologists'}</p>
    <p>${this.lang === 'ar' ? `${this.name} هي منصة رقمية متخصصة في تحويل الأفكار إلى منتجات رقمية متميزة. نجمع بين الإبداع في التصميم والقوة في البرمجة لنقدم لعملائنا حلولاً لا تُضاهى.` : `${this.name} is a digital platform specialized in turning ideas into distinguished digital products. We combine design creativity with programming power to deliver unparalleled solutions.`}</p>
    <p>${this.lang === 'ar' ? 'فريقنا يضم خبراء في تطوير الويب، تطبيقات الجوال، الذكاء الاصطناعي، والتسويق الرقمي — كل هذا تحت سقف واحد لضمان تكامل الخدمة وجودتها.' : 'Our team includes experts in web development, mobile apps, AI, and digital marketing — all under one roof to ensure service integration and quality.'}</p>
    <div class="stats-row">
      <div class="stat-item"><div class="stat-number">+50</div><div class="stat-label">${this.lang === 'ar' ? 'مشروع منجز' : 'Projects Done'}</div></div>
      <div class="stat-item"><div class="stat-number">+30</div><div class="stat-label">${this.lang === 'ar' ? 'عميل سعيد' : 'Happy Clients'}</div></div>
      <div class="stat-item"><div class="stat-number">+5</div><div class="stat-label">${this.lang === 'ar' ? 'سنوات خبرة' : 'Years Experience'}</div></div>
    </div>
  </div>
</section>`;
  }

  darken(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}

module.exports = WebsiteGenerator;
