import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import DotPixelIcon from './DotPixelIcon'

const servicesData = [
  {
    title: "Brand Strategy",
    icon: "strategy",
    subServices: [
      "Brand Positioning",
      "Competitor & Market Research",
      "Brand Architecture",
      "Brand Audit",
      "Brand Naming & Tagline",
      "Brand Messaging & Tone of Voice"
    ],
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?fm=webp&fit=crop&w=800&q=80"
  },
  {
    title: "Web Platforms",
    icon: "web",
    subServices: [
      "SaaS Development",
      "Enterprise Portals",
      "E-commerce Architectures",
      "Next.js Custom Apps",
      "Performance Tuning",
      "Bespoke Integrations"
    ],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?fm=webp&fit=crop&w=800&q=80"
  },
  {
    title: "Mobile Experiences",
    icon: "mobile",
    subServices: [
      "iOS Native Swift",
      "Android Native Kotlin",
      "Flutter Cross-platform",
      "React Native Apps",
      "UI/UX App Prototyping",
      "App Store Deployments"
    ],
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?fm=webp&fit=crop&w=800&q=80"
  },
  {
    title: "Enterprise Systems",
    icon: "enterprise",
    subServices: [
      "ERP Customization",
      "CRM Custom Dashboards",
      "Cloud Infrastructure",
      "Database Migrations",
      "Automated Pipelines",
      "Systems Integrations"
    ],
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?fm=webp&fit=crop&w=800&q=80"
  }
]

export default function Services() {
  const gridRef = useRef(null)

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

  return (
    <section id="services" className="services-section">
      <div className="container">
        <h2 className="services-section-title">Our Expertise.</h2>
        
        <div ref={gridRef} className="services-grid">
          {servicesData.map((service, index) => (
            <div 
              key={index}
              className="service-grid-item"
            >
              {/* Full-bleed background image */}
              <div className="service-image-container">
                <img src={service.image} alt={service.title} />
              </div>

              {/* Default: Title + counter at top */}
              <div className="service-title-container">
                <h3 className="service-title">{service.title}</h3>
                <span className="service-counter">/{service.subServices.length} services</span>
              </div>

              {/* Default: Pixel icon at bottom-left */}
              <div className="service-icon-bottom">
                <DotPixelIcon name={service.icon} size={22} color="rgba(255,255,255,0.75)" />
              </div>

              {/* Hover Overlay: frosted glass + pills */}
              <div className="sub-services-overlay">
                <div className="overlay-header">
                  <h3 className="overlay-title">{service.title}</h3>
                  <span className="overlay-counter">/{service.subServices.length} services</span>
                </div>
                
                <div className="overlay-pills">
                  {service.subServices.map((sub, idx) => (
                    <span key={idx} className="sub-service-pill">
                      {sub}
                    </span>
                  ))}
                </div>

                <div className="overlay-footer">
                  <a href="#contact" className="see-more-link" onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-contact-modal'));
                  }}>
                    See More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
