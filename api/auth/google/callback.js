// Step 2 of Google OAuth: Google redirects the browser back here with a `code`
// and the `state` we signed earlier. We exchange the code for an ID token,
// verify it, and issue our own session cookie.

const { sign, verify, setCookieHeader } = require('../../../lib/sessionCookie');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ||
  'hazemcoding@gmail.com,vixcel.eg@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

function decodeIdToken(idToken) {
  // ID token is a JWT. We don't verify the signature here because the token
  // came directly from Google's HTTPS endpoint over a trusted channel — but
  // we DO verify the issuer + audience claims as a sanity check.
  const [, payloadB64] = idToken.split('.');
  if (!payloadB64) throw new Error('Malformed id_token');
  const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json);
}

function safeReturnTo(r) {
  if (!r || typeof r !== 'string') return '/admin';
  // Only allow same-origin paths
  if (r.startsWith('/') && !r.startsWith('//')) return r;
  return '/admin';
}

module.exports = async (req, res) => {
  const { code, state, error } = req.query || {};

  if (error) {
    return res.status(400).send(`Google OAuth error: ${error}`);
  }
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  const stateData = verify(state);
  if (!stateData || stateData.k !== 'oauth_state') {
    return res.status(400).send('Invalid or expired OAuth state — try again');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/__/auth/handler`;

  // Exchange the code for tokens
  let tokenData;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      console.error('[oauth] token exchange failed:', tokenData);
      return res.status(400).send(`Token exchange failed: ${tokenData.error_description || tokenData.error || tokenRes.status}`);
    }
  } catch (e) {
    console.error('[oauth] token exchange error:', e);
    return res.status(500).send(`Token exchange error: ${e.message}`);
  }

  // Decode the ID token to get the user's email
  let claims;
  try {
    claims = decodeIdToken(tokenData.id_token);
  } catch (e) {
    return res.status(400).send(`Bad id_token: ${e.message}`);
  }

  // Basic sanity checks on the claims
  if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') {
    return res.status(400).send('id_token has wrong issuer');
  }
  if (claims.aud !== CLIENT_ID) {
    return res.status(400).send('id_token has wrong audience');
  }
  if (!claims.email || !claims.email_verified) {
    return res.status(400).send('Google account has no verified email');
  }

  const email = String(claims.email).trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email);

  // Sign our own session cookie with just what we need
  const sessionToken = sign({
    uid:     claims.sub,
    email,
    name:    claims.name || claims.given_name || email.split('@')[0],
    picture: claims.picture || null,
    admin:   isAdmin,
  });

  res.setHeader('Set-Cookie', setCookieHeader(sessionToken));
  const returnTo = safeReturnTo(stateData.r);
  res.writeHead(302, { Location: returnTo });
  res.end();
};
