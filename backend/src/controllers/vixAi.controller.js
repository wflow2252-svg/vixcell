const vixAi = require('../services/vixAi.service');

exports.chat = async (req, res, next) => {
  try {
    const { message, sessionId, logoDataUrl } = req.body;

    if (!message && !logoDataUrl) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const sid = sessionId || `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result = await vixAi.chat(sid, message || '', logoDataUrl);

    res.json({
      success: true,
      data: {
        text: result.text,
        html: result.html || null,
        sessionId: sid,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.reset = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      vixAi.resetSession(sessionId);
    }
    res.json({ success: true, message: 'Session reset' });
  } catch (error) {
    next(error);
  }
};
