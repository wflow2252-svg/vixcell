'use client'

import { motion } from 'framer-motion'
import { Star, Users, Layout, Palette, Cpu, Heart } from 'lucide-react'

interface PricingProps {
  lang: 'ar' | 'en';
}

export default function Pricing({ lang }: PricingProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const stats = [
    { 
      num: '129+', 
      label: t('Design Systems', 'أنظمة التصميم المدمجة'), 
      desc: t('Tailored typography, colors & styles', 'إدارة وتوليد الخطوط والألوان والقوالب البصرية'),
      bgGradient: 'from-amber-400/20 to-orange-400/10'
    },
    { 
      num: '21+', 
      label: t('Coding Agents', 'المساعدين البرمجيين'), 
      desc: t('Detect and connect local agents CLI', 'التعرف التلقائي وربط المساعدين البرمجيين محلياً'),
      bgGradient: 'from-emerald-400/20 to-teal-400/10'
    },
    { 
      num: 'Star us', 
      label: t('Support open source', 'ادعم المصدر المفتوح'), 
      desc: t('Star our GitHub repository workspace', 'ادعم المشروع على مستودع جيت هاب'),
      bgGradient: 'from-purple-400/20 to-indigo-400/10'
    }
  ]

  return (
    <section 
      id="pricing" 
      className="py-24 bg-white border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        
        {/* Title */}
        <h2 className="text-2xl sm:text-4xl font-normal text-black mb-4 tracking-tight leading-relaxed">
          {t('The open-source vibe design workspace, ', 'بيئة عمل برمجية وتصميمية مفتوحة المصدر، ')}
          <span className="font-serif italic">{t('by the numbers', 'بلغة الأرقام')}</span>
        </h2>
        <p className="text-xs text-[#71717A] max-w-2xl mx-auto mb-16 leading-relaxed">
          {t(
            'Explore Vixcell\'s growing ecosystem of developers, custom plugins, and supported local language models.',
            'اكتشف مجتمع مطوري فيكسل النامي، الإضافات المخصصة، والمساعدين البرمجيين محلياً.'
          )}
        </p>

        {/* ─── NUMBERS GRID WITH COLORFUL GRAPHICS BACKDROP (From Video) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-right lg:text-left" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="border border-neutral-200 bg-white rounded-2xl overflow-hidden shadow-sm relative group flex flex-col justify-between min-h-[220px]"
            >
              {/* Artistic/Painting backdrop top half (From Video) */}
              <div className={`h-[120px] w-full bg-gradient-to-tr ${s.bgGradient} border-b border-neutral-100 flex items-center justify-center relative`}>
                <span className="text-3xl font-black font-mono text-neutral-800">{s.num}</span>
                {/* Floating dots decoration */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-black/10" />
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-black/10" />
              </div>

              {/* Text info bottom half */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-black uppercase tracking-wider">{s.label}</span>
                <p className="text-[9px] text-[#71717A] mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
