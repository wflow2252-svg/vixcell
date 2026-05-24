// ─── VIXCELL AI — Intent Detection & NLP ────────────────────────────
// Advanced multi-intent classifier supporting Arabic & English
// with synonym mapping, context awareness, and confidence scoring.

export const INTENT = {
  // Conversational
  GREETING: 'greeting',
  FAREWELL: 'farewell',
  THANKS: 'thanks',
  IDENTITY: 'identity',          // who are you?
  CAPABILITY: 'capability',      // what can you do?
  HELP: 'help',
  AFFIRM: 'affirm',              // yes/agree
  DENY: 'deny',                  // no/disagree
  SMALL_TALK: 'small_talk',      // how are you?

  // Building
  BUILD_SITE: 'build_site',
  BUILD_ECOMMERCE: 'build_ecommerce',
  BUILD_BLOG: 'build_blog',
  BUILD_PORTFOLIO: 'build_portfolio',
  BUILD_RESTAURANT: 'build_restaurant',
  BUILD_LANDING: 'build_landing',
  BUILD_DASHBOARD: 'build_dashboard',
  BUILD_APP: 'build_app',

  // Code Generation
  WRITE_REACT: 'write_react',
  WRITE_NODE: 'write_node',
  WRITE_PYTHON: 'write_python',
  WRITE_HTML: 'write_html',
  WRITE_CSS: 'write_css',
  WRITE_JS: 'write_js',
  WRITE_API: 'write_api',
  WRITE_DATABASE: 'write_database',
  WRITE_ALGORITHM: 'write_algorithm',
  WRITE_COMPONENT: 'write_component',
  WRITE_FORM: 'write_form',
  WRITE_AUTH: 'write_auth',

  // Code Analysis
  ANALYZE_CODE: 'analyze_code',
  DEBUG_CODE: 'debug_code',
  REFACTOR_CODE: 'refactor_code',
  EXPLAIN_CODE: 'explain_code',
  OPTIMIZE_CODE: 'optimize_code',

  // Site Modification
  MODIFY_COLOR: 'modify_color',
  MODIFY_LAYOUT: 'modify_layout',
  MODIFY_CONTENT: 'modify_content',
  ADD_SECTION: 'add_section',
  REMOVE_SECTION: 'remove_section',

  // Learning / Knowledge
  EXPLAIN_CONCEPT: 'explain_concept',
  COMPARE: 'compare',
  RECOMMEND: 'recommend',
  TUTORIAL: 'tutorial',

  // Meta
  RESET: 'reset',
  REPEAT: 'repeat',
  UNKNOWN: 'unknown',
}

