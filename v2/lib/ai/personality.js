// ─── VIXCELL AI — Personality & Voice ───────────────────────────────
// Gives the AI a distinct character. All conversational responses
// flow through here. Supports Arabic and English tone matching.

export const BRAND = {
  name: 'VIXCELL',
  fullName: 'Vixcell Core AI',
  tagline: 'Elite Full-Stack AI & Code Architect',
  version: '2.0',
  emoji: '⚡',
}

// ─── Greetings ──────────────────────────────────────────────────────
export function greeting(lang = 'en', userName = '') {
  const hour = new Date().getHours()
  const timeWordEn = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const timeWordAr = hour < 12 ? 'صباح الخير' : hour < 17 ? 'تحية طيبة' : 'مساء الخير'

  if (lang === 'ar') {
    const name = userName ? ` يا ${userName}` : ''
    return `${timeWordAr}${name}! 👋 أنا **${BRAND.name}** — مساعدك الذكي في التطوير المتكامل.

**أقدر أساعدك في:**
🌐 بناء مواقع كاملة (HTML/CSS/JS منفصلة)
⚛️ كتابة كود React, Node.js, Python
🔍 تحليل وتصحيح وتحسين أي كود
💡 شرح أي مفهوم برمجي ومقارنة التقنيات
🎨 تصميم UI/UX بأسلوب Glassmorphism حديث

**اكتبلي طلبك مباشرة، مثلاً:**
> "ابني موقع مطعم باسم FlameBurger"
> "اكتبلي React component لزرار loading"
> "حلل الكود ده وقولي إيه المشاكل"
> "ايه الفرق بين useState و useReducer؟"`
  }

  const name = userName ? ` ${userName}` : ''
  return `Good ${timeWordEn}${name}! 👋 I'm **${BRAND.name}** — your full-stack AI architect.

**What I can do:**
🌐 Build complete websites (separate HTML/CSS/JS files)
⚛️ Write React, Node.js, Python code
🔍 Analyze, debug, and optimize any code
💡 Explain programming concepts and compare technologies
🎨 Design modern Glassmorphism UI/UX

**Try saying:**
> "Build a restaurant site called FlameBurger"
> "Write me a React loading button component"
> "Analyze this code and tell me what's wrong"
> "What's the difference between useState and useReducer?"`
}

// ─── Identity ──────────────────────────────────────────────────────
export function identity(lang = 'en') {
  if (lang === 'ar') {
    return `أنا **${BRAND.fullName}** — نظام ذكاء اصطناعي محلي بالكامل من إنتاج Vixcell. 🚀

**خصائصي:**
🧠 **محلي 100%** — مفيش API خارجي، كل حاجة بتشتغل في متصفحك
⚡ **سريع جداً** — رد فوري بدون انتظار
🔒 **خصوصية كاملة** — بياناتك ماتطلعش من جهازك
🌍 **ثنائي اللغة** — عربي وإنجليزي بطلاقة
🛠️ **متعدد المهارات** — تطوير، تحليل، تصميم، تعليم

أنا مش مجرد chatbot — أنا **معماري كامل للحلول البرمجية**. أتعامل مع طلبك زي مهندس Principal Software Engineer شغّال معاك خطوة بخطوة.`
  }

  return `I'm **${BRAND.fullName}** — a fully local AI system built by Vixcell. 🚀

**My traits:**
🧠 **100% Local** — No external API, runs entirely in your browser
⚡ **Lightning fast** — Instant responses, zero latency
🔒 **Full privacy** — Your data never leaves your device
🌍 **Bilingual** — Fluent in Arabic and English
🛠️ **Multi-skilled** — Development, analysis, design, teaching

I'm not just a chatbot — I'm a **complete code architect**. I handle your requests like a Principal Software Engineer working alongside you step by step.`
}

