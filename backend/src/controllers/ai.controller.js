const DemoRequest = require('../models/DemoRequest');
const aiTemplateService = require('../services/aiTemplate.service');
const fcmService = require('../services/fcm.service');
const { getIo } = require('../socket');

exports.generateDemo = async (req, res, next) => {
  try {
    const { businessName, businessType, description, primaryColor, language, visitorEmail } = req.body;

    // Generate HTML using smart templates
    const generatedHtml = await aiTemplateService.generateWebsite({
      businessName,
      businessType,
      description,
      primaryColor,
      language
    });

    const demo = await DemoRequest.create({
      businessName,
      businessType,
      description,
      primaryColor,
      language,
      visitorEmail,
      generatedHtml,
      status: 'generated'
    });

    // Notify admins
    const io = getIo();
    io.to('admin_room').emit('demo:new', demo);
    fcmService.notifyAdmins('New AI Demo Generated', `A new demo for ${businessName} has been created.`, { type: 'demo', demoId: demo._id.toString() });

    res.status(201).json({
      success: true,
      data: {
        demoId: demo._id,
        htmlUrl: `/api/ai/demos/${demo._id}`,
        previewHtml: generatedHtml
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDemos = async (req, res, next) => {
  try {
    const demos = await DemoRequest.find().sort('-createdAt').select('-generatedHtml');
    res.json({ success: true, data: demos });
  } catch (error) {
    next(error);
  }
};

exports.getDemoHtml = async (req, res, next) => {
  try {
    const demo = await DemoRequest.findById(req.params.id);
    if (!demo) {
      return res.status(404).send('Demo not found');
    }
    res.send(demo.generatedHtml);
  } catch (error) {
    next(error);
  }
};

exports.ollamaAnalyze = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // Dynamically find available local models
    let modelName = 'llama3.2'; // default fallback
    try {
      const tagsResponse = await fetch(`${ollamaUrl}/api/tags`);
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        if (tagsData.models && tagsData.models.length > 0) {
          modelName = tagsData.models[0].name;
          console.log(`[Ollama Proxy] Dynamically selected model: ${modelName}`);
        }
      }
    } catch (tagErr) {
      console.warn('[Ollama Proxy] Failed to fetch installed models from tags, using default llama3.2:', tagErr.message);
    }
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, message: `Ollama error: ${errText}` });
    }

    const data = await response.json();
    res.json({
      success: true,
      data: {
        response: data.response
      }
    });
  } catch (error) {
    console.error('[Ollama Proxy Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to communicate with local Ollama server.' });
  }
};

exports.correctHandwriting = async (req, res, next) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('[AI Controller] No GEMINI_API_KEY found. Using fallback OCR.');
      return res.json({
        success: true,
        data: {
          text: 'السلام عليكم'
        }
      });
    }

    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid base64 image data URL' });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Please transcribe and correct the handwritten Arabic text in this image. Respond ONLY with the corrected plain text.' },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: `You are a highly advanced Multimodal OCR and handwriting transcription engine specializing in Arabic and English.
Your task is to transcribe the handwritten text/sketches in the image with absolute precision.
Guidelines:
1. Pay close attention to character connections, ligatures, and word spacing (e.g. connected letters like "لا", "أهلاً", spacing between words, character-by-character layout).
2. Correct spelling mistakes, bad handwriting, or logical sentence structure while preserving the exact intended words.
3. Transcribe both Arabic and English text accurately.
4. Output ONLY the transcribed and corrected text itself. Do NOT include any markdown, quotes, backticks, explanations, or introductory phrases. Just return the clean plain text.`
            }
          ]
        },
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.1 // lower temperature for maximum deterministic OCR accuracy
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ success: false, message: `Gemini API error: ${errorText}` });
    }

    const resData = await response.json();
    if (!resData.candidates || resData.candidates.length === 0) {
      throw new Error('Gemini API did not return any candidates.');
    }

    const correctedText = resData.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');

    res.json({
      success: true,
      data: {
        text: correctedText
      }
    });
  } catch (error) {
    next(error);
  }
};
