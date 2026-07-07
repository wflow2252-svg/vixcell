'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface HeroProps {
  lang: 'ar' | 'en';
}

export default function Hero({ lang }: HeroProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16 overflow-hidden bg-white text-center"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      
      {/* ─── FLOATING DESIGN TOOLS (Left & Right Sides PNG Assets from open-design.ai) ─── */}
      {/* Left side: Stylus pen overlapping grid, with T block below */}
      {/* Left side: Exact user-provided design assets image */}
      <div className="absolute left-[3%] top-[10%] hidden xl:block pointer-events-none select-none w-[300px]">
        <Image
          src="/vixcell_left_design_assets.png"
          alt="Design Assets"
          width={300}
          height={440}
          className="opacity-95 drop-shadow-sm"
          priority
        />
      </div>

      {/* Right side: Golden Ratio and Blue cylinder elements */}
      <div className="absolute right-[4%] top-[18%] hidden xl:flex flex-col gap-10 pointer-events-none select-none items-end max-w-[260px]">
        {/* Golden Ratio card */}
        <div className="border border-neutral-200 p-1 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
          <svg className="w-48 h-32 stroke-neutral-200" viewBox="0 0 100 60" fill="none">
            <rect x="2" y="2" width="96" height="56" rx="4" strokeWidth="0.3" />
            <path d="M50 2V58M2 30H98" strokeWidth="0.3" />
            <path d="M50,30 A20,20 0 0,1 70,30 A40,40 0 0,1 30,30 A80,80 0 0,1 98,30" strokeWidth="0.3" stroke="#CCCCCC" />
          </svg>
        </div>

        {/* Small floating blue cylinder/stylus decoration element */}
        <div className="w-20 h-6 bg-gradient-to-r from-cyan-400 to-[#8B5CF6] rounded-full transform rotate-12 opacity-80 shadow-sm border border-white/20" />
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center gap-6">
        
        {/* Small Centered Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[10px] font-black text-[#22C55E] tracking-widest uppercase"
        >
          {t('OPEN SOURCE CLAUDE DESIGN ALTERNATIVE', 'بديل وكالات التصميم بنظام ذكاء اصطناعي محلي 100%')}
        </motion.div>

        {/* ─── FIGMA SELECTION BOX TITLE (Original Static Layout) ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="border-2 border-[#22C55E] p-8 md:p-12 relative max-w-2xl mx-auto rounded bg-white select-none"
        >
          {/* Corner nodes (Handles) */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#22C55E] rounded-sm" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#22C55E] rounded-sm" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#22C55E] rounded-sm" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#22C55E] rounded-sm" />

          {/* Heading content */}
          <h1 className="text-4xl sm:text-6xl md:text-[80px] font-bold tracking-tight leading-[1.02] text-black">
            <span className="font-serif italic font-normal tracking-wide block mb-2">Vixcell</span>
            <span className="font-sans font-black tracking-tight text-3xl sm:text-5xl md:text-6xl block">
              {t('The Vibe Design Workspace', 'منصة تصميم الواجهات الذكية')}
            </span>
          </h1>
        </motion.div>

        {/* Centered CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap gap-3 mt-4 justify-center"
        >
          <Link
            href="/builder"
            className="bg-black hover:bg-neutral-800 text-white font-bold px-8 py-3.5 rounded-full text-xs tracking-wide transition-all shadow-md"
          >
            {t('Download workspace · Windows', 'تحميل منصة العمل · ويندوز')}
          </Link>

          <a
            href="mailto:hello@vixcell.com"
            className="border border-neutral-200 hover:border-neutral-300 bg-white text-black font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-sm"
          >
            {t('Book a Strategy Call', 'احجز جلسة استشارية')}
          </a>
        </motion.div>

        {/* Centered Support Text */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xs sm:text-sm text-[#71717A] max-w-2xl leading-relaxed mt-2"
        >
          {t(
            'Vixcell is the open-source, local vibe design workspace — it turns the coding agents you already run into a design engine that carries you from idea to prototype, web, slides, and HTML video, all finished on your own machine. Agent-native, with 21 coding agents, 129 design systems, and an Apache-2.0 license.',
            'فيكسل هي بيئة عمل مفتوحة المصدر ومحلية لتصميم الواجهات الرقمية — تقوم بتحويل مساعدي البرمجة لديك لمحرك تصميم متكامل ينقلك من الفكرة إلى النموذج الأولي، الويب، الشرائح، وفيديو HTML، كل ذلك على جهازك المحلي وبخصوصية كاملة.'
          )}
        </motion.p>

        {/* ─── INNER WORKSPACE PREVIEW WINDOW (From Video) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="w-full mt-16 relative border border-neutral-200 bg-white p-2 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Mockup bar */}
          <div className="flex gap-1.5 px-3 py-2 border-b border-neutral-200 mb-2 bg-neutral-50 justify-between items-center">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            </div>
            <div className="text-[9px] text-[#A1A1AA] font-mono tracking-widest uppercase">VIXCELL WORKSPACE CLIENT</div>
            <div className="w-8" />
          </div>

          {/* Interactive workspace interior screenshot */}
          <div className="bg-[#FAF9F6] p-4 rounded-lg border border-neutral-200 flex flex-col md:flex-row gap-4 text-left">
            {/* Left sidebar info panel */}
            <div className="w-full md:w-[32%] flex flex-col gap-4 font-mono text-[10px] text-[#71717A] bg-white border border-neutral-200 p-4 rounded-lg">
              <div className="font-bold text-[#09090B] pb-2 border-b border-neutral-100 flex items-center justify-between">
                <span>Liquid Glass Agency</span>
                <span className="text-[#22C55E]">● Active</span>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-black font-semibold">1. Visual Identity "Liquid Glass"</span>
                  <p className="mt-1 leading-relaxed">The core of the design is liquid glass, glassmorphism effect. Every component is custom made, with high-end glass borders.</p>
                </div>
                <div>
                  <span className="text-black font-semibold">2. Dark & Light Balance</span>
                  <p className="mt-1 leading-relaxed">The page uses dynamic light backdrops mixed with deep pure black sections, creating a premium contrast.</p>
                </div>
              </div>
            </div>

            {/* Right preview/mockup browser */}
            <div className="flex-1 bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm flex flex-col min-h-[300px]">
              <div className="px-3 py-1.5 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between text-[9px] font-mono text-[#A1A1AA]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <span>localhost:3000/demo</span>
                </div>
                <div className="flex gap-2">
                  <span>HTML</span>
                  <span>React</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#22C55E]/5 via-white to-neutral-50">
                <h3 className="font-serif italic text-4xl text-[#09090B] mb-2">Qelora</h3>
                <p className="text-[10px] text-[#71717A] max-w-xs text-center leading-relaxed">Designing places beyond what's expected. Easy living starts here.</p>
                <div className="flex gap-2 mt-4">
                  <button className="bg-black text-white text-[9px] font-bold px-3 py-1.5 rounded-full">Start Project</button>
                  <button className="border border-neutral-200 text-black text-[9px] font-bold px-3 py-1.5 rounded-full">Watch Film</button>
                </div>
              </div>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  )
}
