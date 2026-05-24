// ─── VIXCELL AI — Public Client API ─────────────────────────────────
//
// Thin adapter layer over the modular vixAi/ system.
// Preserves the original `getAIResponse(sessionId, message)` signature
// so existing callers (ClientDashboard.jsx) keep working unchanged.
//
// The actual AI brain lives in ./vixAi/ — see:
//   • vixAi/intents.js     — intent classification + NLP
//   • vixAi/memory.js      — session state & conversation history
//   • vixAi/knowledge.js   — technical Q&A and concept explanations
//   • vixAi/personality.js — VIXCELL voice (Arabic + English)
//   • vixAi/siteBuilder.js — full website generation
//   • vixAi/codeGen.js     — React/Node/Python/algorithm templates
//   • vixAi/analyzer.js    — deep code analysis
//   • vixAi/responder.js   — orchestrator
//
// 100% local — no external API calls. Runs entirely in the browser.

import { respond, reset } from './vixAi/index.js'

export function getAIResponse(sessionId, message) {
  return respond(sessionId, message)
}

export function resetSession(sessionId) {
  reset(sessionId)
}
