'use client'

import Link from 'next/link'

export default function CTA() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-brand-goldDim to-brand-bg2 border border-brand-gold/25 text-center">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
          Ready to build?
        </h2>
        <p className="text-brand-text2 mb-8">
          Free. Local. No signup. Just describe what you need and watch it appear.
        </p>
        <Link
          href="/builder"
          className="inline-block bg-brand-gold hover:bg-brand-goldH text-black font-bold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-gold/40"
        >
          Open the Builder →
        </Link>
      </div>
    </section>
  )
}
