import React, { useEffect, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Portfolio from './components/Portfolio'
import ContactFooter from './components/ContactFooter'
import StartProjectForm from './components/StartProjectForm'
import FeedbackForm from './components/FeedbackForm'
import AdminDashboard from './components/AdminDashboard'
import PortfolioPage from './pages/PortfolioPage'
import MeetingRoom from './components/MeetingRoom'
import AIDesignerPage from './pages/AIDesignerPage'
import GemmaLandingSection from './components/GemmaLandingSection'

gsap.registerPlugin(ScrollTrigger)

// ─── Path ↔ view mapping ──────────────────────────────────────────
const PATH_TO_VIEW = {
  '/':          'landing',
  '/portfolio': 'portfolio',
  '/dashboard': 'start',     // legacy URL → new form
  '/start':     'start',
  '/feedback':  'feedback',
  '/admin':     'admin',
  '/meeting':   'meeting',
  '/designer':  'designer',
}
const VIEW_TO_PATH = {
  landing:   '/',
  portfolio: '/portfolio',
  start:     '/start',
  feedback:  '/feedback',
  admin:     '/admin',
  meeting:   '/meeting',
  designer:  '/designer',
}

function App() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('vix_lang') || 'ar';
    } catch {
      return 'ar';
    }
  })
  const [view, setView] = useState(() => {
    try {
      const path = window.location.pathname
      if (path.startsWith('/meeting/')) return 'meeting'
      if (PATH_TO_VIEW[path]) return PATH_TO_VIEW[path]
      const saved = localStorage.getItem('vix_view')
      if (saved && VIEW_TO_PATH[saved]) return saved
    } catch (e) {
      console.warn('[Vixcell] localStorage not available:', e)
    }
    return 'landing'
  })

  // Detect IP address country to set default language if not already saved
  useEffect(() => {
    async function detectLanguage() {
      try {
        if (localStorage.getItem('vix_lang')) return;
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        const arabCountries = ['EG', 'SA', 'AE', 'QA', 'BH', 'OM', 'KW', 'JO', 'LB', 'SY', 'IQ', 'YE', 'MA', 'DZ', 'TN', 'LY', 'SD', 'PS']
        if (arabCountries.includes(data.country_code)) {
          setLang('ar')
        } else {
          // If browser is english, use english, else default to arabic
          const browserLang = navigator.language || navigator.userLanguage || ''
          if (browserLang.startsWith('en')) {
            setLang('en')
          } else {
            setLang('ar')
          }
        }
      } catch (e) {
        console.warn('[Vixcell] IP language detection failed, defaulting to ar:', e)
      }
    }
    detectLanguage()
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    try { localStorage.setItem('vix_view', view) } catch {}
    let path = VIEW_TO_PATH[view] || '/'
    if (view === 'meeting' && window.location.pathname.startsWith('/meeting/')) {
      path = window.location.pathname
    }
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }, [view])

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname
      const newView = path.startsWith('/meeting/') ? 'meeting' : (PATH_TO_VIEW[path] || 'landing')
      setView(newView)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Smooth scroll only on the landing page (not on form/admin pages)
  useEffect(() => {
    if (view !== 'landing') return
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0, 0)
    lenis.scrollTo(0, { immediate: true })
    setTimeout(() => { ScrollTrigger.refresh() }, 100)
    return () => { lenis.destroy() }
  }, [view])

  // "Start a Project" trigger from Hero / Navbar → scroll to the contact form
  // (the ContactFooter on the landing page IS the project intake now)
  useEffect(() => {
    const handler = () => {
      if (view !== 'landing') {
        setView('landing')
        // Wait for landing to mount, then scroll
        setTimeout(() => scrollToContact(), 300)
      } else {
        scrollToContact()
      }
    }
    window.addEventListener('start-project', handler)
    return () => window.removeEventListener('start-project', handler)
  }, [view])

  function scrollToContact() {
    const el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ─── Route switch ─────────────────────────────────────────────
  if (view === 'portfolio') return <PortfolioPage onViewChange={setView} />
  if (view === 'start')     return <StartProjectForm onViewChange={setView} />
  if (view === 'feedback')  return <FeedbackForm    onViewChange={setView} />
  if (view === 'admin')     return <AdminDashboard  onViewChange={setView} />
  if (view === 'designer')  return <AIDesignerPage  onViewChange={setView} />
  if (view === 'meeting') {
    const path = window.location.pathname
    const pathCode = path.startsWith('/meeting/') ? path.substring(9) : ''
    const queryParams = new URLSearchParams(window.location.search)
    const isAdminRole = queryParams.get('role')?.toLowerCase() === 'admin'
    const code = pathCode || queryParams.get('code') || queryParams.get('id') || ''
    return <MeetingRoom isAdmin={isAdminRole} onViewChange={setView} joinMeetingId={code} />
  }

  // Landing
  return (
    <div className="app-wrapper">
      <Navbar currentView={view} onViewChange={setView} onStartProject={() => { setView('landing'); setTimeout(() => scrollToContact(), 100) }} lang={lang} setLang={setLang} />

      <main style={{ minHeight: '100vh' }}>
        <Hero onStartProject={() => { setView('landing'); setTimeout(() => scrollToContact(), 100) }} lang={lang} />
        <Services lang={lang} />
        <GemmaLandingSection lang={lang} />
        <Portfolio onViewChange={setView} lang={lang} />
      </main>

      <ContactFooter lang={lang} />
    </div>
  )
}

export default App
