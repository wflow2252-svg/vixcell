# Vixcell Core OS — System Architecture & Build Plan

> Design deliverable produced **before code**, per the Master Build Specification.
> Author: AI build session. Status: awaiting one foundational decision (see §10).

---

## 0. Executive Summary

The spec describes **Vixcell Core OS** — an AI-driven operating system for an
agency, unifying 10 modules under one **AI Core**: Dashboard (3D Orb), Leads,
Deals, Projects, Meetings, WhatsApp AI, Automation, Analytics, Training Center,
Settings — plus a Dynamic-Island "AI Notch".

**~55% of this already exists and ships** in the current `vixcell-os` desktop app
(Electron + React/Vite + FastAPI + SQLite + Ollama/Whisper/edge-TTS). The spec's
literal stack (Node.js + Next.js + Postgres + Redis + LiveKit) is **different**
from what is built and working.

**Recommendation: EVOLVE the working stack, don't rewrite it.** Rationale in §2.
This document gives the full target architecture, gap analysis, schema, API map,
folder layout, the AI-Core design, and a phased roadmap so we build module-by-
module without throwing away weeks of working, packaged software.

---

## 1. Spec → Current System: Gap Analysis

| Spec module / capability | Status today | Action |
|---|---|---|
| Electron desktop shell | ✅ Built (`frontend/electron`) | Keep |
| AI Notch (Dynamic Island, hotkey, wake word) | ✅ Built (`AssistantBar`, clap wake, Ctrl+Shift+Space) | Keep, polish |
| Local AI (Ollama + Whisper + TTS) | ✅ Built (`ai_engine`, `voice_engine`, `tts_engine`) | Keep, extend |
| Voice command → intent → action | ✅ Built (`voice_engine.parse_intent` + LLM fallback) | **Promote to AI Core** |
| Leads | ✅ Built (`leads` API + page) | Keep |
| Lead **Discovery** | 🟡 Partial — OpenStreetMap only | Extend to social/web + scoring |
| Deals / CRM | 🟡 Built but manual (`crm`, `Deal` model w/ probability) | Add **Deal Intelligence** (AI auto-create + scoring) |
| Projects | ❌ Missing (only website-bridge tasks) | **Build native module** |
| Tasks (auto from chats/meetings) | 🟡 Read-only via website bridge | **Build native + AI generation** |
| WhatsApp Intelligence | ❌ Missing | **Build (Phase 1)** |
| Meetings | 🟡 Via vixcell.com (Supabase WebRTC) | Keep web room; add summaries/action-items pipeline |
| Automation agent layer | 🟡 `system_control` (apps/web/files) + `Workflow` model | Extend to Playwright/MCP agents |
| Analytics | 🟡 Page stub | Wire real metrics |
| Training Center (RAG, datasets) | 🟡 `KnowledgeBase`/`DocumentChunk`/`VoiceLog` seeds | Build RAG + dataset export |
| Dashboard 3D Orb | ❌ Simple dashboard | Build Three.js Orb |
| Memory about the user | ✅ Built (`AssistantMemory`) | Keep |
| Interaction logging for fine-tuning | 🟡 `VoiceLog` only | Generalize to `InteractionLog` |

**Net:** foundation, shell, local-AI, voice, notch, leads, CRM data model — done.
Missing the **intelligence + automation + WhatsApp + projects** layers and the
**AI Core orchestrator** that ties them together.

---

## 2. The Stack Decision (the one that gates everything)

The spec lists **Node.js/TypeScript/Socket.IO/Postgres/Redis** (backend) and
**Next.js** (frontend) and **LiveKit** (meetings). The current system is
**Python/FastAPI/SQLite** + **React/Vite** + **Supabase-WebRTC**.

### Recommended: Evolve (Option A)
Keep FastAPI + React/Vite + SQLite; add the missing modules as new
routers/services/models. Adopt spec *capabilities*, not its literal stack.

- **Why:** preserves a working, **packaged-to-EXE** product the user relies on
  daily (voice pipeline, notch, leads, system control, meetings, memory). A
  rewrite delivers *zero* working software for weeks and re-introduces solved
  bugs. Python is also the right language for the AI layer (Whisper, Ollama,
  embeddings, RAG, Playwright).
- **Where we adopt spec ideas anyway:**
  - **Realtime** → FastAPI WebSockets (the AI-Core stream) instead of Socket.IO.
  - **Queue/Redis** → start with an in-process background task queue + APScheduler;
    add Redis/RQ only if/when multi-process scale demands it.
  - **Postgres** → SQLite now (single-user desktop); ship with a clean SQLAlchemy
    layer so a Postgres switch is a connection-string change, not a rewrite.
  - **Next.js** → stay on React/Vite (SSR is irrelevant for a `file://` Electron
    app); keep Tailwind, add Framer Motion + Three.js for the Orb/animations.
  - **LiveKit** → keep the working Supabase-WebRTC room; revisit LiveKit only if
    we need >5 participants or server recording.

