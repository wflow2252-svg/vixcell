// ─── VIXCELL AI — Code Analyzer ─────────────────────────────────────
// Deep code analysis: language detection, complexity metrics,
// bug patterns, security checks, refactor suggestions.

// ─── Language Detection ────────────────────────────────────────────
export function detectLanguage(code) {
  const clean = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""')

  if (/<html|<body|<head|<!DOCTYPE/i.test(code)) return 'HTML'
  if (/^\s*</.test(code) && /<\/\w+>/.test(code)) return 'XML/HTML'

  // Python signatures
  if (/^\s*(def\s+\w+|class\s+\w+.*:|import\s+\w+|from\s+\w+\s+import)/m.test(clean)) {
    if (/django/i.test(code)) return 'Python (Django)'
    if (/flask/i.test(code)) return 'Python (Flask)'
    if (/fastapi/i.test(code)) return 'Python (FastAPI)'
    if (/pandas|numpy|matplotlib/i.test(code)) return 'Python (Data)'
    return 'Python'
  }

  // React / JSX
  if (/import\s+React|from\s+['"]react['"]/.test(code) ||
      /\b(useState|useEffect|useContext|useReducer|useMemo|useCallback|useRef)\b/.test(code)) {
    if (/:\s*\w+(\[\])?[\s,=)]/.test(code) || /interface\s+\w+|type\s+\w+\s*=/.test(code)) {
      return 'TypeScript React (TSX)'
    }
    return 'React (JSX)'
  }

  // Vue
  if (/createApp|<script setup>|defineComponent|ref\(|reactive\(/.test(code)) return 'Vue.js'

  // TypeScript
  if (/interface\s+\w+\s*\{|type\s+\w+\s*=|:\s*(string|number|boolean|any|unknown|void)\b/.test(code)) {
    return 'TypeScript'
  }

  // JavaScript family
  if (/\b(function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|=>|class\s+\w+)\b/.test(clean)) {
    if (/require\(|module\.exports|process\.env/.test(code)) return 'Node.js'
    return 'JavaScript'
  }

  // Java / C# / Kotlin
  if (/public\s+class|private\s+class|protected\s+class/.test(code)) {
    if (/package\s+[\w.]+;/.test(code)) return 'Java'
    if (/using\s+System;|namespace\s+\w+/.test(code)) return 'C#'
    if (/fun\s+\w+\s*\(/.test(code)) return 'Kotlin'
  }

  // Rust
  if (/fn\s+\w+\s*\(|impl\s+\w+|let\s+(mut\s+)?\w+\s*:/.test(code)) return 'Rust'

  // Go
  if (/^package\s+\w+|func\s+\w+\s*\(/m.test(clean)) return 'Go'

  // PHP
  if (/<\?php|->\w+\(/.test(code)) return 'PHP'

  // C/C++
  if (/#include\s*[<"]/.test(code)) {
    if (/class\s+\w+|std::|template\s*</.test(code)) return 'C++'
    return 'C'
  }

  // SQL
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s+/i.test(code)) return 'SQL'

  // CSS
  if (/[\w-]+\s*:\s*[\w#%(),.-\s]+;/.test(code) && /\{|\}/.test(code)) return 'CSS'

  return 'Unknown'
}

// ─── Metrics ───────────────────────────────────────────────────────
export function computeMetrics(code) {
  const lines = code.split('\n')
  const realLines = lines.filter(l => l.trim()).length
  const blank = lines.length - realLines

  const commentLines = (code.match(/^\s*(\/\/|#|--|\/\*|\*)/gm) || []).length
  const commentRatio = realLines > 0 ? commentLines / realLines : 0

  // Cyclomatic complexity (simplified McCabe)
  const decisionTokens = (code.match(/\b(if|else\s+if|case|for|while|catch|&&|\|\||\?\s*\w)\b/g) || []).length
  const complexity = decisionTokens + 1

  // Function count
  const funcCount = (code.match(/\b(function\s+\w+|def\s+\w+|fn\s+\w+|func\s+\w+|=>\s*\{|=>\s*\()|class\s+\w+/g) || []).length

  // Longest function (rough heuristic — counts lines between function/{ ... }/}/end)
  const longestFn = estimateLongestFunction(code)

  // Nesting depth
  const maxNesting = estimateMaxNesting(code)

  return {
    totalLines: lines.length,
    realLines,
    blank,
    commentLines,
    commentRatio: Number(commentRatio.toFixed(2)),
    complexity,
    functionCount: funcCount,
    longestFunction: longestFn,
    maxNesting,
  }
}

function estimateLongestFunction(code) {
  const lines = code.split('\n')
  let max = 0
  let inFn = false
  let depth = 0
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inFn && /\b(function|def\s+\w+|=>)\b/.test(line) && /\{|:\s*$/.test(line)) {
      inFn = true
      start = i
      depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      continue
    }
    if (inFn) {
      depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      if (depth <= 0) {
        max = Math.max(max, i - start)
        inFn = false
      }
    }
  }
  return max
}

function estimateMaxNesting(code) {
  let depth = 0
  let max = 0
  for (const ch of code) {
    if (ch === '{') {
      depth++
      max = Math.max(max, depth)
    } else if (ch === '}') {
      depth--
    }
  }
  return max
}

// ─── Issue Detectors ────────────────────────────────────────────────
const ISSUES = [
  // — JS/TS issues —
  {
    id: 'var-keyword',
    pattern: /\bvar\s+\w+\s*=/,
    severity: 'warning',
    en: 'Uses `var` — prefer `let` (mutable) or `const` (immutable). `var` is function-scoped and hoists, often causing bugs.',
    ar: 'استخدام `var` — استبدله بـ `let` (متغير) أو `const` (ثابت). `var` بيعمل مشاكل بسبب الـ hoisting والـ function scoping.',
  },
  {
    id: 'console-log',
    pattern: /console\.(log|debug|warn|info)\(/,
    severity: 'info',
    en: 'Contains `console.log` — remove before deploying to production. Consider using a real logger (winston, pino).',
    ar: 'فيه `console.log` — احذفه قبل النشر للإنتاج. استخدم logger حقيقي زي winston أو pino.',
  },
  {
    id: 'no-error-handling',
    pattern: /(await\s+fetch|\.then\()/,
    detect: code => /await\s+fetch|\.then\(/.test(code) && !/try\s*\{|\.catch\(/.test(code),
    severity: 'warning',
    en: 'Async operations without error handling. Wrap in `try/catch` or add `.catch()`.',
    ar: 'عمليات async بدون معالجة أخطاء. لفها في `try/catch` أو ضيف `.catch()`.',
  },
  {
    id: 'string-concat',
    pattern: /['"][^'"]*['"]\s*\+\s*\w+/,
    severity: 'info',
    en: 'String concatenation with `+` — use template literals `` `Hello ${name}` `` for readability.',
    ar: 'دمج strings بـ `+` — استخدم template literals `` `Hello ${name}` `` للقراءة الأحسن.',
  },
  {
    id: 'eval-usage',
    pattern: /\beval\s*\(/,
    severity: 'critical',
    en: '**SECURITY**: `eval()` executes arbitrary code — never use with user input. Use `JSON.parse`, `Function()`, or refactor entirely.',
    ar: '**أمان**: `eval()` بينفذ كود عشوائي — ماتستخدمهوش مع input من المستخدم نهائياً. استخدم `JSON.parse` أو ريفاكتور.',
  },
  {
    id: 'innerhtml-usage',
    pattern: /\.innerHTML\s*=\s*[^'"`]*\$\{|\.innerHTML\s*=\s*\w+/,
    severity: 'critical',
    en: '**XSS RISK**: Setting `innerHTML` with variable content. Use `textContent` for text, or sanitize with DOMPurify.',
    ar: '**خطر XSS**: تعيين `innerHTML` بمحتوى متغير. استخدم `textContent` للنصوص، أو نظف بـ DOMPurify.',
  },
  {
    id: 'sql-injection',
    pattern: /\bquery\s*\(\s*['"`][^'"`]*\$\{|query\s*\(\s*['"`][^'"`]*\+/,
    severity: 'critical',
    en: '**SQL INJECTION RISK**: Interpolating variables into SQL strings. Use parameterized queries (?, $1) always.',
    ar: '**خطر حقن SQL**: إدراج متغيرات في SQL strings. استخدم parameterized queries (?, $1) دايماً.',
  },
  {
    id: 'http-not-https',
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)[\w.-]+/,
    severity: 'warning',
    en: 'HTTP URL detected (not HTTPS). Production should always use HTTPS.',
    ar: 'تم اكتشاف URL بـ HTTP (مش HTTPS). الإنتاج لازم يستخدم HTTPS دايماً.',
  },
  {
    id: 'hardcoded-secret',
    pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{16,}/i,
    severity: 'critical',
    en: '**LEAKED SECRET**: Hardcoded credentials detected. Move to environment variables (`.env`) immediately. Rotate this secret!',
    ar: '**سر مسرّب**: اكتشفت credentials في الكود. انقلها لـ environment variables (`.env`) فوراً. غير السر ده!',
  },

  // — React issues —
  {
    id: 'useeffect-no-deps',
    pattern: /useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\}\s*\)\s*$/m,
    detect: code => /useEffect\([^)]+\)(?!.*\[)/m.test(code) && code.includes('useState'),
    severity: 'warning',
    en: '`useEffect` without dependency array — runs after every render. Add `[]` for mount-only, or list real dependencies.',
    ar: '`useEffect` بدون dependency array — بتشتغل بعد كل render. ضيف `[]` للـ mount مرة واحدة، أو حدد الـ dependencies.',
  },
  {
    id: 'array-index-key',
    pattern: /key\s*=\s*\{\s*(i|idx|index)\s*\}/,
    severity: 'warning',
    en: 'Using array index as React key — causes bugs when items reorder. Use a stable unique ID.',
    ar: 'استخدام array index كـ key في React — بيسبب bugs لما تترتب العناصر. استخدم ID فريد ثابت.',
  },

  // — General quality —
  {
    id: 'magic-numbers',
    pattern: /[^.\w][2-9]\d{2,}[^.\w]/,
    severity: 'info',
    en: 'Magic numbers found. Extract to named constants (e.g., `const MAX_ITEMS = 100`).',
    ar: 'فيه أرقام سحرية. استخرجها لـ constants (مثال: `const MAX_ITEMS = 100`).',
  },
  {
    id: 'todo-comment',
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)\b/i,
    severity: 'info',
    en: 'TODO/FIXME comments present — track these in your issue tracker, not in code.',
    ar: 'فيه TODO/FIXME comments — تابعها في issue tracker، مش في الكود.',
  },
]

export function findIssues(code) {
  const found = []
  for (const issue of ISSUES) {
    const matches = issue.detect ? issue.detect(code) : issue.pattern.test(code)
    if (matches) {
      found.push({
        id: issue.id,
        severity: issue.severity,
        en: issue.en,
        ar: issue.ar,
      })
    }
  }
  return found
}

// ─── Positive Findings ─────────────────────────────────────────────
export function findStrengths(code, metrics) {
  const strengths = []
  if (metrics.commentRatio > 0.15 && metrics.commentRatio < 0.4) {
    strengths.push({ en: 'Healthy comment density', ar: 'كثافة comments جيدة' })
  }
  if (/try\s*\{/.test(code) && /catch\s*\(/.test(code)) {
    strengths.push({ en: 'Error handling with try/catch', ar: 'معالجة أخطاء بـ try/catch' })
  }
  if (/\bconst\s+\w+/.test(code) && !/\bvar\s+\w+/.test(code)) {
    strengths.push({ en: 'Uses modern const/let (no var)', ar: 'يستخدم const/let الحديث (مفيش var)' })
  }
  if (/\`[^`]*\$\{/.test(code)) {
    strengths.push({ en: 'Uses template literals', ar: 'يستخدم template literals' })
  }
  if (metrics.complexity < 10 && metrics.functionCount > 0) {
    strengths.push({ en: 'Low cyclomatic complexity', ar: 'تعقيد منخفض' })
  }
  if (metrics.maxNesting <= 3) {
    strengths.push({ en: 'Shallow nesting — easy to read', ar: 'تداخل سطحي — سهل القراءة' })
  }
  return strengths
}

// ─── Main Report Builder ───────────────────────────────────────────
export function buildReport(code, lang = 'en') {
  const language = detectLanguage(code)
  const metrics = computeMetrics(code)
  const issues = findIssues(code)
  const strengths = findStrengths(code, metrics)

  const isAr = lang === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const sevIcon = { critical: '🔴', warning: '🟡', info: '🔵' }
  const sevLabel = { critical: t('Critical', 'حرج'), warning: t('Warning', 'تحذير'), info: t('Info', 'ملاحظة') }

  // Complexity rating
  let complexityRating
  if (metrics.complexity < 10) complexityRating = `✅ ${t('Simple', 'بسيط')} (1-10)`
  else if (metrics.complexity < 20) complexityRating = `🟡 ${t('Moderate', 'متوسط')} (11-20)`
  else if (metrics.complexity < 40) complexityRating = `🟠 ${t('Complex', 'معقد')} (21-40)`
  else complexityRating = `🔴 ${t('Highly Complex', 'معقد جداً')} (40+)`

  let report = `📊 **${t('Code Analysis Report', 'تقرير تحليل الكود')}** — ${language}\n\n`

  report += `### 📐 ${t('Metrics', 'القياسات')}\n`
  report += `• ${t('Lines', 'الأسطر')}: **${metrics.realLines}** ${t('code', 'كود')} / ${metrics.totalLines} ${t('total', 'إجمالي')}\n`
  report += `• ${t('Comments', 'تعليقات')}: ${metrics.commentLines} (${Math.round(metrics.commentRatio * 100)}%)\n`
  report += `• ${t('Functions', 'دوال')}: ${metrics.functionCount}\n`
  report += `• ${t('Longest function', 'أطول دالة')}: ${metrics.longestFunction} ${t('lines', 'سطر')}\n`
  report += `• ${t('Max nesting depth', 'أقصى تداخل')}: ${metrics.maxNesting}\n`
  report += `• ${t('Cyclomatic complexity', 'التعقيد')}: ${metrics.complexity} — ${complexityRating}\n\n`

  if (issues.length > 0) {
    report += `### ⚠️ ${t('Issues Found', 'مشاكل مكتشفة')} (${issues.length})\n`
    const critical = issues.filter(i => i.severity === 'critical')
    const warnings = issues.filter(i => i.severity === 'warning')
    const infos = issues.filter(i => i.severity === 'info')

    for (const issue of [...critical, ...warnings, ...infos]) {
      report += `${sevIcon[issue.severity]} **${sevLabel[issue.severity]}** — ${isAr ? issue.ar : issue.en}\n\n`
    }
  } else {
    report += `### ✅ ${t('No Issues Detected', 'مفيش مشاكل مكتشفة')}\n${t('Code looks clean!', 'الكود يبدو نظيف!')}\n\n`
  }

  if (strengths.length > 0) {
    report += `### ✨ ${t('Strengths', 'نقاط قوة')}\n`
    for (const s of strengths) {
      report += `✓ ${isAr ? s.ar : s.en}\n`
    }
    report += '\n'
  }

  // Recommendations
  const recs = buildRecommendations(metrics, issues, language, isAr)
  if (recs.length > 0) {
    report += `### 💡 ${t('Recommendations', 'توصيات')}\n`
    for (const r of recs) report += `→ ${r}\n`
    report += '\n'
  }

  report += `### 🎯 ${t('Next Steps', 'الخطوات التالية')}\n`
  report += isAr
    ? `قولي أيا من دول وأنا هساعدك:
• "اعمل refactor للكود ده" — هحوله لـ نسخة أنظف
• "صلح المشاكل دي" — هاعدي على كل issue
• "اشرح السطر [رقم]" — هفسر أي جزء صعب
• "اكتب unit tests" — هولّد tests للكود ده`
    : `Say any of these and I'll help:
• "Refactor this code" — I'll produce a cleaner version
• "Fix these issues" — I'll patch each one
• "Explain line [N]" — I'll break down any tricky part
• "Write unit tests" — I'll generate tests for this code`

  return report
}

function buildRecommendations(metrics, issues, language, isAr) {
  const recs = []

  if (metrics.complexity > 20) {
    recs.push(isAr
      ? `قسّم الدوال الكبيرة — التعقيد ${metrics.complexity} عالي، اهدف لأقل من 10 لكل دالة`
      : `Split large functions — complexity ${metrics.complexity} is high, aim for <10 per function`)
  }

  if (metrics.longestFunction > 50) {
    recs.push(isAr
      ? `أطول دالة ${metrics.longestFunction} سطر — قسمها لدوال أصغر`
      : `Longest function is ${metrics.longestFunction} lines — break into smaller ones`)
  }

  if (metrics.maxNesting > 4) {
    recs.push(isAr
      ? `تداخل ${metrics.maxNesting} مستوى عميق — استخدم early returns أو guard clauses`
      : `Nesting depth ${metrics.maxNesting} is deep — use early returns or guard clauses`)
  }

  if (metrics.commentRatio < 0.05 && metrics.realLines > 50) {
    recs.push(isAr
      ? `قليل التعليقات — وثق المنطق المعقد على الأقل`
      : `Sparse comments — document complex logic at minimum`)
  } else if (metrics.commentRatio > 0.4) {
    recs.push(isAr
      ? `تعليقات كتير قوي — الكود الواضح بيوثق نفسه`
      : `Over-commented — clean code documents itself`)
  }

  if (issues.some(i => i.severity === 'critical')) {
    recs.push(isAr
      ? `**أصلح المشاكل الحرجة فوراً** — مخاطر أمان أو بيانات`
      : `**Fix critical issues immediately** — security or data risks`)
  }

  if (language.includes('React') && !/useCallback|useMemo|memo\(/.test(metrics)) {
    // could add perf advice
  }

  return recs
}

// ─── Quick One-line Issues for inline display ──────────────────────
export function quickAnalyze(code, lang = 'en') {
  const language = detectLanguage(code)
  const metrics = computeMetrics(code)
  const issues = findIssues(code)
  const isAr = lang === 'ar'

  if (issues.length === 0) {
    return isAr
      ? `✅ ${language} — ${metrics.realLines} سطر، complexity ${metrics.complexity}. الكود نظيف!`
      : `✅ ${language} — ${metrics.realLines} lines, complexity ${metrics.complexity}. Looks clean!`
  }

  const critical = issues.filter(i => i.severity === 'critical').length
  const warnings = issues.filter(i => i.severity === 'warning').length

  return isAr
    ? `📊 ${language}: ${critical} حرج، ${warnings} تحذير، complexity ${metrics.complexity}`
    : `📊 ${language}: ${critical} critical, ${warnings} warnings, complexity ${metrics.complexity}`
}
