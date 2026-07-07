const SYSTEM_PROMPT = `You are VIXCELL, an elite AI assistant built by the VIXCELL team. You are a world-class Full-Stack Developer, AI Engineer, Data Analyst, UI/UX Designer, and Multi-domain Expert — all in one.

YOUR IDENTITY & PERSONA:
- Your personality mirrors the style of Claude (by Anthropic): warm, intelligent, precise, honest, deeply helpful, and capable of complex reasoning.
- You think step-by-step, ask clarifying questions only when truly needed, and always deliver complete, production-ready results.
- Speak fluently in whatever language the user writes in (especially Arabic or English). Always respond in the same language the user uses.
- If the user writes in Arabic, respond in natural, fluent Arabic while keeping all technical terms, code blocks, and schemas in clean, industry-standard English.

CORE CAPABILITIES & TECHNICAL DEFAULTS:
1. Full-Stack Web Development: Expert in HTML5, CSS3, Tailwind CSS, JavaScript (ES6+), React, Node.js, Express, databases (PostgreSQL, SQLite, Prisma ORM, MongoDB), and deployments (Vercel, Railway).
2. UI/UX Design: Beautiful by default — never produce ugly, bare-bones interfaces. Apply proper visual hierarchy, mobile responsiveness, dark mode by default, and smooth CSS transitions/GSAP.
3. Code Quality: Always provide COMPLETE, working, copy-paste-ready code. Never truncate code or use placeholders like "TODO".

HOW YOU RESPOND FOR WEBSITE BUILDING:
- Chat naturally and consultatively.
- Build the single-file website immediately when you have enough info (business name + industry/type of business).
- When generating HTML, wrap the code EXACTLY like this:
===HTML_START===
<!DOCTYPE html>
... complete beautifully designed website with Tailwind CSS or custom CSS, real content, sections (Hero, Services, About, Contact), interactive elements, and responsive layout ...
===HTML_END===

- After the HTML block, add a warm, professional, Claude-style message in the user's language confirming it is ready and suggesting next iterations.
- If a logo is uploaded [LOGO_UPLOADED] or active, include <img src="CLIENT_LOGO" alt="logo"> in the header/logo areas.`;

const sessions = new Map();
const MAX_HISTORY = 40;
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
      lastActivity: Date.now(),
    });
  }
  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

function extractHTML(response) {
  const match = response.match(/===HTML_START===\s*([\s\S]*?)\s*===HTML_END===/);
  return match ? match[1].trim() : null;
}

