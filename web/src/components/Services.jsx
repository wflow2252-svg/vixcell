import React, { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import DotPixelIcon from './DotPixelIcon'
import { supabase } from '../services/supabase'

export default function Services({ lang }) {
  const gridRef = useRef(null)
  const [activeCard, setActiveCard] = useState(null)
  const [servicesImages, setServicesImages] = useState({
    mobile: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?fm=webp&fit=crop&w=800&q=80",
    web: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?fm=webp&fit=crop&w=800&q=80",
    ecommerce: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?fm=webp&fit=crop&w=800&q=80"
  })

  useEffect(() => {
    let active = true
    async function loadConfig() {
      try {
        const { data } = await supabase.from('brand_config').select('brand_colors').eq('id', true).maybeSingle()
        if (active && data && data.brand_colors && data.brand_colors.services_images) {
          const imgs = data.brand_colors.services_images
          setServicesImages(prev => ({
            mobile: imgs.mobile || prev.mobile,
            web: imgs.web || prev.web,
            ecommerce: imgs.ecommerce || prev.ecommerce
          }))
        }
      } catch (e) {
        console.error('Failed to load services images:', e)
      }
    }
    loadConfig()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const items = gridRef.current.querySelectorAll('.service-grid-item')
    
    gsap.fromTo(items, 
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        stagger: 0.1, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 80%',
        }
      }
    )
  }, [])

  const t = (en, ar) => (lang === 'ar' ? ar : en)

  const servicesData = [
    {
      title: t("Mobile Application", "تطوير تطبيقات الجوال"),
      icon: "mobile",
      subServices: t(
        ["iOS Native Swift", "Android Native Kotlin", "Flutter Cross-platform", "React Native Apps", "UI/UX App Prototyping", "App Store Deployments"],
        ["تطوير iOS الأصلي", "تطوير أندرويد الأصلي", "تطبيقات فلاتر الهجينة", "تطبيقات ريأكت نيتف", "تصميم واجهات الموبايل", "رفع وتجهيز المتاجر"]
      ),
      image: servicesImages.mobile,
      glowColor: 'rgba(99, 102, 241, 0.25)' // Indigo
    },
    {
      title: t("Website Development", "تطوير مواقع الويب"),
      icon: "web",
      subServices: t(
        ["SaaS Development", "Enterprise Portals", "Custom Applications", "Next.js Custom Apps", "Performance Tuning", "Bespoke Integrations"],
        ["تطوير البرمجيات كخدمة SaaS", "بوابات الشركات والمؤسسات", "تطبيقات الويب المخصصة", "مواقع Next.js الحديثة", "تحسين محركات البحث والسرعة", "ربط وبناء الواجهات الخلفية"]
      ),
      image: servicesImages.web,
      glowColor: 'rgba(16, 185, 129, 0.25)' // Emerald
    },
    {
      title: t("E-commerce Architectures", "هندسة المتاجر الإلكترونية"),
      icon: "enterprise",
      subServices: t(
        ["Custom Shopify Stores", "WooCommerce Architectures", "Payment Gateways Sync", "Inventory Management", "Custom Cart Features", "Sales Analytics Integration"],
        ["بناء متاجر شوبيفاي احترافية", "تطوير متاجر ووكومرس", "ربط بوابات الدفع الإلكتروني", "إعداد أنظمة الشحن والمخازن", "تصميم سلة شراء ذكية وجذابة", "ربط أدوات التحليل والمبيعات"]
      ),
      image: servicesImages.ecommerce,
      glowColor: 'rgba(236, 72, 153, 0.25)' // Pink
    }
  ]

  return (
    <section id="services" className="services-section" style={{
      padding: '100px 0',
      backgroundColor: '#050507',
      position: 'relative'
    }}>
      <div className="container">
        
        {/* Editorial Section Header */}
        <div style={{ marginBottom: '50px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('WHAT WE ENGINEER', 'الخدمات التي نطورها')}
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            margin: '10px 0 0',
            color: '#fff',
            letterSpacing: '-0.02em'
          }}>
            {t('Expert Tech Services.', 'خدمات برمجية وهندسة متكاملة.')}
          </h2>
        </div>
        
        <div ref={gridRef} className="services-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {servicesData.map((service, index) => (
            <div 
              key={index}
              className={`service-grid-item-new`}
              style={{
                position: 'relative',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backgroundColor: 'rgba(20, 20, 25, 0.4)',
                backdropFilter: 'blur(12px)',
                padding: '28px',
                height: '380px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.boxShadow = `0 15px 40px -10px rgba(0,0,0,0.5), 0 0 30px ${service.glowColor}`
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'
                e.currentTarget.style.transform = 'translateY(0px)'
              }}
            >
              {/* Floating Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DotPixelIcon name={service.icon} size={20} color="#fff" />
                </div>
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '100px',
                  padding: '2px 10px'
                }}>
                  /{String(index + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Title & Subservices */}
              <div style={{ margin: '30px 0 auto', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em'
                }}>
                  {service.title}
                </h3>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: lang === 'ar' ? 'flex-start' : 'flex-start',
                  direction: lang === 'ar' ? 'rtl' : 'ltr'
                }}>
                  {service.subServices.map((sub, idx) => (
                    <span 
                      key={idx}
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.6)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '100px',
                        padding: '4px 10px',
                        transition: 'all 0.2s'
                      }}
                      className="service-sub-pill"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                paddingTop: '16px',
                marginTop: '20px'
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {t('Production ready frameworks', 'أطر عمل جاهزة للإنتاج')}
                </span>
                <a 
                  href="#contact" 
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-contact-modal'));
                  }}
                >
                  <span>{t('Contact Us', 'تواصل معنا')}</span>
                  <DotPixelIcon name="arrowRightPixel" size={10} color="#fff" />
                </a>
              </div>

            </div>
          ))}
        </div>
      </div>

      <style>{`
        .service-sub-pill:hover {
          background-color: rgba(99, 102, 241, 0.1) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          color: #fff !important;
        }
      `}</style>
    </section>
  )
}
