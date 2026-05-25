'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-brand-bg/85 backdrop-blur-xl border-b border-brand-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="VIXCELL" width={32} height={32} className="rounded-lg" />
          <span className="font-extrabold tracking-wide text-[15px]">VIXCELL</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-brand-text2">
          <Link href="/builder"   className="hover:text-brand-text transition-colors">Builder</Link>
          <Link href="/templates" className="hover:text-brand-text transition-colors">Templates</Link>
          <a href="#features"     className="hover:text-brand-text transition-colors">Features</a>
          <a href="#pricing"      className="hover:text-brand-text transition-colors">Pricing</a>
        </div>

        <Link
          href="/builder"
          className="bg-brand-gold hover:bg-brand-goldH text-black text-sm font-semibold px-4 py-2 rounded-full transition-all"
        >
          Start Building
        </Link>
      </div>
    </nav>
  )
}