// ─── Pattern Definitions ────────────────────────────────────────────
const PATTERNS = [
  // — Conversational —
  { intent: INTENT.GREETING, weight: 10, patterns: [
    /^(hi|hello|hey|yo|hiya|howdy|greetings)\b/i,
    /^(مرحبا|مرحباً|السلام|أهلا|اهلا|أهلاً|اهلاً|هاي|هلا|صباح|مساء)/,
    /^(good\s*(morning|evening|afternoon))/i,
  ]},
  { intent: INTENT.FAREWELL, weight: 9, patterns: [
    /\b(bye|goodbye|see\s*ya|cya|farewell|take\s*care)\b/i,
    /(مع\s*السلامة|باي|وداعا|الى\s*اللقاء|سلام)/,
  ]},
  { intent: INTENT.THANKS, weight: 9, patterns: [
    /\b(thanks|thank\s*you|thx|tnx|appreciate)\b/i,
    /(شكرا|شكراً|متشكر|تسلم|ميرسي|تشكراتي)/,
  ]},
  { intent: INTENT.IDENTITY, weight: 8, patterns: [
    /\b(who\s*are\s*you|what\s*are\s*you|your\s*name|introduce|tell\s*me\s*about\s*yourself)\b/i,
    /(انت\s*مين|انت\s*ايه|مين\s*انت|عرفني\s*بنفسك|اسمك\s*ايه)/,
  ]},
  { intent: INTENT.CAPABILITY, weight: 8, patterns: [
    /\b(what\s*can\s*you|what\s*do\s*you|your\s*capabilit|your\s*power|features?|abilities?|powered)\b/i,
    /(ايه\s*اللي\s*تقدر|تقدر\s*تعمل\s*ايه|ايه\s*امكانياتك|ايه\s*اللي\s*تعرفه|قدراتك)/,
  ]},
  { intent: INTENT.HELP, weight: 7, patterns: [
    /\b(help|guide|how\s*to\s*use|instructions?|manual)\b/i,
    /(مساعدة|ساعدني|كيف\s*أستخدم|دليل|إرشادات|طريقة)/,
  ]},
  { intent: INTENT.AFFIRM, weight: 7, patterns: [
    /^(yes|yeah|yep|yup|sure|ok|okay|correct|right|exactly|absolutely)\b/i,
    /^(نعم|أيوة|ايوة|ايوه|تمام|طيب|اوكي|أكيد|اكيد|صح|ماشي)/,
  ]},
  { intent: INTENT.DENY, weight: 7, patterns: [
    /^(no|nope|nah|not\s*really|wrong|incorrect)\b/i,
    /^(لا|لأ|مش|مش\s*كده|غلط|خطأ)/,
  ]},
  { intent: INTENT.SMALL_TALK, weight: 6, patterns: [
    /\b(how\s*are\s*you|how's\s*it\s*going|what's\s*up|sup)\b/i,
    /(عامل\s*ايه|اخبارك|كيف\s*حالك|ازيك|ازاي\s*احوالك)/,
  ]},

  // — Build —
  { intent: INTENT.BUILD_ECOMMERCE, weight: 10, patterns: [
    /\b(ecommerce|e-commerce|online\s*store|shop|webshop|store|shopping)\b.*\b(site|website|build|create|make)\b/i,
    /\b(build|create|make).*\b(ecommerce|e-commerce|online\s*store|shop|webshop|store|shopping)\b/i,
    /(متجر|شوب|محل\s*الكتروني|تجارة\s*الكترونية)/,
  ]},
  { intent: INTENT.BUILD_RESTAURANT, weight: 10, patterns: [
    /\b(restaurant|cafe|food|menu|burger|pizza|kitchen|dining)\b.*\b(site|website|build|create|make)\b/i,
    /\b(build|create|make).*\b(restaurant|cafe|food|menu|burger|pizza|kitchen)\b/i,
    /(مطعم|كافيه|كافيتيريا|طعام|أكل|وجبات|فود|قهوة)/,
  ]},
  { intent: INTENT.BUILD_BLOG, weight: 10, patterns: [
    /\b(blog|news|article|magazine|publication)\b.*\b(site|website|build|create|make)\b/i,
    /\b(build|create|make).*\b(blog|news|article|magazine|publication)\b/i,
    /(مدونة|بلوج|أخبار|مقالات|مجلة)/,
  ]},
  { intent: INTENT.BUILD_PORTFOLIO, weight: 10, patterns: [
    /\b(portfolio|showcase|resume|cv|personal\s*site)\b/i,
    /(بورتفوليو|أعمالي|معرض\s*أعمال|سيرة\s*ذاتية|سي\s*في)/,
  ]},
  { intent: INTENT.BUILD_LANDING, weight: 10, patterns: [
    /\b(landing\s*page|lp|squeeze\s*page|sales\s*page)\b/i,
    /(صفحة\s*هبوط|صفحه\s*هبوط|لاندينج|لاندنج|landing\s*بيج|landing\s*page)/i,
  ]},
  { intent: INTENT.BUILD_DASHBOARD, weight: 10, patterns: [
    /\b(dashboard|admin\s*panel|control\s*panel|analytics)\b.*\b(site|website|build|create|make)\b/i,
    /\b(build|create|make).*\b(dashboard|admin\s*panel)\b/i,
    /(لوحة\s*تحكم|داشبورد|لوحة\s*إدارة)/,
  ]},
  { intent: INTENT.BUILD_APP, weight: 9, patterns: [
    /\b(build|create|make|develop)\s+(an?\s+)?(web\s*app|application|app)\b/i,
    /(اعمل|ابني|انشئ|اصنع)\s*(تطبيق|أبليكيشن|ابلكيشن)/,
  ]},
  { intent: INTENT.BUILD_SITE, weight: 8, patterns: [
    /\b(build|create|make|develop|design|generate)\s+(a\s+|an\s+|the\s+)?(site|website|web\s*site|webpage|page|web)\b/i,
    /\bi\s*(want|need|wanna)\s*.*\b(site|website|page)\b/i,
    /(اعمل|ابني|انشئ|اصنع|صمم|عايز|محتاج|عاوز|تعمل|تعملي|تعمللي|تعمليلي)\s*(\S+\s+){0,4}(موقع|صفحة|صفحه|ويب|لاندينج|لاندنج|landing)/,
    /(موقع|صفحة|صفحه|ويب|لاندينج|لاندنج|landing)\s*(\S+\s+){0,4}(لشرك[هة]|شرك[هة]|لمشروع|لمتجر|لمطعم|لعياده|لعيادة)/,
  ]},

  // — Code Generation —
  { intent: INTENT.WRITE_REACT, weight: 11, patterns: [
    /\b(react|jsx|usestate|useeffect|hooks?|next\.?js)\b.*\b(component|function|code|example|how|write)\b/i,
    /\b(write|create|make|build|generate)\s+(a\s+)?(react|jsx)\b/i,
    /\b(write|create|make|generate)\s+.*\bcomponent\b/i,
    /(اكتب|اعمل|انشئ).*\b(react|رياكت|كومبوننت|component)\b/i,
  ]},
  { intent: INTENT.WRITE_NODE, weight: 11, patterns: [
    /\b(node|node\.?js|express|nestjs|fastify)\b.*\b(server|api|endpoint|route|code|example|write)\b/i,
    /\b(write|create|make|build|generate)\s+(a\s+)?(node|express|nest|backend|server)\b/i,
    /(اكتب|اعمل|انشئ).*\b(node|نود|express|سيرفر|server|باك\s*اند|backend)\b/i,
  ]},
  { intent: INTENT.WRITE_PYTHON, weight: 11, patterns: [
    /\b(python|django|flask|fastapi|pandas|numpy)\b.*\b(script|code|example|function|write|how)\b/i,
    /\b(write|create|make|build|generate)\s+(a\s+)?(python|py|django|flask|fastapi)\b/i,
    /(اكتب|اعمل|انشئ).*\b(python|بايثون|بايثن)\b/i,
  ]},
  { intent: INTENT.WRITE_API, weight: 10, patterns: [
    /\b(write|create|make|build|generate|design)\s+(a\s+|an\s+)?(rest\s+)?(api|endpoint|route)\b/i,
    /\bcrud\s+(api|operations?|endpoints?)\b/i,
    /(اكتب|اعمل|انشئ).*\b(api|اي\s*بي\s*اي|endpoint|روت|route)\b/i,
  ]},
  { intent: INTENT.WRITE_DATABASE, weight: 10, patterns: [
    /\b(database|db|sql|mongodb|mongoose|prisma|postgres|mysql|sqlite|schema)\b.*\b(create|design|write|build)\b/i,
    /\b(write|create|design)\s+(a\s+|an\s+)?(database|db|schema|table|model)\b/i,
    /(اكتب|اعمل|انشئ|صمم).*\b(database|قاعدة\s*بيانات|جدول|schema|model)\b/i,
  ]},
  { intent: INTENT.WRITE_AUTH, weight: 10, patterns: [
    /\b(auth|authentication|login|signup|register|jwt|oauth|session)\b.*\b(code|write|create|build|implement|how)\b/i,
    /(تسجيل\s*دخول|أوث|authentication|jwt|توثيق|مصادقة)/i,
  ]},
  { intent: INTENT.WRITE_FORM, weight: 10, patterns: [
    /\b(write|create|make|build)\s+(a\s+|an\s+)?(form|input|validation)\b/i,
    /(اعمل|اكتب).*\b(فورم|نموذج|form|إدخال)\b/i,
  ]},
  { intent: INTENT.WRITE_ALGORITHM, weight: 10, patterns: [
    /\b(algorithm|sort|search|fibonacci|factorial|recursion|binary\s*search|quicksort|mergesort|bubble\s*sort)\b/i,
    /(خوارزمية|ترتيب|بحث|recursion|تكرار)/i,
  ]},
  { intent: INTENT.WRITE_HTML, weight: 9, patterns: [
    /\b(write|generate|create)\s+(some\s+|me\s+)?(html|markup)\b/i,
    /(اكتب|اعمل).*\b(html|اتش\s*تي\s*ام\s*ال|هتمل)\b/i,
  ]},
  { intent: INTENT.WRITE_CSS, weight: 9, patterns: [
    /\b(write|create|style|design)\s+(some\s+)?(css|tailwind|sass|scss)\b/i,
    /(اكتب|اعمل).*\b(css|سي\s*اس\s*اس|tailwind|تصميم)\b/i,
  ]},
  { intent: INTENT.WRITE_JS, weight: 8, patterns: [
    /\b(write|create|make)\s+(a\s+)?(javascript|js|typescript|ts)\s+(function|code|snippet|example)\b/i,
    /(اكتب|اعمل).*\b(javascript|جافا\s*سكريبت|js|كود)\b/i,
  ]},
  { intent: INTENT.WRITE_COMPONENT, weight: 9, patterns: [
    /\b(button|modal|card|navbar|sidebar|tabs?|dropdown|tooltip|accordion|carousel|slider)\b.*\b(component|code|create|build|write)\b/i,
    /(زرار|مودال|كارت|نافبار|ساي\s*دبار|تابز)/,
  ]},

  // — Code Analysis —
  { intent: INTENT.DEBUG_CODE, weight: 10, patterns: [
    /\b(debug|fix|bug|error|issue|problem|broken|not\s*working|wrong|why\s*doesn'?t)\b/i,
    /(صلح|اصلح|مشكلة|خطأ|بق|إيرور|مش\s*شغال|مش\s*بيشتغل|ليه\s*كده|ليه\s*ميشتغلش)/,
  ]},
  { intent: INTENT.REFACTOR_CODE, weight: 9, patterns: [
    /\b(refactor|cleanup|clean\s*up|improve|simplify|reorganize|restructure)\b/i,
    /(إعادة\s*هيكلة|بسط|نظف|حسن|ريفاكتور)/,
  ]},
  { intent: INTENT.OPTIMIZE_CODE, weight: 9, patterns: [
    /\b(optimi[sz]e|performance|faster|speed\s*up|efficient|reduce\s*time)\b/i,
    /(تحسين\s*أداء|سرعة|أسرع|optimization|بطيء)/,
  ]},
  { intent: INTENT.EXPLAIN_CODE, weight: 9, patterns: [
    /\b(explain|what\s*does\s*this|how\s*does\s*this|tell\s*me\s*about\s*this)\b.*\b(code|function|method|class)\b/i,
    /(اشرح|فسر|ايه\s*ده|ايه\s*اللي\s*بيحصل|ازاي\s*بيشتغل)/,
  ]},
  { intent: INTENT.ANALYZE_CODE, weight: 8, patterns: [
    /\b(analy[sz]e|review|inspect|audit|check|evaluate)\b.*\b(code|function|file)\b/i,
    /(حلل|راجع|اكشف|افحص|قيم|ادي\s*رأيك)/,
  ]},

  // — Modify —
  { intent: INTENT.MODIFY_COLOR, weight: 9, patterns: [
    /\b(change|set|make|update)\s+.*\b(color|colour|theme|primary|background)\b/i,
    /(غير|عدل|اجعل).*\b(لون|ألوان|ثيم|primary|color)\b/i,
  ]},
  { intent: INTENT.ADD_SECTION, weight: 8, patterns: [
    /\b(add|insert|include|create)\s+(a\s+|an\s+)?(section|page|panel|component|area|gallery|testimonial|review|faq|footer|header)\b/i,
    /(ضيف|اضف|زود|أضف).*\b(قسم|صفحة|section|gallery|معرض)\b/i,
  ]},
  { intent: INTENT.REMOVE_SECTION, weight: 8, patterns: [
    /\b(remove|delete|drop|take\s*out)\s+(a\s+|an\s+|the\s+)?(section|page|component|footer|header)\b/i,
    /(احذف|شيل|امسح).*\b(قسم|صفحة|section)\b/i,
  ]},
  { intent: INTENT.MODIFY_CONTENT, weight: 7, patterns: [
    /\b(change|update|edit|modify)\s+.*\b(text|title|heading|content|wording)\b/i,
    /(غير|عدل).*\b(نص|عنوان|كلام|محتوى|كلمة|كلمات)\b/i,
  ]},

  // — Learning —
  { intent: INTENT.COMPARE, weight: 8, patterns: [
    /\b(compare|vs|versus|difference\s*between|which\s*is\s*better)\b/i,
    /(قارن|الفرق\s*بين|أيهما\s*أفضل|ايه\s*الفرق)/,
  ]},
  { intent: INTENT.RECOMMEND, weight: 7, patterns: [
    /\b(recommend|suggest|best|should\s*i\s*use|which\s*should)\b/i,
    /(انصح|اقترح|أفضل|ايه\s*أحسن|ايه\s*أحسن\s*حاجة)/,
  ]},
  { intent: INTENT.EXPLAIN_CONCEPT, weight: 7, patterns: [
    /\b(what\s*is|what\s*are|define|explain|tell\s*me\s*about)\b/i,
    /(ايه\s*ال|إيه\s*هو|عرف|اشرح|ايه\s*معنى)/,
  ]},
  { intent: INTENT.TUTORIAL, weight: 7, patterns: [
    /\b(how\s*to|how\s*do\s*i|tutorial|guide\s*me|step\s*by\s*step|teach\s*me)\b/i,
    /(ازاي|كيف|علمني|درس|خطوة\s*خطوة)/,
  ]},

  // — Meta —
  { intent: INTENT.RESET, weight: 9, patterns: [
    /\b(reset|restart|start\s*over|clear|fresh\s*start|new\s*conversation)\b/i,
    /(ابدأ\s*من\s*جديد|امسح|نظف|reset|إعادة)/,
  ]},
  { intent: INTENT.REPEAT, weight: 7, patterns: [
    /\b(repeat|say\s*again|one\s*more\s*time|come\s*again)\b/i,
    /(كرر|تاني|قول\s*تاني|إعادة)/,
  ]},
]

// ─── Tokenization & Normalization ──────────────────────────────────
export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '')  // Arabic diacritics
    .replace(/أ|إ|آ/g, 'ا')                 // Alef variants
    .replace(/ى/g, 'ي')                     // Alef maksura
    .replace(/ة/g, 'ه')                     // Ta marbuta
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(text) {
  return normalize(text).split(/[\s,،.!?؟:;()\[\]{}'"`]+/).filter(Boolean)
}

// ─── Multi-Intent Classification with Confidence ───────────────────
export function classify(text) {
  const norm = normalize(text)
  const matches = []

  for (const { intent, weight, patterns } of PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text) || pattern.test(norm)) {
        matches.push({ intent, weight, source: pattern.source.slice(0, 30) })
        break
      }
    }
  }

  if (matches.length === 0) {
    return { primary: INTENT.UNKNOWN, all: [], confidence: 0 }
  }

  matches.sort((a, b) => b.weight - a.weight)
  const top = matches[0]
  const confidence = Math.min(1, top.weight / 10 + matches.length * 0.05)

  return {
    primary: top.intent,
    all: matches.map(m => m.intent),
    confidence: Number(confidence.toFixed(2)),
    matches,
  }
}