### Alternative: Literal Rewrite (Option B)
Rebuild backend in Node and frontend in Next.js per the spec's words. Honest cost:
discard ~55% working code, multi-week rebuild, no user value until late. Only
worth it if there's a hard external reason to standardize on Node/Next.

→ **Decision required in §10.** Everything below assumes Option A.

---

## 3. Target Architecture (Option A)

```
┌──────────────────────────────────────────────────────────────────┐
│  ELECTRON SHELL  (main.js)                                        │
│  • Main window (React app)   • AI Notch window (#/bar)            │
│  • Meeting window            • Tray + autostart + global hotkey   │
│  • System bridge (open apps/files), clipboard, meeting perms      │
└───────────────┬──────────────────────────────────────────────────┘
                │ IPC + HTTP(127.0.0.1) + WS
┌───────────────▼──────────────────────────────────────────────────┐
│  FRONTEND  React/Vite + Tailwind + Framer Motion + Three.js       │
│  Pages: Dashboard(Orb) Leads Deals Projects Meetings WhatsApp     │
│         Automation Analytics Training Settings                    │
│  Shared: useVoiceAssistant, useAICore (WS), useClapListener       │
└───────────────┬──────────────────────────────────────────────────┘
                │ REST /api/v1/* + WS /api/v1/ai-core/stream
┌───────────────▼──────────────────────────────────────────────────┐
│  FASTAPI BACKEND                                                  │
│                                                                  │
│   ┌────────────────────  AI CORE  ─────────────────────────┐     │
│   │ orchestrator: command → classify → route → execute      │     │
│   │ → stream state (listening/thinking/executing/learning)  │     │
│   │ → log to InteractionLog                                 │     │
│   │ skills registry  •  agent runner  •  RAG context        │     │
│   └─────┬───────┬───────┬───────┬───────┬───────┬──────────┘     │
│         │       │       │       │       │       │                │
│   ┌─────▼─┐ ┌───▼──┐ ┌──▼───┐ ┌─▼────┐ ┌▼─────┐ ┌▼────────┐       │
│   │WhatsAp│ │Deals │ │Projs │ │Meet  │ │LeadDi│ │Automation│      │
│   │ Intel │ │Intel │ │Tasks │ │Intel │ │scover│ │ Agents   │      │
│   └───┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘      │
│       └────────┴────────┴───┬────┴────────┴──────────┘            │
│   ┌────────────────────────▼───────────────────────────┐         │
│   │ LOCAL AI:  ai_engine(Ollama)  voice_engine(Whisper) │         │
│   │            tts_engine  embeddings  RAG(DocumentChunk)│        │
│   └─────────────────────────┬───────────────────────────┘        │
│   ┌─────────────────────────▼───────────────────────────┐        │
│   │ DATA: SQLAlchemy → SQLite (Postgres-ready)           │        │
│   └──────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
        external: WhatsApp Cloud API · Meta Graph · OSM · vixcell.com
```

**AI Core** is the new centerpiece — a single orchestration service every command
flows through, replacing the ad-hoc `parse_intent` branch in `voice_engine`.

---

## 4. Database Schema

### Existing (keep): `tenants, users, refresh_tokens, audit_logs, leads, deals,
crm_activities, social_accounts, scheduled_posts, knowledge_bases,
document_chunks, workflows, voice_logs, integration_configs, assistant_memories`

### New tables

**WhatsApp Intelligence**
```
wa_contacts(id, tenant_id, wa_id/phone, name, profile_pic, lead_id→leads,
            last_active, created_at)
wa_conversations(id, tenant_id, contact_id→wa_contacts, status,
                 interest_score:int, response_quality:int,
                 closing_probability:int, last_analyzed_at, created_at)
wa_messages(id, tenant_id, conversation_id→wa_conversations, direction:in/out,
            body:text, media_url, wa_message_id, status, sent_by:user/ai,
            timestamp)
conversation_insights(id, conversation_id, summary, objections:json,
            recommended_followup:text, suggested_reply:text, model, created_at)
```

**Projects & Tasks (native)**
```
projects(id, tenant_id, deal_id→deals, lead_id→leads, name, status,
         description, created_at, updated_at)
project_assets(id, project_id→projects, kind:file/note/link/meeting, title,
               url/path, body:text, created_at)
