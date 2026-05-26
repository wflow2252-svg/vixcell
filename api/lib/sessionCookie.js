// Tiny stateless session cookie. Signs a payload with HMAC-SHA256 so we can
// verify it on subsequent requests without a database lookup.

const crypto = require('crypto');

const COOKIE_NAME = 'vixcell_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) throw new Error('AUTH_JWT_SECRET env var is missing');
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function sign(payload) {
  const body = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const mac = crypto.createHmac('sha256', getSecret()).update(body).digest();
  return `${body}.${b64url(mac)}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expectedMac = crypto.createHmac('sha256', getSecret()).update(body).digest();
  const givenMac = b64urlDecode(sig);
  if (expectedMac.length !== givenMac.length) return null;
  if (!crypto.timingSafeEqual(expectedMac, givenMac)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8'));
    const age = Math.floor(Date.now() / 1000) - (payload.iat || 0);
    if (age > MAX_AGE_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

function setCookieHeader(token) {
  const flags = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  // Only Secure on https (so localhost dev works)
  if (process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
    flags.push('Secure');
  }
  return flags.join('; ');
}

function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseCookie(req) {
  const raw = req.headers.cookie || '';
  const parts = raw.split(';').map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith(`${COOKIE_NAME}=`)) return p.slice(COOKIE_NAME.length + 1);
  }
  return null;
}

function getSession(req) {
  const token = parseCookie(req);
  return token ? verify(token) : null;
}

module.exports = {
  sign, verify, setCookieHeader, clearCookieHeader, parseCookie, getSession,
  COOKIE_NAME,
};
