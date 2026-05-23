import React from 'react'

export default function Portfolio({ onViewChange }) {
  return (
    <section id="portfolio" className="portfolio-banner-section">
      <div className="container">
        <div
          className="portfolio-banner-link"
          onClick={() => onViewChange('portfolio')}
          style={{ cursor: 'pointer' }}
        >
          <div className="portfolio-banner-wrapper">
            <img
              src="/portfolio-banner.png"
              alt="Vixcell Portfolio"
              className="portfolio-banner-img"
            />
            <div className="portfolio-banner-overlay">
              <span className="portfolio-banner-cta">View All Projects →</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
