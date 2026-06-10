import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Skills.css'

const skillsData = [
  {
    name: 'HTML5',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    color: '#E34F26',
    glow: 'rgba(227, 79, 38, 0.2)',
    shadow: 'rgba(227, 79, 38, 0.3)'
  },
  {
    name: 'CSS3',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    color: '#1572B6',
    glow: 'rgba(21, 114, 182, 0.2)',
    shadow: 'rgba(21, 114, 182, 0.3)'
  },
  {
    name: 'JavaScript',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    color: '#F7DF1E',
    glow: 'rgba(247, 223, 30, 0.15)',
    shadow: 'rgba(247, 223, 30, 0.25)'
  }
]

export default function Skills() {
  const gridRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gridRef.current.querySelectorAll('.skill-item')
      
      // Scroll entry animation
      gsap.fromTo(items,
        { opacity: 0, y: 30 },
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

  return (
    <section id="skills" className="skills-section">
      <div className="container">
        
        {/* Header */}
        <div className="skills-header">
          <span className="skills-tagline">Tech Stack</span>
          <h2 className="skills-title">المهارات البرمجية</h2>
          <p className="skills-subtitle">
            نعتمد على التقنيات القياسية لإنشاء واجهات تفاعلية مذهلة وسريعة الاستجابة.
          </p>
        </div>

        {/* Skills Grid */}
        <div className="skills-container-wrapper">
          <div ref={gridRef} className="skills-grid">
            {skillsData.map((skill, index) => (
              <div key={index} className="skill-item">
                <div 
                  className="skill-square"
                  style={{
                    '--brand-color': skill.color,
                    '--glow-color': skill.glow,
                    '--shadow-color': skill.shadow
                  }}
                >
                  <img 
                    src={skill.logo} 
                    alt={skill.name} 
                    className="skill-logo-img"
                    loading="lazy"
                  />
                </div>
                <span className="skill-label">{skill.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
