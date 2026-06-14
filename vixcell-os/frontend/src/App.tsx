import { useEffect, useState } from 'react'
// HashRouter: BrowserRouter breaks under file:// when packaged in Electron
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore, useAppStore } from '@/store'
import { authAPI } from '@/api/client'

import Layout from '@/components/Layout'
import AssistantBar from '@/components/AssistantBar'
import LoginPage from '@/pages/LoginPage'
import SetupWizardPage from '@/pages/SetupWizardPage'
import DashboardPage from '@/pages/DashboardPage'
import LeadsPage from '@/pages/LeadsPage'
import CRMPage from '@/pages/CRMPage'
import SocialPage from '@/pages/SocialPage'
import ContentPage from '@/pages/ContentPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import SettingsPage from '@/pages/SettingsPage'
import AIModelsPage from '@/pages/AIModelsPage'
import KnowledgePage from '@/pages/KnowledgePage'
import FlowBuilderPage from '@/pages/FlowBuilderPage'
import TasksPage from '@/pages/TasksPage'
import ProjectsPage from '@/pages/ProjectsPage'
import MeetingsPage from '@/pages/MeetingsPage'
import TrainingPage from '@/pages/TrainingPage'
import AutomationPage from '@/pages/AutomationPage'
import WhatsAppPage from '@/pages/WhatsAppPage'
import WebsitePage from '@/pages/WebsitePage'
import CoworkPage from '@/pages/CoworkPage'

// Shown in the floating bar window before the user logs into the main app
function BarLocked() {
  return (
    <div className="h-screen w-screen flex items-center justify-center p-1.5">
      <div className="w-full h-[58px] rounded-2xl border border-line flex items-center justify-center gap-2 text-xs text-slate-400"
        style={{ background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(14px)' }}>
        سجّل الدخول من تطبيق Vixcell الأول عشان البار يشتغل
      </div>
    </div>
  )
}

type AppStatus = 'loading' | 'setup' | 'login' | 'ready'

export default function App() {
  const [status, setStatus] = useState<AppStatus>('loading')
  const { isAuthenticated, loadUser, autoLogin } = useAuthStore()
  const { language } = useAppStore()

  useEffect(() => {
    // Apply language direction
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', language)
  }, [language])

  // The floating voice bar is its own Electron window (#/bar). Render it
  // immediately and independently of the app's loading/setup/login flow —
  // otherwise the tiny bar window would show the loading spinner or the setup
  // wizard instead of the bar (this is why it appeared "not working").
  const isBarWindow = typeof window !== 'undefined' && window.location.hash.startsWith('#/bar')

  useEffect(() => {
    if (!isBarWindow) return
    // Make sure the bar can run commands even if it opened before the main
    // window signed in (shared localStorage token).
    if (!localStorage.getItem('access_token')) {
      autoLogin().catch(() => {})
    }
  }, [isBarWindow, autoLogin])

  useEffect(() => {
    if (isBarWindow) return // the bar window skips the app's auth/setup flow
    const init = async () => {
      try {
        const res = await authAPI.wizardStatus()
        if (res.data.setup_required) {
          setStatus('setup')
          return
        }
        if (isAuthenticated) {
          await loadUser()
          // loadUser logs out on a stale token — fall through to auto-login then
          if (useAuthStore.getState().isAuthenticated) {
            setStatus('ready')
            return
          }
        }
        // Desktop single-user mode: no login screen — the backend signs
        // the admin in automatically (Electron internal key gates access)
        try {
          await autoLogin()
          setStatus('ready')
        } catch {
          setStatus('login') // safety net (e.g. no active admin in DB)
        }
      } catch {
        // Backend not yet available — show login
        setStatus(isAuthenticated ? 'ready' : 'login')
      }
    }
    init()
  }, [])

  // All hooks are above this line — safe to branch now.
  if (isBarWindow) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a35', color: '#e2e8f0', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px' } }} />
        <AssistantBar />
      </>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-lg animate-pulse">
            <span className="text-2xl font-black text-white">V</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-500"
                style={{ animation: `bounce 1s infinite ${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a35',
            color: '#e2e8f0',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px',
          },
        }}
      />

      <Routes>
        {status === 'setup' && (
          <Route path="*" element={<SetupWizardPage onComplete={() => setStatus('ready')} />} />
        )}

        {status === 'login' && (
          <>
            <Route path="/bar" element={<BarLocked />} />
            <Route path="/login" element={<LoginPage onLogin={() => setStatus('ready')} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {status === 'ready' && (
          <>
            {/* Floating system-wide voice bar — its own Electron window (#/bar) */}
            <Route path="/bar" element={<AssistantBar />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/cowork" element={<CoworkPage />} />
              <Route path="/website" element={<WebsitePage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/automation" element={<AutomationPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/flows" element={<FlowBuilderPage />} />
              <Route path="/ai-models" element={<AIModelsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </>
        )}
      </Routes>
    </HashRouter>
  )
}
