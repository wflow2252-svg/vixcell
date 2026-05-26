// Clears the session cookie and redirects home.

const { clearCookieHeader } = require('../lib/sessionCookie');

module.exports = (req, res) => {
  res.setHeader('Set-Cookie', clearCookieHeader());
  const returnTo = (req.query && req.query.return_to) || '/';
  // If the request is JSON (XHR), just respond OK. Otherwise redirect.
  if ((req.headers.accept || '').includes('application/json')) {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  }
  res.writeHead(302, { Location: returnTo });
  res.end();
};