// ─── Information Extraction ────────────────────────────────────────
const PROJECT_TYPE_HINTS = {
  ecommerce: ['ecommerce', 'e-commerce', 'store', 'shop', 'متجر', 'محل', 'مبيع'],
  restaurant: ['restaurant', 'cafe', 'food', 'menu', 'مطعم', 'كافيه', 'مقهى', 'مأكولات'],
  blog: ['blog', 'news', 'magazine', 'مدونة', 'بلوج', 'أخبار', 'مقالات'],
  portfolio: ['portfolio', 'showcase', 'resume', 'cv', 'بورتفوليو', 'أعمال', 'معرض'],
  clinic: ['clinic', 'hospital', 'doctor', 'medical', 'عيادة', 'طبيب', 'مستشفى'],
  school: ['school', 'university', 'education', 'course', 'مدرسة', 'جامعة', 'تعليم', 'كورس'],
  business: ['business', 'company', 'agency', 'corporate', 'شركة', 'مؤسسة', 'وكالة'],
  personal: ['personal', 'about\\s*me', 'شخصي', 'عني'],
  landing: ['landing', 'squeeze', 'sales', 'هبوط', 'لاندينج'],
  dashboard: ['dashboard', 'admin', 'panel', 'لوحة\\s*تحكم', 'داشبورد'],
}

