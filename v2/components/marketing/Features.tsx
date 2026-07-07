'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface FeaturesProps {
  lang: 'ar' | 'en';
}

export default function Features({ lang }: FeaturesProps) {
  const [activeTab, setActiveTab] = useState<'desktop' | 'agents' | 'learn'>('desktop')
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const tabs = [
    { id: 'desktop' as const, label: t('Desktop-native', 'تطبيق مكتبي محلي') },
    { id: 'agents' as const, label: t('We plug agents in', 'نحن نقوم بربط المساعدين') },
    { id: 'learn' as const, label: t('It learns you over time', 'يتعلم تفضيلاتك مع الوقت') }
  ]

  const tabContents = {
    desktop: {
      title: t('Design happens on the desktop', 'التصميم والبرمجة تتم محلياً'),
      desc: t(
        'Local files, Figma exports, and code repositories are directly readable. The agent has full terminal execution power to build and verify code on your own machine.',
        'الملفات المحلية، ملفات Figma المصدرة، ومستودعات الأكواد مقروءة مباشرة. يمتلك المساعد البرمجي صلاحية تشغيل الأوامر لبناء الأكواد واختبارها محلياً بالكامل.'
      ),
      img: '/vixcell_ai_designer_hero.png'
    },
    agents: {
      title: t('We don\'t build agents, we plug them in', 'نحن لا نطور المساعدين، بل نربطهم مباشرة'),
      desc: t(
        'The Claude Code, Gemini CLI, or Cursor already on your machine are strong enough. Vixcell wires them into a unified, visual design system workflow.',
        'المساعدون البرمجيون المثبتون بالفعل على جهازك (مثل Claude أو Gemini أو Cursor) يتمتعون بالقوة الكافية. فيكسل تقوم بربطهم فقط في بيئة عمل بصرية متكاملة.'
      ),
      img: '/local_ai_feature_diagram.png'
    },
    learn: {
      title: t('Every choice is saved to your memory', 'كل اختيار وتعديل يُحفظ في ذاكرتك المحلية'),
      desc: t(
        'Vixcell saves your visual choices into local design systems, brand preferences, and component memory, ensuring the next generation lands closer to what you want.',
        'تقوم فيكسل بحفظ اختياراتك وتعديلاتك في ملفات الذاكرة والهوية البصرية المحلية، مما يضمن أن عمليات التوليد القادمة ستحاكي تماماً أسلوبك المفضل.'
      ),
      img: '/vixcell_ai_designer_hero.png'
    }
  }

  const current = tabContents[activeTab]

  return (
    <section 
      id="features" 
      className="py-24 bg-white border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        
        <span className="text-[10px] font-black text-[#22C55E] uppercase tracking-widest mb-4 block">
          {t('Why Vixcell?', 'لماذا فيكسل؟')}
        </span>

        {/* Serif stylized heading in features section (From Video) */}
        <h2 className="text-2xl sm:text-4xl font-normal text-black max-w-4xl mx-auto leading-relaxed mb-10">
          {t('Vixcell is the ', 'فيكسل هي ')}
          <span className="font-serif italic font-normal">{t('open-source, agentic vibe design workspace', 'بيئة عمل برمجية وتصميمية محلية مفتوحة المصدر')}</span>
          {t(' — it turns the coding agent you already run into a design engine whose output you fully own.', ' — تحول مساعد البرمجة الذي تقوم بتشغيله بالفعل إلى محرك تصميم تملك مخرجاته بالكامل.')}
        </h2>

        {/* Tablist Switcher (Figma selection visual tags with green bg on active) */}
        <div className="flex justify-center gap-2 border-b border-neutral-200 pb-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-4 py-2 rounded transition-all ${
                activeTab === tab.id
                  ? 'bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/30 font-semibold'
                  : 'text-[#71717A] hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-right lg:text-left"
            style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
          >
            {/* Left description */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h3 className="text-xl font-bold text-black">{current.title}</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">{current.desc}</p>
            </div>

            {/* Right Mockup image */}
            <div className="lg:col-span-7 border border-neutral-200 bg-white p-1.5 rounded-xl shadow-sm relative overflow-hidden">
              <Image
                src={current.img}
                alt={current.title}
                width={800}
                height={480}
                className="rounded-lg object-cover w-full border border-neutral-100"
              />
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}
