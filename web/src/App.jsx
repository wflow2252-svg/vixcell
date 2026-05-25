import React, { useEffect, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Portfolio from './components/Portfolio'
import AIDemo from './components/AIDemo'
import LiveChat from './components/LiveChat'
import ContactFooter from './components/ContactFooter'
import StartProjectForm from './components/StartProjectForm'
import FeedbackForm from './components/FeedbackForm'
import AdminDashboard from './components/AdminDashboard'
import PortfolioPage from './pages/PortfolioPage'

gsap.registerPlugin(ScrollTrigger)

// ─── Path ↔ view mapping ──────────────────────────────────────────
const PATH_TO_VIEW = {
  '/':          'landing',
  '/portfolio': 'portfolio',
  '/dashboard': 'start',     // legacy URL → new form
  '/start':     'start',
  '/feedback':  'feedback',
  '/admin':     'admin',
}
const VIEW_TO_PATH = {
  landing:   '/',
  portfolio: '/portfolio',
  start:     '/start',
  feedback:  '/feedback',
  admin:     '/admin',
}

function App() {
  const [view, setView] = useState(() => {
    try {
      const path = window.location.pathname
      if (PATH_TO_VIEW[path]) return PATH_TO_VIEW[path]
      const saved = localStorage.getItem('vix_view')
      if (saved && VIEW_TO_PATH[saved]) return saved
    } catch (e) {
      console.warn('[Vixcell] localStorage not available:', e)
    }
    return 'landing'
  })

  useEffect(() => {
    try { localStorage.setItem('vix_view', view) } catch {}
    const path = VIEW_TO_PATH[view] || '/'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }, [view])

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const newView = PATH_TO_VIEW[window.location.pathname] || 'landing'
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

  // Landing
  return (
    <div className="app-wrapper">
      <Navbar currentView={view} onViewChange={setView} onStartProject={() => { setView('landing'); setTimeout(() => scrollToContact(), 100) }} />

      <main style={{ minHeight: '100vh' }}>
        <Hero onStartProject={() => { setView('landing'); setTimeout(() => scrollToContact(), 100) }} />
        <Services />
        <Portfolio onViewChange={setView} />
        <AIDemo />
      </main>

      <ContactFooter />
      <LiveChat />
    </div>
  )
}

export default App