const COLOR_MAP = {
  '#3b82f6': /\b(blue|blueish|navy|azure)\b|(أزرق|كحلي|سماوي)/i,
  '#22c55e': /\b(green|emerald|forest|lime)\b|(أخضر|اخضر)/i,
  '#ef4444': /\b(red|crimson|scarlet|ruby)\b|(أحمر|احمر|قرمزي)/i,
  '#8b5cf6': /\b(purple|violet|lavender|indigo)\b|(بنفسجي|أرجواني)/i,
  '#f97316': /\b(orange|amber|tangerine)\b|(برتقالي)/i,
  '#ec4899': /\b(pink|magenta|rose|fuchsia)\b|(وردي|بمبي)/i,
  '#eab308': /\b(yellow|gold|golden|mustard)\b|(أصفر|اصفر|ذهبي)/i,
  '#14b8a6': /\b(teal|turquoise|cyan)\b|(تركواز|سماوي\s*غامق)/i,
  '#0f172a': /\b(black|dark|midnight)\b|(أسود|اسود|داكن)/i,
  '#ffffff': /\b(white|ivory|cream)\b|(أبيض|ابيض)/i,
  '#64748b': /\b(gray|grey|slate)\b|(رمادي|سيلفر)/i,
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'i', 'me', 'my', 'we',
  'you', 'your', 'it', 'its', 'and', 'or', 'but', 'with', 'for', 'in', 'on', 'at',
  'to', 'of', 'from', 'as', 'by', 'this', 'that', 'these', 'those', 'want', 'need',
  'make', 'create', 'build', 'design', 'site', 'website', 'page', 'web', 'app',
  'called', 'named', 'name',
  'موقع', 'صفحة', 'صفحه', 'ابني', 'اعمل', 'انشئ', 'صمم', 'عايز', 'محتاج', 'عاوز',
  'اسمه', 'اسمها', 'باسم', 'في', 'من', 'الى', 'على', 'ال', 'هو', 'هي', 'مع',
])

