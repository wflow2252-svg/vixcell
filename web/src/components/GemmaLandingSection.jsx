import React, { useState, useEffect, useRef } from 'react';
import DotPixelIcon from './DotPixelIcon';

const T = {
  bgCard: 'rgba(20, 20, 25, 0.6)',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  primary: '#6366f1',
  accent: '#10b981',
  glow: 'rgba(99, 102, 241, 0.15)'
};

export default function GemmaLandingSection({ lang }) {
  const [model, setModel] = useState('qwen-fast'); // 'gemma-2b' | 'qwen-fast' | 'window-ai'
  const [prompt, setPrompt] = useState('Create a modern glassmorphic landing page hero section with a signup form');
  const [systemPrompt, setSystemPrompt] = useState(
    `Act as an Elite Product Design Team composed of: Staff Product Designer, Principal UI Designer, Senior UX Researcher, Design System Architect, Staff Frontend Engineer, Senior Motion Designer, Accessibility Specialist, SEO Engineer, and Performance Optimization Engineer.

Your mission is to design and engineer a world-class premium SaaS page that could compete visually and technically with products such as Stripe, Linear, Vercel, OpenAI, Notion, and Raycast.

DO NOT copy any existing website. Instead, analyze the premium design language shared by these companies (perfect editorial spacing, visual rhythm, typography hierarchy, subtle motion, layered depth, sophisticated borders) and create an original experience inspired by their quality standards.

CRITICAL CODE REQUIREMENTS:
- Generate FULL production-ready HTML with embedded CSS and Javascript.
- Return the output strictly inside ===HTML_START=== and ===HTML_END=== delimiters.
- NO extra conversational text outside the tags.
- Use Plus Jakarta Sans and Cairo (for Arabic text).
- Import Tailwind CSS (https://cdn.tailwindcss.com) and Lucide Icons via CDN for clean styling.
- All sections must be fully written, responsive, and functional.`
  );

  // States
  const [modelStatus, setModelStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'generating' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState({});
  const [htmlCode, setHtmlCode] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);

  const [isWindowAiAvailable, setIsWindowAiAvailable] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const workerRef = useRef(null);
  const iframeRef = useRef(null);

  const t = (en, ar) => (lang === 'ar' ? ar : en);

  // Check window.ai Prompt API
  useEffect(() => {
    const checkWindowAi = async () => {
      if (window.ai) {
        try {
          const canCreate = await window.ai.canCreateTextSession?.() || await window.ai.languageModel?.capabilities?.();
          if (canCreate && canCreate !== 'no') {
            setIsWindowAiAvailable(true);
          }
        } catch (e) {
          console.log("window.ai check error:", e);
        }
      }
    };
    checkWindowAi();
  }, []);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker('/ai-worker.js', { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { type, data, status, message } = e.data;

      if (type === "status") {
        setModelStatus(status);
        setStatusMessage(message);
        if (status === "ready") {
          setDownloadProgress({});
          setOverallProgress(0);
        }
      }

      else if (type === "progress") {
        setModelStatus('loading');
        setDownloadProgress(prev => {
          const updated = {
            ...prev,
            [data.file]: data.progress
          };
          // Calculate average progress
          const keys = Object.keys(updated);
          let sum = 0;
          keys.forEach(k => { sum += updated[k] || 0; });
          setOverallProgress(Math.round(sum / keys.length));
          return updated;
        });
      }

      else if (type === "chunk") {
        setHtmlCode(prev => {
          const text = prev + data;
          extractHtml(text);
          return text;
        });
      }

      else if (type === "done") {
        setModelStatus('ready');
        setStatusMessage(t('Design compiled successfully!', 'تم تجميع التصميم بنجاح!'));
        extractHtml(data);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  const extractHtml = (text) => {
    let html = '';
    const startIndex = text.indexOf('===HTML_START===');
    const endIndex = text.indexOf('===HTML_END===');

    if (startIndex !== -1) {
      if (endIndex !== -1) {
        html = text.substring(startIndex + 16, endIndex).trim();
      } else {
        html = text.substring(startIndex + 16).trim();
      }
    } else {
      const match = text.match(/```html([\s\S]*?)(?:```|$)/);
      if (match) {
        html = match[1].trim();
      } else if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        const rawStart = text.indexOf('<!DOCTYPE html>');
        const finalStart = rawStart !== -1 ? rawStart : text.indexOf('<html');
        html = text.substring(finalStart).trim();
      }
    }

    if (html) {
      if (!html.includes('cdn.jsdelivr.net/npm/tailwindcss')) {
        html = html.replace('<head>', '<head>\n<script src="https://cdn.tailwindcss.com"></script>\n<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">\n<style>body { font-family: "Plus Jakarta Sans", sans-serif; }</style>');
      }
      setHtmlCode(html);
    }
  };

  const handleLoadModel = (modelName) => {
    setModel(modelName);
    if (modelName === 'window-ai') {
      setModelStatus('ready');
      setStatusMessage('Gemini Nano ready!');
      return;
    }

    let modelId = modelName === 'gemma-2b' 
      ? 'onnx-community/gemma-2-2b-it-ONNX' 
      : 'onnx-community/Qwen2.5-0.5B-Instruct';

    workerRef.current.postMessage({
      type: 'load',
      data: {
        modelId,
        device: navigator.gpu ? 'webgpu' : 'wasm'
      }
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setHtmlCode('');
    setModelStatus('generating');
    setStatusMessage(t('Inference started locally...', 'بدء التشغيل محلياً...'));

    if (model === 'window-ai') {
      try {
        let session;
        if (window.ai.createTextSession) {
          session = await window.ai.createTextSession();
        } else if (window.ai.languageModel && window.ai.languageModel.create) {
          session = await window.ai.languageModel.create({
            systemPrompt: systemPrompt
          });
        }

        if (!session) throw new Error('Failed to start Gemini Nano session.');

        const stream = session.promptStreaming 
          ? await session.promptStreaming(`System Instructions: ${systemPrompt}\n\nPrompt: ${prompt}`)
          : null;

        if (stream) {
          let output = '';
          for await (const chunk of stream) {
            output = chunk;
            extractHtml(output);
          }
        } else {
          const res = await session.prompt(`System Instructions: ${systemPrompt}\n\nPrompt: ${prompt}`);
          extractHtml(res);
        }
        setModelStatus('ready');
        setStatusMessage(t('Compiled!', 'تم التجميع!'));
        session.destroy?.();
      } catch (err) {
        setModelStatus('error');
        setStatusMessage(`Error: ${err.message}`);
      }
    } else {
      workerRef.current.postMessage({
        type: 'generate',
        data: {
          prompt,
          systemPrompt,
          maxTokens: 1500,
          temperature: 0.6
        }
      });
    }
  };

  return (
    <section id="gemma-playground" style={{
      padding: '100px 0',
      backgroundColor: '#070709',
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        
        {/* Editorial Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: T.primary,
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '4px 12px',
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {t('On-Device Browser Intelligence', 'ذكاء اصطناعي مدمج بالمتصفح')}
          </span>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 800,
            margin: '16px 0 8px',
            color: '#fff',
            letterSpacing: '-0.02em'
          }}>
            {t('Local-First AI Web Sandbox', 'مساحة العمل الذكية التفاعلية')}
          </h2>
          <p style={{
            color: T.textSecondary,
            fontSize: '15px',
            maxWidth: '540px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {t(
              'Run Google Gemma & Gemini Nano on-device. Zero server calls, 100% private execution, compiled directly in browser using WebGPU.',
              'شغّل موديلات جوجل محلياً في جهازك. بدون خوادم خارجية، خصوصية كاملة للملفات والبيانات، وتجميع فوري للواجهات باستخدام الـ GPU.'
            )}
          </p>
        </div>

        {/* Feature Grid Split */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '40px',
          alignItems: 'stretch'
        }} className="gemma-split-grid">

          {/* Left Column: Local AI Value & Graph */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: `1px solid ${T.border}`,
            borderRadius: '16px',
            padding: '30px',
            background: T.bgCard,
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                {t('Why Run AI Locally?', 'لماذا نستخدم الذكاء الاصطناعي المحلي؟')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '20px', color: T.primary }}>🔒</span>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{t('Absolute Privacy', 'خصوصية مطلقة')}</h4>
                    <p style={{ fontSize: '12px', color: T.textSecondary, margin: '2px 0 0' }}>{t('Your code prompts never leave your local browser sandbox.', 'مدخلاتك وبياناتك لا تغادر متصفحك أبداً.')}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '20px', color: T.accent }}>⚡</span>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{t('GPU Accelerated', 'تسريع بطاقة الرسوميات GPU')}</h4>
                    <p style={{ fontSize: '12px', color: T.textSecondary, margin: '2px 0 0' }}>{t('Direct execution via WebGPU for fast, real-time responses.', 'تشغيل مباشر عبر تقنية WebGPU لاستجابة فائقة السرعة.')}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '20px', color: '#f59e0b' }}>💰</span>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{t('Zero Costs Forever', 'تكلفة صفرية دائماً')}</h4>
                    <p style={{ fontSize: '12px', color: T.textSecondary, margin: '2px 0 0' }}>{t('Run models completely free, with no API limits or pricing bills.', 'تشغيل الموديلات مجاني بالكامل بدون فواتير أو حدود للاستخدام.')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Image Illustration */}
            <div style={{
              marginTop: '30px',
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
              backgroundColor: '#0a0a0d',
              position: 'relative'
            }}>
              <img 
                src="/local_ai_feature_diagram.png" 
                alt="Local AI Processing Diagram"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {/* Right Column: AI Playground Sandbox */}
          <div style={{
            border: `1px solid ${T.border}`,
            borderRadius: '16px',
            padding: '30px',
            background: 'rgba(10, 10, 14, 0.8)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            
            {/* Model Selector Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase' }}>
                {t('Select Engine', 'اختر المحرك المحلي')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => handleLoadModel('qwen-fast')}
                  style={{
                    backgroundColor: model === 'qwen-fast' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: model === 'qwen-fast' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: T.text,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Qwen 0.5B (350MB)
                </button>
                <button
                  onClick={() => handleLoadModel('gemma-2b')}
                  style={{
                    backgroundColor: model === 'gemma-2b' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: model === 'gemma-2b' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: T.text,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Gemma 2B (1.4GB)
                </button>
                <button
                  onClick={() => handleLoadModel('window-ai')}
                  disabled={!isWindowAiAvailable}
                  style={{
                    backgroundColor: model === 'window-ai' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: model === 'window-ai' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: isWindowAiAvailable ? T.text : T.textSecondary,
                    cursor: isWindowAiAvailable ? 'pointer' : 'not-allowed',
                    opacity: isWindowAiAvailable ? 1 : 0.4,
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Gemini Nano (Chrome)
                </button>
              </div>
            </div>

            {/* Loading progress */}
            {modelStatus === 'loading' && overallProgress > 0 && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                padding: '10px',
                border: `1px solid ${T.border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>{t('Caching local weights...', 'تنزيل الأوزان في ذاكرة المتصفح...')}</span>
                  <span>{overallProgress}%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${overallProgress}%`, backgroundColor: T.primary, transition: 'width 0.2s' }} />
                </div>
              </div>
            )}

            {/* Prompt input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase' }}>
                {t('Prompt Input', 'صف التصميم المطلوب')}
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    height: '80px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    color: T.text,
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {modelStatus === 'generating' && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTopColor: T.primary,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </div>
            </div>

            {/* Compile buttons */}
            <button
              onClick={handleGenerate}
              disabled={modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim()}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: `linear-gradient(135deg, ${T.primary} 0%, #4f46e5 100%)`,
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: (modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim()) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {modelStatus === 'generating' ? t('Compiling design locally...', 'جاري التجميع محلياً...') : t('Generate UI Component', 'توليد مكون واجهة المستخدم')}
            </button>

            {statusMessage && (
              <span style={{ fontSize: '11px', textAlign: 'center', color: T.textSecondary }}>
                ● {statusMessage}
              </span>
            )}

            {/* Sandboxed iframe Preview */}
            <div style={{
              height: '300px',
              borderRadius: '8px',
              border: `1px solid ${T.border}`,
              backgroundColor: '#fff',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {htmlCode ? (
                <iframe
                  ref={iframeRef}
                  title="Local AI Sandbox Preview Home"
                  srcDoc={htmlCode}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  sandbox="allow-scripts"
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⚡</span>
                  <span style={{ fontSize: '12px' }}>{t('Sandbox Preview Container', 'حاوية المعاينة والتجميع')}</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Embedded Spinner Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 991px) {
          .gemma-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
