import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ThreeDLogo from './ThreeDLogo'
import DotPixelIcon from './DotPixelIcon'

export default function Hero({ onStartProject }) {
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const ctaRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out', delay: 0.2 }
      )
      gsap.fromTo(ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.9 }
      )
    }, heroRef)
    
    return () => ctx.revert()
  }, [])

  return (
    <section className="hero" ref={heroRef}>
      {/* 3D V Logo — fullscreen background */}
      <div className="logo-3d-wrapper">
        <ThreeDLogo />
      </div>

      {/* Bottom row: text left, CTA right */}
      <div className="container hero-grid">
        {/* Left: tagline + heading */}
        <div className="hero-left">
          <div ref={titleRef} className="hero-text-block">
            <span className="hero-tagline">FULL-SERVICE AGENCY</span>
            <h1 className="hero-title-inline">
              <span className="text-white">Vixcell is a design and technology studio based in Egypt.</span>
              <span className="text-gray"> We deliver hollistic brand identity &amp; digital experiences.</span>
            </h1>
          </div>
        </div>

        {/* Right: Start a Project button */}
        <div ref={ctaRef} className="hero-cta">
          <button className="magnetic-btn btn-start-project" onClick={onStartProject}>
            <span className="btn-text">Start a Project</span>
            <DotPixelIcon name="arrowRightPixel" size={14} color="currentColor" />
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="pixel-scroll-indicator">
        <span className="scroll-text">Scroll</span>
        <DotPixelIcon name="arrowDownPixel" size={14} color="#ffffff" className="scroll-icon" />
      </div>
    </section>
  )
}
