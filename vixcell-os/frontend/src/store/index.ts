import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/api/client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  tenant_id: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  autoLogin: () => Promise<void>
  logout: () => void
  setupWizard: (data: any) => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authAPI.login(email, password)
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          set({ accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })
          await get().loadUser()
        } finally {
          set({ isLoading: false })
        }
      },

      // Desktop single-user mode — backend signs the admin in, no password UI
      autoLogin: async () => {
        set({ isLoading: true })
        try {
          const res = await authAPI.autoLogin()
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          set({ accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })
          await get().loadUser()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      setupWizard: async (data) => {
        set({ isLoading: true })
        try {
          const res = await authAPI.wizardSetup(data)
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          set({ accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })
          await get().loadUser()
        } finally {
          set({ isLoading: false })
        }
      },

      loadUser: async () => {
        try {
          const res = await authAPI.me()
          set({ user: res.data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'vixcell-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)

// ── App UI Store ───────────────────────────────────────────────────────────────
interface AppState {
  sidebarOpen: boolean
  language: 'ar' | 'en'
  theme: 'dark' | 'light'
  currentTenantId: string | null
  toggleSidebar: () => void
  setLanguage: (lang: 'ar' | 'en') => void
  setTenant: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      language: 'ar',
      theme: 'dark',
      currentTenantId: null,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setLanguage: (lang) => {
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
        document.documentElement.setAttribute('lang', lang)
        set({ language: lang })
      },
      setTenant: (id) => set({ currentTenantId: id }),
    }),
    { name: 'vixcell-app' }
  )
)
