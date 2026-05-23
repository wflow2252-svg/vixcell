// Gemini AI Service for the Project Builder
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

const SYSTEM_PROMPT = `You are Vix — a senior web developer and digital consultant working at Vixcell agency.
You talk naturally and freely with clients like a real expert friend, NOT a scripted chatbot.

YOUR PERSONALITY:
- Warm, casual, expert. Like a smart friend who builds websites for a living.
- You respond to whatever the client says — no fixed script, no forced questions.
- You listen and understand from context what the client needs.
- Speak the same language as the client (Arabic or English — match their language instantly).

HOW YOU WORK:
- Chat naturally. If the client says "I want a website for my restaurant" → ask what you need to know (name, style, colors etc.) in a natural flowing way.
- If you already have enough info → start building immediately without more questions.
- If a logo is uploaded ([LOGO_UPLOADED]) → acknowledge it and use it in the website.
- You can ask follow-up questions naturally as needed — but never in a rigid numbered list format.
- If the client gives you a lot of info at once → great, start building right away.
- If client says something vague → ask one smart clarifying question.

WHEN TO BUILD THE WEBSITE:
Build the HTML when you have enough info (name + type of business, even just these two are enough to start).
Don't wait for perfection. A real dev starts with what they have and can iterate.
After generating HTML, tell the client they can keep refining it by chatting with you.

WEBSITE QUALITY:
Generate a COMPLETE, stunning, modern single-file HTML website:
- Beautiful hero section with gradient/animation
- Responsive mobile-friendly design
- Smooth CSS animations and hover effects
- Professional typography (use Google Fonts)
- Sections relevant to their business (services, about, contact, gallery, etc.)
- Real content — not placeholder text
- If logo uploaded: <img src="CLIENT_LOGO" alt="logo"> everywhere appropriate
- Dark or light theme based on their brand/industry

OUTPUT FORMAT — wrap HTML exactly like this:
===HTML_START===
<!DOCTYPE html>
... complete website ...
===HTML_END===

After the HTML, add a short friendly message like "هيا! موقعك جاهز 🎉 قولي لو عايز أغير أي حاجة"

IMPORTANT: You are a real AI — respond freely. Don't follow a script. React to what the client actually says.`

let genAI = null
let chat = null

export function initGemini() {
  if (!API_KEY) {
    console.warn('No Gemini API key found. Using mock responses.')
    return false
  }
  genAI = new GoogleGenerativeAI(API_KEY)
  return true
}

export async function startChat() {
  if (!genAI) {
    initGemini()
  }
  if (!genAI) return null

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT
  })

  chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    }
  })

  return chat
}

export async function sendMessage(message, logoDataUrl = null) {
  if (!chat) {
    await startChat()
  }
  if (!chat) {
    return getMockResponse(message)
  }

  let userMessage = message
  if (logoDataUrl) {
    userMessage = message + '\n[LOGO_UPLOADED]'
  }

  try {
    const result = await chat.sendMessage(userMessage)
    return result.response.text()
  } catch (err) {
    console.error('Gemini error:', err)
    return getMockResponse(message)
  }
}

export function extractHTML(response) {
  const match = response.match(/===HTML_START===\s*([\s\S]*?)\s*===HTML_END===/)
  if (match) return match[1].trim()
  return null
}

