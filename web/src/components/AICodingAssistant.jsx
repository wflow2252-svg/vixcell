import React, { useState, useEffect, useRef } from 'react';
import DotPixelIcon from './DotPixelIcon';

const T = {
  bg: '#0c0c0e',
  bg2: '#131316',
  bg3: '#1a1a1f',
  border: 'rgba(250, 246, 240,0.08)',
  borderH: 'rgba(250, 246, 240,0.16)',
  text: '#e8e8ed',
  text2: '#a8a8b3',
  text3: '#6b6b75',
  gold: '#c8a35c',
  goldH: '#d4b06a',
  goldDim: 'rgba(200,163,92,0.12)',
  purple: '#a855f7',
  purpleDim: 'rgba(168,85,247,0.12)',
  success: '#10b981',
  error: '#ef4444'
};

const styles = {
  wrapper: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${T.border}`,
    paddingBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #e8e8ed 0%, #c8a35c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'right'
  },
  subtitle: {
    margin: '4px 0 0',
    color: T.text2,
    fontSize: '13px',
    textAlign: 'right'
  },
  card: {
    background: T.bg2,
    border: `1px solid ${T.border}`,
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)'
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: '12px',
    padding: '16px',
    color: T.text,
    fontSize: '14px',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    textAlign: 'right',
    direction: 'rtl'
  },
  btnSubmit: {
    background: `linear-gradient(135deg, ${T.gold} 0%, #a8813c 100%)`,
    color: T.bg,
    border: 'none',
    borderRadius: '10px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'flex-end',
    boxShadow: '0 4px 12px rgba(200, 163, 92, 0.2)'
  },
  btnDisabled: {
    background: T.border,
    color: T.text3,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  statusWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    margin: '20px 0'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: '10px',
    transition: 'all 0.3s ease'
  },
  statusIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: T.border
  },
  progressBar: {
    height: '4px',
    width: '100%',
    background: 'rgba(250, 246, 240,0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '8px'
  },
  progressFill: {
    height: '100%',
    background: T.gold,
    transition: 'width 0.4s ease'
  },
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${T.border}`,
    marginBottom: '16px',
    gap: '12px',
    direction: 'rtl'
  },
  tab: {
    background: 'none',
    border: 'none',
    color: T.text3,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  tabActive: {
    color: T.gold
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: T.gold,
    borderRadius: '2px'
  },
  codeWrap: {
    position: 'relative',
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '13px',
    lineHeight: '1.5'
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: T.bg3,
    padding: '10px 16px',
    borderBottom: `1px solid ${T.border}`
  },
  btnCopy: {
    background: T.border,
    color: T.text2,
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  codePre: {
    margin: 0,
    padding: '16px',
    overflowX: 'auto',
    color: '#a9b1d6',
    textAlign: 'left',
    direction: 'ltr',
    maxHeight: '450px',
    overflowY: 'auto'
  },
  mdContent: {
    color: T.text,
    fontSize: '14px',
    lineHeight: '1.7',
    textAlign: 'right',
    direction: 'rtl'
  }
};

export default function AICodingAssistant() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1 = analysis, 2 = frontend, 3 = backend, 4 = security, 5 = finished
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'analysis' | 'frontend' | 'backend' | 'security'
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [reloadKey, setReloadKey] = useState(0);

  const stepTimerRef = useRef(null);

  const getCleanHtml = (html) => {
    if (!html) return '';
    let cleaned = html.trim();
    const match = cleaned.match(/```(?:html|xml)?([\s\S]*?)```/);
    if (match) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/i, '').replace(/```$/, '').trim();
    }
    return cleaned;
  };

  const steps = [
    { id: 1, label: 'تحليل المتطلبات وهندسة النظام', labelEn: 'Analyzing & Architecting', emoji: '🧠', color: T.gold },
    { id: 2, label: 'تصميم وبناء الواجهات الرسومية', labelEn: 'Frontend Development', emoji: '🎨', color: T.purple },
    { id: 3, label: 'تطوير الخوادم والمنطق الخلفي', labelEn: 'Backend Development', emoji: '⚙️', color: T.gold },
    { id: 4, label: 'تدقيق الأمان وفحص الثغرات الحماية', labelEn: 'Security & Vulnerability Audit', emoji: '🛡️', color: '#ef4444' }
  ];

  // Simulated stepper animation while the single call executes
  const startStepping = () => {
    setCurrentStep(1);
    stepTimerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) {
          return prev + 1;
        } else {
          clearInterval(stepTimerRef.current);
          return prev;
        }
      });
    }, 4500); // Progress to next step every 4.5 seconds
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setErrorMsg('');
    startStepping();

    try {
      const res = await fetch('/api/ai/coding-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (data.success && data.data) {
        clearInterval(stepTimerRef.current);
        setCurrentStep(5); // Instantly finish
        setResult(data.data);
        setActiveTab('preview');
      } else {
        throw new Error(data.message || 'فشل التوليد');
      }
    } catch (err) {
      clearInterval(stepTimerRef.current);
      setCurrentStep(0);
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe markdown wrapper render
  const renderMarkdown = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return <h3 key={idx} style={{ color: T.gold, marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 700 }}>{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('##')) {
        return <h2 key={idx} style={{ color: T.gold, marginTop: '20px', marginBottom: '10px', fontSize: '18px', fontWeight: 800 }}>{line.replace('##', '').trim()}</h2>;
      }
      if (line.startsWith('-') || line.startsWith('*')) {
        return <li key={idx} style={{ marginRight: '16px', marginBottom: '4px' }}>{line.substring(1).trim()}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={idx} style={{ marginRight: '16px', marginBottom: '6px', listStyleType: 'decimal' }}>{line.replace(/^\d+\./, '').trim()}</li>;
      }
      if (line.trim() === '') return <div key={idx} style={{ height: '8px' }} />;
      return <p key={idx} style={{ margin: '4px 0', color: T.text }}>{line}</p>;
    });
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>AI Software Architect</h1>
          <p style={styles.subtitle}>بناء متكامل وتصميم للأنظمة البرمجية متوافق مع معايير الأمان باستخدام Gemma 2</p>
        </div>
      </div>

      {/* Input Form */}
      <div style={styles.card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <textarea
            style={{
              ...styles.textarea,
              borderColor: prompt.trim() ? T.goldH : T.border
            }}
            placeholder="اكتب فكرة التطبيق أو الوظيفة المطلوبة (مثال: إنشاء نظام مصادقة JWT متكامل مع حماية XSS وتخزين بيانات SQLite)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {errorMsg && <span style={{ color: T.error, fontSize: '13px' }}>⚠️ {errorMsg}</span>}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                ...styles.btnSubmit,
                ...(loading || !prompt.trim() ? styles.btnDisabled : {})
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'vxSpin 1s linear infinite'
                  }} />
                  جاري البناء...
                </>
              ) : (
                'ابدأ البناء الذكي'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Steps & Progress */}
      {loading && (
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px', color: T.text, fontSize: '14px', textAlign: 'right' }}>مراحل تنفيذ البناء الذكي:</h3>
          <div style={styles.statusWrap}>
            {steps.map((step) => {
              const active = currentStep === step.id;
              const completed = currentStep > step.id;
              const pending = currentStep < step.id;

              return (
                <div
                  key={step.id}
                  style={{
                    ...styles.statusItem,
                    borderColor: active ? step.color : T.border,
                    opacity: pending ? 0.4 : 1,
                    transform: active ? 'scale(1.01)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>{step.emoji}</span>
                    <span style={{ color: active ? '#FAF6F0' : T.text2, fontSize: '14px', fontWeight: active ? 700 : 500 }}>
                      {step.label}
                    </span>
                  </div>
                  <div>
                    {completed && <span style={{ color: T.success, fontWeight: 700 }}>✓ مكتمل</span>}
                    {active && <span style={{ color: step.color, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>● جاري التنفيذ...</span>}
                    {pending && <span style={{ color: T.text3 }}>قيد الانتظار</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Finished Results tabbed interface */}
      {result && (
        <div style={styles.card}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('preview')}
              style={{ ...styles.tab, ...(activeTab === 'preview' ? styles.tabActive : {}) }}
            >
              👁️ معاينة الواجهة (Preview)
              {activeTab === 'preview' && <span style={styles.tabIndicator} />}
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              style={{ ...styles.tab, ...(activeTab === 'analysis' ? styles.tabActive : {}) }}
            >
              🧠 هندسة النظام
              {activeTab === 'analysis' && <span style={styles.tabIndicator} />}
            </button>
            <button
              onClick={() => setActiveTab('frontend')}
              style={{ ...styles.tab, ...(activeTab === 'frontend' ? styles.tabActive : {}) }}
            >
              🎨 Frontend Code
              {activeTab === 'frontend' && <span style={styles.tabIndicator} />}
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              style={{ ...styles.tab, ...(activeTab === 'backend' ? styles.tabActive : {}) }}
            >
              ⚙️ Backend Code
              {activeTab === 'backend' && <span style={styles.tabIndicator} />}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{ ...styles.tab, ...(activeTab === 'security' ? styles.tabActive : {}) }}
            >
              🛡️ الأمان والحماية
              {activeTab === 'security' && <span style={styles.tabIndicator} />}
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ marginTop: '16px' }}>
            {activeTab === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {/* Simulated Browser Top Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: T.bg3,
                  border: `1px solid ${T.border}`,
                  borderRadius: '12px 12px 0 0',
                  padding: '10px 16px',
                  gap: '16px',
                  boxSizing: 'border-box'
                }}>
                  {/* Left window control dots */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
                  </div>

                  {/* Address input */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: T.text2,
                    direction: 'ltr',
                    textAlign: 'left',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '12px' }}>🔒</span>
                    <span style={{ fontFamily: 'monospace' }}>vixcell-sandbox.app/live-preview</span>
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Reload Button */}
                    <button
                      onClick={() => setReloadKey(prev => prev + 1)}
                      style={{
                        background: 'rgba(250, 246, 240,0.04)',
                        border: `1px solid ${T.border}`,
                        color: T.text2,
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="إعادة تحميل المعاينة"
                    >
                      🔄 تحديث
                    </button>

                    {/* Viewport Toggles */}
                    <div style={{
                      display: 'flex',
                      background: T.bg,
                      borderRadius: '8px',
                      padding: '2px',
                      border: `1px solid ${T.border}`
                    }}>
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        style={{
                          background: previewMode === 'desktop' ? T.goldDim : 'transparent',
                          border: 'none',
                          color: previewMode === 'desktop' ? T.gold : T.text3,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        💻 شاشة كاملة
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        style={{
                          background: previewMode === 'mobile' ? T.goldDim : 'transparent',
                          border: 'none',
                          color: previewMode === 'mobile' ? T.gold : T.text3,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        📱 جوال
                      </button>
                    </div>
                  </div>
                </div>

                {/* Device Sandbox Area */}
                <div style={{
                  background: '#16161a',
                  borderRadius: '0 0 12px 12px',
                  border: `1px solid ${T.border}`,
                  borderTop: 'none',
                  padding: previewMode === 'mobile' ? '30px 10px' : '0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '550px',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  {previewMode === 'mobile' ? (
                    /* Smartphone Device Frame Wrapper */
                    <div style={{
                      width: '375px',
                      height: '620px',
                      background: '#FAF6F0',
                      border: '14px solid #28282e',
                      borderRadius: '40px',
                      boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxSizing: 'border-box'
                    }}>
                      {/* Notch Speaker/Camera */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '150px',
                        height: '24px',
                        background: '#28282e',
                        borderRadius: '0 0 18px 18px',
                        zIndex: 10,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <div style={{ width: '45px', height: '4px', borderRadius: '2px', background: '#1c1c1f' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1c1c1f', marginLeft: '8px' }} />
                      </div>

                      <iframe
                        key={reloadKey}
                        title="Frontend Live Preview Mobile"
                        srcDoc={getCleanHtml(result.frontend)}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: '#FAF6F0',
                          paddingTop: '24px',
                          boxSizing: 'border-box'
                        }}
                        sandbox="allow-scripts"
                      />
                    </div>
                  ) : (
                    /* Desktop Frame Full Width */
                    <iframe
                      key={reloadKey}
                      title="Frontend Live Preview Desktop"
                      srcDoc={getCleanHtml(result.frontend)}
                      style={{
                        width: '100%',
                        height: '580px',
                        border: 'none',
                        background: '#FAF6F0',
                        boxSizing: 'border-box'
                      }}
                      sandbox="allow-scripts"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div style={styles.mdContent}>
                {renderMarkdown(result.analysis)}
              </div>
            )}

            {activeTab === 'frontend' && (
              <div style={styles.codeWrap}>
                <div style={styles.codeHeader}>
                  <button style={styles.btnCopy} onClick={() => handleCopy(result.frontend)}>
                    {copied ? '✓ تم النسخ' : 'نسخ الكود'}
                  </button>
                  <span style={{ color: T.text3 }}>Frontend Blueprint</span>
                </div>
                <pre style={styles.codePre}><code>{result.frontend}</code></pre>
              </div>
            )}

            {activeTab === 'backend' && (
              <div style={styles.codeWrap}>
                <div style={styles.codeHeader}>
                  <button style={styles.btnCopy} onClick={() => handleCopy(result.backend)}>
                    {copied ? '✓ تم النسخ' : 'نسخ الكود'}
                  </button>
                  <span style={{ color: T.text3 }}>Backend Blueprint</span>
                </div>
                <pre style={styles.codePre}><code>{result.backend}</code></pre>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={styles.mdContent}>
                {renderMarkdown(result.security)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
