'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface CapabilitiesProps {
  lang: 'ar' | 'en';
}

export default function Capabilities({ lang }: CapabilitiesProps) {
  const [activeTab, setActiveTab] = useState<'proto' | 'artifact' | 'slides' | 'image' | 'video' | 'hyper'>('proto')
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const items = {
    proto: {
      prompt: 'Describe what you want to build a landing page for... e.g. Qelora projects workspace.',
      stats: 'Prototype · HTML/CSS + TSX'
    },
    artifact: {
      prompt: 'Build a live interactive workspace calculator widget or pricing matrix block.',
      stats: 'Live Artifact · Sandbox Sandbox'
    },
    slides: {
      prompt: 'Generate an interactive slide deck showing local agent design concepts.',
      stats: 'Slide deck · HTML Slide'
    },
    image: {
      prompt: 'Compile optimized SVG drawings representing golden ratio layout diagrams.',
      stats: 'Image · SVG Vector'
    },
    video: {
      prompt: 'Generate a short product walkthrough walkthrough MP4 movie file.',
      stats: 'Video · HTML Render'
    },
    hyper: {
      prompt: 'Build nested HyperFrames with timeline-based motion layers.',
      stats: 'HyperFrames · Motion Engine'
    }
  }

  const current = items[activeTab]

  return (
    <section 
      className="py-24 bg-[#FAF9F6] border-b border-neutral-200 relative z-10"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        
        {/* Title */}
        <h2 className="text-2xl sm:text-4xl font-normal text-black mb-4 tracking-tight leading-relaxed">
          {t('Explore Vixcell outputs & options', 'استكشف مخرجات وقدرات منصة فيكسل')}
        </h2>
        
        {/* ─── FLOATING TEMPLATE PLAYGROUND SIMULATOR (From Video) ─── */}
        <div className="border border-neutral-200 bg-white rounded-2xl p-6 max-w-2xl mx-auto text-left shadow-sm flex flex-col gap-4">
          <div className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase border-b border-neutral-100 pb-2">
            The open-source design workspace generator
          </div>

          {/* Prompt tabs selection */}
          <div className="flex flex-wrap gap-1.5 bg-neutral-50 p-1 rounded-lg border border-neutral-200/50">
            {Object.keys(items).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as keyof typeof items)}
                className={`text-[9px] font-bold px-3 py-1.5 rounded transition-all ${
                  activeTab === key
                    ? 'bg-white text-black shadow-sm border border-neutral-200/60'
                    : 'text-[#71717A] hover:text-black'
                }`}
              >
                {key === 'proto' ? 'Prototype' : 
                 key === 'artifact' ? 'Live artifact' :
                 key === 'slides' ? 'Slide deck' :
                 key === 'image' ? 'Image' : 
                 key === 'video' ? 'Video' : 'HyperFrames'}
              </button>
            ))}
          </div>

          {/* Interactive prompt textbox */}
          <div className="border border-neutral-200 rounded-lg p-3 bg-[#FAF9F6] min-h-[90px] text-xs text-neutral-800 leading-relaxed font-mono flex flex-col justify-between">
            <motion.span
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {current.prompt}
            </motion.span>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-200/40">
              <span className="text-[9px] font-bold text-neutral-400 uppercase">{current.stats}</span>
              <button className="bg-neutral-800 hover:bg-black text-white text-[9px] font-bold px-3 py-1 rounded">Generate</button>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
