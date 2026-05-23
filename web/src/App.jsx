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
import GoogleSignInModal from './components/GoogleSignInModal'
import AIProjectChat from './components/AIProjectChat'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('vix_view')
    if (saved === 'dashboard') return 'dashboard'
    if (window.location.pathname === '/portfolio') return 'portfolio'
    return 'landing'
  })
  const [showSignIn, setShowSignIn] = useState(false)
  const [user, setUser] = useState(null)
  const [showAIChat, setShowAIChat] = useState(false)

  // Restore user session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('vix_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('vix_view', view)
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
    const handler = () => handleStartProject()
    window.addEventListener('start-project', handler)
    return () => window.removeEventListener('start-project', handler)
  }, [user])

  function handleStartProject() {
    if (user) {
      // AI goes to dashboard
      setView('dashboard')
      setShowAIChat(false)
    } else {
      setShowSignIn(true)
    }
  }

  function handleSignInSuccess(userData) {
    setUser(userData)
    // Save user session persistently
    localStorage.setItem('vix_user', JSON.stringify(userData))
    setShowSignIn(false)
    // Go to dashboard with AI
    setView('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('vix_user')
    setUser(null)
    setView('landing')
    setShowAIChat(false)
  }

  // Full-screen AI Chat (separate mode)
  if (showAIChat) {
    return (
      <AIProjectChat
        user={user}
        onClose={() => setShowAIChat(false)}
      />
    )
  }

  // Portfolio full page
  if (view === 'portfolio') {
    return <PortfolioPage onViewChange={setView} />
  }

  // Dashboard with integrated AI
  if (view === 'dashboard') {
    return (
      <ClientDashboard
        onViewChange={setView}
        user={user}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app-wrapper">
      <Navbar currentView={view} onViewChange={setView} onStartProject={handleStartProject} user={user} onLogout={handleLogout} />

      <main style={{ minHeight: '100vh' }}>
        {view === 'landing' ? (
          <>
            <Hero onStartProject={handleStartProject} />
            <Services />
            <Portfolio onViewChange={setView} />
            <AIDemo />
          </>
        ) : null}
      </main>

      <ContactFooter />
      <LiveChat />

      {/* Google Sign-In Modal */}
      {showSignIn && (
        <GoogleSignInModal
          onSuccess={handleSignInSuccess}
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  )
}

export default App
