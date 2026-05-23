const WebsiteGenerator = require('./websiteGenerator.service');

const sessions = new Map();
const MAX_HISTORY = 50;
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Clean old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}, 1000 * 60 * 30);

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      history: [],
      context: {
        stage: 'greeting',
        projectName: '',
        businessType: '',
        description: '',
        colors: { primary: '#ff6b35', bg: '#0a0a0a', text: '#ffffff' },
        logo: null,
        features: [],
        language: 'ar',
        generatedCode: null,
        lastIntent: '',
      },
      lastActivity: Date.now(),
    });
  }
  return sessions.get(sessionId);
}

function touchSession(sessionId) {
  const session = getSession(sessionId);
  session.lastActivity = Date.now();
}

function addToHistory(sessionId, role, text) {
  const session = getSession(sessionId);
  session.history.push({ role, text, timestamp: Date.now() });
  if (session.history.length > MAX_HISTORY) {
    session.history.splice(0, session.history.length - MAX_HISTORY);
  }
}

const INTENTS = {
  GREETING: 'greeting',
  BUILD_WEBSITE: 'build_website',
  MODIFY_WEBSITE: 'modify_website',
  ADD_FEATURE: 'add_feature',
  CHANGE_COLOR: 'change_color',
  ADD_LOGO: 'add_logo',
  EXPLAIN_CODE: 'explain_code',
  HELP: 'help',
  UNKNOWN: 'unknown',
};

function detectIntent(text) {
  const t = text.toLowerCase().trim();

  // Greeting
  if (/^(مرحبا|السلام|أهلا|hello|hi|hey|اهلا)/i.test(t)) {
    return INTENTS.GREETING;
  }

  // Help
  if (/(مساعدة|مساعد|help|what can you|what do you|ماذا|تقدر|powered)/i.test(t)) {
    return INTENTS.HELP;
  }

  // Build website
  if (/(ابني|اعمل|create|build|make|new|موقع|website|site|landing|ebni|aamil|page|صفحة|متجر|store|ecommerce|shop|شركة|company|business)/i.test(t)) {
    return INTENTS.BUILD_WEBSITE;
  }

  // Modify website
  if (/(تعديل|عدل|غير|modify|edit|change|update|ضيف|زود|نقص|بدل|replace|حو|حول)/i.test(t)) {
    return INTENTS.MODIFY_WEBSITE;
  }

  // Add feature
  if (/(ضيف|زود|add|feature|إضافة|section|قسم|جزء|part|component)/i.test(t)) {
    return INTENTS.ADD_FEATURE;
  }

  // Change color
  if (/(لون|color|الوان|theme|dark|light|da2k)/i.test(t)) {
    return INTENTS.CHANGE_COLOR;
  }

  // Logo
  if (/(logo|لوجو|شعار)/i.test(t)) {
    return INTENTS.ADD_LOGO;
  }

  // Explain code
  if (/(شرح|explain|analyze|تحليل|understand|فهم|code|كود|function)/i.test(t)) {
    return INTENTS.EXPLAIN_CODE;
  }

  return INTENTS.UNKNOWN;
}

