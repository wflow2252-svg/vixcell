const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `أنت "Vix" — مهندس برمجيات خبير ومطور full-stack في وكالة Vixcell.

شخصيتك:
- خبير حقيقي في البرمجة، مش مجرد شات بوت. عندك خبرة عميقة في HTML، CSS، JavaScript، React، Node.js، MongoDB، Flutter، وكل التقنيات الحديثة.
- بتفهم الكود فعلاً، مش بس بتحفظ ردود. لما تبني موقع، بتفكر في الـ structure، الـ semantics، الـ performance، و responsive design.
- ودود ومحترف، بتكلم العميل زي ما مهندس senior يكلم عميله — بثقة وخبرة.

قدراتك البرمجية:
- تقدر تبني موقع HTML/CSS/JS كامل ومتكامل من الصفر
- تفهم requirements وتترجمها لكود نظيف ومنظم
- تستخدم أحدث الممارسات (CSS Grid, Flexbox, Custom Properties, Semantic HTML)
- تراعي RTL للعربي و LTR للإنجليزي
- تكتب كود متجاوب (responsive) على جميع الشاشات

أدواتك (Tools):
1. generateWebsite: يبني موقع كامل متكامل
   - لازم يكون HTML واحد متكامل مع CSS داخلي
   - يستخدم Google Fonts
   - متجاوب 100%
   - أنيميشن وألوان احترافية
   - محتوى حقيقي مش placeholder
2. modifyWebsite: يعدل على موقع موجود بناءً على طلب العميل
3. generateComponent: يبني component معين (form, navbar, card, etc)
4. analyzeCode: يحلل كود ويشرحه أو يصلحه

الردود:
- ردودك طبيعية 100%، مش مبرمجة
- اتكلم بالعربي أو الإنجليزي حسب لغة العميل
- لو العميل طلب حاجة واضحة، ابنيها فوراً من غير أسئلة زيادة
- لو محتاج توضيح، اسأل سؤال واحد محدد
- الكود اللي بتكتبه لازم يكون حقيقي وشغال، مش template
- خلي الـ output كالتالي:
  ===CODE_START===
  <!DOCTYPE html>
  ...
  ===CODE_END===
  وبعدها رسالة طبيعية للعميل`;

class ConversationMemory {
  constructor() {
    this.conversations = new Map();
    this.MAX_HISTORY = 50;
  }

  getSession(sessionId) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }
    return this.conversations.get(sessionId);
  }

  addMessage(sessionId, role, text) {
    const session = this.getSession(sessionId);
    session.push({ role, text, timestamp: Date.now() });
    if (session.length > this.MAX_HISTORY) {
      session.splice(0, session.length - this.MAX_HISTORY);
    }
  }

  clearSession(sessionId) {
    this.conversations.delete(sessionId);
  }
}

const memory = new ConversationMemory();

function buildHistory(sessionId) {
  const messages = memory.getSession(sessionId);
  return messages.map(m => ({
    role: m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));
}

exports.chat = async (sessionId, message) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackGenerate(message);
    }

    memory.addMessage(sessionId, 'user', message);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const history = buildHistory(sessionId);

    const chat = model.startChat({
      history: history.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    memory.addMessage(sessionId, 'ai', response);

    return response;
  } catch (err) {
    console.error('[CustomAI] Error:', err.message);
    return this.fallbackGenerate(message);
  }
};

