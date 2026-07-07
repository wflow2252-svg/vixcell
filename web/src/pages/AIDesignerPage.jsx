import React, { useState, useEffect, useRef } from 'react';
import DotPixelIcon from '../components/DotPixelIcon';

// Premium Theme Palette (inspired by open-design.ai)
const T = {
  bg: '#08080a',
  bgCard: 'rgba(17, 17, 21, 0.75)',
  bgInput: '#121216',
  border: 'rgba(255, 255, 255, 0.06)',
  borderActive: 'rgba(99, 102, 241, 0.4)', // Indigo glow
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  primary: '#6366f1', // Indigo
  primaryHover: '#4f46e5',
  accent: '#10b981', // Green
  glow: 'rgba(99, 102, 241, 0.15)'
};

const STYLE_PRESETS = [
  {
    id: 'apple-minimal',
    name: 'Apple Minimal',
    icon: '💻',
    desc: 'Clean layouts, crisp typography, generous whitespace.',
    systemText: 'Design with high-end Apple-style minimalism. Use clean layouts, huge bold headings, sans-serif typography, generous margins, subtle grey borders, and an elegant professional tone. White or pitch black background.'
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    icon: '🔮',
    desc: 'Frosted glass panels, glowing blur, vibrant backdrop gradients.',
    systemText: 'Design with a heavy Glassmorphism style. Background should feature rich moving color gradients (purple/indigo/pink). Cards and elements must have backdrop-filter: blur(16px), background: rgba(255,255,255,0.06), and border: 1px solid rgba(255,255,255,0.12). Add subtle glow effects.'
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    icon: '⚡',
    desc: 'Monospace, glowing grid, neon pink & cyan accents.',
    systemText: 'Design with a futuristic Cyberpunk Neon style. Use pitch-black background, monospace fonts, angled borders, neon cyan (#00f0ff) and neon pink (#ff007f) glowing box-shadows, scanlines, and high contrast cybernetic details.'
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    icon: '🔘',
    desc: 'Soft double-shadows, extruded UI, organic feel.',
    systemText: 'Design with a Neumorphism aesthetic. Elements should have soft double-shadows for a 3D embossed look (e.g., box-shadow: 6px 6px 12px rgba(0,0,0,0.4), -6px -6px 12px rgba(255,255,255,0.03)). Use smooth rounded edges.'
  },
  {
    id: 'brutalism',
    name: 'Neo-Brutalism',
    icon: '🎨',
    desc: 'Thick black strokes, high-contrast primary colors.',
    systemText: 'Design with a bold Neo-Brutalism style. Use thick black borders (3px solid #000), harsh drop shadows (box-shadow: 4px 4px 0px #000), bright solid background colors (yellow, neon green, or orange), and aggressive layout grid.'
  }
];

const COMPONENT_PRESETS = [
  {
    name: 'Hero Landing Page',
    prompt: 'Create a high-end landing page hero section for an aerospace space tourism company. It should feature a bold heading, interactive CTA buttons with a glow effect, a sub-description, and a floating futuristic mockup container.'
  },
  {
    name: 'Interactive Pricing Cards',
    prompt: 'Create a 3-tier subscription pricing grid (Starter, Pro, Enterprise). Include a billing toggle (monthly/annually) that changes prices using simple inline javascript, glowing active card, checkmarks for features, and glassmorphic CTA buttons.'
  },
  {
    name: 'Feature Grid & Showcase',
    prompt: 'Create a 3-column features section for an AI developer platform. Each card should have hover scale animations, custom glowing icons, descriptions, and a subtle badge indicator.'
  },
  {
    name: 'FAQ Accordion',
    prompt: 'Create an interactive FAQ accordion section with 4 questions. Clicking a question should expand the answer smoothly using CSS transitions, toggling the chevron icon with pure CSS/JS.'
  },
  {
    name: 'Premium Navigation Bar',
    prompt: 'Create a responsive, glassmorphic sticky navigation bar. It should have a brand logo placeholder, links with hover slide-in underlines, and a glowing CTA button.'
  }
];

