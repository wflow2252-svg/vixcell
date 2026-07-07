import React from 'react'
import DotPixelIcon from './DotPixelIcon'

export default function Portfolio({ onViewChange, lang }) {
  const t = (en, ar) => (lang === 'ar' ? ar : en)

  return (
    <section id="portfolio" className="portfolio-banner-section">
      <div className="container">
        <div
          className="portfolio-banner-link"
          onClick={() => onViewChange('portfolio')}
          style={{ cursor: 'pointer' }}
        >
          <div className="portfolio-banner-header">
            <h2 className="portfolio-banner-title">
              <span>{t('Click here to view our projects', 'اضغط هنا لروئيه مشاريعنا')}</span>
              <DotPixelIcon 
                name={lang === 'ar' ? 'arrowLeftPixel' : 'arrowRightPixel'} 
                size={20} 
                color="#FAF6F0" 
                className="portfolio-banner-icon"
              />
            </h2>
          </div>
          <div className="portfolio-banner-wrapper">
            <img
              src="/portfolio-banner.png"
              alt="Vixcell Portfolio"
              className="portfolio-banner-img"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