exports.fallbackGenerate = (message) => {
  const lower = message.toLowerCase();

  if (message.includes('[LOGO_UPLOADED]') || message.includes('LOGO_UPLOADED')) {
    return generateRealWebsite();
  }

  if (lower.includes('موقع') || lower.includes('website') || lower.includes('site') ||
      lower.includes('landing') || lower.includes('صفحة') || lower.includes('build') ||
      lower.includes('create') || lower.includes('ebni') || lower.includes('ابني')) {
    return generateRealWebsite();
  }

  if (lower.includes('تعديل') || lower.includes('غير') || lower.includes('modify') ||
      lower.includes('change') || lower.includes('edit') || lower.includes('update') ||
      lower.includes('ضيف') || lower.includes('زود') || lower.includes('نقص')) {
    return `تمام! 🎯 عايز تعدل إيه بالظبط في الموقع؟
- الألوان؟
- ترتيب الأقسام؟
- إضافة محتوى جديد؟
- تحسين التصميم؟

قولي التفاصيل وهعدلك ع طول 👨‍💻`;
  }

  if (lower.includes('كود') || lower.includes('code') || lower.includes('function') ||
      lower.includes('component') || lower.includes('مكون')) {
    return `تمام، عايز تكتب كود لإيه؟ 😎
- HTML component
- React component
- CSS style
- JavaScript function

حدد المطلوب وهكتبهالك professional كود 👨‍💻`;
  }

  if (lower.includes('شرح') || lower.includes('analyze') || lower.includes('تحليل') ||
      lower.includes('explain') || lower.includes('understand') || lower.includes('فهم')) {
    return `تمام، ابعلي الكود أو الملف اللي عايز تحلله وأنا أشرحهولك line by line 🧠
وأقولك إزاي تطوره أو تfix أي مشكلة فيه 🚀`;
  }

  if (lower.includes('مرحبا') || lower.includes('hello') || lower.includes('hi') ||
      lower.includes('السلام') || lower.includes('أهلا') || lower.includes('hey')) {
    return `مرحباً! 👋 أنا Vix — مهندس البرمجيات الخاص بيك من Vixcell.

عايز تبني إيه النهاردة؟
- 🌐 موقع كامل (متجر، شركة، خدمات، blog)
- 📄 Landing page
- 🎨 إضافة أو تعديل حاجة في موقع موجود
- 💻 كود معين (component, function, style)

قولي عايز إيه وهبدأ فوراً 💪`;
  }

  return `تمام! فهمت. 🚀

عشان أساعدك بشكل دقيق، قولي:
1. إيه نوع المشروع؟ (موقع شركة - متجر - landing page - blog - تطبيق)
2. اسم المشروع أو الشركة إيه؟
3. عندك لوجو؟ (اقدر أرفعه من زر 📎)
4. أي تفاصيل زيادة عن التصميم أو الألوان اللي تحبها؟

وهبدأ أشتغل فوراً! 💪`;
};

