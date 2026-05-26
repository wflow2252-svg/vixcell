const { verifyCron } = require('../../lib/auth');
const { runDailyPost } = require('../../lib/dailyPost');

module.exports = async (req, res) => {
  const auth = verifyCron(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    const result = await runDailyPost({ language: 'ar' });
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/daily-post-ar]', err);
    res.status(500).json({ ok: false, error: err.message, details: err.details });
  }
};
