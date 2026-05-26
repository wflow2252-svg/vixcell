// Builds a professional 1080×1080 social poster from a Gemini-generated
// background. Composites:
//   • Dark gradient at the bottom for text legibility
//   • Large Arabic headline (3-5 words)
//   • Smaller subheading line
//   • Event badge (top-left) if it's a holiday
//   • Brand logo (bottom-right)
//   • Brand-color frame
//
// Falls back to the original buffer if anything goes wrong so the post
// still ships.

const sharp = require('sharp');
const { downloadAsBuffer } = require('./supabase');

const W = 1080;
const H = 1080;

// XML-safe escape — headlines come from Gemini and may contain & < > "
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// SVG overlay covering the full 1080×1080 frame
function buildOverlaySVG({
  headline,
  subheading,
  eventBadge,
  eventMotif,
  brandName,
  accent = '#c8a35c',
}) {
  const headlineSafe   = esc(headline   || '');
  const subheadingSafe = esc(subheading || '');
  const brandSafe      = esc(brandName  || 'VIXCELL');

  // Choose font sizes that look balanced at 1080×1080
  const headlineSize    = headlineSafe.length > 24 ? 64 : 84;
  const subheadingSize  = 28;
  const badgeSize       = 22;
  const brandWatermark  = 20;

  const badge = eventBadge ? `
    <g transform="translate(60, 60)">
      <rect x="0" y="0" rx="22" ry="22" width="${(eventBadge.length * 16) + 80}" height="48"
            fill="${accent}" opacity="0.95"/>
      <text x="${((eventBadge.length * 16) + 80) / 2}" y="32"
            font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
            font-size="${badgeSize}" font-weight="700" fill="#000"
            text-anchor="middle" direction="rtl">${esc(eventMotif || '')} ${esc(eventBadge)}</text>
    </g>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bottomFade" x1="0" y1="0.6" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0"/>
      <stop offset="60%"  stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
    </linearGradient>
  </defs>

  <!-- Bottom gradient for headline legibility -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bottomFade)"/>

  <!-- Brand-color frame -->
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}"
        rx="40" ry="40"
        fill="none" stroke="${accent}" stroke-width="6" opacity="0.9"/>

  <!-- Event badge top-left if present -->
  ${badge}

  <!-- Headline + subheading bottom-center -->
  <g transform="translate(${W / 2}, ${H - 220})">
    <text x="0" y="0"
          font-family="Tahoma, 'Segoe UI', 'Arial', sans-serif"
          font-size="${headlineSize}" font-weight="800" fill="#ffffff"
          text-anchor="middle" direction="rtl"
          style="paint-order:stroke;stroke:#000;stroke-width:2;stroke-opacity:0.4;">
      ${headlineSafe}
    </text>
    <text x="0" y="${headlineSize + 14}"
          font-family="Tahoma, 'Segoe UI', 'Arial', sans-serif"
          font-size="${subheadingSize}" font-weight="500" fill="${accent}"
          text-anchor="middle" direction="rtl">
      ${subheadingSafe}
    </text>
  </g>

  <!-- Bottom-left brand wordmark (fallback if no logo image) -->
  <text x="60" y="${H - 60}"
        font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
        font-size="${brandWatermark}" font-weight="700" fill="#ffffff"
        opacity="0.7" letter-spacing="3">${brandSafe.toUpperCase()}</text>
</svg>`;
}

/**
 * Composes a brand-finished poster from a raw background image.
 *
 * @param {Buffer} buffer  - the Gemini-generated background
 * @param {Object} options - { headline, subheading, eventBadge, eventMotif,
 *                            brandName, logoUrl, accent }
 * @returns {Promise<Buffer>} - the finished PNG
 */
async function buildPoster(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) return buffer;
  const {
    headline = '',
    subheading = '',
    eventBadge,
    eventMotif,
    brandName = 'VIXCELL',
    logoUrl,
    accent = '#c8a35c',
  } = options;

  try {
    // 1. Resize background to a 1:1 1080×1080 canvas
    const bg = await sharp(buffer)
      .resize(W, H, { fit: 'cover', position: 'attention' })
      .toBuffer();

    const composites = [];

    // 2. The text + frame overlay
    const overlay = buildOverlaySVG({ headline, subheading, eventBadge, eventMotif, brandName, accent });
    composites.push({ input: Buffer.from(overlay), top: 0, left: 0 });

    // 3. Logo in the bottom-right
    if (logoUrl) {
      try {
        const logoBuf = await downloadAsBuffer(logoUrl);
        if (logoBuf) {
          const target = 140;
          const logoResized = await sharp(logoBuf)
            .resize({ width: target, height: target, fit: 'inside' })
            .png()
            .toBuffer();
          const meta = await sharp(logoResized).metadata();
          composites.push({
            input: logoResized,
            top:  H - (meta.height || target) - 50,
            left: W - (meta.width  || target) - 50,
          });
        }
      } catch (e) {
        console.warn('[image] logo overlay failed:', e.message);
      }
    }

    return await sharp(bg).composite(composites).png({ quality: 92 }).toBuffer();
  } catch (e) {
    console.warn('[image] poster composition failed, returning original:', e.message);
    return buffer;
  }
}

// Back-compat — older recipes call applyBrandFinish; route it to buildPoster
// with minimal options (no headline).
async function applyBrandFinish(buffer, opts = {}) {
  return buildPoster(buffer, { ...opts, headline: opts.headline || '', subheading: opts.subheading || '' });
}

module.exports = { buildPoster, applyBrandFinish };