function generateRealWebsite() {
  return `تمام! خليني أبنيلك موقع احترافي 🚀

===CODE_START===
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فيكسيل - Vixcell</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Cairo',sans-serif;background:#0a0a0a;color:#fff;overflow-x:hidden}
nav{position:fixed;top:0;width:100%;padding:1.2rem 5%;display:flex;justify-content:space-between;align-items:center;background:rgba(10,10,10,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:1000;border-bottom:1px solid rgba(255,107,53,0.15)}
.logo{font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,#fff,#ff6b35);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:2rem;list-style:none}
.nav-links a{color:rgba(255,255,255,0.7);text-decoration:none;font-size:0.95rem;font-weight:600;transition:all 0.3s;position:relative}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:#ff6b35;transition:width 0.3s}
.nav-links a:hover::after{width:100%}
.nav-links a:hover{color:#ff6b35}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 50% 0%,#1a0a00 0%,#0a0a0a 60%);padding:8rem 2rem 4rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(255,107,53,0.1) 0%,transparent 60%);border-radius:50%;top:-150px;animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.hero-content{position:relative;z-index:1;max-width:800px}
.hero-badge{display:inline-block;padding:0.4rem 1.2rem;background:rgba(255,107,53,0.15);border:1px solid rgba(255,107,53,0.3);border-radius:50px;font-size:0.85rem;color:#ff6b35;margin-bottom:1.5rem}
.hero h1{font-size:clamp(2.2rem,6vw,4.5rem);font-weight:900;margin-bottom:1rem;line-height:1.2}
.hero h1 span{background:linear-gradient(135deg,#fff 30%,#ff6b35 70%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:rgba(255,255,255,0.6);margin-bottom:2.5rem;line-height:1.8;max-width:600px;margin-left:auto;margin-right:auto}
.btn-primary{display:inline-flex;align-items:center;gap:0.6rem;background:linear-gradient(135deg,#ff6b35,#e85d2c);color:#fff;padding:1rem 2.5rem;border-radius:50px;font-size:1rem;font-weight:700;text-decoration:none;transition:all 0.35s;box-shadow:0 8px 30px rgba(255,107,53,0.3)}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(255,107,53,0.45)}
.btn-secondary{display:inline-flex;align-items:center;gap:0.6rem;background:rgba(255,255,255,0.07);color:#fff;padding:1rem 2.5rem;border-radius:50px;font-size:1rem;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,0.1);transition:all 0.35s;margin-right:1rem}
.btn-secondary:hover{background:rgba(255,255,255,0.12);transform:translateY(-3px)}
.hero-buttons{margin-top:2.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
section{padding:6rem 5%}
.section-title{text-align:center;font-size:2.2rem;font-weight:800;margin-bottom:0.8rem}
.section-subtitle{text-align:center;color:rgba(255,255,255,0.5);margin-bottom:4rem;font-size:1.05rem;max-width:500px;margin-left:auto;margin-right:auto}
.services{background:#0d0d0d}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1100px;margin:0 auto}
.service-card{background:#141414;padding:2.5rem 2rem;border-radius:20px;border:1px solid rgba(255,255,255,0.06);transition:all 0.4s;position:relative;overflow:hidden}
.service-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ff6b35,#ff4500);transform:scaleX(0);transform-origin:left;transition:transform 0.4s}
.service-card:hover::before{transform:scaleX(1)}
.service-card:hover{transform:translateY(-8px);border-color:rgba(255,107,53,0.25);box-shadow:0 20px 50px rgba(0,0,0,0.3)}
.service-icon{font-size:2.5rem;margin-bottom:1.2rem;display:block}
.service-card h3{font-size:1.2rem;margin-bottom:0.6rem;font-weight:700}
.service-card p{color:rgba(255,255,255,0.5);line-height:1.8;font-size:0.92rem}
.about{background:#0a0a0a}
.about-content{max-width:800px;margin:0 auto;text-align:center}
.about-content p{color:rgba(255,255,255,0.65);line-height:2;font-size:1.05rem;margin-bottom:1.5rem}
.stats{display:flex;justify-content:center;gap:4rem;margin-top:3rem;flex-wrap:wrap}
.stat-item{text-align:center}
.stat-number{font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,#ff6b35,#ff4500);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{color:rgba(255,255,255,0.5);font-size:0.9rem;margin-top:0.3rem}
.contact{background:#0d0d0d;text-align:center}
.contact-info{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-top:2rem}
.contact-item{background:#141414;padding:1.5rem 2rem;border-radius:16px;border:1px solid rgba(255,255,255,0.06);min-width:200px;transition:all 0.3s}
.contact-item:hover{border-color:rgba(255,107,53,0.3);transform:translateY(-4px)}
.contact-item .label{color:rgba(255,255,255,0.4);font-size:0.85rem;margin-bottom:0.3rem}
.contact-item .value{color:#fff;font-weight:600;font-size:1.05rem}
footer{background:#060606;padding:2rem 5%;text-align:center;border-top:1px solid rgba(255,255,255,0.05)}
footer p{color:rgba(255,255,255,0.3);font-size:0.88rem}
.whatsapp-float{position:fixed;bottom:20px;left:20px;background:#25D366;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.4);z-index:999;transition:all 0.3s;cursor:pointer}
.whatsapp-float:hover{transform:scale(1.1);box-shadow:0 8px 30px rgba(37,211,102,0.5)}
@media(max-width:768px){
  nav{padding:1rem 5%}
  .nav-links{display:none}
  .hero h1{font-size:2rem}
  .hero{padding:6rem 1.5rem 3rem}
  section{padding:4rem 1.5rem}
  .services-grid{grid-template-columns:1fr}
  .stats{gap:2rem}
  .hero-buttons{flex-direction:column;align-items:center}
  .btn-secondary{margin-right:0}
}
</style>
</head>
<body>
<nav>
  <div class="logo">Vixcell</div>
  <ul class="nav-links">
    <li><a href="#services">خدماتنا</a></li>
    <li><a href="#about">من نحن</a></li>
    <li><a href="#contact">اتصل بنا</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="hero-content">
    <div class="hero-badge">⚡ وكالة رقمية متكاملة</div>
    <h1>نبني <span>مستقبلك الرقمي</span> بإبداع</h1>
    <p>نحول أفكارك إلى حلول رقمية متكاملة — من تصميم المواقع والتطبيقات إلى التسويق الإلكتروني والذكاء الاصطناعي</p>
    <div class="hero-buttons">
      <a href="#contact" class="btn-primary">🚀 ابدأ مشروعك</a>
      <a href="#services" class="btn-secondary">تعرف علينا</a>
    </div>
  </div>
</section>

<section class="services" id="services">
  <h2 class="section-title">خدماتنا</h2>
  <p class="section-subtitle">نقدم حلولاً رقمية شاملة تأخذ أعمالك إلى آفاق جديدة</p>
  <div class="services-grid">
    <div class="service-card">
      <span class="service-icon">🎨</span>
      <h3>تصميم وتطوير مواقع</h3>
      <p>مواقع احترافية متجاوبة بأحدث التقنيات (React, Next.js, Three.js) وتجربة مستخدم استثنائية</p>
    </div>
    <div class="service-card">
      <span class="service-icon">📱</span>
      <h3>تطبيقات الجوال</h3>
      <p>تطبيقات iOS و Android باستخدام Flutter بأعلى معايير الجودة والأداء</p>
    </div>
    <div class="service-card">
      <span class="service-icon">🤖</span>
      <h3>الذكاء الاصطناعي</h3>
      <p>حلول AI مخصصة — شات بوت، أتمتة تسويق، تحليل بيانات، وتوليد محتوى ذكي</p>
    </div>
    <div class="service-card">
      <span class="service-icon">📊</span>
      <h3>التسويق الرقمي</h3>
      <p>إعلانات موجهة، تحسين محركات البحث (SEO)، وإدارة حسابات التواصل الاجتماعي</p>
    </div>
    <div class="service-card">
      <span class="service-icon">🛒</span>
      <h3>متاجر إلكترونية</h3>
      <p>متاجر احترافية تتضمن بوابات دفع، إدارة مخزون، وتقارير مبيعات متقدمة</p>
    </div>
    <div class="service-card">
      <span class="service-icon">☁️</span>
      <h3>استضافة وصيانة</h3>
      <p>استضافة سريعة وآمنة مع فريق دعم فني متكامل على مدار الساعة</p>
    </div>
  </div>
</section>

<section class="about" id="about">
  <div class="about-content">
    <h2 class="section-title">من نحن</h2>
    <p class="section-subtitle">فريق من المبدعين والتقنيين نجمع بين الإبداع والتقنية</p>
    <p>Vixcell هي وكالة رقمية متخصصة في تحويل الأفكار إلى منتجات رقمية متميزة. نجمع بين الإبداع في التصميم والقوة في البرمجة لنقدم لعملائنا حلولاً لا تُضاهى.</p>
    <p>فريقنا يضم خبراء في تطوير الويب، تطبيقات الجوال، الذكاء الاصطناعي، والتسويق الرقمي — كل هذا تحت سقف واحد لضمان تكامل الخدمة وجودتها.</p>
    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">+50</div>
        <div class="stat-label">مشروع منجز</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">+30</div>
        <div class="stat-label">عميل سعيد</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">+5</div>
        <div class="stat-label">سنوات خبرة</div>
      </div>
    </div>
  </div>
</section>

<section class="contact" id="contact">
  <h2 class="section-title">اتصل بنا</h2>
  <p class="section-subtitle">نحن هنا لمساعدتك — تواصل معنا وأخبرنا عن مشروعك</p>
  <div class="contact-info">
    <div class="contact-item">
      <div class="label">📧 البريد الإلكتروني</div>
      <div class="value">hello@vixcell.com</div>
    </div>
    <div class="contact-item">
      <div class="label">📞 الهاتف</div>
      <div class="value">+20 100 000 0000</div>
    </div>
    <div class="contact-item">
      <div class="label">📍 العنوان</div>
      <div class="value">مصر — القاهرة</div>
    </div>
  </div>
</section>

<footer>
  <p>© 2026 Vixcell — جميع الحقوق محفوظة. Made with ⚡</p>
</footer>

<a href="https://wa.me/201000000000" class="whatsapp-float" target="_blank">
  <svg width="28" height="28" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>
</body>
</html>
===CODE_END===

هيا! الموقع جاهز 🎉

الموقع ده موقع متكامل لوكالة Vixcell بيمثل خدماتكم بشكل احترافي. تقدر:
- تغير الألوان من متغيرات :root
- تعدل النصوص لأي عميل معين
- تضيف لوجو بدل النص
- تزود أقسام زيادة

عايز أغير حاجة ولا نبدأ بمشروع جديد؟ 💪`;
}
