import React, { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import './MediaGallery.css'

const mediaItems = [
  {
    image: '/promo-ready.png',
    title: 'كن مستعداً لإنشاء موقعك',
    desc: 'أهلاً بك في عالم الإبداع والحلول البرمجية المتكاملة والذكية مع Vixcell.',
    badge: 'Vixcell Launch'
  },
  {
    image: '/promo-store.jpg',
    title: 'إنشاء متجرك الإلكتروني على جوجل',
    desc: 'لوحة تحكم وإدارة (Backend & Dashboard)، متوافق مع كافة الشاشات والأجهزة، استضافة ودومين مجاني، حماية متكاملة وسهولة فائقة.',
    badge: 'Online Store'
  },
  {
    image: '/promo-app.jpg',
    title: 'إنشاء تطبيقك على متجر بلاي',
    desc: 'لوحة تحكم كاملة، حساب مطورين Google Play Console، توافق مثالي مع كافة الأجهزة، وسهولة تامة بالاستخدام.',
    badge: 'Play Store App'
  },
  {
    image: '/promo-platform.jpg',
    title: 'منصة رقمية متكاملة',
    desc: 'تطوير وتصميم متجر إلكتروني أو صفحة تعريفية + موبايل أب متكامل لشركتك بأعلى مستويات الأمان والسرعة.',
    badge: 'Full Platform'
  }
]

export default function MediaGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const gridRef = useRef(null)

  // GSAP scroll trigger entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gridRef.current.querySelectorAll('.media-card')
      gsap.fromTo(items,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
          }
        }
      )
    }, gridRef)

    return () => ctx.revert()
  }, [])

  // Navigation handlers for Lightbox
  const handlePrev = (e) => {
    e.stopPropagation()
    setSelectedIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setSelectedIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
  }

  const handleClose = () => {
    setSelectedIndex(null)
  }

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (selectedIndex === null) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') handlePrev(e)
      if (e.key === 'ArrowRight') handleNext(e)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedIndex])

  return (
    <section id="media-showcase" className="media-gallery-section">
      <div className="container">
        
        {/* Header Section */}
        <div className="media-gallery-header">
          <span className="media-gallery-tagline">Visual Showcase</span>
          <h2 className="media-gallery-title">معرض الميديا</h2>
          <p className="media-gallery-subtitle">
            استكشف حلولنا البرمجية وباقاتنا الإعلانية الرقمية المصممة خصيصاً لمساعدتك على بدء ونمو مشروعك الرقمي بنجاح.
          </p>
        </div>

        {/* Responsive Grid */}
        <div ref={gridRef} className="media-grid">
          {mediaItems.map((item, index) => (
            <div 
              key={index} 
              className="media-card"
              onClick={() => setSelectedIndex(index)}
            >
              {/* Badge */}
              <span className="media-card-badge">{item.badge}</span>
              
              {/* Image wrapper */}
              <div className="media-img-wrapper">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="media-img"
                  loading="lazy"
                />
              </div>

              {/* Glassmorphic Overlay */}
              <div className="media-card-overlay">
                <h3 className="media-card-title">{item.title}</h3>
                <p className="media-card-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <div 
        className={`lightbox-modal ${selectedIndex !== null ? 'active' : ''}`}
        onClick={handleClose}
      >
        {selectedIndex !== null && (
          <div className="lightbox-content-wrapper" onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button className="lightbox-close-btn" onClick={handleClose} aria-label="Close lightbox">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Left navigation arrow */}
            <button className="lightbox-arrow lightbox-arrow-left" onClick={handlePrev} aria-label="Previous image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {/* Main Lightbox Image */}
            <img 
              src={mediaItems[selectedIndex].image} 
              alt={mediaItems[selectedIndex].title} 
              className="lightbox-img"
            />

            {/* Right navigation arrow */}
            <button className="lightbox-arrow lightbox-arrow-right" onClick={handleNext} aria-label="Next image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* Captions and Descriptions */}
            <div className="lightbox-caption">
              <h3 className="lightbox-title">{mediaItems[selectedIndex].title}</h3>
              <p className="lightbox-desc">{mediaItems[selectedIndex].desc}</p>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}