export default function AIDesignerPage({ onViewChange }) {
  const [model, setModel] = useState('qwen-fast'); // 'gemma-2b' | 'qwen-fast' | 'tinyllama' | 'window-ai'
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
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('apple-minimal');
  const [selectedComponent, setSelectedComponent] = useState('');

  // AI Loading & Execution states
  const [modelStatus, setModelStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'generating' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState({});
  const [generationOutput, setGenerationOutput] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  
  // UI Tabs and options
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code' | 'design-md'
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [isWindowAiAvailable, setIsWindowAiAvailable] = useState(false);
  const [gpuStatus, setGpuStatus] = useState('Checking GPU support...');
  const [copied, setCopied] = useState(false);

  const workerRef = useRef(null);
  const iframeRef = useRef(null);

  // Check window.ai availability and GPU
  useEffect(() => {
    // Check Chrome window.ai Prompt API
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

    // Check GPU support
    if (navigator.gpu) {
      navigator.gpu.requestAdapter().then(adapter => {
        if (adapter) {
          setGpuStatus('WebGPU Accelerated (Ready)');
        } else {
          setGpuStatus('WebAssembly CPU fallback (GPU Adapter not found)');
        }
      }).catch(() => {
        setGpuStatus('WebAssembly CPU fallback (GPU Error)');
      });
    } else {
      setGpuStatus('WebAssembly CPU (WebGPU not supported in this browser)');
    }
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
        }
      }

      else if (type === "progress") {
        setModelStatus('loading');
        setDownloadProgress(prev => ({
          ...prev,
          [data.file]: {
            progress: data.progress,
            loaded: data.loaded,
            total: data.total
          }
        }));
      }

      else if (type === "chunk") {
        setGenerationOutput(prev => {
          const newOut = prev + data;
          // Parse HTML on the fly if delimiters appear
          extractHtmlPreview(newOut);
          return newOut;
        });
      }

      else if (type === "done") {
        setModelStatus('ready');
        setStatusMessage('Generation completed successfully!');
        setGenerationOutput(data);
        extractHtmlPreview(data);
      }

      else if (type === "fallback") {
        setStatusMessage(message);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  // Update System Prompt when a preset changes
  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    const preset = STYLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSystemPrompt(
        `Act as an Elite Product Design Team composed of: Staff Product Designer, Principal UI Designer, Senior UX Researcher, Design System Architect, Staff Frontend Engineer, Senior Motion Designer, Accessibility Specialist, SEO Engineer, and Performance Optimization Engineer.

Your mission is to design and engineer a world-class premium SaaS page that could compete visually and technically with products such as Stripe, Linear, Vercel, OpenAI, Notion, and Raycast.

DO NOT copy any existing website. Instead, analyze the premium design language shared by these companies (perfect editorial spacing, visual rhythm, typography hierarchy, subtle motion, layered depth, sophisticated borders) and create an original experience inspired by their quality standards.

CRITICAL CODE REQUIREMENTS:
- Generate FULL production-ready HTML with embedded CSS and Javascript.
- Return the output strictly inside ===HTML_START=== and ===HTML_END=== delimiters.
- NO extra conversational text outside the tags.
- Use Plus Jakarta Sans and Cairo (for Arabic text).
- Import Tailwind CSS (https://cdn.tailwindcss.com) and Lucide Icons via CDN for clean styling.
- All sections must be fully written, responsive, and functional.
- Style Theme instructions: ${preset.systemText}`
      );
    }
  };

  const handleComponentSelect = (cName) => {
    const comp = COMPONENT_PRESETS.find(c => c.name === cName);
    if (comp) {
      setPrompt(comp.prompt);
      setSelectedComponent(cName);
    }
  };

  // Model Loading
  const handleLoadModel = (modelName) => {
    setModel(modelName);
    if (modelName === 'window-ai') {
      setModelStatus('ready');
      setStatusMessage('Chrome Built-in AI Gemini Nano ready!');
      return;
    }

    let modelId = '';
    if (modelName === 'gemma-2b') {
      modelId = 'onnx-community/gemma-2-2b-it-ONNX';
    } else if (modelName === 'qwen-fast') {
      modelId = 'onnx-community/Qwen2.5-0.5B-Instruct';
    } else {
      modelId = 'Xenova/TinyLlama-1.1B-Chat-v1.0';
    }

    workerRef.current.postMessage({
      type: 'load',
      data: {
        modelId,
        device: navigator.gpu ? 'webgpu' : 'wasm'
      }
    });
  };

  // Generate Execution
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerationOutput('');
    setHtmlCode('');
    setModelStatus('generating');
    setStatusMessage('Sending prompt to model...');

    // 1. Check window.ai (Gemini Nano)
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

        if (!session) {
          throw new Error('Could not create Gemini Nano session. Verify Chrome flags.');
        }

        setStatusMessage('Gemini Nano is thinking...');
        
        // Use streaming if available
        const stream = session.promptStreaming 
          ? await session.promptStreaming(`System Instruction: ${systemPrompt}\n\nUser Request: ${prompt}`)
          : null;

        if (stream) {
          let fullText = '';
          for await (const chunk of stream) {
            fullText = chunk;
            setGenerationOutput(fullText);
            extractHtmlPreview(fullText);
          }
          setModelStatus('ready');
          setStatusMessage('Generation completed!');
          session.destroy?.();
        } else {
          // Fallback to non-streaming
          const response = await session.prompt(`System Instruction: ${systemPrompt}\n\nUser Request: ${prompt}`);
          setGenerationOutput(response);
          extractHtmlPreview(response);
          setModelStatus('ready');
          setStatusMessage('Generation completed!');
          session.destroy?.();
        }
      } catch (err) {
        console.error("Gemini Nano Error:", err);
        setModelStatus('error');
        setStatusMessage(`Gemini Nano Error: ${err.message}. Ensure chrome://flags are enabled.`);
      }
    } 
    // 2. WebGPU Web Worker LLM (Gemma, Qwen, TinyLlama)
    else {
      workerRef.current.postMessage({
        type: 'generate',
        data: {
          prompt,
          systemPrompt,
          maxTokens: 2048,
          temperature: 0.6
        }
      });
    }
  };

  // Helper to extract HTML block from model output
  const extractHtmlPreview = (text) => {
    let html = '';
    // Look for ===HTML_START===
    const startIndex = text.indexOf('===HTML_START===');
    const endIndex = text.indexOf('===HTML_END===');

    if (startIndex !== -1) {
      if (endIndex !== -1) {
        html = text.substring(startIndex + 16, endIndex).trim();
      } else {
        html = text.substring(startIndex + 16).trim(); // Stream loading
      }
    } else {
      // Try searching for ```html ... ``` markdown block
      const match = text.match(/```html([\s\S]*?)(?:```|$)/);
      if (match) {
        html = match[1].trim();
      } else if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        // Raw HTML detection
        const rawStart = text.indexOf('<!DOCTYPE html>');
        const finalStart = rawStart !== -1 ? rawStart : text.indexOf('<html');
        html = text.substring(finalStart).trim();
      }
    }

    if (html) {
      // Injects styling standard Tailwind and Font Awesome / Lucide icons automatically if missing
      if (!html.includes('cdn.jsdelivr.net/npm/tailwindcss')) {
        html = html.replace('<head>', '<head>\n<script src="https://cdn.tailwindcss.com"></script>\n<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;600;700;900&family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">\n<style>body { font-family: "Plus Jakarta Sans", "Cairo", sans-serif; }</style>');
      }
      setHtmlCode(html);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlCode || generationOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate download progress percentage
  const getOverallProgress = () => {
    const keys = Object.keys(downloadProgress);
    if (keys.length === 0) return 0;
    let totalProgress = 0;
    keys.forEach(k => {
      totalProgress += downloadProgress[k].progress || 0;
    });
    return Math.round(totalProgress / keys.length);
  };

  const overallProgress = getOverallProgress();

  return (
    <div style={{
      backgroundColor: T.bg,
      color: T.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header Bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: `1px solid ${T.border}`,
        backgroundColor: 'rgba(10, 10, 12, 0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => onViewChange('landing')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              color: T.text,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Web
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              VIXCELL <span style={{ color: T.primary }}>AI Designer</span>
            </h1>
            <span style={{
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: T.primary,
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>LOCAL FIRST</span>
          </div>
        </div>

        {/* Hardware Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
          <div style={{ color: T.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Hardware:</span>
            <span style={{ color: T.accent, fontWeight: 600 }}>{gpuStatus}</span>
          </div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: modelStatus === 'ready' ? T.accent : (modelStatus === 'generating' ? '#f59e0b' : '#ef4444')
          }} />
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        overflow: 'hidden',
        height: 'calc(100vh - 60px)'
      }}>
        
        {/* Left Side: Prompt Panel & Configuration */}
        <aside style={{
          borderRight: `1px solid ${T.border}`,
          backgroundColor: 'rgba(12, 12, 16, 0.95)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          
          {/* Section: Model Setup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select AI Model (100% Offline)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              
              {/* Chrome window.ai Option */}
              <button
                onClick={() => handleLoadModel('window-ai')}
                disabled={!isWindowAiAvailable}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: model === 'window-ai' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                  backgroundColor: model === 'window-ai' ? 'rgba(99, 102, 241, 0.1)' : (isWindowAiAvailable ? T.bgInput : 'transparent'),
                  color: isWindowAiAvailable ? T.text : T.textMuted,
                  cursor: isWindowAiAvailable ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>Gemini Nano (Chrome Built-in)</span>
                  <span style={{ fontSize: '11px', color: T.textSecondary }}>Zero download, instant startup</span>
                </div>
                {!isWindowAiAvailable && <span style={{ fontSize: '10px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Unavailable</span>}
              </button>

              {/* Local Qwen 0.5B (Fast WebGPU) */}
              <button
                onClick={() => handleLoadModel('qwen-fast')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: model === 'qwen-fast' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                  backgroundColor: model === 'qwen-fast' ? 'rgba(99, 102, 241, 0.1)' : T.bgInput,
                  color: T.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>Qwen 2.5 0.5B (Fast WebGPU)</span>
                  <span style={{ fontSize: '11px', color: T.textSecondary }}>Lightweight download (~350MB), fast</span>
                </div>
              </button>

              {/* Local Gemma 2 2B (Google Model) */}
              <button
                onClick={() => handleLoadModel('gemma-2b')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: model === 'gemma-2b' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                  backgroundColor: model === 'gemma-2b' ? 'rgba(99, 102, 241, 0.1)' : T.bgInput,
                  color: T.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>Gemma 2 2B (Google WebGPU)</span>
                  <span style={{ fontSize: '11px', color: T.textSecondary }}>Best design reasoning (~1.4GB)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Download Progress Bar */}
          {modelStatus === 'loading' && overallProgress > 0 && (
            <div style={{
              backgroundColor: T.bgInput,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: T.textSecondary }}>Downloading Model weights...</span>
                <span style={{ color: T.primary, fontWeight: 700 }}>{overallProgress}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${overallProgress}%`, backgroundColor: T.primary, transition: 'width 0.2s ease' }} />
              </div>
              <p style={{ fontSize: '10px', color: T.textMuted, marginTop: '8px', lineHeight: '1.4' }}>
                Weights will be stored in your browser cache and won't be re-downloaded next time.
              </p>
            </div>
          )}

          {/* Section: Custom AI Behavior Instruction */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                System Instruction (Behavior)
              </label>
              <span style={{ fontSize: '10px', color: T.primary }}>Customizable</span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                backgroundColor: T.bgInput,
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '8px 12px',
                color: T.text,
                fontSize: '11px',
                lineHeight: '1.5',
                resize: 'none',
                outline: 'none',
                fontFamily: 'monospace'
              }}
              placeholder="Define rules for the AI (e.g. use bright colors, design only RTL Arabic pages...)"
            />
          </div>

          {/* Section: Style Catalogs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Design Style Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  style={{
                    backgroundColor: selectedPreset === preset.id ? 'rgba(99, 102, 241, 0.12)' : T.bgInput,
                    border: selectedPreset === preset.id ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    color: T.text,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{preset.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Component Library */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Component Template Library
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '130px',
              overflowY: 'auto',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              padding: '6px'
            }}>
              {COMPONENT_PRESETS.map((comp) => (
                <button
                  key={comp.name}
                  onClick={() => handleComponentSelect(comp.name)}
                  style={{
                    backgroundColor: selectedComponent === comp.name ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: selectedComponent === comp.name ? T.text : T.textSecondary,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{comp.name}</span>
                  <span>⚡</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Prompt Input */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              What do you want to design?
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{
                  width: '100%',
                  height: '90px',
                  backgroundColor: T.bgInput,
                  border: `1px solid ${T.border}`,
                  borderRadius: '12px',
                  padding: '12px 42px 12px 12px',
                  color: T.text,
                  fontSize: '13px',
                  lineHeight: '1.4',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Describe your design in detail... (e.g. A space travel reservation portal with glassmorphic elements)"
              />
              {/* Generating overlay spinner */}
              {modelStatus === 'generating' && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: T.primary,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </div>

            {/* Glowing Action Button */}
            <button
              onClick={handleGenerate}
              disabled={modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim() 
                  ? '#1f1f25' 
                  : `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryHover} 100%)`,
                color: modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim() ? T.textMuted : '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: modelStatus === 'generating' || modelStatus === 'loading' || !prompt.trim() 
                  ? 'none' 
                  : `0 4px 15px ${T.glow}`,
                transition: 'all 0.2s ease'
              }}
            >
              {modelStatus === 'generating' ? (
                <>Designing in browser...</>
              ) : modelStatus === 'loading' ? (
                <>Loading local weights...</>
              ) : (
                <>✨ Generate Design Layout</>
              )}
            </button>

            {/* Micro Status Indicators */}
            {statusMessage && (
              <span style={{
                fontSize: '10px',
                textAlign: 'center',
                color: modelStatus === 'error' ? '#ef4444' : T.textSecondary,
                opacity: 0.8
              }}>
                {modelStatus === 'error' ? '⚠️ ' : '● '} {statusMessage}
              </span>
            )}
          </div>

        </aside>

        {/* Right Side: Preview & Canvas area */}
        <main style={{
          backgroundColor: '#0a0a0d',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden'
        }}>
          
          {/* Top Bar for Viewports and Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${T.border}`,
            paddingBottom: '12px'
          }}>
            
            {/* View Tabs */}
            <div style={{
              display: 'flex',
              backgroundColor: '#121216',
              borderRadius: '8px',
              padding: '3px',
              border: `1px solid ${T.border}`
            }}>
              <button
                onClick={() => setActiveTab('preview')}
                style={{
                  background: activeTab === 'preview' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'preview' ? T.primary : T.textSecondary,
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                👁️ Live Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                style={{
                  background: activeTab === 'code' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'code' ? T.primary : T.textSecondary,
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                💻 Code View
              </button>
              <button
                onClick={() => setActiveTab('design-md')}
                style={{
                  background: activeTab === 'design-md' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'design-md' ? T.primary : T.textSecondary,
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📄 DESIGN.md Settings
              </button>
            </div>

            {/* Viewport Toggles (only visible in Preview Tab) */}
            {activeTab === 'preview' && (
              <div style={{
                display: 'flex',
                backgroundColor: '#121216',
                borderRadius: '8px',
                padding: '3px',
                border: `1px solid ${T.border}`
              }}>
                <button
                  onClick={() => setViewportMode('desktop')}
                  style={{
                    background: viewportMode === 'desktop' ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    color: viewportMode === 'desktop' ? T.text : T.textMuted,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Desktop View
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  style={{
                    background: viewportMode === 'mobile' ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    color: viewportMode === 'mobile' ? T.text : T.textMuted,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Mobile View
                </button>
              </div>
            )}

            {/* Action Buttons (Copy/Download) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCopyCode}
                disabled={!htmlCode && !generationOutput}
                style={{
                  backgroundColor: T.bgInput,
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  color: T.text,
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: (htmlCode || generationOutput) ? 'pointer' : 'not-allowed',
                  opacity: (htmlCode || generationOutput) ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>

          </div>

          {/* Sandbox Canvas Area */}
          <div style={{
            flex: 1,
            backgroundColor: '#070709',
            border: `1px solid ${T.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            
            {/* TAB 1: Preview Canvas */}
            {activeTab === 'preview' && (
              <>
                {htmlCode ? (
                  viewportMode === 'mobile' ? (
                    /* iPhone Mockup Frame */
                    <div style={{
                      width: '375px',
                      height: '620px',
                      border: '12px solid #1a1a24',
                      borderRadius: '36px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                      backgroundColor: '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Notch Camera */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '120px',
                        height: '18px',
                        backgroundColor: '#1a1a24',
                        borderRadius: '0 0 12px 12px',
                        zIndex: 10
                      }} />
                      <iframe
                        ref={iframeRef}
                        title="Local AI Live Sandbox Mobile"
                        srcDoc={htmlCode}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          paddingTop: '18px',
                          backgroundColor: '#fff'
                        }}
                        sandbox="allow-scripts"
                      />
                    </div>
                  ) : (
                    /* Desktop Frame */
                    <iframe
                      ref={iframeRef}
                      title="Local AI Live Sandbox Desktop"
                      srcDoc={htmlCode}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: '#fff'
                      }}
                      sandbox="allow-scripts"
                    />
                  )
                ) : (
                  /* Empty state */
                  <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🎨</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Your AI Design Sandbox</h3>
                    <p style={{ fontSize: '13px', color: T.textSecondary, lineHeight: '1.6' }}>
                      Select a model on the left, type a description, and watch code compile into a live sandboxed interface in real-time.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: Raw Code View */}
            {activeTab === 'code' && (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0a0a0d',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                overflow: 'auto',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                {htmlCode || generationOutput ? (
                  <pre style={{ margin: 0, color: '#a5b4fc', textAlign: 'left', direction: 'ltr' }}>
                    <code>{htmlCode || generationOutput}</code>
                  </pre>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.textMuted }}>
                    No code generated yet. Describe your design and click generate.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DESIGN.md Asset Inspector */}
            {activeTab === 'design-md' && (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0a0a0d',
                padding: '24px',
                boxSizing: 'border-box',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: T.primary }}>DESIGN.md - Local Brand Identity</h3>
                <p style={{ fontSize: '13px', color: T.textSecondary }}>
                  This file configures global rules that the model reads before generating layouts.
                </p>
                <div style={{
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  backgroundColor: T.bgInput,
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  direction: 'ltr'
                }}>
                  <p style={{ color: T.accent }}># VIXCELL DESIGN IDENTITY</p>
                  <p style={{ color: T.textMuted }}>## Typography Rules</p>
                  <p>- Heading: Plus Jakarta Sans / Manrope</p>
                  <p>- Body: Cairo (Arabic) / Inter (English)</p>
                  <br />
                  <p style={{ color: T.textMuted }}>## Color Palette Tokens</p>
                  <p>- Primary Accent: #6366f1 (Indigo)</p>
                  <p>- Secondary Accent: #10b981 (Emerald)</p>
                  <p>- Neutral Dark: #08080a</p>
                  <br />
                  <p style={{ color: T.textMuted }}>## Animation Principles</p>
                  <p>- Soft Micro-interactions: scale(1.02) on hover</p>
                  <p>- State transitions: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)</p>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Embedded Animations & Spinners */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
