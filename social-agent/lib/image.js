// Builds a premium-agency-style 1080×1350 social poster (4:5 ratio matches the
// references the user shared). Layout:
//
//   ┌──────────────────────────────┐
//   │     [logo top-center]        │
//   │                              │
//   │   ╔══════════════════╗       │
//   │   ║ BIG ARABIC HEADLINE ║    │  ← metallic gradient fill + glow
//   │   ║   subtle subhead    ║    │
//   │   ╚══════════════════╝       │
//   │                              │
//   │     [hero image area]        │  ← Gemini's 3D-rendered visual
//   │                              │
//   │     [bullet services list]   │  ← from brand_config.services
//   │                              │
//   │     [payment / CTA strip]    │
//   └──────────────────────────────┘
//
// Falls back to the original buffer if anything fails.

const sharp = require('sharp');
const { downloadAsBuffer } = require('./supabase');

const W = 1080;
const H = 1350;

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Wraps Arabic text into <= maxCharsPerLine chunks. Returns an array of lines.
function wrapArabic(text, maxCharsPerLine = 16) {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxCharsPerLine) {
      current = (current ? current + ' ' : '') + w;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildOverlaySVG({
  headline,
  subheading,
  eventBadge,
  eventMotif,
  brandName,
  tagline,
  services = [],
  contact,
  accent = '#c8a35c',
}) {
  const headlineLines = wrapArabic(headline, 16);
  const lineHeight    = headlineLines.length > 1 ? 84 : 96;
  const headlineSize  = headlineLines.length > 1 ? 78 : 92;
  const subheadSize   = 32;

  // Top headline block — starts around 22% from top of canvas
  const headlineYStart = 280;
  const headlineLinesSvg = headlineLines.map((line, i) => `
    <text x="${W / 2}" y="${headlineYStart + i * lineHeight}"
          font-family="Tahoma, 'Segoe UI', 'Arial', sans-serif"
          font-size="${headlineSize}" font-weight="900" fill="url(#metallic)"
          text-anchor="middle" direction="rtl"
          style="paint-order:stroke;stroke:#000;stroke-width:1.5;stroke-opacity:0.5">${esc(line)}</text>`).join('');

  // Subheading sits below the headline
  const subY = headlineYStart + headlineLines.length * lineHeight + 40;
  const subheadingSvg = subheading ? `
    <rect x="${W / 2 - 200}" y="${subY - 38}" width="400" height="52"
          rx="26" ry="26" fill="${accent}" opacity="0.9"/>
    <text x="${W / 2}" y="${subY - 4}"
          font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
          font-size="${subheadSize}" font-weight="700" fill="#000"
          text-anchor="middle" direction="rtl">${esc(subheading)}</text>` : '';

  // Bullet services list near the bottom (matches the reference "GEMINI PRO • VEO 3.1" style)
  const servicesList = services.slice(0, 4);
  const servicesY = H - 240;
  const colW = W / 2;
  const servicesSvg = servicesList.length ? servicesList.map((s, i) => {
    const col = i % 2; // 0 = right, 1 = left
    const row = Math.floor(i / 2);
    const x = col === 0 ? W - 80 : W / 2 - 30;
    const y = servicesY + row * 50;
    return `
      <circle cx="${x + 12}" cy="${y - 12}" r="5" fill="${accent}"/>
      <text x="${x}" y="${y}"
            font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
            font-size="24" font-weight="700" fill="#ffffff"
            text-anchor="end" direction="rtl">${esc(s)}</text>`;
  }).join('') : '';

  // "يشمل" label above the services list
  const servicesLabel = servicesList.length ? `
    <line x1="${W * 0.25}" y1="${servicesY - 50}" x2="${W * 0.4}" y2="${servicesY - 50}" stroke="${accent}" stroke-width="2"/>
    <text x="${W / 2}" y="${servicesY - 44}"
          font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
          font-size="24" font-weight="700" fill="${accent}"
          text-anchor="middle" direction="rtl" letter-spacing="6">يشمل</text>
    <line x1="${W * 0.6}" y1="${servicesY - 50}" x2="${W * 0.75}" y2="${servicesY - 50}" stroke="${accent}" stroke-width="2"/>` : '';

  // Event badge in top-right
  const badge = eventBadge ? `
    <g transform="translate(${W - 60}, 100)">
      <rect x="${-(eventBadge.length * 16 + 80)}" y="-30" rx="22" ry="22"
            width="${eventBadge.length * 16 + 80}" height="48"
            fill="${accent}" opacity="0.95"/>
      <text x="${-(eventBadge.length * 16 + 80) / 2}" y="2"
            font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
            font-size="22" font-weight="700" fill="#000"
            text-anchor="middle" direction="rtl">${esc(eventMotif || '')} ${esc(eventBadge)}</text>
    </g>` : '';

  // Footer strip with brand contact line
  const footerY = H - 80;
  const contactStr = contact || 'vixcell.com';
  const footer = `
    <rect x="0" y="${footerY - 30}" width="${W}" height="60" fill="#000" opacity="0.5"/>
    <text x="${W / 2}" y="${footerY + 8}"
          font-family="Tahoma, 'Segoe UI', Arial, sans-serif"
          font-size="22" font-weight="600" fill="#ffffff" opacity="0.9"
          text-anchor="middle" letter-spacing="3" direction="ltr">${esc(contactStr.toUpperCase())}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Metallic gradient for the Arabic headline (mimics the references' copper-shine look) -->
    <linearGradient id="metallic" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#fff5e0"/>
      <stop offset="35%"  stop-color="${accent}"/>
      <stop offset="60%"  stop-color="#7a5a2a"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>

    <!-- Soft glow filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Top vignette so the headline pops -->
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.7"/>
      <stop offset="40%"  stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>

    <!-- Bottom vignette for the services list -->
    <linearGradient id="bottomShade" x1="0" y1="0.6" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0"/>
      <stop offset="50%"  stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

  <!-- Top + bottom vignettes -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#topShade)"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bottomShade)"/>

  ${badge}
  ${headlineLinesSvg}
  ${subheadingSvg}
  ${servicesLabel}
  ${servicesSvg}
  ${footer}
</svg>`;
}

async function buildPoster(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) return buffer;
  const {
    headline = '',
    subheading = '',
    eventBadge,
    eventMotif,
    brandName = 'VIXCELL',
    tagline,
    services = [],
    contact,
    logoUrl,
    accent = '#c8a35c',
  } = options;

  try {
    // Resize background to 1080×1350 (4:5 — the ratio Instagram uses for portrait)
    const bg = await sharp(buffer)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .modulate({ brightness: 0.85, saturation: 1.1 }) // slightly darken so text reads
      .toBuffer();

    const composites = [];

    // Logo at the TOP-CENTER (matches reference layouts)
    if (logoUrl) {
      try {
        const logoBuf = await downloadAsBuffer(logoUrl);
        if (logoBuf) {
          const target = 130;
          const logoResized = await sharp(logoBuf)
            .resize({ width: target, height: target, fit: 'inside' })
            .png()
            .toBuffer();
          const meta = await sharp(logoResized).metadata();
          composites.push({
            input: logoResized,
            top:  80,
            left: Math.round((W - (meta.width || target)) / 2),
          });
        }
      } catch (e) {
        console.warn('[image] logo overlay failed:', e.message);
      }
    }

    // Text + frame overlay
    const overlay = buildOverlaySVG({
      headline, subheading, eventBadge, eventMotif,
      brandName, tagline, services, contact, accent,
    });
    composites.push({ input: Buffer.from(overlay), top: 0, left: 0 });

    return await sharp(bg).composite(composites).png({ quality: 92 }).toBuffer();
  } catch (e) {
    console.warn('[image] poster composition failed, returning original:', e.message);
    return buffer;
  }
}

// Back-compat
async function applyBrandFinish(buffer, opts = {}) {
  return buildPoster(buffer, { ...opts, headline: opts.headline || '', subheading: opts.subheading || '' });
}

module.exports = { buildPoster, applyBrandFinish };