exports.chat = async (sessionId, message, logoDataUrl = null) => {
  const session = getSession(sessionId);
  const customEndpoint = process.env.VIXCELL_MODEL_ENDPOINT || '';
  const customModel = process.env.VIXCELL_MODEL_NAME || 'vixcell-gemma-2-9b';
  const customAuth = process.env.VIXCELL_MODEL_AUTH_TOKEN || '';
  const apiKey = process.env.GEMINI_API_KEY || '';

  // 1. Prepare user parts
  let userParts = [{ text: message || 'مرحباً' }];

  if (logoDataUrl) {
    const match = logoDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      userParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      userParts[0].text += '\n[LOGO_UPLOADED]';
    }
  }

  // Route request to Vixcell Model server (Gemma vLLM compatible API) if configured
  if (customEndpoint) {
    try {
      session.history.push({ role: 'user', parts: userParts });

      const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];
      for (const turn of session.history) {
        const textContent = turn.parts.map(p => p.text || (p.inlineData ? `[Uploaded Image data]` : '')).join('\n');
        formattedMessages.push({
          role: turn.role === 'model' ? 'assistant' : 'user',
          content: textContent
        });
      }

      const headers = { 'Content-Type': 'application/json' };
      if (customAuth) {
        headers['Authorization'] = `Bearer ${customAuth}`;
      }

      const response = await fetch(`${customEndpoint.replace(/\/+$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: customModel,
          messages: formattedMessages,
          max_tokens: 8192,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vixcell AI Engine returned status ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      if (!resData.choices || resData.choices.length === 0) {
        throw new Error('Vixcell AI Engine did not return any valid choices.');
      }

      const aiResponseText = resData.choices[0].message.content;

      session.history.push({ role: 'model', parts: [{ text: aiResponseText }] });

      if (session.history.length > MAX_HISTORY) {
        session.history.splice(0, session.history.length - MAX_HISTORY);
      }

      const html = extractHTML(aiResponseText);
      const cleanText = aiResponseText.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim();

      return {
        text: cleanText || 'تم البناء بنجاح! يمكنك معاينته في لوحة المعاينة.',
        html: html
      };
    } catch (err) {
      console.error('[VIXCELL AI ENGINE ERROR]:', err.message);
      session.history.pop();
      const mockRes = getMockResponse(message, logoDataUrl);
      const html = extractHTML(mockRes);
      const cleanText = mockRes.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim();
      return {
        text: `(تنبيه: حدث خطأ أثناء الاتصال بمحرك الذكاء الاصطناعي، تم استخدام الاستجابة التلقائية المدمجة)\n\n${cleanText}`,
        html: html
      };
    }
  }

  // 2. Fallback to mock response if no API key or endpoint is configured
  if (!apiKey) {
    console.warn('[VIXCELL AI] No backend model endpoint or GEMINI_API_KEY found. Falling back to mock.');
    const mockRes = getMockResponse(message, logoDataUrl);
    const html = extractHTML(mockRes);
    const cleanText = mockRes.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim();
    
    session.history.push({ role: 'user', parts: [{ text: message }] });
    session.history.push({ role: 'model', parts: [{ text: mockRes }] });
    
    return {
      text: cleanText || 'تم البناء بنجاح! يمكنك معاينته في لوحة المعاينة.',
      html: html
    };
  }

  try {
    session.history.push({ role: 'user', parts: userParts });

    const contents = session.history.map(item => ({
      role: item.role,
      parts: item.parts
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vixcell AI Engine returned status ${response.status}`);
    }

    const resData = await response.json();
    if (!resData.candidates || resData.candidates.length === 0) {
      throw new Error('Vixcell AI Engine did not return any candidates.');
    }

    const aiResponseText = resData.candidates[0].content.parts[0].text;

    session.history.push({ role: 'model', parts: [{ text: aiResponseText }] });

    if (session.history.length > MAX_HISTORY) {
      session.history.splice(0, session.history.length - MAX_HISTORY);
    }

    const html = extractHTML(aiResponseText);
    const cleanText = aiResponseText.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim();

    return {
      text: cleanText || 'تم البناء بنجاح! يمكنك معاينته في لوحة المعاينة.',
      html: html
    };

  } catch (err) {
    console.error('[VIXCELL AI] Error in backend Vixcell chat:', err.message);
    session.history.pop();
    
    const mockRes = getMockResponse(message, logoDataUrl);
    const html = extractHTML(mockRes);
    const cleanText = mockRes.replace(/===HTML_START===[\s\S]*?===HTML_END===/g, '').trim();
    return {
      text: `(تنبيه: حدث خطأ أثناء الاتصال بمحرك الذكاء الاصطناعي، تم استخدام الاستجابة التلقائية المدمجة)\n\n${cleanText}`,
      html: html
    };
  }
};

exports.resetSession = (sessionId) => {
  sessions.delete(sessionId);
};

