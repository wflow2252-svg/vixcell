'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/marketing/Navbar'
import Hero from '@/components/marketing/Hero'
import TrustedBy from '@/components/marketing/TrustedBy'
import Features from '@/components/marketing/Features'
import Workflow from '@/components/marketing/Workflow'
import Capabilities from '@/components/marketing/Capabilities'
import Comparison from '@/components/marketing/Comparison'
import Pricing from '@/components/marketing/Pricing'
import Testimonials from '@/components/marketing/Testimonials'
import FAQ from '@/components/marketing/FAQ'
import CTA from '@/components/marketing/CTA'
import Footer from '@/components/marketing/Footer'

export default function HomePage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const [showDock, setShowDock] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vix_lang')
      if (saved === 'ar' || saved === 'en') {
        setLang(saved)
      }
    } catch {}

    const handleScroll = () => {
      setShowDock(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />
      <main className="bg-white text-black min-h-screen">
        <Hero lang={lang} />
        <TrustedBy lang={lang} />
        <Features lang={lang} />
        <Workflow lang={lang} />
        <Capabilities lang={lang} />
        <Comparison lang={lang} />
        <Pricing lang={lang} />
        <Testimonials lang={lang} />
        <FAQ lang={lang} />
        <CTA lang={lang} />
      </main>
      <Footer lang={lang} />

      {/* Floating Glass Dock at the Bottom */}
      {showDock && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-fadeUp">
          <div className="bg-white/60 backdrop-blur-lg border border-neutral-200/80 rounded-full px-6 py-3 flex items-center gap-4 shadow-[0_15px_35px_rgba(0,0,0,0.06)] pointer-events-auto transition-all">
            <span className="text-[10px] font-black text-black hidden sm:inline">VIXCELL AI</span>
            <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
            <Link
              href="/builder"
              className="bg-black hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded-full text-[10px] tracking-wide transition-all"
            >
              {lang === 'ar' ? 'تحميل منصة العمل' : 'Download desktop'}
            </Link>
            <a
              href="mailto:hello@vixcell.com"
              className="border border-neutral-200 hover:border-neutral-300 bg-white/80 text-black font-bold px-4 py-2 rounded-full text-[10px] transition-all"
            >
              {lang === 'ar' ? 'احجز استشارة' : 'Book a Call'}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
