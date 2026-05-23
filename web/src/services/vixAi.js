const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let sessionId = localStorage.getItem('vix_ai_session') || null;

export async function sendMessage(message, logoDataUrl = null) {
  try {
    const res = await fetch(`${API_BASE}/api/vix-ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId,
        logoDataUrl,
      }),
    });

    const data = await res.json();

    if (data.success) {
      sessionId = data.data.sessionId;
      localStorage.setItem('vix_ai_session', sessionId);
      return {
        text: data.data.text,
        html: data.data.html,
      };
    }

    throw new Error(data.message || 'Failed to get AI response');
  } catch (err) {
    console.error('VixAI Error:', err);
    return {
      text: 'عذراً، حصل خطأ في الاتصال. حاول تاني.',
      html: null,
    };
  }
}

export async function resetChat() {
  try {
    await fetch(`${API_BASE}/api/vix-ai/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
  } catch {}
  sessionId = null;
  localStorage.removeItem('vix_ai_session');
}