export function extractProjectType(text) {
  const norm = normalize(text)
  for (const [type, hints] of Object.entries(PROJECT_TYPE_HINTS)) {
    for (const h of hints) {
      // Normalize the hint too so ة/ه and other variants both match
      const hNorm = normalize(h)
      if (new RegExp(hNorm, 'i').test(norm)) return type
    }
  }
  return ''
}

export function extractColor(text) {
  for (const [hex, regex] of Object.entries(COLOR_MAP)) {
    if (regex.test(text)) return hex
  }
  const hexMatch = text.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)
  return hexMatch ? hexMatch[0] : ''
}

export function extractProjectName(text) {
  // Try high-confidence "name is X" patterns first
  const patterns = [
    /(?:called|named|titled|under\s+the\s+name)\s+["']?([\w؀-ۿ][\w؀-ۿ\s-]{1,28})["']?/i,
    /(?:اسمها|اسمه|اسمي|اسم|باسم|بإسم)\s+["']?([\w؀-ۿ][\w؀-ۿ\s-]{1,28})["']?/i,
    /(?:for|عشان)\s+(?:my\s+|the\s+)?(?:company|brand|project|business|store)\s+["']?([\w؀-ۿ][\w؀-ۿ\s-]{1,28})["']?/i,
    /\bل?شرك[هة]\s+(?:اسمها\s+|باسم\s+)?["']?([\w؀-ۿ][\w؀-ۿ\s-]{1,28})["']?/i,
    /["']([\w؀-ۿ][\w؀-ۿ\s-]{1,28})["']/,
    /\*\*([\w؀-ۿ][\w؀-ۿ\s-]{1,28})\*\*/,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const candidate = m[1].trim()
      const words = candidate.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()))
      if (words.length > 0 && words.length <= 4) {
        return words.slice(0, 3).join(' ')
      }
    }
  }

  // Fallback 1: any standalone Latin word that looks like a brand
  // (3-20 chars, no common English/Arabic words, allows lowercase brands like "vixcell")
  const latinWordRe = /\b([a-zA-Z][a-zA-Z0-9]{2,19})\b/g
  let m
  while ((m = latinWordRe.exec(text)) !== null) {
    const word = m[1]
    if (STOP_WORDS.has(word.toLowerCase())) continue
    if (TECH_WORDS.has(word.toLowerCase())) continue
    return word
  }

  return ''
}

// Common tech terms that should never be treated as project names
const TECH_WORDS = new Set([
  'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'react', 'vue', 'node', 'nodejs',
  'python', 'php', 'java', 'sql', 'api', 'rest', 'json', 'http', 'https',
  'landing', 'page', 'site', 'website', 'webpage', 'app', 'web', 'mobile',
  'frontend', 'backend', 'fullstack', 'database', 'auth', 'jwt',
  'tailwind', 'bootstrap', 'sass', 'scss', 'webpack', 'vite', 'nextjs',
  'company', 'business', 'brand', 'project', 'store', 'shop',
])

export function extractAll(text) {
  return {
    name: extractProjectName(text),
    type: extractProjectType(text),
    color: extractColor(text),
  }
}

// ─── Code Block Extraction ─────────────────────────────────────────
export function extractCode(text) {
  // Triple backtick code
  const fenced = text.match(/```(\w*)\n?([\s\S]*?)```/)
  if (fenced) return { lang: fenced[1] || '', code: fenced[2].trim() }

  // Inline code or raw code (heuristic: lots of {, }, ;, =>)
  if (/[\{\}\;\=\>\<]{3,}|function\s+\w+|class\s+\w+|def\s+\w+|=>/i.test(text)) {
    return { lang: '', code: text.trim() }
  }
  return null
}