tasks(id, tenant_id, project_id→projects?, deal_id?, title, description,
      status:todo/doing/review/done, priority, due_date, source:manual/ai_chat/
      ai_meeting, source_ref, assignee_id→users, created_at, updated_at)
```

**Meetings Intelligence** (room stays on vixcell.com; this is the AI pipeline)
```
meetings(id, tenant_id, project_id?, room_code, title, started_at, ended_at,
         recording_path, created_at)
meeting_segments(id, meeting_id, speaker, text, t_start, t_end)
meeting_summaries(id, meeting_id, summary, decisions:json, risks:json,
                  pdf_path, model, created_at)
-- action items land directly in `tasks` with source='ai_meeting'
```

**Lead Discovery / Opportunities**
```
opportunities(id, tenant_id, source:facebook/instagram/linkedin/web/osm, name,
              url, phone, signals:json{missing_website,poor_ux,no_booking,
              no_crm,weak_presence}, opportunity_score:int, status:new/contacted/
              converted, lead_id→leads?, created_at)
```

**Automation**
```
agent_runs(id, tenant_id, goal:text, plan:json, steps:json, status:running/
           done/failed, result:text, started_at, finished_at)
-- automation rules reuse the existing `workflows` table (trigger_type already
--   includes 'whatsapp_msg','new_lead','time_cron')
```

**AI Core / Training**
```
interaction_logs(id, tenant_id, channel:voice/text/notch, input:text,
                 intent:text, action:text, params:json, result:text,
                 success:bool, model, latency_ms, created_at)
datasets(id, tenant_id, name, kind:intent/chat/summary, rows:int,
         file_path, exported_at)
```

**Deal extensions** (alter `deals`): `ai_confidence:int`,
`predicted_close_date`, `source_conversation_id→wa_conversations`,
`last_ai_update`.

> All new models follow the existing pattern (UUID PK, `tenant_id` FK with
> CASCADE, tz-aware timestamps) and register in `models/__init__.py` so
> `Base.metadata.create_all` builds them with zero migration step (desktop).

---

## 5. API Map (new routers under `/api/v1`)

```
AI CORE
  POST /ai-core/command          {text|audio, channel} → {intent, action, speech, result}
  GET  /ai-core/state            current orb state
  WS   /ai-core/stream           live state + transcript + execution log

WHATSAPP
  POST /whatsapp/connect         {method: cloud_api|web}        connect account
  GET  /whatsapp/conversations   list w/ scores
  GET  /whatsapp/conversations/{id}/messages
  POST /whatsapp/send            {to|contact|conversation_id, text}  ← the burning need
  POST /whatsapp/conversations/{id}/analyze     → interest/quality/closing
  POST /whatsapp/conversations/{id}/suggest-reply
  POST /whatsapp/webhook         inbound messages (Cloud API)

DEALS (extends existing /crm)
  POST /deals/from-conversation/{conv_id}        AI extracts client/service/value
  POST /deals/{id}/rescore                        AI updates probability
  (existing crm deals CRUD stays)

PROJECTS & TASKS
  CRUD /projects                 + POST /projects/from-deal/{deal_id}
  GET/POST /projects/{id}/assets
  CRUD /tasks                    + POST /tasks/generate {source:chat|meeting, ref}

MEETINGS
  POST /meetings                 register a room
  POST /meetings/{id}/transcribe (Whisper over recording)
  POST /meetings/{id}/summarize  → summary + decisions + risks + action-item tasks
  GET  /meetings/{id}/summary    (+ PDF)

OPPORTUNITIES (lead discovery)
  POST /opportunities/discover   {source, query, location}
  GET  /opportunities            list w/ scores
  POST /opportunities/{id}/to-lead

AUTOMATION
  GET  /automation/runs
  POST /automation/run           {goal}  → agent plans + executes (Playwright/MCP)
  CRUD /automation/rules         (workflows)

TRAINING / ANALYTICS
  GET  /training/interactions
  POST /training/datasets/export {kind}
  POST /training/rag/search      {query} → top-k chunks
  GET  /analytics/overview