function extractInfo(text, session) {
  const ctx = session.context;

  // Extract project name (words after "اسمي" or "اسم" or "شركة" or "project")
  const nameMatch = text.match(/(?:اسمي|اسم الشركة|اسم المشروع|شركة|project name|company)\s*[:\s]\s*(.+)/i);
  if (nameMatch) ctx.projectName = nameMatch[1].trim();

  // Extract business type
  const typeMatch = text.match(/(?:متجر|store|ecommerce|shop|مطعم|restaurant|شركة|company|عيادة|clinic|school|مدرسة|blog|مدونة|personal|شخصي|portfolio|أعمال)\b/i);
  if (typeMatch) {
    const types = {
      'متجر': 'ecommerce', 'store': 'ecommerce', 'ecommerce': 'ecommerce', 'shop': 'ecommerce',
      'مطعم': 'restaurant', 'restaurant': 'restaurant',
      'شركة': 'business', 'company': 'business',
      'عيادة': 'clinic', 'clinic': 'clinic',
      'مدرسة': 'school', 'school': 'school',
      'blog': 'blog', 'مدونة': 'blog',
      'personal': 'personal', 'شخصي': 'personal',
      'portfolio': 'portfolio', 'أعمال': 'portfolio',
    };
    ctx.businessType = types[typeMatch[0].toLowerCase()] || 'business';
  }

  // Extract color
  const colorMatch = text.match(/(?:#)?([0-9a-fA-F]{6})\b/);
  if (colorMatch) {
    ctx.colors.primary = '#' + colorMatch[1];
  }
  if (/\bأسود|dark|black\b/i.test(text)) ctx.colors.bg = '#0a0a0a';
  if (/\bأبيض|light|white\b/i.test(text)) ctx.colors.bg = '#ffffff';

  return ctx;
}

// Greeting responses
const greetings = [
  'مرحباً! 👋 أنا Vix — مساعدك البرمجي الذكي.\n\nأقدر أبني لك موقع متكامل، Landing page، متجر إلكتروني، أو أي حاجة تخص الويب.\n\n📌 **قولي عايز إيه بالظبط:**\n- اسم المشروع أو الشركة\n- النوع (موقع شركة، متجر، مطعم، portfolio، الخ)\n- أي تفاصيل زيادة عن التصميم\n\nوابدأ أشتغل فوراً 💪',
  'أهلاً بيك في Vixcell! 🤖\n\nأنا هنا عشان أساعدك تبني موقعك. مجرد ما تقول:\n- إيه نوع الموقع؟\n- اسم المشروع؟\n- الألوان اللي تحبها؟\n\nوهبدأ أشتغل 🚀',
];

const helpResponse = `🎯 **أنا أقدر أساعدك في:**

🌐 **بناء مواقع** — موقع شركة، متجر، مطعم، مدونة، portfolio، landing page
✏️ **تعديل وتحديث** — أغير الألوان، النصوص، الأقسام، أي حاجة في الموقع
🎨 **تصميم مخصص** — أضيف ميزات، أقسام، animations، تأثيرات
📱 **متجاوب** — الموقع يشتغل على الجوال والتابلت والكمبيوتر
💻 **كود نظيف** — HTML/CSS/JS professional

**طريقة الشغل:**
1. قولي عايز إيه (نوع الموقع + اسم المشروع)
2. هبنيهولك فوراً
3. قولي عايز أغير حاجة وهعدلها

**جرب تقول:** "ابني موقع لشركة Vixcell" 🚀`;

const unknownResponses = [
  'تمام! 😊 عشان أساعدك:\n- عايز **تبني موقع** جديد؟\n- ولا عايز **تعدل** على موقع موجود؟\n- ولا عندك **استفسار** معين؟\n\nقولي تفاصيل أكتر 🎯',
  'فهمت! خليني أوضح:\n\nأنا متخصص في برمجة المواقع. أقدر:\n✅ أبني موقع كامل من الصفر\n✅ أعدل على أي موقع موجود\n✅ أضيف أقسام وميزات جديدة\n\nعايز إيه بالظبط؟ 🚀',
];

exports.chat = async (sessionId, message, logoDataUrl = null) => {
  const session = getSession(sessionId);
  touchSession(sessionId);

  if (logoDataUrl) {
    session.context.logo = logoDataUrl;
    addToHistory(sessionId, 'user', message);
    const html = exports.generateSite(session.context);
    session.context.generatedCode = html;
    session.context.stage = 'modify';
    const cleanMsg = message.replace('[LOGO_UPLOADED]', '').trim();
    const responseText = cleanMsg
      ? `تمام! استلمت اللوجو ✅\n\n${cleanMsg}\n\nهبدأ أشتغل ع طول 💪`
      : 'تم استلام اللوجو ✅ هبدأ أشتغل عليه فوراً 💪';
    addToHistory(sessionId, 'ai', responseText + '\n\n' + html);
    return { text: responseText, html };
  }

  addToHistory(sessionId, 'user', message);
  const intent = detectIntent(message);
  const ctx = session.context;
  extractInfo(message, session);

  let response;

  switch (intent) {
    case INTENTS.GREETING:
      response = greetings[Math.floor(Math.random() * greetings.length)];
      ctx.stage = 'collecting_info';
      break;

    case INTENTS.HELP:
      response = helpResponse;
      break;

    case INTENTS.BUILD_WEBSITE: {
      const name = ctx.projectName || extractNameOrDefault(message);
      const type = ctx.businessType || extractTypeOrDefault(message);
      ctx.projectName = name;
      ctx.businessType = type;

      if (needsMoreInfo(ctx)) {
        response = buildInfoQuestions(ctx);
        ctx.stage = 'collecting_info';
      } else {
        const html = exports.generateSite(ctx);
        ctx.generatedCode = html;
        ctx.stage = 'modify';
        response = `تمام! خلصت الموقع بتاع **${name}** 🎉

هو موقع ${getTypeName(type)} احترافي ومتجاوب. تقدر:
- تغير الألوان أو النصوص
- تضيف أقسام زيادة
- ترفع لوجو
- تظبط أي حاجة عايزها

🚀 الموقع:`;
        addToHistory(sessionId, 'ai', response);
        return { text: response, html };
      }
      break;
    }

    case INTENTS.MODIFY_WEBSITE: {
      if (!ctx.generatedCode) {
        response = 'معنديش موقع عشان أعدله! 😅 قولي عايز تبني إيه وهبدأ 🚀';
      } else {
        const modified = handleModification(message, ctx);
        ctx.generatedCode = modified;
        response = 'تم! عدلت حسب طلبك 🎉\n\nالموقع بعد التعديل:';
        addToHistory(sessionId, 'ai', response);
        return { text: response, html: modified };
      }
      break;
    }

    case INTENTS.CHANGE_COLOR: {
      if (!ctx.generatedCode) {
        response = 'معنديش موقع عشان أغير ألوانه! ابني واحد الأول 😊';
      } else {
        parseColorChange(message, ctx);
        const modified = modifyColors(ctx.generatedCode, ctx.colors);
        ctx.generatedCode = modified;
        response = 'تم تغيير الألوان! 🎨\n\nالموقع بعد الألوان الجديدة:';
        addToHistory(sessionId, 'ai', response);
        return { text: response, html: modified };
      }
      break;
    }

    case INTENTS.ADD_FEATURE: {
      if (!ctx.generatedCode) {
        response = 'ابني موقع الأول وبعدين نضيف عليه 💪';
      } else {
        const feature = extractFeatureRequest(message);
        const modified = addFeatureToSite(ctx.generatedCode, feature, ctx);
        ctx.generatedCode = modified;
        response = `تمام! ضفت ${feature} للموقع 🎉\n\nالموقع بعد الإضافة:`;
        addToHistory(sessionId, 'ai', response);
        return { text: response, html: modified };
      }
      break;
    }

    case INTENTS.EXPLAIN_CODE: {
      if (ctx.generatedCode) {
        response = `🎯 **تحليل الكود:**

الموقع الحالي عبارة عن **${getTypeName(ctx.businessType)}**.

**الأقسام:**
1. **Navbar** — شريط التنقل العلوي مثبت (fixed)
2. **Hero** — القسم الرئيسي بتصميم جذاب وأنيميشن
3. **Services/Products** — عرض الخدمات أو المنتجات
4. **About** — معلومات عن الشركة/المشروع
5. **Contact** — معلومات التواصل
6. **Footer** — التذييل
7. **WhatsApp Float** — زر واتساب عائم

**التقنيات:**
- HTML5 Semantic
- CSS3 (Grid, Flexbox, Animations, Custom Properties)
- Google Fonts
- Fully Responsive
- RTL Support

**عايز أشرح جزء معين؟** قولي الكود أو السطر 👨‍💻`;
      } else {
        response = 'مفيش كود حالياً عشان أشرحه! ابني موقع الأول وهشرحهولك line by line 🧠';
      }
      break;
    }

    default: {
      // Check if we're in info collection mode
      if (ctx.stage === 'collecting_info') {
        const info = extractAllInfo(message, ctx);
        if (info.complete) {
          const html = exports.generateSite(ctx);
          ctx.generatedCode = html;
          ctx.stage = 'modify';
          response = `تمام! خلصت موقع **${ctx.projectName}** 🎉

`;
          addToHistory(sessionId, 'ai', response);
          return { text: response, html };
        } else {
          response = buildInfoQuestions(ctx);
        }
      } else if (ctx.stage === 'modify' && ctx.generatedCode) {
        // Try to understand what they want to modify
        response = `تمام! عايز أعدل إيه بالظبط؟ 😊
- الألوان؟
- محتوى معين (نصوص/صور)؟
- إضافة قسم جديد؟
- تغيير التنسيق؟`;
      } else {
        response = unknownResponses[Math.floor(Math.random() * unknownResponses.length)];
      }
      break;
    }
  }

  addToHistory(sessionId, 'ai', response);
  return { text: response, html: null };
};

function extractNameOrDefault(message) {
  // Try to extract name from patterns
  const patterns = [
    /(?:اسمي|اسم|الاسم)[^a-zA-Z]*([\w\s]+)/i,
    /(?:شركة|company|business|project)[^a-zA-Z]*([\w\s]+)/i,
    /لـ\s+([\w\s]+)/,
    /for\s+([\w\s]+)/i,
    /site\s+(?:for|of|called|named)\s+([\w\s]+)/i,
    /موقع\s+([\w\s.]+)/,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m && m[1] && m[1].trim().length > 0) return m[1].trim().split(/\s+/).slice(0, 3).join(' ');
  }
  return 'مشروعي';
}

function extractTypeOrDefault(message) {
  const t = message.toLowerCase();
  if (/\b(متجر|store|ecommerce|shop|eshop)\b/i.test(t)) return 'ecommerce';
  if (/\b(مطعم|restaurant|cafe|كافيه)\b/i.test(t)) return 'restaurant';
  if (/\b(blog|مدونة)\b/i.test(t)) return 'blog';
  if (/\b(portfolio|أعمال|معرض)\b/i.test(t)) return 'portfolio';
  if (/\b(عيادة|clinic|doctor|طبيب)\b/i.test(t)) return 'clinic';
  if (/\b(مدرسة|school|academy|أكاديمية)\b/i.test(t)) return 'school';
  if (/\b(personal|شخصي)\b/i.test(t)) return 'personal';
  return 'business';
}

function getTypeName(type) {
  const names = {
    ecommerce: 'متجر إلكتروني',
    restaurant: 'مطعم',
    blog: 'مدونة',
    portfolio: 'معرض أعمال',
    clinic: 'عيادة',
    school: 'مدرسة',
    personal: 'شخصي',
    business: 'شركة',
  };
  return names[type] || 'موقع';
}

function needsMoreInfo(ctx) {
  if (!ctx.projectName || ctx.projectName === 'مشروعي') return true;
  if (!ctx.businessType) return true;
  return false;
}

function buildInfoQuestions(ctx) {
  let q = '🎯 **عشان أبدأ، محتاج أعرف:**\n\n';
  if (!ctx.projectName || ctx.projectName === 'مشروعي') {
    q += '1️⃣ **اسم المشروع أو الشركة** إيه؟\n';
  }
  if (!ctx.businessType) {
    q += '2️⃣ **نوع الموقع** إيه؟ (شركة، متجر، مطعم، مدونة، portfolio، عيادة، الخ)\n';
  }
  if (ctx.projectName && ctx.projectName !== 'مشروعي' && ctx.businessType) {
    q += '3️⃣ أي **تفاصيل زيادة** عن التصميم أو الألوان؟\n';
  }
  q += '\nوهبدأ فوراً 💪';
  return q;
}

function extractAllInfo(message, ctx) {
  const namePatterns = [
    /اسمه\s+([\w\s]+)/i, /اسمها\s+([\w\s]+)/i,
    /اسمي\s+([\w\s]+)/i,
    /اسم\s+المشروع\s+([\w\s]+)/i,
    /project\s+(?:name|is|called)\s+([\w\s]+)/i,
    /شركة\s+([\w\s]{2,})/i,
    /company\s+([\w\s]{2,})/i,
    /([\w\s]{2,})\s+(?:website|site|موقع)/i,
  ];

  for (const p of namePatterns) {
    const m = message.match(p);
    if (m && m[1].trim().length > 2) {
      ctx.projectName = m[1].trim().split(/\s+/).slice(0, 3).join(' ');
      break;
    }
  }

  const type = extractTypeOrDefault(message);
  if (type) ctx.businessType = type;

  // Color
  if (/\bأزرق|blue\b/i.test(message)) ctx.colors.primary = '#3b82f6';
  if (/\bأخضر|green\b/i.test(message)) ctx.colors.primary = '#22c55e';
  if (/\bأحمر|red\b/i.test(message)) ctx.colors.primary = '#ef4444';
  if (/\bبنفسجي|purple\b/i.test(message)) ctx.colors.primary = '#8b5cf6';
  if (/\bأسود|dark\b/i.test(message)) { ctx.colors.bg = '#0a0a0a'; ctx.colors.text = '#ffffff'; }
  if (/\bأبيض|light|white\b/i.test(message)) { ctx.colors.bg = '#ffffff'; ctx.colors.text = '#1a1a1a'; }

  return {
    complete: ctx.projectName && ctx.projectName !== 'مشروعي' && ctx.businessType,
  };
}

function parseColorChange(message, ctx) {
  const t = message.toLowerCase();
  if (/\bأزرق|blue\b/i.test(t)) ctx.colors.primary = '#3b82f6';
  else if (/\bأخضر|green\b/i.test(t)) ctx.colors.primary = '#22c55e';
  else if (/\bأحمر|red\b/i.test(t)) ctx.colors.primary = '#ef4444';
  else if (/\bبنفسجي|purple\b/i.test(t)) ctx.colors.primary = '#8b5cf6';
  else if (/\bأسود|dark\b/i.test(t)) { ctx.colors.bg = '#0a0a0a'; ctx.colors.text = '#ffffff'; }
  else if (/\bأبيض|light|white\b/i.test(t)) { ctx.colors.bg = '#ffffff'; ctx.colors.text = '#1a1a1a'; }
  else if (/\bبرتقالي|orange\b/i.test(t)) ctx.colors.primary = '#f97316';
  else if (/\bوردي|pink\b/i.test(t)) ctx.colors.primary = '#ec4899';
  else if (/\bذهبي|gold|yellow|أصفر\b/i.test(t)) ctx.colors.primary = '#eab308';
}

function handleModification(message, ctx) {
  let html = ctx.generatedCode;
  const t = message.toLowerCase();

  // Change specific colors
  parseColorChange(message, ctx);
  html = modifyColors(html, ctx.colors);

  // Change text
  const textChanges = message.match(/غير\s+([\w\s]+)\s+إلى\s+([\w\s]+)/i);
  if (textChanges) {
    html = html.replace(new RegExp(textChanges[1].trim(), 'gi'), textChanges[2].trim());
  }

  // Add section
  if (/\b(ضيف|زود|add)\b.*\b(section|قسم)\b/i.test(t)) {
    html = addFeatureToSite(html, extractFeatureRequest(message), ctx);
  }

  return html;
}

function extractFeatureRequest(message) {
  const t = message.toLowerCase();
  if (/\b(gallery|معرض|صور|images)\b/i.test(t)) return 'gallery';
  if (/\b(team|فريق|اعضاء)\b/i.test(t)) return 'team';
  if (/\b(pricing|أسعار|خطط|plans)\b/i.test(t)) return 'pricing';
  if (/\b(contact|اتصال|تواصل)\b/i.test(t)) return 'contact';
  if (/\b(blog|مدونة|مقالات|posts)\b/i.test(t)) return 'blog';
  if (/\b(faq|أسئلة|questions|شائعة)\b/i.test(t)) return 'faq';
  if (/\b(services|خدمات)\b/i.test(t)) return 'services';
  if (/\b(slider|carousel|عرض|slideshow)\b/i.test(t)) return 'slider';
  if (/\b(menu|قائمة|منيو)\b/i.test(t)) return 'menu';
  if (/\b(map|خريطة|location|موقع)\b/i.test(t)) return 'map';
  if (/\b(reviews|تقييمات|مراجعات|testimonials)\b/i.test(t)) return 'testimonials';
  return 'section';
}

function modifyColors(html, colors) {
  // Replace CSS color variables or inline colors
  let result = html;
  if (colors.primary) {
    result = result.replace(/#ff6b35|#ff4500|#e85d2c|#f97316|orange/g, colors.primary);
    // Also replace gradient with new color
    result = result.replace(
      /linear-gradient\(135deg,\s*#[0-9a-fA-F]+\s*,\s*#[0-9a-fA-F]+\)/g,
      `linear-gradient(135deg, ${colors.primary}, ${adjustColor(colors.primary, -30)})`
    );
  }
  if (colors.bg) {
    const bgRegex = /background[^;]*#0a0a0a[^;]*;/g;
    result = result.replace(bgRegex, (match) => match.replace(/#0a0a0a/g, colors.bg));
    result = result.replace(/#0d0d0d/g, colors.bg === '#ffffff' ? '#f5f5f5' : '#0d0d0d');
    result = result.replace(/#060606/g, colors.bg === '#ffffff' ? '#e5e5e5' : '#060606');
    result = result.replace(/#141414/g, colors.bg === '#ffffff' ? '#ffffff' : '#141414');
  }
  return result;
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function addFeatureToSite(html, feature, ctx) {
  const featureHTML = getFeatureHTML(feature, ctx);
  // Insert before footer
  const footerIndex = html.lastIndexOf('<footer');
  if (footerIndex > -1) {
    return html.slice(0, footerIndex) + featureHTML + '\n' + html.slice(footerIndex);
  }
  // Insert before </body>
  const bodyEndIndex = html.lastIndexOf('</body>');
  if (bodyEndIndex > -1) {
    return html.slice(0, bodyEndIndex) + featureHTML + '\n' + html.slice(bodyEndIndex);
  }
  return html + '\n' + featureHTML;
}

function getFeatureHTML(feature, ctx) {
  const isDark = ctx.colors.bg !== '#ffffff';
  const cardBg = isDark ? '#141414' : '#f8f8f8';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const bg = ctx.colors.bg;
  const sectionBg = isDark ? '#0d0d0d' : '#f5f5f5';
  const headingColor = isDark ? '#fff' : '#1a1a1a';

  const sections = {
    gallery: `<section class="gallery" style="padding:6rem 5%;background:${sectionBg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">معرض الصور</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">لحظات من أعمالنا</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;max-width:1100px;margin:0 auto">
    <div style="background:${cardBg};border-radius:16px;padding:5rem 2rem;text-align:center;border:1px solid ${borderColor};font-size:3rem">🖼️</div>
    <div style="background:${cardBg};border-radius:16px;padding:5rem 2rem;text-align:center;border:1px solid ${borderColor};font-size:3rem">🎨</div>
    <div style="background:${cardBg};border-radius:16px;padding:5rem 2rem;text-align:center;border:1px solid ${borderColor};font-size:3rem">📸</div>
  </div>
</section>`,

    team: `<section class="team" style="padding:6rem 5%;background:${bg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">فريق العمل</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">نخبة من المحترفين</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;max-width:900px;margin:0 auto">
    <div style="text-align:center;background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:4rem;margin-bottom:0.8rem">👨‍💻</div><h3 style="color:${headingColor};margin-bottom:0.3rem">أحمد</h3><p style="color:${textColor};font-size:0.9rem">Full Stack Developer</p></div>
    <div style="text-align:center;background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:4rem;margin-bottom:0.8rem">🎨</div><h3 style="color:${headingColor};margin-bottom:0.3rem">سارة</h3><p style="color:${textColor};font-size:0.9rem">UI/UX Designer</p></div>
    <div style="text-align:center;background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:4rem;margin-bottom:0.8rem">🚀</div><h3 style="color:${headingColor};margin-bottom:0.3rem">محمد</h3><p style="color:${textColor};font-size:0.9rem">Project Manager</p></div>
  </div>
</section>`,

    pricing: `<section class="pricing" style="padding:6rem 5%;background:${sectionBg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">الخطط والأسعار</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">اختر الخطة المناسبة لك</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto">
    <div style="background:${cardBg};padding:2.5rem 2rem;border-radius:20px;border:1px solid ${borderColor};text-align:center"><h3 style="color:${headingColor};margin-bottom:1rem">Basic</h3><div style="font-size:2.5rem;font-weight:900;color:${ctx.colors.primary};margin-bottom:1.5rem">$499</div><p style="color:${textColor};margin-bottom:1.5rem">موقع بسيط متكامل</p><a href="#" style="display:inline-block;background:${ctx.colors.primary};color:#fff;padding:0.8rem 2rem;border-radius:50px;text-decoration:none;font-weight:700">ابدأ</a></div>
    <div style="background:${cardBg};padding:2.5rem 2rem;border-radius:20px;border:2px solid ${ctx.colors.primary};text-align:center;transform:scale(1.05)"><div style="font-size:0.8rem;background:${ctx.colors.primary};color:#fff;display:inline-block;padding:0.2rem 1rem;border-radius:50px;margin-bottom:0.8rem">الأكثر طلباً</div><h3 style="color:${headingColor};margin-bottom:1rem">Pro</h3><div style="font-size:2.5rem;font-weight:900;color:${ctx.colors.primary};margin-bottom:1.5rem">$1,299</div><p style="color:${textColor};margin-bottom:1.5rem">متجر إلكتروني متكامل</p><a href="#" style="display:inline-block;background:${ctx.colors.primary};color:#fff;padding:0.8rem 2rem;border-radius:50px;text-decoration:none;font-weight:700">ابدأ</a></div>
    <div style="background:${cardBg};padding:2.5rem 2rem;border-radius:20px;border:1px solid ${borderColor};text-align:center"><h3 style="color:${headingColor};margin-bottom:1rem">Enterprise</h3><div style="font-size:2.5rem;font-weight:900;color:${ctx.colors.primary};margin-bottom:1.5rem">$2,999</div><p style="color:${textColor};margin-bottom:1.5rem">حل متكامل مخصص</p><a href="#" style="display:inline-block;background:${ctx.colors.primary};color:#fff;padding:0.8rem 2rem;border-radius:50px;text-decoration:none;font-weight:700">اتصل بنا</a></div>
  </div>
</section>`,

    testimonials: `<section class="testimonials" style="padding:6rem 5%;background:${bg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">ماذا قالوا عنا</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">آراء عملائنا</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto">
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:1.5rem;color:${ctx.colors.primary};margin-bottom:0.8rem">⭐⭐⭐⭐⭐</div><p style="color:${textColor};line-height:1.8">"تجربة رائعة! فريق محترف جداً وسريع في التنفيذ"</p><div style="margin-top:1rem;color:${headingColor};font-weight:700">- عميل سعيد</div></div>
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:1.5rem;color:${ctx.colors.primary};margin-bottom:0.8rem">⭐⭐⭐⭐⭐</div><p style="color:${textColor};line-height:1.8">"موقعي بقى أفضل بكتير من الأول، شكراً Vixcell!"</p><div style="margin-top:1rem;color:${headingColor};font-weight:700">- عميل مميز</div></div>
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:1.5rem;color:${ctx.colors.primary};margin-bottom:0.8rem">⭐⭐⭐⭐⭐</div><p style="color:${textColor};line-height:1.8">"أنصح أي حد يشتغل معاهم، احترافية وتزام"</p><div style="margin-top:1rem;color:${headingColor};font-weight:700">- شريك نجاح</div></div>
  </div>
</section>`,

    faq: `<section class="faq" style="padding:6rem 5%;background:${sectionBg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">الأسئلة الشائعة</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">إجابات لأسئلتكم</p>
  <div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:0.8rem">
    <div style="background:${cardBg};padding:1.2rem 1.5rem;border-radius:12px;border:1px solid ${borderColor}"><div style="font-weight:700;color:${headingColor};margin-bottom:0.3rem">كم يستغرق بناء الموقع؟</div><p style="color:${textColor};font-size:0.92rem">حسب حجم المشروع، ولكن في الغالب من 3 إلى 7 أيام عمل</p></div>
    <div style="background:${cardBg};padding:1.2rem 1.5rem;border-radius:12px;border:1px solid ${borderColor}"><div style="font-weight:700;color:${headingColor};margin-bottom:0.3rem">هل تقدمون دعماً بعد التسليم؟</div><p style="color:${textColor};font-size:0.92rem">نعم، نوفر شهر دعم مجاني بعد التسليم</p></div>
    <div style="background:${cardBg};padding:1.2rem 1.5rem;border-radius:12px;border:1px solid ${borderColor}"><div style="font-weight:700;color:${headingColor};margin-bottom:0.3rem">هل الموقع سيكون متجاوب مع الجوال؟</div><p style="color:${textColor};font-size:0.92rem">طبعاً! كل مواقعنا بتشتغل على جميع الأجهزة</p></div>
  </div>
</section>`,

    services: `<section class="services-custom" style="padding:6rem 5%;background:${bg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">خدماتنا</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">نقدم حلولاً متكاملة</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;max-width:1100px;margin:0 auto">
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:2.5rem;margin-bottom:1rem">🌐</div><h3 style="color:${headingColor};margin-bottom:0.5rem">تصميم مواقع</h3><p style="color:${textColor};font-size:0.92rem;line-height:1.8">مواقع احترافية بأحدث التقنيات</p></div>
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:2.5rem;margin-bottom:1rem">📱</div><h3 style="color:${headingColor};margin-bottom:0.5rem">تطبيقات جوال</h3><p style="color:${textColor};font-size:0.92rem;line-height:1.8">تطبيقات native متكاملة</p></div>
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:2.5rem;margin-bottom:1rem">🤖</div><h3 style="color:${headingColor};margin-bottom:0.5rem">حلول AI</h3><p style="color:${textColor};font-size:0.92rem;line-height:1.8">ذكاء اصطناعي مخصص لأعمالك</p></div>
  </div>
</section>`,

    slider: `<section class="slider" style="padding:6rem 5%;background:${sectionBg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:2rem">أعمالنا</h2>
  <div style="display:flex;gap:1rem;overflow-x:auto;padding:1rem 0;max-width:1100px;margin:0 auto">
    <div style="min-width:300px;height:200px;background:${cardBg};border-radius:16px;border:1px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:3rem">🖥️</div>
    <div style="min-width:300px;height:200px;background:${cardBg};border-radius:16px;border:1px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:3rem">📊</div>
    <div style="min-width:300px;height:200px;background:${cardBg};border-radius:16px;border:1px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:3rem">🎯</div>
  </div>
</section>`,

    menu: `<section class="menu" style="padding:6rem 5%;background:${bg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">قائمة الطعام</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">أشهى الأطباق</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;max-width:900px;margin:0 auto">
    <div style="background:${cardBg};padding:1.5rem;border-radius:16px;border:1px solid ${borderColor}"><h3 style="color:${headingColor}">طبق 1</h3><p style="color:${textColor};font-size:0.9rem">وصف الطبق</p><div style="color:${ctx.colors.primary};font-weight:700;margin-top:0.5rem">$15</div></div>
    <div style="background:${cardBg};padding:1.5rem;border-radius:16px;border:1px solid ${borderColor}"><h3 style="color:${headingColor}">طبق 2</h3><p style="color:${textColor};font-size:0.9rem">وصف الطبق</p><div style="color:${ctx.colors.primary};font-weight:700;margin-top:0.5rem">$22</div></div>
    <div style="background:${cardBg};padding:1.5rem;border-radius:16px;border:1px solid ${borderColor}"><h3 style="color:${headingColor}">طبق 3</h3><p style="color:${textColor};font-size:0.9rem">وصف الطبق</p><div style="color:${ctx.colors.primary};font-weight:700;margin-top:0.5rem">$18</div></div>
    <div style="background:${cardBg};padding:1.5rem;border-radius:16px;border:1px solid ${borderColor}"><h3 style="color:${headingColor}">طبق 4</h3><p style="color:${textColor};font-size:0.9rem">وصف الطبق</p><div style="color:${ctx.colors.primary};font-weight:700;margin-top:0.5rem">$25</div></div>
  </div>
</section>`,

    map: `<section class="map" style="padding:6rem 5%;background:${sectionBg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">موقعنا</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:2rem">تفضل بزيارتنا</p>
  <div style="max-width:800px;margin:0 auto;background:${cardBg};padding:4rem 2rem;border-radius:20px;border:1px solid ${borderColor};text-align:center"><div style="font-size:3rem;margin-bottom:1rem">📍</div><p style="color:${textColor}">مصر — القاهرة\nطريق النصر</p></div>
</section>`,

    blog: `<section class="blog" style="padding:6rem 5%;background:${bg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">المدونة</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">آخر المقالات</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto">
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:2rem;margin-bottom:1rem">📝</div><h3 style="color:${headingColor};font-size:1.1rem;margin-bottom:0.5rem">عنوان المقال</h3><p style="color:${textColor};font-size:0.9rem">ملخص سريع للمقال...</p></div>
    <div style="background:${cardBg};padding:2rem;border-radius:20px;border:1px solid ${borderColor}"><div style="font-size:2rem;margin-bottom:1rem">💡</div><h3 style="color:${headingColor};font-size:1.1rem;margin-bottom:0.5rem">نصائح تقنية</h3><p style="color:${textColor};font-size:0.9rem">أحدث النصائح والتقنيات...</p></div>
  </div>
</section>`,

    contact: `<section class="contact-custom" style="padding:6rem 5%;background:${sectionBg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:0.8rem">اتصل بنا</h2>
  <p style="text-align:center;color:${textColor};margin-bottom:3rem">نحن هنا لمساعدتك</p>
  <div style="display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;max-width:800px;margin:0 auto">
    <div style="background:${cardBg};padding:1.5rem 2rem;border-radius:16px;border:1px solid ${borderColor};min-width:180px;text-align:center"><div style="color:${ctx.colors.primary};font-weight:700">📧 info@vixcell.com</div></div>
    <div style="background:${cardBg};padding:1.5rem 2rem;border-radius:16px;border:1px solid ${borderColor};min-width:180px;text-align:center"><div style="color:${ctx.colors.primary};font-weight:700">📞 +20 100 000 0000</div></div>
  </div>
</section>`,

    section: `<section class="new-section" style="padding:6rem 5%;background:${bg}">
  <h2 style="text-align:center;font-size:2.2rem;font-weight:800;color:${headingColor};margin-bottom:1rem">قسم جديد</h2>
  <p style="text-align:center;color:${textColor};max-width:600px;margin:0 auto;line-height:1.8">محتوى القسم الجديد هنا — تقدر تضيف أي محتوى عايزه</p>
</section>`,
  };

  return sections[feature] || sections.section;
}

exports.generateSite = (context) => {
  const generator = new WebsiteGenerator(context);
  return generator.generate();
};

exports.resetSession = (sessionId) => {
  sessions.delete(sessionId);
};

exports.getSession = getSession;

exports.WebsiteGenerator = WebsiteGenerator;
