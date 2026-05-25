// ─── VIXCELL AI — Main Entry Point ──────────────────────────────────
// Modular, fully-local AI system. No external API calls.

import { respond, reset } from './responder.js'

export { respond, reset }
export { BRAND } from './personality.js'
export { classify, extractAll, INTENT } from './intents.js'
export { inspectSession } from './memory.js'

// Aliases matching the v1 client API (used by Builder.tsx)
export const getAIResponse = (sessionId, message) => respond(sessionId, message)
export const resetSession  = (sessionId) => reset(sessionId)
