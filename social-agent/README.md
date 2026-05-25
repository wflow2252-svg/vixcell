# VIXCELL Social Agent

Local Node.js server that drives Gemini Web UI (via Playwright) to generate social-media content using your **Gemini AI Pro** account — no API key, no billing required for AI.

## How it works

1. You run `npm start` on your PC. A Chromium browser opens.
2. First time: you sign into Gemini in that browser. The session persists.
3. From the VIXCELL admin dashboard (`/admin → Social Agent`), you click a button.
4. The agent automates Gemini Web UI: types prompts, scrapes responses, downloads generated images.
5. Results saved to Supabase. Optionally posted to Facebook.

## Setup

```bash
cd social-agent
npm install                 # installs deps + Playwright Chromium
cp .env.example .env        # edit AGENT_TOKEN (any random string)
npm start
```

First run: a browser window opens at https://gemini.google.com. Sign in with your **AI Pro** Google account. Close the browser when done — your session is saved in `./browser-profile/`.

## Connect the dashboard

In `web/.env.local`:
```
VITE_SOCIAL_AGENT_URL=http://localhost:3001
VITE_SOCIAL_AGENT_TOKEN=<same as AGENT_TOKEN above>
```

Then `npm run dev` in `web/` and visit `http://localhost:5173/admin`.

## Recipes

- **`daily-post-ar`** — Arabic daily post (caption + hashtags + image)
- **`daily-post-en`** — English daily post
- **`market-analysis`** — Weekly market report

Trigger via dashboard buttons, or directly:
```bash
curl -X POST http://localhost:3001/run/daily-post-ar \
  -H "x-agent-token: YOUR_TOKEN"
```

## Schedule daily runs (Windows)

Use Task Scheduler:

1. Create a basic task → trigger daily at 10:00 → action: start program
2. Program: `curl.exe`
3. Arguments: `-X POST http://localhost:3001/run/daily-post-ar -H "x-agent-token: YOUR_TOKEN"`

Make sure `npm start` is running (or set it to run at startup via Startup folder).

## Security

- The agent runs on `localhost` only. Not exposed to the internet.
- All requests authenticated with `AGENT_TOKEN` (shared secret).
- CORS restricted to `ALLOWED_ORIGINS` in `.env`.
- Your Gemini session lives in `./browser-profile/` — gitignored.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Gemini input not found" | Open browser-profile/ folder, sign in to Gemini manually |
| Browser doesn't open | Set `HEADED=true` in `.env` |
| Recipe times out | Gemini UI may have changed — check `lib/gemini-web.js` selectors |
| FB post skipped | Set `META_PAGE_ACCESS_TOKEN` + `META_PAGE_ID` in `.env` |
