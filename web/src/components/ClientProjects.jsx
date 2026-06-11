import React from 'react'

const projects = [
  {
    title: "Alex Lab Coworking",
    url: "https://alex-lab-coworking.vercel.app",
    description: "مساحة عمل مشتركة مبتكرة في الإسكندرية تدعم ريادة الأعمال والعمل المشترك.",
    industry: "Coworking Space",
    tags: ["Next.js", "Tailwind CSS", "Booking Systems"],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Morsal",
    url: "https://morsall.com",
    description: "منصة اتصالات رقمية متكاملة لربط الخدمات والشركات وحلول الإرسال الإلكتروني.",
    industry: "Communications",
    tags: ["React", "API integration", "SaaS Platform"],
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Oman Project",
    url: "https://oman-xi.vercel.app",
    description: "موقع مؤسسي فاخر ومطوّر لتقديم وعرض الهوية والمشاريع الكبرى في سلطنة عُمان.",
    industry: "Corporate",
    tags: ["React", "Motion", "Premium UI"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
  }
]

export default function ClientProjects() {
  return (
    <section className="client-projects-section" id="client-projects" style={{ padding: '6rem 0', background: '#0c0c0e' }}>
      <div className="container">
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#c8a35c', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>
            SELECTED WORK
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem', fontFamily: 'Cairo, sans-serif' }}>
            أعمالنا ومشاريعنا
          </h2>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: '#a8a8b3', fontSize: '1.05rem', lineHeight: 1.6 }}>
            استعرض نماذج حية ومباشرة من المنصات الرقمية ومواقع الشركات التي قمنا بتطويرها لشركائنا بأعلى المعايير.
          </p>
        </div>

        <div className="client-projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {projects.map((proj, idx) => (
            <a
              key={idx}
              href={proj.url}
              target="_blank"
              rel="noopener noreferrer"
              className="client-project-card"
              style={{
                background: '#131316',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer'
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden', height: '200px' }}>
                <img
                  src={proj.image}
                  alt={proj.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  className="project-card-img"
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(200, 163, 92, 0.15)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} className="project-card-overlay">
                  <span style={{
                    background: '#c8a35c',
                    color: '#000000',
                    fontWeight: 700,
                    padding: '0.6rem 1.2rem',
                    borderRadius: '30px',
                    fontSize: '0.85rem'
                  }}>
                    زيارة الموقع المباشر ↗
                  </span>
                </div>
              </div>

              <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#c8a35c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {proj.industry}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {proj.tags.slice(0, 2).map((t, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.05)', color: '#a8a8b3', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.6rem', fontFamily: 'Cairo, sans-serif' }}>
                  {proj.title}
                </h3>
                <p style={{ color: '#a8a8b3', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {proj.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .client-project-card:hover {
          transform: translateY(-8px);
          border-color: rgba(200, 163, 92, 0.3) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }
        .client-project-card:hover .project-card-img {
          transform: scale(1.06);
        }
        .client-project-card:hover .project-card-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  )
}
