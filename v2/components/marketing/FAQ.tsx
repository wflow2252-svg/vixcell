'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'

interface FAQProps {
  lang: 'ar' | 'en';
}

export default function FAQ({ lang }: FAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const items = [
    {
      q: t('Is Vixcell an open-source alternative?', 'هل فيكسل هي بديل مفتوح المصدر لـ Claude Design؟'),
      a: t(
        'Yes. Vixcell is an Apache-2.0 open-source alternative to Claude Design. It allows you to run all UI prototyping and web sandbox components locally on your machine.',
        'نعم، فيكسل هي بديل برمجى مفتوح المصدر بالكامل (ترخيص Apache-2.0) لـ Claude Design، تتيح لك معالجة وتطوير النماذج الأولية محلياً.'
      )
    },
    {
      q: t('What is a vibe design workspace?', 'ما هي منصة تصميم "الفايب" (Vibe Design Workspace)؟'),
      a: t(
        'It is a file-centric environment where your natural language inputs shape spacing, color variables, and components automatically through local configuration files.',
        'هي بيئة عمل برمجية تعتمد على الملفات والتوجيهات النصية لتوليد أوزان الأبعاد، ألوان الخطوط، والمكونات البصرية بشكل تلقائي.'
      )
    },
    {
      q: t('Does Vixcell run locally?', 'هل تعمل منصة فيكسل محلياً بالكامل؟'),
      a: t(
        'Yes. All models compile and execute on your GPU/CPU via WebAssembly and WebGPU inside your browser. No data ever leaves your workspace.',
        'نعم، تعمل محلياً بالكامل بالاعتماد على تسريع كرت الشاشة والمعالج عبر المتصفح مباشرة، وتظل بياناتك محفوظة بالكامل على جهازك.'
      )
    },
    {
      q: t('Which coding agents does Vixcell support?', 'ما هي المساعدات البرمجية التي تدعمها فيكسل؟'),
      a: t(
        'Vixcell integrates with 21+ coding agents including Claude Code, Cursor agent, Gemini CLI, OpenCode, Aider, Qwen 2.5, and Codex.',
        'فيكسل تدعم وتتكامل مع 21+ مساعد برمجي ذكي مثل Claude Code و Cursor و Gemini CLI و DeepSeek وغيرها.'
      )
    },
    {
      q: t('Can I self-host Vixcell?', 'هل يمكنني استضافة منصة فيكسل بنفسي؟'),
      a: t(
        'Yes. You can fork the repository, self-host Vixcell on Vercel, Cloudflare, or run the desktop app locally.',
        'نعم، يمكنك أخذ نسخة من المستودع البرمجي واستضافتها بنفسك على خوادم Vercel أو Cloudflare أو تشغيلها محلياً.'
      )
    },
    {
      q: t('Is my data sent to Anthropic or OpenAI?', 'هل يتم إرسال بياناتي لـ OpenAI أو Anthropic؟'),
      a: t(
        'No. Unless you configure cloud APIs, all intelligence runs 100% locally on-device. Zero network traffic is generated for AI inferences.',
        'لا، تظل الواجهات والمعالجات محلية 100%، ولا يتم إرسال أي بيانات أو زيارات برمجية للخوادم السحابية الخارجية.'
      )
    },
    {
      q: t('How much does Vixcell cost?', 'ما هي تكلفة استخدام منصة فيكسل؟'),
      a: t(
        'Vixcell is free under the Apache-2.0 open-source license. There are no monthly subscriptions, usage limits, or cloud billing credits.',
        'فيكسل مجانية تماماً ومفتوحة المصدر بالكامل، بدون أي اشتراكات شهرية، فواتير تشغيل سحابية، أو قيود على الاستخدام.'
      )
    }
  ]

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx)
  }

  return (
    <section 
      id="faq" 
      className="py-24 bg-white border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-4 py-1.5 uppercase tracking-widest">
            {t('FAQ Support', 'الأسئلة الشائعة')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal text-black mt-4 mb-2 tracking-tight leading-relaxed">
            {t('Vixcell FAQ — open source, local-first ', 'الأسئلة الشائعة حول فيكسل — بديل محلي ')}
            <span className="font-serif italic">{t('Claude Design alternative', 'مفتوح المصدر لـ Claude Design')}</span>
          </h2>
        </div>

        {/* Accordions (Clean high-density listing from Video) */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {items.map((item, idx) => {
            const isOpen = openIdx === idx
            return (
              <div 
                key={idx} 
                className="border border-neutral-200 bg-white rounded-xl overflow-hidden hover:border-neutral-300 transition-all duration-350 shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
              >
                {/* Header Button */}
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 flex items-center justify-between text-right lg:text-left text-neutral-800"
                  style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
                >
                  <span className="text-xs font-bold flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                    {item.q}
                  </span>
                  <span className="text-[#22C55E]">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {/* Animated Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div 
                        className="px-5 pb-5 text-[11px] text-[#71717A] border-t border-neutral-100 pt-3 leading-relaxed text-right lg:text-left"
                        style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
                      >
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
