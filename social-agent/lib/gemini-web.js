// Gemini Web UI driver. Sends a prompt to gemini.google.com and scrapes the
// latest model response. Image responses are downloaded as buffers.
//
// User must be logged in to Gemini once (with their AI Pro / paid account).
// The persistent browser profile keeps that session across runs.

const { getPage } = require('./browser');

const GEMINI_URL = 'https://gemini.google.com/app';

async function ensureGeminiPage() {
  const page = await getPage();
  if (!page.url().startsWith('https://gemini.google.com')) {
    await page.goto(GEMINI_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  // Wait for the input area. If the user isn't logged in, this throws after timeout.
  const input = await page.waitForSelector(
    'rich-textarea [contenteditable="true"], textarea[aria-label*="prompt"], textarea[aria-label*="Prompt"]',
    { timeout: 30000 }
  ).catch(() => null);

  if (!input) {
    throw new Error(
      'Gemini input not found — user is probably not logged in. ' +
      'Open the launched browser, sign in to Gemini, then retry.'
    );
  }
  return page;
}

async function sendPrompt(prompt, { onLog = () => {}, files = [] } = {}) {
  const page = await ensureGeminiPage();

  // 1. Attach any files first so they're staged before we send the prompt
  if (files.length) {
    onLog(`Attaching ${files.length} file(s) to Gemini chat…`);
    try {
      const input = await page.$('input[type="file"]');
      if (!input) {
        onLog('⚠️ Could not find file input — sending prompt without attachments');
      } else {
        await input.setInputFiles(files);
        // Wait for upload thumbnails to appear before sending
        await page.waitForTimeout(2500);
      }
    } catch (e) {
      onLog(`⚠️ File attach failed: ${e.message}`);
    }
  }

  onLog('Typing prompt into Gemini…');

  // Click on the editable area and type
  const editor = await page.waitForSelector('rich-textarea [contenteditable="true"]', { timeout: 15000 });
  await editor.click();
  await page.keyboard.insertText(prompt);
  await page.waitForTimeout(300);

  // Send (Enter) — Gemini sends on Enter when input is focused
  await page.keyboard.press('Enter');
  onLog('Prompt sent. Waiting for response…');

  // Wait for response to appear and finish streaming.
  // Gemini renders responses inside <model-response> elements with a "stop streaming"
  // button visible while streaming. We wait for the stop button to disappear.
  const startTs = Date.now();
  let lastResponseCount = -1;
  await page.waitForFunction(() => {
    return document.querySelectorAll('model-response').length > 0;
  }, { timeout: 30000 });

  // Poll until streaming stops (no [data-test-id="stop-button"] visible)
  while (Date.now() - startTs < 120000) {
    const streaming = await page.$('button[data-test-id="stop-button"], button[aria-label*="Stop"]');
    if (!streaming) break;
    await page.waitForTimeout(500);
  }
  onLog('Response complete.');

  // Get the last response text + image (if any)
  const result = await page.evaluate(() => {
    const responses = Array.from(document.querySelectorAll('model-response'));
    const last = responses[responses.length - 1];
    if (!last) return { text: '', imageUrls: [] };

    const text = (last.innerText || '').trim();
    const imgs = Array.from(last.querySelectorAll('img'))
      .map(i => i.src)
      .filter(s => s && !s.startsWith('data:'));
    return { text, imageUrls: imgs };
  });

  // Download any images
  const imageBuffers = [];
  for (const url of result.imageUrls) {
    try {
      const resp = await page.context().request.get(url);
      if (resp.ok()) {
        const body = await resp.body();
        imageBuffers.push({ url, buffer: body, contentType: resp.headers()['content-type'] || 'image/png' });
      }
    } catch (e) {
      onLog(`Failed to download image: ${e.message}`);
    }
  }

  return { text: result.text, images: imageBuffers };
}

// Try to switch Gemini to image generation mode if it's a separate toggle.
// (Gemini supports "Imagen" image generation inline via prompts like "generate an image of X")
async function newConversation() {
  const page = await ensureGeminiPage();
  // Click "New chat" if available
  const newBtn = await page.$('[aria-label*="New chat"], [aria-label*="new chat"]');
  if (newBtn) await newBtn.click().catch(() => {});
  await page.waitForTimeout(500);
}

module.exports = { ensureGeminiPage, sendPrompt, newConversation };
