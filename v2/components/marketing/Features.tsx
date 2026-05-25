'use client'

import { motion } from 'framer-motion'

const FEATURES = [
  { icon: '🤖', title: 'AI Site Generator',     desc: 'Describe your business — get a complete, responsive site with hero, features, testimonials, and more.' },
  { icon: '⚡', title: 'Live Code Streaming',    desc: 'Watch every line of code being written in real-time. No black box. The code is yours.' },
  { icon: '🎨', title: 'Real Variability',       desc: '8 palettes × 5 fonts × 10 section types. Every project gets a unique design, not a swapped template.' },
  { icon: '📦', title: 'Export as ZIP',          desc: 'Download separate index.html, style.css, script.js — drop them on any host. No lock-in.' },
  { icon: '🌍', title: 'Bilingual',              desc: 'Fluent in Arabic and English. Detects your language and responds in kind.' },
  { icon: '🔒', title: 'Local & Private',        desc: 'Runs entirely in your browser. No data leaves your device. No subscriptions. No API keys.' },
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 border-t border-brand-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-goldDim border border-brand-gold/30 text-brand-gold text-[11px] font-bold uppercase tracking-wider mb-3">
            What You Get
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Built like a real engineer would
          </h2>
          <p className="text-brand-text2 max-w-xl mx-auto">
            Not a no-code drag-and-drop. Real code, clean structure, production-ready.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-7 bg-brand-bg2 border border-brand-border rounded-2xl hover:border-brand-borderH hover:-translate-y-1 transition-all"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-brand-text2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