// Mock responses for when no API key is set
let mockStep = 0
function getMockResponse(message) {
  const lowerMsg = message.toLowerCase()

  // If logo uploaded
  if (message.includes('[LOGO_UPLOADED]') || message.includes('LOGO_UPLOADED')) {
    return Promise.resolve(`تمام، شايف اللوجو 👌 بناءً على اللي قلتلي عليه، دلوقتي هبني الموقع...

===HTML_START===
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>موقعك الاحترافي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Cairo', sans-serif; background: #0a0a0a; color: #fff; }
nav { position: fixed; top: 0; width: 100%; padding: 1.2rem 4rem; display: flex; justify-content: space-between; align-items: center; background: rgba(10,10,10,0.92); backdrop-filter: blur(20px); z-index: 100; border-bottom: 1px solid rgba(255,107,53,0.2); }
.logo img { height: 45px; object-fit: contain; }
.nav-links a { color: rgba(255,255,255,0.75); text-decoration: none; margin-right: 2rem; font-size: 0.95rem; transition: color 0.3s; }
.nav-links a:hover { color: #ff6b35; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse at top, #1a0a00 0%, #0a0a0a 60%); position: relative; overflow: hidden; padding: 6rem 2rem 4rem; }
.hero::before { content: ''; position: absolute; width: 800px; height: 800px; background: radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 65%); border-radius: 50%; top: -200px; left: 50%; transform: translateX(-50%); animation: pulse 4s ease-in-out infinite; }
@keyframes pulse { 0%,100%{transform:translateX(-50%) scale(1);} 50%{transform:translateX(-50%) scale(1.1);} }
.hero-logo { width: 90px; height: 90px; object-fit: contain; margin-bottom: 2rem; border-radius: 16px; box-shadow: 0 0 40px rgba(255,107,53,0.3); animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
h1 { font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 900; margin-bottom: 1.2rem; background: linear-gradient(135deg, #fff 40%, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero p { font-size: 1.2rem; opacity: 0.7; margin-bottom: 2.5rem; max-width: 500px; margin-right: auto; margin-left: auto; line-height: 1.8; }
.btn { background: linear-gradient(135deg, #ff6b35, #ff4500); color: white; padding: 1rem 2.5rem; border-radius: 50px; text-decoration: none; font-weight: 700; display: inline-block; transition: all 0.3s; box-shadow: 0 8px 30px rgba(255,107,53,0.35); }
.btn:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(255,107,53,0.5); }
.services { padding: 7rem 4rem; background: #0f0f0f; }
.section-title { text-align: center; font-size: 2.5rem; font-weight: 800; margin-bottom: 0.7rem; }
.section-sub { text-align: center; opacity: 0.5; margin-bottom: 4rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; max-width: 1100px; margin: 0 auto; }
.card { background: #161616; padding: 2.2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); transition: all 0.35s; }
.card:hover { transform: translateY(-8px); border-color: rgba(255,107,53,0.4); box-shadow: 0 20px 50px rgba(255,107,53,0.12); }
.card-icon { font-size: 2.5rem; margin-bottom: 1.2rem; }
.card h3 { font-size: 1.2rem; margin-bottom: 0.6rem; }
.card p { opacity: 0.55; line-height: 1.8; font-size: 0.92rem; }
.contact { padding: 7rem 4rem; background: #0a0a0a; text-align: center; }
.contact-btn { display: inline-flex; align-items: center; gap: 0.7rem; background: #25D366; color: white; padding: 1rem 2.5rem; border-radius: 50px; text-decoration: none; font-weight: 700; margin: 0.5rem; transition: all 0.3s; }
.contact-btn:hover { transform: translateY(-3px); opacity: 0.9; }
footer { background: #060606; padding: 2.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); }
footer p { opacity: 0.4; font-size: 0.88rem; }
</style>
</head>
<body>
<nav>
  <div class="logo"><img src="CLIENT_LOGO" alt="logo"></div>
  <div class="nav-links">
    <a href="#services">الخدمات</a>
    <a href="#about">من نحن</a>
    <a href="#contact">تواصل معنا</a>
  </div>
</nav>
<section class="hero">
  <div>
    <img class="hero-logo" src="CLIENT_LOGO" alt="logo">
    <h1>أهلاً بك معنا</h1>
    <p>نقدم لك أفضل الحلول والخدمات باحترافية عالية وجودة لا تُضاهى</p>
    <a href="#contact" class="btn">تواصل معنا الآن</a>
  </div>
</section>
<section class="services" id="services">
  <h2 class="section-title">خدماتنا</h2>
  <p class="section-sub">نقدم حلولاً متكاملة تلبي جميع احتياجاتك</p>
  <div class="cards">
    <div class="card"><div class="card-icon">🚀</div><h3>تصميم احترافي</h3><p>تصميم متميز يعكس هوية علامتك التجارية بأعلى معايير الجودة</p></div>
    <div class="card"><div class="card-icon">💡</div><h3>ابتكار مستمر</h3><p>حلول إبداعية مبتكرة تواكب أحدث التقنيات والاتجاهات</p></div>
    <div class="card"><div class="card-icon">🎯</div><h3>نتائج مضمونة</h3><p>نعمل بشغف لتحقيق أهدافك وضمان رضاك الكامل</p></div>
  </div>
</section>
<section class="contact" id="contact">
  <h2 class="section-title">تواصل معنا</h2>
  <p class="section-sub" style="margin-bottom:2.5rem">نحن هنا لمساعدتك في أي وقت</p>
  <a href="https://wa.me/201000000000" class="contact-btn">
    <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    واتساب
  </a>
</section>
<footer><p>© 2025 جميع الحقوق محفوظة — Powered by Vixcell ⚡</p></footer>
</body>
</html>
===HTML_END===

هيا! موقعك جاهز 🎉 قولي لو عايز أغير الألوان، النصوص، أو تضيف أي section تانية!`)
  }

  // If first message or greeting
  if (mockStep === 0) {
    mockStep++
    return Promise.resolve(`أهلاً! 👋 أنا Vix، مطور الويب الذكي من Vixcell.

قولي عايز إيه بالظبط — سواء موقع جديد، landing page، متجر، أو أي حاجة تانية. وهبدأ أشتغل فوراً 🚀`)
  }

  // Generic response
  mockStep++
  return Promise.resolve(`تمام! فاهمك. 

عشان أبني الموقع بشكل صح — قولي اسم مشروعك أو شركتك، وهبدأ دلوقتي. لو عندك لوجو ارفعه من الزر في الأسفل 📎`)
}

export function resetChat() {
  chat = null
  mockStep = 0
}
