// Step 1 of Google OAuth: redirect the browser to Google's consent screen.
//
// Triggered when the user clicks "Continue with Google" in the dashboard.
// We pass a one-time `state` value (signed) so the callback can detect CSRF.

const crypto = require('crypto');
const { sign } = require('../../lib/sessionCookie');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

module.exports = (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID env var missing on the server' });
  }

  // Where to send the user after a successful sign-in (defaults to /admin)
  const returnTo = (req.query && req.query.return_to) || '/admin';

  // Origin of this request — used both as the OAuth redirect_uri host and the
  // final redirect target after callback.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;

  // The redirect_uri MUST match one of the URIs registered on the Google OAuth
  // client. Existing client allows: https://vixcell.com/__/auth/handler and
  // http://localhost:5173/__/auth/handler — we use that path.
  const redirectUri = `${origin}/__/auth/handler`;

  // Sign the state so the callback can verify it (CSRF protection)
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = sign({ k: 'oauth_state', n: nonce, r: returnTo });

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.writeHead(302, { Location: url });
  res.end();
};
