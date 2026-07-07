import React from 'react'

const projects = [
  {
    title_en: "Alex Lab Coworking",
    title_ar: "مساحة عمل اليكس لاب",
    url: "https://alex-lab-coworking.vercel.app",
    desc_en: "An innovative coworking space in Alexandria supporting entrepreneurship and shared workspaces.",
    desc_ar: "مساحة عمل مشتركة مبتكرة في الإسكندرية تدعم ريادة الأعمال والعمل المشترك.",
    ind_en: "Coworking Space",
    ind_ar: "مساحة عمل مشتركة",
    tags: ["Next.js", "Tailwind CSS", "Booking Systems"],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
  },
  {
    title_en: "Morsal",
    title_ar: "مرسال",
    url: "https://morsall.com",
    desc_en: "An integrated digital communications platform connecting services, businesses, and messaging solutions.",
    desc_ar: "منصة اتصالات رقمية متكاملة لربط الخدمات والشركات وحلول الإرسال الإلكتروني.",
    ind_en: "Communications",
    ind_ar: "الاتصالات",
    tags: ["React", "API integration", "SaaS Platform"],
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80"
  },
  {
    title_en: "Oman Project",
    title_ar: "مشروع عمان",
    url: "https://oman-xi.vercel.app",
    desc_en: "A luxury corporate website presenting the identity and major projects in the Sultanate of Oman.",
    desc_ar: "موقع مؤسسي فاخر ومطوّر لتقديم وعرض الهوية والمشاريع الكبرى في سلطنة عُمان.",
    ind_en: "Corporate",
    ind_ar: "شركات والمؤسسات",
    tags: ["React", "Motion", "Premium UI"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
  }
]

export default function ClientProjects({ lang }) {
  const t = (en, ar) => (lang === 'ar' ? ar : en)

  return (
    <section className="client-projects-section" id="client-projects" style={{ padding: '6rem 0', background: '#0c0c0e' }}>
      <div className="container">

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
                border: '1px solid rgba(250, 246, 240, 0.08)',
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
                  alt={t(proj.title_en, proj.title_ar)}
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
                    {t('Visit Live Site ↗', 'زيارة الموقع المباشر ↗')}
                  </span>
                </div>
              </div>

              <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#c8a35c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t(proj.ind_en, proj.ind_ar)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {proj.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} style={{ background: 'rgba(250, 246, 240,0.05)', color: '#a8a8b3', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FAF6F0', marginBottom: '0.6rem', fontFamily: "Manrope, Lora, Amiri, serif" }}>
                  {t(proj.title_en, proj.title_ar)}
                </h3>
                <p style={{ color: '#a8a8b3', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {t(proj.desc_en, proj.desc_ar)}
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
