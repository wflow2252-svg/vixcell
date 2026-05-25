function verifyCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, status: 500, error: 'CRON_SECRET not configured' };
  }

  const header = req.headers.authorization || req.headers['x-cron-secret'] || '';
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const expected = `Bearer ${secret}`;

  if (header === expected || header === secret || isVercelCron) {
    return { ok: true };
  }
  return { ok: false, status: 401, error: 'Unauthorized' };
}

module.exports = { verifyCron };