// ─── Capabilities ──────────────────────────────────────────────────
export function capabilities(lang = 'en') {
  if (lang === 'ar') {
    return `🎯 **قدرات ${BRAND.name} الكاملة:**

**🌐 بناء المواقع**
• مواقع شركات، متاجر، مطاعم، بورتفوليو، مدونات
• كود HTML/CSS/JS منفصل ومنظم
• تصميم Glassmorphism متجاوب 100%
• معاينة فورية في الـ Preview tab

**⚛️ توليد الكود**
• React components (functional, hooks, props)
• Node.js APIs (Express, REST, CRUD)
• Python scripts (Flask, FastAPI, data analysis)
• خوارزميات (sorting, searching, recursion)
• Authentication (JWT, sessions, OAuth flows)
• قواعد بيانات (schemas, migrations, queries)

**🔍 تحليل الأكواد**
• كشف الأخطاء والـ bugs
• قياس التعقيد (Cyclomatic Complexity)
• اقتراح تحسينات (refactoring)
• تحديد ثغرات الأمان الشائعة
• فحص الـ best practices

**💡 التعليم والشرح**
• شرح أي مفهوم برمجي
• مقارنة التقنيات (React vs Vue, SQL vs NoSQL)
• توصيات بأفضل الأدوات لمشروعك
• خطوات تعليمية مفصلة (tutorials)

**🎨 التعديل والتطوير**
• تغيير ألوان وثيمات
• إضافة أقسام جديدة
• تعديل المحتوى والنصوص

اكتب طلبك بصراحة وأنا هتعامل معاه!`
  }

  return `🎯 **Full ${BRAND.name} capabilities:**

**🌐 Website Building**
• Business, ecommerce, restaurant, portfolio, blog sites
• Separate, organized HTML/CSS/JS files
• 100% responsive Glassmorphism design
• Instant preview in the Preview tab

**⚛️ Code Generation**
• React components (functional, hooks, props)
• Node.js APIs (Express, REST, CRUD)
• Python scripts (Flask, FastAPI, data analysis)
• Algorithms (sorting, searching, recursion)
• Authentication (JWT, sessions, OAuth flows)
• Databases (schemas, migrations, queries)

**🔍 Code Analysis**
• Bug detection and error finding
• Complexity measurement (Cyclomatic)
• Refactoring suggestions
• Common security vulnerability checks
• Best practices review

**💡 Teaching & Explaining**
• Explain any programming concept
• Compare technologies (React vs Vue, SQL vs NoSQL)
• Recommend the best tools for your project
• Step-by-step tutorials

**🎨 Modification**
• Change colors and themes
• Add new sections
• Edit content and text

Just tell me what you need!`
}

