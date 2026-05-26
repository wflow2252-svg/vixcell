// Returns the currently signed-in user from the session cookie, or null.

const { getSession } = require('../../lib/sessionCookie');

module.exports = (req, res) => {
  const session = getSession(req);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (!session) return res.end(JSON.stringify({ user: null }));
  res.end(JSON.stringify({
    user: {
      uid:     session.uid,
      email:   session.email,
      name:    session.name,
      picture: session.picture,
      admin:   !!session.admin,
    },
  }));
};
