const { verifyCron } = require('../lib/auth');
const { runMarketAnalysis } = require('../lib/market');

module.exports = async (req, res) => {
  const auth = verifyCron(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    const result = await runMarketAnalysis();
    res.status(200).json({
      ok: true,
      report_id: result.report.id,
      period: `${result.report.period_start} → ${result.report.period_end}`,
      preview: result.report.summary,
    });
  } catch (err) {
    console.error('[cron/market-analysis]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
