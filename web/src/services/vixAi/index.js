// ─── VIXCELL AI — Main Entry Point ──────────────────────────────────
// Modular, fully-local AI system built from scratch.
// No external API calls. Pure pattern matching + knowledge base
// + code generation + analysis.

export { respond, reset } from './responder.js'
export { BRAND } from './personality.js'
export { classify, extractAll, INTENT } from './intents.js'
export { inspectSession } from './memory.js'
