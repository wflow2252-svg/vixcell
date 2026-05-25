'use client'

import Link from 'next/link'
import { useState } from 'react'
import Navbar from '@/components/marketing/Navbar'
import Footer from '@/components/marketing/Footer'
import { TEMPLATES, CATEGORIES, Template } from '@/lib/templates/catalog'

export default function TemplatesPage() {
  const [active, setActive] = useState<string>('all')

  const filtered: Template[] = active === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === active)

  function launch(t: Template) {
    // Pass the template prompt to /builder via query param.
    // The Builder reads ?prompt= on load and auto-starts a conversation.
    const params = new URLSearchParams({ prompt: t.prompt })
    window.location.href = `/builder?${params.toString()}`
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-goldDim border border-brand-gold/30 text-brand-gold text-[11px] font-bold uppercase tracking-wider mb-3">
              Template Gallery
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              Start from a template
            </h1>
            <p className="text-brand-text2 max-w-xl mx-auto">
              Each template is an AI-customizable starting point. Pick one, then refine.
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <button
              onClick={() => setActive('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                active === 'all'
                  ? 'bg-brand-gold text-black'
                  : 'bg-brand-bg2 border border-brand-border text-brand-text2 hover:text-brand-text'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  active === c.id
                    ? 'bg-brand-gold text-black'
                    : 'bg-brand-bg2 border border-brand-border text-brand-text2 hover:text-brand-text'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(t => (
              <div
                key={t.id}
                className="p-6 bg-brand-bg2 border border-brand-border rounded-2xl hover:border-brand-borderH transition-all flex flex-col"
              >
                <div className="text-4xl mb-4">{t.icon}</div>
                <h3 className="text-lg font-bold mb-1.5">{t.name}</h3>
                <p className="text-sm text-brand-text2 mb-4 flex-1">{t.description}</p>
                <ul className="text-xs text-brand-text3 mb-5 space-y-1">
                  {t.features.slice(0, 3).map((f, i) => <li key={i}>· {f}</li>)}
                </ul>
                <button
                  onClick={() => launch(t)}
                  className="bg-brand-gold hover:bg-brand-goldH text-black text-sm font-bold py-2.5 rounded-lg transition-all"
                >
                  Use this template →
                </button>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-brand-text3 py-12">No templates in this category yet.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
