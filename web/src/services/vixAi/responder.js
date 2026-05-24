// ─── VIXCELL AI — Response Orchestrator ─────────────────────────────
// The brain that combines intent classification, knowledge lookup,
// code generation, analysis, and personality into a single response.

import { INTENT, classify, extractAll, extractCode } from './intents.js'
import {
  getSession,
  addTurn,
  updateContext,
  setStage,
  setGeneratedFiles,
  resetSession,
  detectLanguage,
  hasRecentIntent,
} from './memory.js'
import {
  greeting,
  identity,
  capabilities,
  farewell,
  thanksResponse,
  smallTalk,
  affirmAck,
  denyAck,
  unknown,
  codeIntro,
  analysisIntro,
  buildProgress,
  needMoreInfo,
} from './personality.js'
import {
  findConcept,
  findComparison,
  findRecommendation,
  getBestPractices,
} from './knowledge.js'
import { SiteBuilder } from './siteBuilder.js'
import { generateCode, formatCodeResponse, SNIPPETS } from './codeGen.js'
import { buildReport } from './analyzer.js'

// ─── Main Entry Point ──────────────────────────────────────────────
export function respond(sessionId, message) {
  const session = getSession(sessionId)
  const ctx = session.context

  // Detect language and remember it
  const lang = detectLanguage(message) || ctx.userLanguage || 'en'
  if (lang) updateContext(sessionId, { userLanguage: lang })

  // Logo upload (special signal)
  if (message.includes('[LOGO_UPLOADED]')) {
    return handleLogoUpload(sessionId, lang)
  }

  // Code block in message? Always treat as analyze/explain first
  const codeBlock = extractCode(message)
  if (codeBlock && codeBlock.code.length > 20) {
    addTurn(sessionId, 'user', message, INTENT.ANALYZE_CODE)
    const report = buildReport(codeBlock.code, lang)
    const intro = analysisIntro(lang)
    const text = `${intro}\n\n${report}`
    addTurn(sessionId, 'assistant', text, INTENT.ANALYZE_CODE)
    return { text, html: null }
  }

  // Classify intent
  const { primary, all, confidence } = classify(message)
  addTurn(sessionId, 'user', message, primary)

  // Update context from message
  const extracted = extractAll(message)
  const patch = {}
  if (extracted.name) patch.projectName = extracted.name
  if (extracted.type) patch.businessType = extracted.type
  if (extracted.color) patch.primary = extracted.color
  if (Object.keys(patch).length) updateContext(sessionId, patch)

  // Route to handler
  const response = route(primary, all, sessionId, message, lang)

  addTurn(sessionId, 'assistant', response.text || '', primary)
  return response
}