// Hardcoded premium mock site for elegant fallbacks
function getMockResponse(message, hasLogo) {
  const lowerMsg = (message || '').toLowerCase();
  
  if (hasLogo || lowerMsg.includes('لوجو') || lowerMsg.includes('شعار')) {
    return `تمام، شايف اللوجو 👌 بناءً على الشعار والهوية البصرية، هبنيلك موقع متكامل وجذاب!

===HTML_START===
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VIXCELL Client Site</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Cairo', sans-serif; background: #060814; color: #fff; line-height: 1.6; }
nav { position: fixed; top: 0; width: 100%; padding: 1.2rem 4rem; display: flex; justify-content: space-between; align-items: center; background: rgba(6, 8, 20, 0.9); backdrop-filter: blur(20px); z-index: 100; border-bottom: 1px solid rgba(255,107,53,0.15); }
.logo img { height: 45px; object-fit: contain; }
.nav-links a { color: rgba(255,255,255,0.7); text-decoration: none; margin-right: 2rem; font-size: 0.95rem; transition: color 0.3s; }
.nav-links a:hover { color: #ff6b35; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse at top, #1e1b4b 0%, #060814 60%); padding: 6rem 2rem; }
.hero-content { max-width: 800px; }
.hero img { width: 100px; height: 100px; object-fit: contain; margin-bottom: 2rem; filter: drop-shadow(0 0 20px rgba(255,107,53,0.4)); }
h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; margin-bottom: 1.2rem; background: linear-gradient(135deg, #fff 45%, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero p { font-size: 1.15rem; opacity: 0.7; margin-bottom: 2.5rem; }
.btn { background: linear-gradient(135deg, #ff6b35, #ff4500); color: white; padding: 0.9rem 2.2rem; border-radius: 50px; text-decoration: none; font-weight: 700; display: inline-block; transition: all 0.3s; box-shadow: 0 8px 30px rgba(255,107,53,0.3); }
.btn:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(255,107,53,0.5); }
</style>
</head>
<body>
<nav>
  <div class="logo"><img src="CLIENT_LOGO" alt="logo"></div>
  <div class="nav-links">
    <a href="#about">من نحن</a>
    <a href="#services">الخدمات</a>
  </div>
</nav>
<section class="hero">
  <div class="hero-content">
    <img src="CLIENT_LOGO" alt="logo">
    <h1>أهلاً بك في موقعك الجديد</h1>
    <p>تم بناء هذا الموقع وتنسيقه مع اللوجو المرفوع بشكل احترافي وجذاب.</p>
    <a href="#contact" class="btn">اكتشف المزيد</a>
  </div>
</section>
</body>
</html>
===HTML_END===

هيا! موقعك جاهز مع الشعار المرفوع 🎉 قولي لو حابب نعدل الألوان، نضيف أقسام تانية، أو نغير النصوص!`;
  }

  return `أهلاً بك! 👋 أنا **VIXCELL AI** مساعدك الذكي.

لقد قمت بتحليل طلبك، وهيا بنا نبني لك موقعاً رائعاً يليق بتطلعاتك!

===HTML_START===
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VIXCELL Premium Demo</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Cairo', sans-serif; background: #080b16; color: #fff; line-height: 1.6; }
nav { position: fixed; top: 0; width: 100%; padding: 1.2rem 4rem; display: flex; justify-content: space-between; align-items: center; background: rgba(8, 11, 22, 0.9); backdrop-filter: blur(20px); z-index: 100; border-bottom: 1px solid rgba(255,107,53,0.15); }
.logo { font-size: 1.6rem; font-weight: 900; background: linear-gradient(135deg, #fff, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.nav-links a { color: rgba(255,255,255,0.7); text-decoration: none; margin-right: 2rem; font-size: 0.95rem; transition: color 0.3s; }
.nav-links a:hover { color: #ff6b35; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse at top, #1e1b4b 0%, #080b16 65%); padding: 6rem 2rem; }
.hero-content { max-width: 800px; }
h1 { font-size: clamp(2.2rem, 6vw, 4.5rem); font-weight: 900; margin-bottom: 1.5rem; background: linear-gradient(135deg, #fff 40%, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero p { font-size: 1.2rem; opacity: 0.75; margin-bottom: 2.5rem; max-width: 600px; margin-right: auto; margin-left: auto; }
.btn { background: linear-gradient(135deg, #ff6b35, #ff4500); color: white; padding: 1rem 2.5rem; border-radius: 50px; text-decoration: none; font-weight: 700; display: inline-block; transition: all 0.3s; box-shadow: 0 8px 30px rgba(255,107,53,0.3); }
.btn:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(255,107,53,0.5); }
.services { padding: 8rem 4rem; background: #0f1222; }
.services-title { text-align: center; font-size: 2.5rem; font-weight: 800; margin-bottom: 3.5rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; max-width: 1100px; margin: 0 auto; }
.card { background: #161a32; padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.35s; }
.card:hover { transform: translateY(-8px); border-color: rgba(255,107,53,0.3); }
.card-icon { font-size: 3rem; margin-bottom: 1rem; }
.card h3 { font-size: 1.3rem; margin-bottom: 0.8rem; }
.card p { opacity: 0.6; font-size: 0.95rem; }
</style>
</head>
<body>
<nav>
  <div class="logo">VIXCELL</div>
  <div class="nav-links">
    <a href="#services">الخدمات</a>
    <a href="#contact">تواصل معنا</a>
  </div>
</nav>
<section class="hero">
  <div class="hero-content">
    <h1>مستقبل أعمالك الرقمي يبدأ اليوم</h1>
    <p>نصمم ونطور حلول الويب الفاخرة للشركات والناشئين بأعلى معايير الإتقان والتكنولوجيا الحديثة.</p>
    <a href="#services" class="btn">استكشف خدماتنا 🚀</a>
  </div>
</section>
<section class="services" id="services">
  <h2 class="services-title">ماذا نقدم لك؟</h2>
  <div class="cards">
    <div class="card"><div class="card-icon">🚀</div><h3>تطوير الويب الفاخر</h3><p>مواقع فائقة السرعة والتجاوب مع تجربة مستخدم لا تُنسى.</p></div>
    <div class="card"><div class="card-icon">⚡</div><h3>حلول السحاب والـ ERP</h3><p>أتمتة كاملة لإدارتك وتخزين آمن وموثوق لبيانات شركتك.</p></div>
    <div class="card"><div class="card-icon">🧠</div><h3>ذكاء اصطناعي مدمج</h3><p>دمج وكلاء ومساعدين أذكياء في أنظمة العمل لزيادة المبيعات والسرعة.</p></div>
  </div>
</section>
</body>
</html>
===HTML_END===

لقد قمت بإنشاء نسخة معاينة أولية فاخرة تناسب تطلعاتك! هل ترغب في تغيير الألوان أو الأقسام؟ أخبرني فحسب!`;
}
