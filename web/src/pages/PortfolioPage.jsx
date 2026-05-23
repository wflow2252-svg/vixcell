import React from 'react'
import DotPixelIcon from '../components/DotPixelIcon'

const allProjects = [
  {
    title: "MedSync",
    industry: "Healthcare",
    description: "Enterprise hospital management platform.",
    image: "https://images.unsplash.com/photo-1576091160550-2173ff9e5eb3?auto=format&fit=crop&w=800&q=80",
    tags: ["Web Platform", "Enterprise", "UX/UI"]
  },
  {
    title: "FoodFlow",
    industry: "E-Commerce",
    description: "High-scale restaurant ordering system.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    tags: ["Mobile", "E-Commerce", "Brand"]
  },
  {
    title: "TradeVault",
    industry: "FinTech",
    description: "Secure trading analytics dashboard.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    tags: ["Dashboard", "FinTech", "Web"]
  },
  {
    title: "UrbanRide",
    industry: "Transportation",
    description: "Next-gen ride-sharing mobile application.",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80",
    tags: ["Mobile App", "UI/UX", "Brand"]
  },
  {
    title: "EduCore",
    industry: "EdTech",
    description: "Interactive e-learning platform for universities.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    tags: ["Web Platform", "EdTech", "UX/UI"]
  },
  {
    title: "ShelfAI",
    industry: "Retail",
    description: "AI-powered inventory & shelf analytics system.",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80",
    tags: ["AI", "Enterprise", "Dashboard"]
  }
]

export default function PortfolioPage({ onViewChange }) {
  return (
    <div className="portfolio-page">
      {/* Header */}
      <header className="portfolio-page-header">
        <div className="portfolio-page-header-inner">
          <button onClick={() => onViewChange('landing')} className="portfolio-back-link">
            <span>←</span> Back to Home
          </button>
          <button onClick={() => onViewChange('landing')} className="portfolio-page-logo">
            <img src="/logo.png" alt="Vixcell" style={{ height: '22px' }} />
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
            <div key={index} className="portfolio-project-card">
              <div className="portfolio-project-image">
                <img src={project.image} alt={project.title} />
                <div className="portfolio-project-overlay">
                  <DotPixelIcon name="arrowRightPixel" size={18} color="#ffffff" />
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
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="portfolio-page-footer-cta">
        <h2>Have a project in mind?</h2>
        <a href="/" className="portfolio-page-cta-btn">
          Start a Project →
        </a>
      </div>
    </div>
  )
}