// ─── Intent Router ─────────────────────────────────────────────────
function route(primary, all, sessionId, message, lang) {
  const session = getSession(sessionId)
  const ctx = session.context

  // — Conversational —
  if (primary === INTENT.GREETING) {
    setStage(sessionId, 'collecting')
    return { text: greeting(lang, ctx.userName), html: null }
  }
  if (primary === INTENT.FAREWELL) return { text: farewell(lang), html: null }
  if (primary === INTENT.THANKS) return { text: thanksResponse(lang), html: null }
  if (primary === INTENT.IDENTITY) return { text: identity(lang), html: null }
  if (primary === INTENT.CAPABILITY || primary === INTENT.HELP) {
    return { text: capabilities(lang), html: null }
  }
  if (primary === INTENT.SMALL_TALK) return { text: smallTalk(lang), html: null }
  if (primary === INTENT.AFFIRM) return { text: affirmAck(lang), html: null }
  if (primary === INTENT.DENY) return { text: denyAck(lang), html: null }
  if (primary === INTENT.RESET) {
    resetSession(sessionId)
    return {
      text: lang === 'ar'
        ? `✨ تم مسح الجلسة. ابدأ من جديد!`
        : `✨ Session cleared. Fresh start!`,
      html: null,
    }
  }

  // — Site Building Family —
  const buildIntents = [
    INTENT.BUILD_SITE, INTENT.BUILD_ECOMMERCE, INTENT.BUILD_RESTAURANT,
    INTENT.BUILD_BLOG, INTENT.BUILD_PORTFOLIO, INTENT.BUILD_LANDING,
    INTENT.BUILD_DASHBOARD, INTENT.BUILD_APP,
  ]
  if (buildIntents.includes(primary)) {
    // Infer business type from sub-intent
    const typeMap = {
      [INTENT.BUILD_ECOMMERCE]: 'ecommerce',
      [INTENT.BUILD_RESTAURANT]: 'restaurant',
      [INTENT.BUILD_BLOG]: 'blog',
      [INTENT.BUILD_PORTFOLIO]: 'portfolio',
      [INTENT.BUILD_LANDING]: 'landing',
      [INTENT.BUILD_DASHBOARD]: 'dashboard',
    }
    if (typeMap[primary] && !ctx.businessType) {
      updateContext(sessionId, { businessType: typeMap[primary] })
    }
    return buildSite(sessionId, lang)
  }

  // — Site Modifications —
  if (primary === INTENT.MODIFY_COLOR && session.generatedFiles) {
    return modifyColor(sessionId, lang)
  }
  if ((primary === INTENT.ADD_SECTION || primary === INTENT.REMOVE_SECTION || primary === INTENT.MODIFY_CONTENT) && session.generatedFiles) {
    return { text: modifyNoticeMsg(lang), html: null }
  }

  // — Code Generation —
  const codeMap = {
    [INTENT.WRITE_REACT]: 'react',
    [INTENT.WRITE_COMPONENT]: 'react',
    [INTENT.WRITE_NODE]: 'node',
    [INTENT.WRITE_PYTHON]: 'python',
    [INTENT.WRITE_API]: 'api',
    [INTENT.WRITE_AUTH]: 'auth',
    [INTENT.WRITE_FORM]: 'form',
    [INTENT.WRITE_ALGORITHM]: 'algorithm',
    [INTENT.WRITE_DATABASE]: 'database',
  }
  if (codeMap[primary]) {
    return generateCodeResponse(codeMap[primary], message, lang)
  }

  // — Code Analysis (when explicitly asked but no code block was found) —
  if ([INTENT.ANALYZE_CODE, INTENT.DEBUG_CODE, INTENT.REFACTOR_CODE, INTENT.OPTIMIZE_CODE, INTENT.EXPLAIN_CODE].includes(primary)) {
    return askForCode(lang)
  }

  // — Knowledge / Learning —
  if (primary === INTENT.COMPARE) {
    const comp = findComparison(message)
    if (comp) return { text: lang === 'ar' ? comp.ar : comp.en, html: null }
    return { text: askMoreSpecific('compare', lang), html: null }
  }
  if (primary === INTENT.RECOMMEND) {
    const rec = findRecommendation(message)
    if (rec) return { text: lang === 'ar' ? rec.ar : rec.en, html: null }
    return { text: askMoreSpecific('recommend', lang), html: null }
  }
  if (primary === INTENT.EXPLAIN_CONCEPT || primary === INTENT.TUTORIAL) {
    const concept = findConcept(message)
    if (concept) return { text: lang === 'ar' ? concept.ar : concept.en, html: null }
    return tryGeneralKnowledge(message, lang)
  }

  // — Unknown: fall back to general knowledge or unknown response —
  return tryGeneralKnowledge(message, lang)
}

// ─── Handlers ──────────────────────────────────────────────────────
function handleLogoUpload(sessionId, lang) {
  updateContext(sessionId, { logo: true })
  setStage(sessionId, 'building')
  return buildSite(sessionId, lang, /*fromLogo*/ true)
}

function buildSite(sessionId, lang, fromLogo = false) {
  const session = getSession(sessionId)
  const ctx = session.context

  // Ensure we have minimum info
  if (!ctx.projectName) {
    setStage(sessionId, 'collecting')
    return { text: needMoreInfo(true, !ctx.businessType, lang), html: null }
  }
  if (!ctx.businessType) {
    // Default to business if name exists but no type
    updateContext(sessionId, { businessType: 'business' })
  }

  const updatedCtx = getSession(sessionId).context
  const builder = new SiteBuilder(updatedCtx)
  const files = builder.generateAll()
  setGeneratedFiles(sessionId, files)
  const preview = builder.generatePreview()

  const typeDisplay = updatedCtx.businessType.charAt(0).toUpperCase() + updatedCtx.businessType.slice(1)
  const text = fromLogo
    ? (lang === 'ar'
      ? `✅ استلمت اللوجو! بأبني **${updatedCtx.projectName}** الآن... 🚀\n\nشوف الـ Preview tab! 👀`
      : `✅ Logo received! Building **${updatedCtx.projectName}** now... 🚀\n\nCheck the Preview tab! 👀`)
    : buildProgress(updatedCtx.projectName, typeDisplay, lang)

  return { text, html: preview, files }
}

function modifyColor(sessionId, lang) {
  const session = getSession(sessionId)
  const ctx = session.context
  const builder = new SiteBuilder(ctx)
  const files = builder.generateAll()
  setGeneratedFiles(sessionId, files)
  const preview = builder.generatePreview()

  const text = lang === 'ar'
    ? `✅ تم تحديث الألوان! 🎨\n\nالـ accent الجديد: \`${ctx.primary}\`\n\nشوف الـ **Preview** للتغييرات.`
    : `✅ Colors updated! 🎨\n\nNew accent: \`${ctx.primary}\`\n\nCheck the **Preview** to see changes.`

  return { text, html: preview, files }
}

