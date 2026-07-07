'use client'

import { motion } from 'framer-motion'

interface CTAProps {
  lang: 'ar' | 'en';
}

export default function CTA({ lang }: CTAProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  return (
    <section 
      id="contact"
      className="py-24 bg-white relative overflow-hidden z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Light card container */}
        <div className="border border-neutral-200 bg-[#FAF9F6] rounded-3xl p-10 md:p-16 text-center shadow-sm relative group overflow-hidden">
          
          <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-widest bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-1 rounded-full">
            {t('Launch Your Platform', 'ابدأ مشروعك الرقمي')}
          </span>

          <h2 className="text-3xl md:text-5xl font-black text-black mt-6 mb-4 tracking-tight leading-[1.1]">
            {t('Bring AI power to every desk.', 'اجعل القوة البرمجية على كل مكتب.')}
          </h2>

          <p className="text-sm text-[#71717A] max-w-lg mx-auto mb-10 leading-relaxed">
            {t(
              'Join leading companies and startups working with Vixcell to build premium custom software, websites, and offline AI integrations.',
              'انضم إلى كبرى الشركات التقنية والناشئة التي تتعاون مع فيكسل لهندسة وتصميم واجهاتها البرمجية وأنظمة ذكائها الاصطناعي.'
            )}
          </p>

          {/* Quick Intake Button */}
          <div className="flex justify-center">
            <a
              href="mailto:hello@vixcell.com"
              className="bg-black hover:bg-neutral-850 text-white font-extrabold px-10 py-4 rounded-full transition-all flex items-center gap-2 text-xs shadow-md"
            >
              <span>{t('Book a Strategy Call', 'احجز جلسة استشارية')}</span>
              <span>→</span>
            </a>
          </div>

        </div>

      </div>
    </section>
  )
}
