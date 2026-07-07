const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const SYSTEM_INSTRUCTION = `You are the Vixcell AI Software Architect, powered by Gemma 2.
Your task is to analyze the user's coding request and output a complete full-stack development blueprint.
You MUST return a valid JSON object matching the exact structure below. Do not wrap the JSON in markdown code blocks like \`\`\`json. Return only the raw JSON.

Structure:
{
  "analysis": "A detailed Markdown analysis of the requirements, files needed, folder structure, and database schema (in natural Arabic/English).",
  "frontend": "A complete, standalone, production-ready HTML page (including Tailwind CSS CDN link and embedded JavaScript) implementing the frontend user interface. It must be a complete single-file webpage ready to be rendered in an iframe preview.",
  "backend": "A complete, production-ready backend code snippet (Node.js Express / Python FastAPI) implementing the server endpoints.",
  "security": "A detailed security audit report in Markdown format, reviewing potential vulnerabilities and mitigations."
}`;

exports.generateCodingBlueprint = async (userPrompt) => {
  const hfModel = "google/gemma-2-9b-it";
  const hfUrl = `https://api-inference.huggingface.co/models/${hfModel}`;

  console.log(`[Coding Assistant] Attempting to query Gemma 2 via Hugging Face...`);

  // Try Hugging Face Gemma 2 first
  try {
    const hfPrompt = `<start_of_turn>user
System Instructions: ${SYSTEM_INSTRUCTION}

User Request: ${userPrompt}<end_of_turn>
<start_of_turn>model`;

    const response = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: hfPrompt,
        parameters: {
          max_new_tokens: 3000,
          temperature: 0.3,
          return_full_text: false
        }
      }),
      signal: AbortSignal.timeout(12000) // 12-second timeout for quick fallback
    });

    if (response.ok) {
      const result = await response.json();
      let generatedText = '';
      if (Array.isArray(result) && result[0]?.generated_text) {
        generatedText = result[0].generated_text.trim();
      } else if (result?.generated_text) {
        generatedText = result.generated_text.trim();
      }

      // Try to parse as JSON
      if (generatedText) {
        // Strip markdown backticks if any
        const cleaned = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.analysis && parsed.frontend && parsed.backend && parsed.security) {
          console.log(`[Coding Assistant] Successfully generated blueprint using Gemma 2 via Hugging Face.`);
          parsed.frontend = cleanCodeBlock(parsed.frontend);
          parsed.backend = cleanCodeBlock(parsed.backend);
          return parsed;
        }
      }
    }
    console.warn(`[Coding Assistant] Hugging Face returned non-JSON or error status: ${response.status}. Falling back to Gemini...`);
  } catch (error) {
    console.warn(`[Coding Assistant] Hugging Face request failed or timed out: ${error.message}. Falling back to Gemini...`);
  }

  // Fallback to Gemini API
  if (!GEMINI_API_KEY) {
    console.warn(`[Coding Assistant] No GEMINI_API_KEY found. Using mock fallback.`);
    return getMockBlueprint(userPrompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    parsed.frontend = cleanCodeBlock(parsed.frontend);
    parsed.backend = cleanCodeBlock(parsed.backend);
    console.log(`[Coding Assistant] Successfully generated blueprint using Gemini API (Gemini 2.0 Flash).`);
    return parsed;
  } catch (geminiError) {
    console.error(`[Coding Assistant] Gemini fallback failed:`, geminiError);
    return getMockBlueprint(userPrompt);
  }
};

const cleanCodeBlock = (code) => {
  if (typeof code !== 'string') return code;
  let cleaned = code.trim();
  const match = cleaned.match(/```(?:html|xml|javascript|js|python|py|json)?([\s\S]*?)```/i);
  if (match) {
    cleaned = match[1].trim();
  } else {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/i, '').replace(/```$/, '').trim();
  }
  return cleaned;
};

function getMockBlueprint(prompt) {
  return {
    analysis: `### تحليل متطلبات المشروع: "${prompt}"\n\n- **نوع النظام:** تطبيق ويب متكامل (Full-Stack Web App)\n- **الهيكل الموصى به:**\n  - \`client/\`: واجهة المستخدم (React/Vite)\n  - \`server/\`: خادم البيانات (Express.js/Node.js)\n  - \`database/\`: قاعدة البيانات (SQLite)\n- **الخطوات:** تصميم الفرونت إند، إعداد الباك إند، ثم فحص الحماية والأمان.`,
    frontend: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vixcell Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #020617; }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex items-center justify-center font-sans">
  <div class="p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl max-w-md w-full text-center shadow-2xl backdrop-blur-md">
    <div class="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <span class="text-3xl text-amber-500">✨</span>
    </div>
    <h1 class="text-2xl font-bold text-amber-500 mb-2">Vixcell Coding Assistant</h1>
    <p class="text-slate-400 mb-6 text-sm">تم تصميم هذه الواجهة التفاعلية لتلبية طلبك محاكاةً للنموذج المدمج:</p>
    <div class="p-4 bg-slate-950/80 border border-slate-800/50 rounded-xl mb-6 text-right">
      <span class="text-slate-500 text-xs block mb-1">الطلب المستلم:</span>
      <span class="text-slate-200 text-sm font-semibold">${prompt}</span>
    </div>
    <button class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-amber-500/10">
      بدء العمل المشترك
    </button>
  </div>
</body>
</html>`,
    backend: `// server/server.js\nconst express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 5000;\n\napp.use(express.json());\n\napp.get('/api/status', (req, res) => {\n  res.json({ success: true, message: 'Server is running for: ${prompt}' });\n});\n\napp.listen(PORT, () => console.log('Server running on port ' + PORT));`,
    security: `### تقرير تدقيق الحماية والأمان (Security Audit):\n\n1. **التحقق من المدخلات (Input Validation):** تجنب حقن أكواد SQL (SQL Injection) باستخدام استعلامات مجهزة (Prepared Statements).\n2. **تأمين الواجهة (XSS Mitigation):** استخدام React يمنع حقن النصوص البرمجية الافتراضي.\n3. **التوثيق (Authentication):** يوصى باستخدام JWT مشفر ومحفوظ في Cookies محمية بـ HttpOnly.`
  };
}