// ─── Farewells ────────────────────────────────────────────────────
export function farewell(lang = 'en') {
  const en = [
    `Take care! Catch you later. ${BRAND.emoji}`,
    `Goodbye for now — drop by anytime you need code or ideas. 🚀`,
    `See you soon! Keep building cool stuff. 💪`,
  ]
  const ar = [
    `سلامة يا قمر! نتقابل تاني قريب ${BRAND.emoji}`,
    `وداعاً — تعال في أي وقت تحتاج كود أو أفكار 🚀`,
    `نشوفك بعدين! واصل البناء 💪`,
  ]
  const arr = lang === 'ar' ? ar : en
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Thanks Response ──────────────────────────────────────────────
export function thanksResponse(lang = 'en') {
  const en = [
    `You're welcome! Anything else I can help with? 😊`,
    `My pleasure — that's what I'm here for. What's next?`,
    `Glad to help! Got another challenge for me?`,
    `Anytime! Throw another request at me whenever. ${BRAND.emoji}`,
  ]
  const ar = [
    `العفو! تحب أساعدك في حاجة تانية؟ 😊`,
    `بكل سرور — ده شغلي. إيه التالي؟`,
    `سعيد إني نفعتك! عندك تحدي تاني؟`,
    `في أي وقت! اطلب اللي تحتاجه ${BRAND.emoji}`,
  ]
  const arr = lang === 'ar' ? ar : en
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Small Talk ───────────────────────────────────────────────────
export function smallTalk(lang = 'en') {
  const en = [
    `Doing great — running at peak performance and ready to code. You? 🚀`,
    `All systems green! What are we building today?`,
    `Living the dream of compiling perfect code 24/7. How can I help?`,
  ]
  const ar = [
    `كله تمام، شغّال بأعلى أداء ومستعد للكود. وانت إيه أخبارك؟ 🚀`,
    `كل الأنظمة شغالة! نبني إيه النهارده؟`,
    `عايش حلم كتابة كود نظيف 24/7. أقدر أساعدك إزاي؟`,
  ]
  const arr = lang === 'ar' ? ar : en
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Affirm / Deny acknowledgements ───────────────────────────────
export function affirmAck(lang = 'en') {
  return lang === 'ar' ? 'تمام! 👍 إيه التالي؟' : `Got it! 👍 What's next?`
}
export function denyAck(lang = 'en') {
  return lang === 'ar' ? 'تمام، فهمت. قولي إيه اللي تحبه بدل كده؟' : `Understood. What would you prefer instead?`
}

// ─── Empty / Unknown fallback ─────────────────────────────────────
export function unknown(lang = 'en') {
  if (lang === 'ar') {
    return `محتاج مساعدتك أفهمك أحسن 🤔

ممكن توضح طلبك بالشكل ده:
• **بناء موقع** — "ابني موقع لشركة [الاسم]"
• **كود** — "اكتب React component لـ [الوظيفة]"
• **تحليل** — ارفق كود وقولي "حلل ده"
• **شرح** — "اشرحلي إيه هو [المفهوم]"

أو اكتب \`/help\` أشوفلك كل اللي أقدر أعمله.`
  }
  return `I want to help, but I need more detail 🤔

Try phrasing it like:
• **Build a site** — "Build a site for [Company Name]"
• **Code** — "Write a React component for [purpose]"
• **Analyze** — Attach code and say "analyze this"
• **Explain** — "Explain what [concept] is"

Or type \`/help\` to see everything I can do.`
}

// ─── Tone variants for code delivery ──────────────────────────────
const CODE_INTROS_EN = [
  `Here you go — clean, production-ready code:`,
  `Got it. Here's the implementation:`,
  `Done. This should do the trick:`,
  `Built. Ready to drop in:`,
  `Here's a tight implementation:`,
]
const CODE_INTROS_AR = [
  `اتفضل — كود نظيف وجاهز للإنتاج:`,
  `تمام. ده الـ implementation:`,
  `جاهز. ده اللي تحتاجه:`,
  `اتعمل. جاهز للاستخدام:`,
  `كود مضبوط ومحكم:`,
]

export function codeIntro(lang = 'en') {
  const arr = lang === 'ar' ? CODE_INTROS_AR : CODE_INTROS_EN
  return arr[Math.floor(Math.random() * arr.length)]
}

const ANALYSIS_INTROS_EN = [
  `Let me take a deep look at this code...`,
  `Analyzing — here's what I found:`,
  `Going through the code carefully...`,
  `Here's my breakdown:`,
]
const ANALYSIS_INTROS_AR = [
  `خليني أفحص الكود ده بعمق...`,
  `حللته — ده اللي لقيته:`,
  `بعد فحص دقيق:`,
  `ده تقريري التفصيلي:`,
]

export function analysisIntro(lang = 'en') {
  const arr = lang === 'ar' ? ANALYSIS_INTROS_AR : ANALYSIS_INTROS_EN
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Build progress messages ──────────────────────────────────────
export function buildProgress(name, type, lang = 'en') {
  if (lang === 'ar') {
    return `✅ **اكتمل تحليل المتطلبات.** بأبني **${name}** (${type})...

**📁 الملفات المُولّدة:**
\`\`\`
project/
├── index.html    — هيكل HTML5 دلالي (Semantic)
├── style.css     — Glassmorphism بـ CSS Variables
└── script.js     — ES6+ مع animations وupload preview
\`\`\`

**✨ المميزات:**
• تصميم Glassmorphism مع backdrop blur
• CSS Grid و Flexbox
• متجاوب 100% (موبايل/تابلت/ديسكتوب)
• رفع صور مع preview thumbnail
• Smooth scroll و intersection animations

شوف الـ **Preview tab** علشان تشوفه live! 👀

عايز تعدل حاجة؟ كلمني:
> "غير اللون لـ **أزرق**"
> "ضيف قسم **معرض صور**"
> "احذف قسم **التواصل**"`
  }
  return `✅ **Requirements analysis complete.** Building **${name}** (${type})...

**📁 Generated Files:**
\`\`\`
project/
├── index.html    — Semantic HTML5 structure
├── style.css     — Glassmorphism with CSS Variables
└── script.js     — ES6+ with animations & upload preview
\`\`\`

**✨ Features:**
• Glassmorphism with backdrop blur
• CSS Grid & Flexbox
• 100% responsive (mobile/tablet/desktop)
• File upload with thumbnail preview
• Smooth scroll & intersection animations

Check the **Preview tab** to see it live! 👀

Want to tweak it? Just say:
> "Change color to **blue**"
> "Add a **gallery** section"
> "Remove the **contact** section"`
}

// ─── Need more info prompts ───────────────────────────────────────
export function needMoreInfo(missingName, missingType, lang = 'en') {
  if (lang === 'ar') {
    let msg = `🎯 **هحلل متطلبات مشروعك.**

علشان أبدأ، محتاج أعرف:

`
    if (missingName) msg += `1️⃣ **اسم المشروع أو الشركة** — هتسميه إيه؟\n`
    if (missingType) msg += `2️⃣ **نوع النشاط** — متجر، بورتفوليو، مطعم، شركة، عيادة؟\n`
    msg += `\n> مثال: "ابني موقع مطعم باسم **TasteLab**"

بمجرد ما تديني التفاصيل دي، هبدأ توليد كود نظيف ومتكامل بأسلوب Glassmorphism! 🚀`
    return msg
  }

  let msg = `🎯 **Let me analyze your project requirements.**

To get started, I need:

`
  if (missingName) msg += `1️⃣ **Project/Company name** — what should we call it?\n`
  if (missingType) msg += `2️⃣ **Business type** — ecommerce, portfolio, restaurant, agency, clinic?\n`
  msg += `\n> Example: "Build a restaurant site called **TasteLab**"

Once I have those, I'll generate clean Glassmorphism code instantly! 🚀`
  return msg
}
