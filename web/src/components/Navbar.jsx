import React, { useState, useEffect, useRef } from 'react'
import DotPixelIcon from './DotPixelIcon'
import { supabase } from '../services/supabase'

const megaMenuData = [
  { title: "Brand Strategy", count: "04", link: "#services", icon: "strategy", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=80" },
  { title: "Web Development", count: "07", link: "#services", icon: "web", image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80" },
  { title: "Mobile Apps", count: "05", link: "#services", icon: "mobile", image: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=600&q=80" },
  { title: "Enterprise Systems", count: "06", link: "#services", icon: "enterprise", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" },
  { title: "AI Integrations", count: "03", link: "#services", icon: "ai", image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80" },
  { title: "Cloud Architecture", count: "04", link: "#services", icon: "cloud", image: "https://images.unsplash.com/photo-1484417894907-623942c8ea29?auto=format&fit=crop&w=600&q=80" },
  { title: "UI/UX Design", count: "04", link: "#services", icon: "design", image: "https://images.unsplash.com/photo-1581291518655-9523c932dedf?auto=format&fit=crop&w=600&q=80" },
  { title: "Digital Marketing", count: "05", link: "#services", icon: "marketing", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" }
]

export default function Navbar({ currentView, onViewChange, onStartProject, lang, setLang }) {
  const [scrolled, setScrolled] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo.png')

  const closeTimeoutRef = useRef(null)
  const openTimeoutRef = useRef(null)

  const t = (en, ar) => (lang === 'ar' ? ar : en)

  useEffect(() => {
    let active = true
    async function loadLogo() {
      try {
        const { data } = await supabase.from('brand_config').select('logo_url').eq('id', true).maybeSingle()
        if (active && data && data.logo_url) {
          setLogoUrl(data.logo_url)
        }
      } catch (e) {
        console.error('Failed to load logo:', e)
      }
    }
    loadLogo()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) setScrolled(true)
      else setScrolled(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleOpenModal = () => setIsContactOpen(true)
    window.addEventListener('open-contact-modal', handleOpenModal)
    return () => window.removeEventListener('open-contact-modal', handleOpenModal)
  }, [])

  const handleMouseEnterMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    if (!openTimeoutRef.current) {
      openTimeoutRef.current = setTimeout(() => {
        setMegaMenuOpen(true)
      }, 180)
    }
  }

  const handleMouseLeaveMenu = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }
    closeTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false)
      setHoveredCard(null)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)
    }
  }, [])

  const handleLinkClick = (e, target) => {
    e.preventDefault()
    setMegaMenuOpen(false)
    if (target === 'dashboard') {
      onViewChange('dashboard')
    } else {
      onViewChange('landing')
      setTimeout(() => {
        if (target === '#') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          const el = document.querySelector(target)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }, 60)
    }
  }

  return (
    <>
      <header className={`sticky-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Left: Logo Column */}
          <div className="header-logo">
            <a href="#" onClick={(e) => handleLinkClick(e, '#')}>
              <img 
                src={logoUrl} 
                alt="Vixcell Logo" 
                className="nav-logo-img" 
              />
            </a>
          </div>
          
          {/* Center: Links inside dark pill capsule + Mega Menu Dropdown */}
          <div 
            className="header-center-wrapper"
            onMouseLeave={handleMouseLeaveMenu}
          >
            <div className="nav-pill">
              <div className="header-links">
                <a 
                  href="#services" 
                  className={currentView === 'landing' && megaMenuOpen ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    onViewChange('landing');
                    setMegaMenuOpen(!megaMenuOpen);
                  }}
                  onMouseEnter={handleMouseEnterMenu}
                >
                  {t('Services', 'خدماتنا')}
                </a>
                <a 
                  href="#portfolio" 
                  onMouseEnter={handleMouseLeaveMenu}
                  onClick={(e) => handleLinkClick(e, '#portfolio')}
                >
                  {t('Portfolio', 'أعمالنا')}
                </a>
                <a 
                  href="/designer"
                  onMouseEnter={handleMouseLeaveMenu}
                  className={currentView === 'designer' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    onViewChange('designer');
                  }}
                >
                  {t('AI Designer', 'المصمم الذكي')}
                </a>
                <a 
                  href="/meeting"
                  onMouseEnter={handleMouseLeaveMenu}
                  className={currentView === 'meeting' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    onViewChange('meeting');
                  }}
                >
                  {t('VIXCELL MEET', 'لقاءات فيكسل')}
                </a>
                <a 
                  href="#ai" 
                  onMouseEnter={handleMouseLeaveMenu}
                  onClick={(e) => handleLinkClick(e, '#ai')}
                >
                  {t('About', 'من نحن')}
                </a>

                <a
                  href="#contact"
                  onMouseEnter={handleMouseLeaveMenu}
                  onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }}
                >
                  {t('Contact', 'اتصل بنا')}
                </a>

                <button 
                  onClick={() => {
                    const nextLang = lang === 'ar' ? 'en' : 'ar';
                    setLang(nextLang);
                    try { localStorage.setItem('vix_lang', nextLang); } catch(e) {}
                  }}
                  className="btn-nav-lang-toggle"
                >
                  {lang === 'ar' ? 'EN' : 'عربي'}
                </button>
              </div>
            </div>

            {/* Mega Menu Dropdown - aligned exactly below the header */}
            <div 
              className={`mega-menu ${megaMenuOpen ? 'open' : ''}`}
              onMouseEnter={handleMouseEnterMenu}
            >
              <div className="mega-menu-grid">
                {megaMenuData.map((item, idx) => {
                  const isHovered = hoveredCard === idx
                  const isAnyHovered = hoveredCard !== null
                  const cardOpacity = isAnyHovered ? (isHovered ? 1 : 0.25) : 0.95

                  return (
                    <a 
                      key={idx} 
                      href={item.link} 
                      className={`mega-item ${isHovered ? 'active' : ''}`}
                      style={{ opacity: cardOpacity }}
                      onMouseEnter={() => setHoveredCard(idx)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={(e) => {
                        setMegaMenuOpen(false);
                        handleLinkClick(e, '#services');
                      }}
                    >
                      <div 
                        className="mega-image-container"
                        style={{
                          height: isHovered ? '110px' : '0px',
                          opacity: isHovered ? 1 : 0,
                          marginBottom: isHovered ? '1rem' : '0px'
                        }}
                      >
                        <img src={item.image} alt={item.title} />
                      </div>
                      
                      <div className="mega-content-row">
                        <span className="mega-count">/{item.count} services</span>
                        <div className="mega-right">
                          <span className="mega-title">{item.title}</span>
                          <DotPixelIcon name={item.icon} size={20} color={isHovered ? 'var(--primary)' : 'var(--text-color)'} />
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Contact Icon */}
          <div className="header-right">
            <button 
              className="btn-nav-pixel-icon" 
              onClick={() => setIsContactOpen(true)}
              aria-label="Open Contact"
            >
              <DotPixelIcon name="dotGrid" size={20} color="rgba(250, 246, 240,0.85)" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Contact Modal */}
      <div className={`contact-modal-overlay ${isContactOpen ? 'open' : ''}`}>
        <div className="contact-modal-container">
          <button 
            className="contact-modal-close" 
            onClick={() => setIsContactOpen(false)}
            aria-label={t("Close modal", "إغلاق النافذة")}
          >
            <DotPixelIcon name="close" size={24} color="var(--text-color)" />
          </button>
          
          <div className="contact-modal-content">
            <h2 className="contact-modal-title">
              {lang === 'ar' ? (
                <>جاهز <span className="text-muted-gray">للبدء والعمل معنا؟</span></>
              ) : (
                <>Ready to <span className="text-muted-gray">get started?</span></>
              )}
            </h2>
            
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-grid">
                <div className="form-group half">
                  <input type="text" placeholder={t("Your Name *", "الاسم الكريم *")} required />
                </div>
                <div className="form-group half">
                  <input type="email" placeholder={t("Email *", "البريد الإلكتروني *")} required />
                </div>
                <div className="form-group full">
                  <input type="tel" placeholder={t("Phone (Optional)", "رقم الهاتف (اختياري)")} />
                </div>
                <div className="form-group full">
                  <textarea placeholder={t("Tell us about your project *", "حدثنا قليلاً عن تفاصيل مشروعك *")} required rows={4}></textarea>
                </div>
              </div>

              <div className="services-interest-section">
                <span className="services-interest-title">{t("SERVICES YOU ARE INTERESTED IN", "الخدمات التي تهمك")}</span>
                <div className="services-interest-grid">
                  {(lang === 'ar' ? [
                    "استراتيجية العلامة التجارية", "تطوير مواقع الويب",
                    "الهوية البصرية", "المتاجر الإلكترونية",
                    "تصميم تجربة المستخدم", "تطبيقات الويب والجوال",
                    "المحتوى المرئي", "الأنظمة المدمجة والأجهزة"
                  ] : [
                    "Brand Strategy", "Web Development",
                    "Brand Identity", "eCommerce",
                    "User Experience Design", "Web & Mobile Applications",
                    "Visual Content", "Embedded & Hardware"
                  ]).map((service, index) => (
                    <label key={index} className="service-interest-label">
                      <input type="checkbox" name="services" value={service} />
                      <span className="checkbox-custom"></span>
                      <span className="service-name">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="contact-submit-btn">
                <span>{t("Send Message", "إرسال الرسالة")}</span>
                <DotPixelIcon name="send" size={16} color="black" className="submit-arrow" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
