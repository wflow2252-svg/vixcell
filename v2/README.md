# VIXCELL v2 — Next.js 14 platform

The next-generation VIXCELL AI website builder, built on Next.js 14 (App Router)
+ TypeScript + Tailwind CSS. The existing local AI engine has been ported as-is
and is now embedded inside a proper marketing site + dedicated builder route.

## What's here (Phase 1)

```
v2/
├── app/
│   ├── layout.tsx              ← Root layout (dark, Inter, RTL/LTR ready)
│   ├── page.tsx                ← Landing page (Hero + Features + CTA + Footer)
│   ├── builder/page.tsx        ← /builder — AI chat + live preview + ZIP export
│   ├── templates/page.tsx      ← /templates — curated starting points
│   └── api/export/route.ts     ← POST /api/export → ZIP download
├── components/
│   ├── marketing/              ← Navbar, Hero, Features, CTA, Footer
│   └── builder/                ← Builder, Icon, markdown utils
├── lib/
│   ├── ai/                     ← The full AI engine (9 modules, ported)
│   └── templates/catalog.ts    ← Template definitions
└── public/logo.png             ← VIXCELL brand logo
```

## Run locally

```bash
cd v2
npm install
npm run dev
```

Then open <http://localhost:3000>:
- `/`           → landing
- `/builder`    → AI chat + live preview
- `/templates`  → template gallery (clicking one launches the builder with a prompt)

## Deploy to Vercel

1. Push the repo to GitHub (already done — `wflow2252-svg/vixcell` on `main`).
2. In Vercel dashboard → **Add new project** → import that repo.
3. **Root directory:** set to `v2` (instead of the default).
4. Framework preset: **Next.js** (auto-detected).
5. Build command: `npm run build` (default).
6. Output directory: `.next` (default).
7. Add the `vixcell.com` domain to this project once it deploys cleanly.
8. **Important:** delete the v1 `web` project on Vercel or remove the
   `vixcell.com` alias from it first — only one project can own the domain.

## Why two folders?

- `web/` (Vite + React) is the **current** vixcell.com — still live, untouched.
- `v2/` (Next.js 14) is the **new platform** — develop here without breaking prod.

When `v2/` is solid (templates filled in, ZIP export tested, deploy verified),
update the Vercel project root to `v2/` and the swap is done. The v1 folder
can stay as a snapshot or be deleted later.

## What's NOT in Phase 1 yet

These are explicitly deferred to later phases per the spec:
- **Phase 2:** Visual editor with drag-and-drop, undo/redo, image generation
- **Phase 3:** Auth (Clerk / NextAuth), user dashboard, subdomain hosting, analytics
- **Phase 4:** Stripe subscriptions, custom domains, multi-language content, team collab

When you're ready for Phase 2, ask for it explicitly — it's a substantial set
of features and benefits from being scoped one piece at a time.