```

Existing routers (`auth, tenants, settings, leads, crm, dashboard, ai, voice,
system, website, memory`) stay; `voice` delegates to AI Core.

---

## 6. Folder Structure (additions)

```
backend/app/
  services/
    ai_core.py            ← NEW orchestrator (command→route→stream→log)
    whatsapp_service.py   ← NEW (Cloud API + deep-link send + analysis)
    deal_intel.py         ← NEW (extract/score deals from convos)
    project_service.py    ← NEW
    task_service.py       ← NEW (+ AI task generation)
    meeting_intel.py      ← NEW (transcribe→summarize→action items)
    discovery_service.py  ← extend lead_finder (social/web signals)
    agent_runner.py       ← NEW (Playwright/MCP automation)
    embeddings.py         ← NEW (RAG over DocumentChunk)
    (existing: ai_engine, voice_engine, tts_engine, system_control,
               system_info, website_client, lead_finder)
  api/
    ai_core.py whatsapp.py projects.py tasks.py meetings.py
    opportunities.py automation.py training.py   ← NEW routers
  models/
    whatsapp.py project.py task.py meeting.py opportunity.py
    automation.py core.py                          ← NEW models

frontend/src/
  pages/
    DashboardPage.tsx     ← upgrade: 3D Orb + 3-panel layout
    WhatsAppPage.tsx DealsPage.tsx ProjectsPage.tsx
    AutomationPage.tsx TrainingPage.tsx            ← NEW
  components/
    Orb.tsx               ← NEW (Three.js AI orb, 5 states)
    aicore/StreamPanel.tsx ExecutionLog.tsx        ← NEW
  hooks/
    useAICore.ts          ← NEW (WS stream → orb state + logs)
  store/  (add aiCore slice)
```

---

## 7. AI Core Design (the brain)

A single service all commands pass through:

1. **Ingest** — text (or audio→Whisper) + channel (voice/notch/text).
2. **Classify** — `parse_intent` rules first (instant), LLM fallback (Ollama),
   RAG context injected (user memory + recent interactions + domain data).
3. **Route** — dispatch to a **skill** (navigate, read_stats, find_leads,
   send_whatsapp, create_deal, generate_content, open_app, system_info, …) or an
   **agent** (multi-step goal via `agent_runner`).
4. **Stream** — push states over WS so the Orb/Notch animate:
   `listening → thinking → executing → learning/idle` (+ `error`).
5. **Log** — every command + result to `interaction_logs` (the fine-tuning corpus).

This generalizes today's `voice_engine.parse_intent` + `llm_intent_fallback`
into a registry-driven orchestrator, so new skills are plug-ins.

---

## 8. Implementation Roadmap (phased, each phase ships)

- **Phase 0 — Design** (this document). ✅
- **Phase 1 — AI Core + WhatsApp Intelligence** *(burning need)*
  - `ai_core` orchestrator + `interaction_logs` + WS stream.
  - WhatsApp: connect (Cloud API or Web), **send by voice** ("ابعت لأحمد …"),
    conversation list + analysis (interest/quality/closing) + suggested replies.
- **Phase 2 — Deal & Project Intelligence**
  - Auto-create deals from conversations + probability scoring.
  - Native Tasks + Projects (auto-project when a deal is Won; AI tasks from chats).
- **Phase 3 — Meetings Intelligence**
  - Transcribe recording → summary + decisions + risks → action-item tasks → PDF.
- **Phase 4 — Lead Discovery 2.0** — social/web sources + weakness signals + scoring.
- **Phase 5 — Automation Agents** — Playwright/MCP goal-runner ("افتح كذا واعمل كذا").
- **Phase 6 — Dashboard Orb + Training Center + Analytics** — Three.js Orb,
  RAG search, dataset export, real metrics.

Each phase: backend service+API+models → frontend page/hook → verify (compile +
tests + tsc) → rebuild EXE. Web-side pieces (meeting) deploy to vixcell.com.

---

## 9. Cross-cutting Standards

- **Auth/tenancy:** every new table `tenant_id`-scoped; routers gate on
  `get_current_active_user` (desktop auto-login already in place).
- **Secrets:** integration creds in `integration_configs` (local SQLite only).
- **Safety:** outward actions (WhatsApp send, posting) confirm before firing.
- **Offline-first:** all AI local (Ollama/Whisper/TTS); cloud only for WhatsApp/
  Meta/meeting-relay, each degrades gracefully.
- **Packaging:** unchanged — `npm run build:vite` + `electron-builder`; bundled
  venv ships the new Python deps (httpx already in; add Playwright in Phase 5).

---

## 10. Decisions Required Before Coding

1. **Stack direction** — Evolve current Python/React (recommended, §2) vs literal
   Node/Next/Postgres rewrite.
2. **WhatsApp connection method** — Cloud API (official, needs Meta Business +
   24h-window/templates, structured) vs WhatsApp-Web automation (full
   conversation history for analysis, works with any/personal number, but
   unofficial/ToS-risk) vs deep-link prefilled-send (zero setup, one tap, no
   analysis). This shapes the entire WhatsApp module.

Once confirmed, Phase 1 starts immediately.
