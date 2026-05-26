// Post-processes a generated image: composites the brand logo into a corner,
// applies a subtle brand-color border, and re-encodes as PNG.
//
// Pure best-effort — if anything fails (no sharp, missing logo, etc.) we
// fall back to the original buffer so the post still goes out.

const sharp = require('sharp');
const { downloadAsBuffer } = require('./supabase');

async function applyBrandFinish(buffer, { logoUrl, accent = '#c8a35c' } = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) return buffer;

  let img;
  try {
    img = sharp(buffer);
    const meta = await img.metadata();
    const W = meta.width || 1024;
    const H = meta.height || 1024;

    const composites = [];

    // 1. Logo in the bottom-right corner if we have one.
    if (logoUrl) {
      try {
        const logoBuf = await downloadAsBuffer(logoUrl);
        if (logoBuf) {
          // Size logo to ~12% of the image's shorter side, capped at 200px.
          const target = Math.min(Math.round(Math.min(W, H) * 0.12), 200);
          const logoResized = await sharp(logoBuf)
            .resize({ width: target, height: target, fit: 'inside' })
            .png()
            .toBuffer();
          const logoMeta = await sharp(logoResized).metadata();
          const margin = Math.round(Math.min(W, H) * 0.03);
          composites.push({
            input: logoResized,
            top:  H - (logoMeta.height || target) - margin,
            left: W - (logoMeta.width  || target) - margin,
          });
        }
      } catch (e) {
        console.warn('[image] logo overlay failed:', e.message);
      }
    }

    // 2. Thin accent border so posts feel like a series.
    try {
      const border = Math.max(4, Math.round(Math.min(W, H) * 0.005));
      const svg = `<svg width="${W}" height="${H}">
        <rect x="${border/2}" y="${border/2}"
              width="${W - border}" height="${H - border}"
              fill="none" stroke="${accent}" stroke-width="${border}"
              rx="${border * 4}" ry="${border * 4}" opacity="0.8" />
      </svg>`;
      composites.push({ input: Buffer.from(svg), top: 0, left: 0 });
    } catch (_) {}

    if (composites.length === 0) return buffer;

    return await sharp(buffer).composite(composites).png().toBuffer();
  } catch (e) {
    console.warn('[image] sharp processing failed, returning original:', e.message);
    return buffer;
  }
}

module.exports = { applyBrandFinish };
