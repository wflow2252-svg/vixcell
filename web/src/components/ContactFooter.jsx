import React, { useState } from 'react'

export default function ContactFooter() {
  const [selectedServices, setSelectedServices] = useState([])

  const toggleService = (svc) => {
    if(selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter(s => s !== svc))
    } else {
      setSelectedServices([...selectedServices, svc])
    }
  }

  const services = [
    "Brand Strategy", "Web Development", "Mobile Apps", 
    "Enterprise Systems", "AI Integrations", "Cloud Architecture"
  ]

  return (
    <footer className="footer-section">
      <div className="container footer-container">
        <div className="footer-flex-container">
          <div className="footer-left">
            <h2 className="footer-title">
              Ready to get started?
            </h2>
            <p className="footer-desc">
              Fill the form to request a quote or connect with us directly.
            </p>
          </div>
          
          <div className="footer-right">
            <form className="footer-form">
              <input placeholder="Your Name *" required className="footer-input" />
              <input placeholder="Email *" required type="email" className="footer-input" />
              <input placeholder="Phone (Optional)" className="footer-input" />
              <textarea placeholder="Tell us about your project *" required className="footer-input footer-textarea" />
              
              <div>
                <h4 className="footer-form-title">Services you are interested in</h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem'}}>
                  {services.map((svc, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => toggleService(svc)}
                      style={{
                        padding: '0.8rem 1.5rem',
                        borderRadius: '30px',
                        border: `1px solid ${selectedServices.includes(svc) ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: selectedServices.includes(svc) ? 'var(--primary)' : 'transparent',
                        color: selectedServices.includes(svc) ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <button className="magnetic-btn" style={{marginTop: '2rem', alignSelf: 'flex-start'}}>
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="footer-bottom-links">
          <div className="links-wrapper">
            <a href="#">INSTAGRAM</a>
            <a href="#">LINKEDIN</a>
            <a href="#">TWITTER</a>
            <a href="#">DRIBBBLE</a>
          </div>
          <a href="mailto:hello@vixcell.com">HELLO@VIXCELL.COM</a>
        </div>
      </div>

      {/* Ultra Large Typography */}
      <div className="footer-large-text">
        VIXCELL
      </div>
    </footer>
  )
}
