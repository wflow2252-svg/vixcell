import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

// ─── المشاريع الحقيقية ────────────────────────────────────────────
const allProjects = [
  {
    title: "Alex Lab Coworking",
    industry: "Coworking Space",
    description: "منصة حجز ومجتمع لمساحات العمل المشترك في الإسكندرية.",
    url: "https://alex-lab-coworking.vercel.app",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    tags: ["Web Platform", "Booking", "Community"]
  },
  {
    title: "Morsal",
    industry: "Digital Agency",
    description: "وكالة إبداعية رقمية متخصصة في بناء الهوية البصرية والمنصات الرقمية.",
    url: "https://morsall.com",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
    tags: ["Brand Identity", "Web Design", "Agency"]
  },
  {
    title: "Oman Project",
    industry: "Corporate",
    description: "موقع مؤسسي احترافي لشركة عُمانية بتصميم عالمي المستوى.",
    url: "https://oman-xi.vercel.app",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    tags: ["Corporate", "Web", "Enterprise"]
  },
]

export default function PortfolioPage({ onViewChange }) {
  const [logoUrl, setLogoUrl] = useState('/logo.png')

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

  return (
    <div className="portfolio-page">
      {/* Header */}
      <header className="portfolio-page-header">
        <div className="portfolio-page-header-inner">
          <button onClick={() => onViewChange('landing')} className="portfolio-back-link">
            <span>←</span> Back to Home
          </button>
          <button onClick={() => onViewChange('landing')} className="portfolio-page-logo">
            <img src={logoUrl} alt="Vixcell" style={{ height: '22px' }} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="portfolio-page-hero">
        <div className="portfolio-page-hero-inner">
          <span className="portfolio-page-tagline">SELECTED WORK</span>
          <h1 className="portfolio-page-title">Our Projects.</h1>
          <p className="portfolio-page-subtitle">
            A curated selection of digital experiences we've built for ambitious brands.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="portfolio-page-content">
        <div className="portfolio-projects-grid">
          {allProjects.map((project, index) => (
            <a
              key={index}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-project-card"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div className="portfolio-project-image">
                <img src={project.image} alt={project.title} />
                <div className="portfolio-project-overlay" style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(26,115,232,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity .3s',
                }}>
                  <span style={{
                    background: '#1a73e8', color: '#FAF6F0', borderRadius: 20,
                    padding: '8px 20px', fontSize: 13, fontWeight: 700,
                  }}>فتح الموقع ↗</span>
                </div>
              </div>
              <div className="portfolio-project-info">
                <div className="portfolio-project-meta">
                  <span className="portfolio-project-industry">{project.industry}</span>
                  <div className="portfolio-project-tags">
                    {project.tags.map((tag, i) => (
                      <span key={i} className="portfolio-project-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <h3 className="portfolio-project-title">{project.title}</h3>
                <p className="portfolio-project-desc">{project.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="portfolio-page-footer-cta">
        <h2>Have a project in mind?</h2>
        <button onClick={() => onViewChange('start')} className="portfolio-page-cta-btn" style={{ border: 'none', cursor: 'pointer' }}>
          Start a Project →
        </button>
      </div>

      <style>{`
        .portfolio-project-card:hover .portfolio-project-overlay { opacity: 1 !important; }
        .portfolio-project-image { position: relative; overflow: hidden; }
        @media (max-width: 768px) {
          .portfolio-projects-grid { grid-template-columns: 1fr !important; }
          .portfolio-page-hero { padding: 40px 16px !important; }
        }
      `}</style>
    </div>
  )
}
