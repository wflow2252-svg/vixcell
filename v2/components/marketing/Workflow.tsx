'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface WorkflowProps {
  lang: 'ar' | 'en';
}

export default function Workflow({ lang }: WorkflowProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const steps = [
    { 
      num: '01', 
      title: t('Choose a starting point', 'اختر نقطة البداية'), 
      desc: t('Describe your goal in one line, or start from a template / plugin.', 'صف هدفك أو فكرتك في سطر واحد، أو ابدأ من قالب جاهز.'),
      stepTag: 'step 1',
      pillText: 'Describe your goal in one line, or start from a template / plugin.'
    },
    { 
      num: '02', 
      title: t('Set the visual direction', 'حدد الاتجاه البصري والسمة'), 
      desc: t('Select your preferred spacing, typography scale, and color palette.', 'اختر الأبعاد، مقياس الخطوط، وتناسق الألوان المفضل لديك.'),
      stepTag: 'step 2',
      pillText: 'Set layout spacing, font family selection, and default light palette.'
    },
    { 
      num: '03', 
      title: t('Generate the artifact', 'قم بتوليد التصميم والملفات'), 
      desc: t('Watch the local agent write code and compile outputs in real-time.', 'راقب المساعد البرمجي يكتب الأكواد ويبني الملفات أمامك مباشرة.'),
      stepTag: 'step 3',
      pillText: 'The agent reads all context, produces real runnable files, and previews live.'
    },
    { 
      num: '04', 
      title: t('Deliver or make a video', 'تصدير الملفات أو إنتاج فيديو'), 
      desc: t('Export ready-to-run files to engineering, or make a demo video.', 'صدّر الملفات الجاهزة للتطوير، أو قم بتحويلها لفيديو تسويقي.'),
      stepTag: 'step 4',
      pillText: 'Export it to engineering to keep building, or turn it into marketing video.'
    }
  ]

  return (
    <section 
      id="workflow" 
      className="py-24 bg-white border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-normal text-black tracking-tight leading-relaxed">
            {t('From idea to prototype, ', 'من الفكرة إلى النموذج الأولي، ')}
            <span className="font-serif italic">{t('web, slides, and HTML video', 'الويب، الشرائح، وفيديو HTML')}</span>
          </h2>
          <p className="text-xs text-[#71717A] max-w-2xl mx-auto mt-4 leading-relaxed">
            {t(
              'Once a direction is set, palette, type, and spacing flow into generation automatically. The agent reads all context, produces real runnable files, and previews and edits them live in a sandbox.',
              'بمجرد تحديد الاتجاه، تتدفق خطوط الألوان والتناسق تلقائياً للتوليد. يقرأ المساعد سياق العمل وينتج ملفات قابلة للتشغيل ويعرضها مباشرة في محاكاة تفاعلية.'
            )}
          </p>
        </div>

        {/* Steps Grid (Exact layout from Video) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Visual step cards representation */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {steps.map((step, idx) => (
              <div 
                key={idx}
                className="border border-neutral-200 bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 text-left"
              >
                <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-green-600 text-white font-mono font-bold uppercase px-2.5 py-1 rounded-full">{step.stepTag}</span>
                <span className="text-xs font-semibold text-neutral-800 leading-relaxed flex-1">{step.pillText}</span>
              </div>
            ))}
          </div>

          {/* Right Steps list info */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-right lg:text-left" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: lang === 'ar' ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex gap-4 items-start border-b border-neutral-100 pb-4 last:border-b-0"
              >
                <span className="text-sm font-mono font-bold text-[#22C55E] mt-0.5">{step.num}</span>
                <div>
                  <h3 className="text-sm font-bold text-black mb-1">{step.title}</h3>
                  <p className="text-[11px] text-[#71717A] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
