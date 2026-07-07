'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface NavbarProps {
  lang?: 'ar' | 'en';
  setLang?: (lang: 'ar' | 'en') => void;
}

export default function Navbar({ lang: propLang, setLang: propSetLang }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [localLang, setLocalLang] = useState<'ar' | 'en'>('ar')
  const lang = propLang || localLang

  const setLang = (nextLang: 'ar' | 'en') => {
    if (propSetLang) propSetLang(nextLang)
    else setLocalLang(nextLang)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  const handleToggleLang = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar'
    setLang(nextLang)
    try { localStorage.setItem('vix_lang', nextLang) } catch {}
  }

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 border-b ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-neutral-200/80 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.02)]' 
          : 'bg-transparent border-transparent py-5'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Vixcell Logo" width={28} height={28} className="rounded" />
          <span className="font-extrabold text-sm tracking-tight text-black">VIXCELL</span>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#52525B]">
          <Link href="/builder" className="hover:text-black transition-colors">{t('Product', 'المنتج')}</Link>
          <a href="#features" className="hover:text-black transition-colors">{t('Why Vixcell', 'لماذا فيكسل')}</a>
          <a href="#agents" className="hover:text-black transition-colors">{t('Agents', 'المساعدين')}</a >
          <a href="#workflow" className="hover:text-black transition-colors">{t('Workflow', 'آلية العمل')}</a >
          <a href="#pricing" className="hover:text-black transition-colors">{t('Pricing', 'الأسعار')}</a >
          <a href="#faq" className="hover:text-black transition-colors">{t('Resources', 'المصادر')}</a >
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleLang}
            className="text-[11px] font-bold text-[#52525B] hover:text-black transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          
          <Link
            href="/builder"
            className="text-[11px] font-bold text-[#52525B] hover:text-black transition-colors border border-neutral-200 px-3.5 py-1.5 rounded-full hover:bg-neutral-50 transition-all"
          >
            {t('Sign in', 'تسجيل الدخول')}
          </Link>
          
          <Link
            href="/builder"
            className="bg-black hover:bg-neutral-800 text-white text-[11px] font-bold px-4 py-2 rounded-full transition-all"
          >
            {t('Download', 'تحميل')}
          </Link>
        </div>

      </div>
    </nav>
  )
}
