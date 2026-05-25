const { uploadImageBuffer } = require('./supabase');

const IMAGEN_MODEL = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';
const FALLBACK_IMAGE_URL = process.env.FALLBACK_IMAGE_URL || '';

async function generateImage(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${key}`;
  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      personGeneration: 'allow_adult',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Imagen error: ${data.error?.message || res.status}`);
  }

  const b64 =
    data.predictions?.[0]?.bytesBase64Encoded ||
    data.predictions?.[0]?.image?.bytesBase64Encoded;
  if (!b64) throw new Error('Imagen returned no image bytes');
  return Buffer.from(b64, 'base64');
}

async function generateAndStoreImage({ prompt, slug }) {
  try {
    const buffer = await generateImage(prompt);
    const filename = `${slug}-${Date.now()}.png`;
    const publicUrl = await uploadImageBuffer(buffer, filename);
    return { url: publicUrl, generated: true };
  } catch (err) {
    console.error('[image] generation failed:', err.message);
    if (FALLBACK_IMAGE_URL) {
      return { url: FALLBACK_IMAGE_URL, generated: false, error: err.message };
    }
    throw err;
  }
}

module.exports = { generateImage, generateAndStoreImage };
