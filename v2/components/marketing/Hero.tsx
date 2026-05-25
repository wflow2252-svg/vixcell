'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-brand-gold/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[360px] h-[360px] rounded-full bg-brand-gold/15 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-3xl text-center"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-brand-goldDim border border-brand-gold/30 text-brand-gold text-xs font-semibold mb-6 tracking-wide">
          ✦ AI-Powered Website Builder
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          Describe it.{' '}
          <span className="bg-gradient-to-r from-white via-brand-gold to-white bg-clip-text text-transparent">
            Get a website.
          </span>
        </h1>

        <p className="text-lg text-brand-text2 mb-10 max-w-2xl mx-auto leading-relaxed">
          VIXCELL AI builds complete, production-ready websites from a sentence.
          HTML, CSS, JavaScript — generated live, in front of you. 100% local. No API keys.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/builder"
            className="bg-brand-gold hover:bg-brand-goldH text-black font-bold px-7 py-3.5 rounded-full transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-gold/30"
          >
            Start Building →
          </Link>
          <Link
            href="/templates"
            className="border border-brand-border hover:border-brand-borderH text-brand-text font-semibold px-7 py-3.5 rounded-full transition-colors"
          >
            Browse Templates
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-6 text-xs text-brand-text3 flex-wrap">
          <span>⚡ Instant generation</span>
          <span>🎨 8 themes × 5 fonts × 10 sections</span>
          <span>🔒 Local & free</span>
        </div>
      </motion.div>
    </section>
  )
}
