'use client'

import { motion } from 'framer-motion'

interface TrustedByProps {
  lang: 'ar' | 'en';
}

const LOGOS = [
  'OpenAI', 'Stripe', 'Linear', 'Vercel', 'Notion', 'Raycast', 
  'Supabase', 'Figma', 'GitHub', 'Google', 'Next.js', 'Tailwind'
]

export default function TrustedBy({ lang }: TrustedByProps) {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  return (
    <section className="py-12 bg-white border-y border-neutral-200 overflow-hidden relative z-10">
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
          {t('POWERING LEADING DIGITAL EXPERIENCES', 'نطور ونهندس حلولاً لرواد التكنولوجيا')}
        </span>
      </div>

      {/* Infinite loop marquee */}
      <div className="flex w-full overflow-hidden mask-gradient-marquee relative py-2">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex gap-16 whitespace-nowrap min-w-full"
          animate={{ x: [0, -500] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 15,
              ease: "linear",
            },
          }}
        >
          {/* First loop list */}
          {LOGOS.concat(LOGOS).map((logo, idx) => (
            <div key={idx} className="text-sm font-extrabold text-neutral-400 hover:text-black transition-colors duration-300 select-none cursor-default font-mono flex items-center gap-2">
              <span className="text-[#22C55E]">✦</span> {logo}
            </div>
          ))}
        </motion.div>
      </div>

      <style jsx>{`
        .mask-gradient-marquee {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </section>
  )
}