function modifyNoticeMsg(lang) {
  return lang === 'ar'
    ? `📝 تعديلات على الأقسام بتدعمها الآن في حالات محدودة. حالياً بأدعم:\n\n• تغيير اللون: "خلي اللون أزرق"\n• تغيير اسم المشروع: "اسمه TechCorp"\n\nلتعديلات تانية، احكيلي اللي عايزه بتفصيل وأنا هحاول.`
    : `📝 Section edits are supported in limited cases. Right now I handle:\n\n• Color changes: "Make the color blue"\n• Project name: "Call it TechCorp"\n\nFor other edits, describe what you want and I'll try.`
}

function generateCodeResponse(kind, message, lang) {
  const result = generateCode(kind, message)
  if (!result) {
    return {
      text: lang === 'ar'
        ? `محتاج تفاصيل أكتر — أي نوع component/كود تحديداً؟ مثلاً:\n• "اكتب React modal"\n• "اعمل button مع loading state"\n• "اكتبلي JWT auth"`
        : `Need more detail — which component/code specifically? Try:\n• "Write a React modal"\n• "Make a button with loading state"\n• "Write JWT auth"`,
      html: null,
    }
  }

  const formatted = formatCodeResponse(result, lang)
  const intro = codeIntro(lang)
  return { text: `${intro}\n\n${formatted}`, html: null }
}

function askForCode(lang) {
  return {
    text: lang === 'ar'
      ? `📄 الصق الكود اللي عايز أحلله بين ثلاث backticks:\n\n\\\`\\\`\\\`javascript\nyour code here\n\\\`\\\`\\\`\n\nأو ارفع الملف مباشرة وأنا هتولى الباقي.`
      : `📄 Paste the code between triple backticks:\n\n\\\`\\\`\\\`javascript\nyour code here\n\\\`\\\`\\\`\n\nOr upload the file directly and I'll handle it.`,
    html: null,
  }
}

function askMoreSpecific(kind, lang) {
  if (kind === 'compare') {
    return lang === 'ar'
      ? `قارن إيه بإيه تحديداً؟ مثلاً:\n• React vs Vue\n• SQL vs NoSQL\n• REST vs GraphQL\n• var vs let vs const`
      : `Compare what specifically? Try:\n• React vs Vue\n• SQL vs NoSQL\n• REST vs GraphQL\n• var vs let vs const`
  }
  if (kind === 'recommend') {
    return lang === 'ar'
      ? `أنصح في إيه تحديداً؟ مثلاً:\n• "ايه أفضل framework للـ frontend؟"\n• "ايه أفضل قاعدة بيانات لـ SaaS؟"\n• "فين أستضيف موقعي؟"`
      : `Recommend what specifically? Try:\n• "Best framework for frontend?"\n• "Best database for SaaS?"\n• "Where should I host my app?"`
  }
}

// ─── Fall-through: try knowledge match before giving up ────────────
function tryGeneralKnowledge(message, lang) {
  // Try concepts first
  const concept = findConcept(message)
  if (concept) return { text: lang === 'ar' ? concept.ar : concept.en, html: null }

  // Try comparisons
  const comp = findComparison(message)
  if (comp) return { text: lang === 'ar' ? comp.ar : comp.en, html: null }

  // Try recommendations
  const rec = findRecommendation(message)
  if (rec) return { text: lang === 'ar' ? rec.ar : rec.en, html: null }

  // Best practices?
  const lower = message.toLowerCase()
  if (/best\s*practice|practice|انماط|أفضل\s*ممارسات|بيست\s*براكتس/i.test(lower)) {
    let topic = null
    if (/react|رياكت/i.test(lower)) topic = 'react'
    else if (/api|endpoint/i.test(lower)) topic = 'api'
    else if (/security|آمن|أمان|حماية/i.test(lower)) topic = 'security'

    if (topic) {
      const tips = getBestPractices(topic, lang) || []
      const header = lang === 'ar' ? `💡 **أفضل الممارسات في ${topic}:**` : `💡 **${topic} best practices:**`
      return { text: `${header}\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`, html: null }
    }
  }

  // Quick snippet match
  if (/uuid|guid/i.test(lower)) return snippet('uuid', lang)
  if (/fetch.*timeout|timeout.*fetch/i.test(lower)) return snippet('fetch', lang)
  if (/shuffle/i.test(lower)) return snippet('shuffle', lang)
  if (/format\s*date|date\s*format/i.test(lower)) return snippet('formatDate', lang)

  // Truly unknown — friendly fallback
  return { text: unknown(lang), html: null }
}

function snippet(key, lang) {
  const code = SNIPPETS[key]
  if (!code) return { text: unknown(lang), html: null }
  const intro = codeIntro(lang)
  return { text: `${intro}\n\n\`\`\`javascript\n${code}\n\`\`\``, html: null }
}

// ─── Reset Exposed ──────────────────────────────────────────────────
export function reset(sessionId) {
  resetSession(sessionId)
}
