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
import ClientDashboard from './components/ClientDashboard'
import PortfolioPage from './pages/PortfolioPage'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [view, setView] = useState(() => {
    try {
      if (window.location.pathname === '/dashboard') return 'dashboard'
      if (window.location.pathname === '/portfolio') return 'portfolio'
      
      const saved = localStorage.getItem('vix_view')
      if (saved === 'dashboard') return 'dashboard'
      if (saved === 'portfolio') return 'portfolio'
    } catch (e) {
      console.warn('[Vixcell] localStorage not available:', e)
    }
    return 'landing'
  })

  useEffect(() => {
    try { localStorage.setItem('vix_view', view) } catch (e) { /* ignore */ }
    if (view === 'portfolio') {
      window.history.pushState({}, '', '/portfolio')
    } else if (view === 'landing') {
      window.history.pushState({}, '', '/')
    } else if (view === 'dashboard') {
      window.history.pushState({}, '', '/dashboard')
    }
  }, [view])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
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

  // Listen for "Start a Project" trigger from Hero / Navbar
  useEffect(() => {
    const handler = () => setView('dashboard')
    window.addEventListener('start-project', handler)
    return () => window.removeEventListener('start-project', handler)
  }, [])

  // Portfolio full page
  if (view === 'portfolio') {
    return <PortfolioPage onViewChange={setView} />
  }

  // Dashboard = full AI page
  if (view === 'dashboard') {
    return <ClientDashboard onViewChange={setView} />
  }

  return (
    <div className="app-wrapper">
      <Navbar currentView={view} onViewChange={setView} onStartProject={() => setView('dashboard')} />

      <main style={{ minHeight: '100vh' }}>
        {view === 'landing' ? (
          <>
            <Hero onStartProject={() => setView('dashboard')} />
            <Services />
            <Portfolio onViewChange={setView} />
            <AIDemo />
          </>
        ) : null}
      </main>

      <ContactFooter />
      <LiveChat />
    </div>
  )
}

export default App
