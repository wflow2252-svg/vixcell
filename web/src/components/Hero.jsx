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
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
      )
      // Fade in mockup frame
      gsap.fromTo(mockupRef.current,
        { opacity: 0, scale: 0.95, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 0.6 }
      )
    }, heroRef)
    
    return () => ctx.revert()
  }, [])

  const scrollToGemma = () => {
    const el = document.getElementById('gemma-playground')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" ref={heroRef} style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      padding: '120px 0 80px',
      backgroundColor: '#050507',
      overflow: 'hidden'
    }}>
      {/* Ambient Background 3D Logo / Grid */}
      <div className="logo-3d-wrapper" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.25,
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <ErrorBoundary>
          <ThreeDLogo />
        </ErrorBoundary>
      </div>

      {/* Grid lines background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <div className="container" style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }} className="hero-split-grid">
          
          {/* Left Column: Headline and CTAs */}
          <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="hero-fade-in" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '100px',
              padding: '6px 16px',
              width: 'fit-content'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🚀 {t('LOCAL-FIRST AI STUDIO', 'استوديو الذكاء الاصطناعي المحلي')}
              </span>
            </div>

            <h1 className="hero-fade-in" style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
              color: '#fff',
              textAlign: lang === 'ar' ? 'right' : 'left'
            }}>
              {t(
                <>We engineer <span style={{ background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>next-gen</span> digital products.</>,
                <>نحن نصمم <span style={{ background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>الجيل القادم</span> من المنتجات الرقمية.</>
              )}
            </h1>

            <p className="hero-fade-in" style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.6,
              color: '#a1a1aa',
              margin: 0,
              maxWidth: '560px',
              textAlign: lang === 'ar' ? 'right' : 'left'
            }}>
              {t(
                'Vixcell is a design & technology studio. We build custom platforms, mobile applications, and brand identities with 100% private, local-first on-device AI integrations.',
                'فيكسل هو استوديو للتصميم والبرمجة. نحن نطور منصات مخصصة، تطبيقات جوال، وهويات تجارية مدعومة بذكاء اصطناعي محلي خاص يعمل بالكامل داخل المتصفح.'
              )}
            </p>

            {/* CTA Actions */}
            <div className="hero-fade-in" style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
              flexWrap: 'wrap',
              justifyContent: lang === 'ar' ? 'flex-start' : 'flex-start',
              direction: lang === 'ar' ? 'rtl' : 'ltr'
            }}>
              <button 
                onClick={onStartProject}
                style={{
                  backgroundColor: '#fff',
                  color: '#09090b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.1)'
                }}
                className="hover-scale-btn"
              >
                <span>{t('Start a Project', 'ابدأ مشروعاً')}</span>
                <DotPixelIcon name="arrowRightPixel" size={12} color="#09090b" />
              </button>

              <button 
                onClick={scrollToGemma}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.25s ease'
                }}
                className="hover-glow-btn"
              >
                <span>✨ {t('Try Local AI Generator', 'جرب المولد الذكي')}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Floating Dashboard Mockup */}
          <div ref={mockupRef} style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }} className="hero-mockup-container">
            
            {/* Glowing Backdrop Aura */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              zIndex: 1,
              pointerEvents: 'none'
            }} />

            {/* Glowing Mockup Card */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(10, 10, 14, 0.8)',
              backdropFilter: 'blur(20px)',
              padding: '8px',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.05)',
              transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
              transition: 'transform 0.5s ease',
              width: '100%'
            }}
            className="hover-mockup-card"
            >
              {/* Window Controls */}
              <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
              </div>

              {/* Product Image */}
              <img 
                src="/vixcell_ai_designer_hero.png" 
                alt="Vixcell AI Designer Mockup" 
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Styles for Hover Effects */}
      <style>{`
        .hover-scale-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.15) !important;
        }
        .hover-glow-btn:hover {
          background-color: rgba(255,255,255,0.07) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
        }
        .hover-mockup-card:hover {
          transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.01) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.9), 0 0 60px rgba(99, 102, 241, 0.1) !important;
        }
        @media (max-width: 991px) {
          .hero-split-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 50px !important;
          }
          .hero-split-grid h1, .hero-split-grid p {
            text-align: center !important;
            margin-left: auto;
            margin-right: auto;
          }
          .hero-split-grid div {
            align-items: center !important;
            justify-content: center !important;
          }
          .hover-mockup-card {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
