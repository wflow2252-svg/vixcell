'use client'

interface FooterProps {
  lang?: 'ar' | 'en';
}

export default function Footer({ lang = 'ar' }: FooterProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  return (
    <footer 
      className="bg-black border-t border-[#1F1F23] py-16 relative z-10 text-right lg:text-left text-[#71717A] text-[11px]" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-7 gap-8">
        
        {/* Column 1: Product */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Product', 'المنتج')}</h4>
          <a href="#" className="hover:text-white transition-colors">Vixcell</a>
          <a href="#" className="hover:text-white transition-colors">HTML Anything</a>
          <a href="#" className="hover:text-white transition-colors">HTML Video</a>
        </div>

        {/* Column 2: Solution */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Solution', 'الحلول')}</h4>
          <a href="#" className="hover:text-white transition-colors">{t('Prototype', 'النماذج الأولية')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Dashboard', 'لوحات التحكم')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Slides', 'العروض')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Image', 'الرسوم البيانية')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Design System', 'أنظمة التصميم')}</a>
        </div>

        {/* Column 3: Agent */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Agent', 'المساعدين')}</h4>
          <a href="#" className="hover:text-white transition-colors">Claude Code</a>
          <a href="#" className="hover:text-white transition-colors">Codex</a>
          <a href="#" className="hover:text-white transition-colors">Cursor</a>
          <a href="#" className="hover:text-white transition-colors">Gemini CLI</a>
          <a href="#" className="hover:text-white transition-colors">OpenCode</a>
        </div>

        {/* Column 4: Plugins */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Plugins', 'الإضافات')}</h4>
          <a href="#" className="hover:text-white transition-colors">{t('Templates', 'القوالب')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Skills', 'المهارات')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Systems', 'الأنظمة')}</a>
        </div>

        {/* Column 5: Compare */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Compare', 'المقارنة')}</h4>
          <a href="#" className="hover:text-white transition-colors">Claude Design</a>
          <a href="#" className="hover:text-white transition-colors">Figma</a>
          <a href="#" className="hover:text-white transition-colors">Lovable</a>
          <a href="#" className="hover:text-white transition-colors">Bolt.new</a>
          <a href="#" className="hover:text-white transition-colors">v0.dev</a>
        </div>

        {/* Column 6: Resources */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Resources', 'المصادر')}</h4>
          <a href="#" className="hover:text-white transition-colors">Blog</a>
          <a href="#" className="hover:text-white transition-colors">Tutorials</a>
          <a href="#" className="hover:text-white transition-colors">Download</a>
          <a href="#" className="hover:text-white transition-colors">Quickstart</a>
        </div>

        {/* Column 7: Company */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">{t('Company', 'الشركة')}</h4>
          <a href="#" className="hover:text-white transition-colors">{t('About', 'من نحن')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('FAQ', 'الأسئلة الشائعة')}</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-[#1F1F23]/60 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} Vixcell Inc. · Apache-2.0</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">{t('Privacy Policy', 'سياسة الخصوصية')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('Terms', 'شروط الاستخدام')}</a>
        </div>
      </div>
    </footer>
  )
}
