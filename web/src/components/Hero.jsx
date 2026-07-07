import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ThreeDLogo from './ThreeDLogo'
import DotPixelIcon from './DotPixelIcon'
import ErrorBoundary from './ErrorBoundary'

export default function Hero({ onStartProject, lang }) {
  const heroRef = useRef(null)
  const contentRef = useRef(null)
  const mockupRef = useRef(null)

  const t = (en, ar) => (lang === 'ar' ? ar : en)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in text elements
      gsap.fromTo(contentRef.current.querySelectorAll('.hero-fade-in'), 
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
      )
      // Fade in mockup frame
      gsap.fromTo(mockupRef.current,
        { opacity: 0, scale: 0.96, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 0.6 }
      )
    }, heroRef)
    
    return () => ctx.revert()
  }, [])

  return (
    <section className="hero" ref={heroRef} style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '140px 24px 80px',
      overflow: 'hidden',
      backgroundColor: '#08080a', // Dark theme matching the navbar and rest of page
      textAlign: 'center',
      color: '#ffffff',
      direction: lang === 'ar' ? 'rtl' : 'ltr'
    }}>
      
      {/* Ambient Background 3D Logo / Grid */}
      <div className="logo-3d-wrapper" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.2,
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <ErrorBoundary>
          <ThreeDLogo />
        </ErrorBoundary>
      </div>

      {/* Grid lines background (Subtle dark grid) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* ─── FLOATING DESIGN TOOLS (Left & Right Sides PNG Assets) ─── */}
      {/* Left side: Exact user-provided design assets image */}
      <div style={{
        position: 'absolute',
        left: '3%',
        top: '10%',
        display: 'block',
        pointerEvents: 'none',
        userSelect: 'none',
        width: '300px',
        zIndex: 2
      }} className="floating-left-asset">
        <img
          src="/vixcell_left_design_assets.png"
          alt="Design Assets"
          style={{
            width: '100%',
            height: 'auto',
            opacity: 0.85,
            filter: 'drop-shadow(0px 8px 24px rgba(99,102,241,0.08))'
          }}
        />
      </div>

      {/* Right side: Golden Ratio and Blue cylinder elements */}
      <div style={{
        position: 'absolute',
        right: '4%',
        top: '18%',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        pointerEvents: 'none',
        userSelect: 'none',
        alignItems: 'flex-end',
        maxWidth: '260px',
        zIndex: 2
      }} className="floating-right-asset">
        {/* Golden Ratio card */}
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4px',
          borderRadius: '16px',
          backgroundColor: 'rgba(10, 10, 14, 0.6)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}>
          <svg style={{ width: '192px', height: '128px' }} viewBox="0 0 100 60" fill="none">
            <rect x="2" y="2" width="96" height="56" rx="4" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            <path d="M50 2V58M2 30H98" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            <path d="M50,30 A20,20 0 0,1 70,30 A40,40 0 0,1 30,30 A80,80 0 0,1 98,30" strokeWidth="0.3" stroke="#555555" />
          </svg>
        </div>

        {/* Small floating blue cylinder/stylus decoration element */}
        <div style={{
          width: '80px',
          height: '24px',
          background: 'linear-gradient(90deg, #22d3ee 0%, #8b5cf6 100%)',
          borderRadius: '9999px',
          transform: 'rotate(12deg)',
          opacity: 0.8,
          boxShadow: '0 2px 10px rgba(99,102,241,0.2)',
          border: '1px solid rgba(255,255,255,0.2)'
        }} />
      </div>

      <div ref={contentRef} style={{
        position: 'relative',
        zIndex: 3,
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        
        {/* Small Centered Badge */}
        <div className="hero-fade-in" style={{
          fontSize: '10px',
          fontWeight: 900,
          color: '#22C55E',
          letterSpacing: '0.15em',
          textTransform: 'uppercase'
        }}>
          {t('OPEN SOURCE DESIGN WORKSPACE', 'بديل وكالات التصميم بنظام ذكاء اصطناعي محلي 100%')}
        </div>

        {/* ─── FIGMA SELECTION BOX TITLE (Glowing Dark Layout) ─── */}
        <div className="hero-fade-in" style={{
          border: '2px solid #22C55E',
          padding: '48px 32px',
          position: 'relative',
          maxWidth: '650px',
          width: '100%',
          margin: '0 auto',
          borderRadius: '4px',
          backgroundColor: 'rgba(10, 10, 14, 0.4)',
          backdropFilter: 'blur(12px)',
          userSelect: 'none',
          boxShadow: '0 0 40px rgba(34, 197, 94, 0.08)'
        }}>
          {/* Corner nodes (Handles) */}
          <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #22C55E', borderRadius: '1px' }} />
          <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #22C55E', borderRadius: '1px' }} />
          <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #22C55E', borderRadius: '1px' }} />
          <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #22C55E', borderRadius: '1px' }} />

          {/* Heading content */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            margin: 0,
            color: '#ffffff'
          }}>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'normal', display: 'block', marginBottom: '8px', color: '#a5b4fc' }}>Vixcell</span>
            <span style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', display: 'block' }}>
              {t('The Vibe Design Workspace', 'منصة تصميم الواجهات الذكية')}
            </span>
          </h1>
        </div>

        {/* Centered CTA Buttons */}
        <div className="hero-fade-in" style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={onStartProject}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              fontWeight: 700,
              padding: '14px 32px',
              borderRadius: '9999px',
              fontSize: '12px',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
            }}
            className="hover-scale-btn"
          >
            {t('Download workspace · Windows', 'تحميل منصة العمل · ويندوز')}
          </button>

          <a
            href="mailto:hello@vixcell.com"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '14px 32px',
              borderRadius: '9999px',
              fontSize: '12px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
            className="hover-glow-btn"
          >
            {t('Book a Strategy Call', 'احجز جلسة استشارية')}
          </a>
        </div>

        {/* Centered Support Text */}
        <p className="hero-fade-in" style={{
          fontSize: 'clamp(11px, 1.5vw, 13px)',
          color: '#a1a1aa',
          maxWidth: '650px',
          lineHeight: 1.6,
          margin: '8px 0 0',
          textAlign: 'center'
        }}>
          {t(
            'Vixcell is the open-source, local vibe design workspace — it turns the coding agents you already run into a design engine that carries you from idea to prototype, web, slides, and HTML video, all finished on your own machine. Agent-native, with 21 coding agents, 129 design systems, and an Apache-2.0 license.',
            'فيكسل هي بيئة عمل مفتوحة المصدر ومحلية لتصميم الواجهات الرقمية — تقوم بتحويل مساعدي البرمجة لديك لمحرك تصميم متكامل ينقلك من الفكرة إلى النموذج الأولي، الويب، الشرائح، وفيديو HTML، كل ذلك على جهازك المحلي وبخصوصية كاملة.'
          )}
        </p>

        {/* ─── INNER WORKSPACE PREVIEW WINDOW (From Video) ─── */}
        <div ref={mockupRef} style={{
          width: '100%',
          marginTop: '64px',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(10, 10, 14, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '8px',
          borderRadius: '16px',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.05)',
          overflow: 'hidden'
        }} className="hero-mockup-window">
          {/* Mockup bar */}
          <div style={{
            display: 'flex',
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            marginBottom: '8px',
            backgroundColor: 'rgba(15, 15, 20, 0.5)',
            justifyContent: 'between',
            alignItems: 'center'
          }} className="mockup-bar">
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            </div>
            <div style={{ fontSize: '9px', color: '#71717A', fontFamily: 'monospace', letterSpacing: '0.1em', margin: '0 auto' }}>VIXCELL WORKSPACE CLIENT</div>
            <div style={{ width: '32px' }} />
          </div>

          {/* Interactive workspace interior screenshot */}
          <div style={{
            backgroundColor: 'rgba(8, 8, 10, 0.8)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            textAlign: 'left'
          }} className="mockup-interior">
            {/* Left sidebar info panel */}
            <div style={{
              width: '32%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#8e8e93',
              backgroundColor: 'rgba(17, 17, 21, 0.6)',
              border: '1px solid rgba(255,255,255,0.04)',
              padding: '16px',
              borderRadius: '8px'
            }} className="mockup-sidebar">
              <div style={{
                fontWeight: 'bold',
                color: '#ffffff',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
                justifyContent: 'between',
                alignItems: 'center'
              }}>
                <span>Liquid Glass Agency</span>
                <span style={{ color: '#22C55E', marginLeft: 'auto' }}>● Active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>1. Visual Identity "Liquid Glass"</span>
                  <p style={{ marginTop: '4px', lineHeight: 1.4 }}>The core of the design is liquid glass, glassmorphism effect. Every component is custom made, with high-end glass borders.</p>
                </div>
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>2. Dark & Light Balance</span>
                  <p style={{ marginTop: '4px', lineHeight: 1.4 }}>The page uses dynamic light backdrops mixed with deep pure black sections, creating a premium contrast.</p>
                </div>
              </div>
            </div>

            {/* Right preview/mockup browser */}
            <div style={{
              flex: 1,
              backgroundColor: 'rgba(10, 10, 14, 0.4)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '300px'
            }} className="mockup-browser">
              <div style={{
                padding: '6px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                backgroundColor: 'rgba(15, 15, 20, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#71717A'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3a3a3c' }} />
                  <span>localhost:3000/demo</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>HTML</span>
                  <span>React</span>
                </div>
              </div>
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.03) 0%, rgba(10,10,14,0.6) 50%, rgba(8,8,10,0.8) 100%)'
              }}>
                <h3 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '36px', color: '#ffffff', margin: '0 0 8px 0' }}>Qelora</h3>
                <p style={{ fontSize: '10px', color: '#8e8e93', maxWidth: '280px', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>Designing places beyond what's expected. Easy living starts here.</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button style={{ backgroundColor: '#ffffff', color: '#000000', fontSize: '9px', fontWeight: 'bold', padding: '6px 16px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}>Start Project</button>
                  <button style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#ffffff', fontSize: '9px', fontWeight: 'bold', padding: '6px 16px', borderRadius: '9999px', cursor: 'pointer' }}>Watch Film</button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Styles for Hover and Responsive Layouts */}
      <style>{`
        .hover-scale-btn:hover {
          transform: translateY(-1px);
          background-color: #f3f4f6 !important;
          box-shadow: 0 6px 20px rgba(255,255,255,0.15) !important;
        }
        .hover-glow-btn:hover {
          border-color: #22C55E !important;
          background-color: rgba(255,255,255,0.05) !important;
        }
        @media (max-width: 1200px) {
          .floating-left-asset, .floating-right-asset {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .mockup-interior {
            flex-direction: column !important;
          }
          .mockup-sidebar {
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  )
}
