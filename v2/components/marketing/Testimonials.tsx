'use client'

interface TestimonialsProps {
  lang: 'ar' | 'en';
}

export default function Testimonials({ lang }: TestimonialsProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  return (
    <section 
      className="py-24 bg-white border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-xl mx-auto px-6 text-center flex flex-col gap-4">
        
        {/* Title */}
        <h2 className="text-2xl sm:text-4xl font-black text-black tracking-tight">
          {t('The Vixcell newsletter', 'النشرة البريدية لفيكسل')}
        </h2>
        
        {/* Paragraph */}
        <p className="text-xs text-[#71717A] leading-relaxed max-w-sm mx-auto mb-6">
          {t(
            'New templates, design-system updates, ambassador events, and product news — straight to your inbox.',
            'قوالب جديدة، تحديثات أنظمة التصميم، الفعاليات، وآخر أخبار المساعدين البرمجيين — مباشرة إلى بريدك الإلكتروني.'
          )}
        </p>

        {/* Input box + Button */}
        <div className="flex gap-2 w-full">
          <input
            type="email"
            placeholder={t('Enter your email address', 'عنوان بريدك الإلكتروني')}
            className="flex-1 bg-neutral-50 border border-neutral-200 rounded px-4 py-2.5 text-xs text-black placeholder-[#71717A] focus:outline-none focus:border-black transition-colors"
          />
          <button className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-6 py-2.5 rounded transition-colors">
            {t('Subscribe', 'اشترك')}
          </button>
        </div>

      </div>
    </section>
  )
}
