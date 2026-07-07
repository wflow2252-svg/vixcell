'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShieldAlert, Sparkles, ArrowRight, CheckCircle2, User, Mail } from 'lucide-react'
import MeetingRoom from '@/components/dashboard/MeetingRoom'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
)

export default function ClientMeetingPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params?.code as string) || 'default-room'

  // Auth & Meeting State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)
  
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  
  const [meetingEnded, setMeetingEnded] = useState(false)
  const [attendanceSaved, setAttendanceSaved] = useState(false)

  // Simulation of Google OAuth
  const handleGoogleSignIn = () => {
    setIsLoggingIn(true)
    
    // Simulate OAuth redirect/popup delay
    setTimeout(async () => {
      const googleUser = {
        name: 'أحمد محمد (العميل)',
        email: 'ahmed.m@el-noor.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
      }
      
      setUserProfile(googleUser)
      setIsLoggingIn(false)
      setIsAuthenticated(true)
      
      // Save user attendance in the database via API
      try {
        const response = await fetch('/api/auth/save-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.avatar,
            provider: 'google'
          })
        })
        if (response.ok) {
          setAttendanceSaved(true)
        }
      } catch (err) {
        console.error('Failed to save attendance logs:', err)
      }
    }, 1500)
  }

  const handleManualSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim() || !customEmail.trim()) return
    
    setIsLoggingIn(true)
    setTimeout(async () => {
      const manualUser = {
        name: customName,
        email: customEmail,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(customName)}`
      }
      
      setUserProfile(manualUser)
      setIsLoggingIn(false)
      setIsAuthenticated(true)
      
      try {
        const response = await fetch('/api/auth/save-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            name: manualUser.name,
            email: manualUser.email,
            avatar: manualUser.avatar,
            provider: 'manual'
          })
        })
        if (response.ok) {
          setAttendanceSaved(true)
        }
      } catch (err) {
        console.error('Failed to save attendance logs:', err)
      }
    }, 1000)
  }

  if (meetingEnded) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#0c0c0e] text-[#e8e8ed] p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#c8a35c]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-[#0a0a0d]/80 border border-[#c8a35c]/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
          <div className="h-16 w-16 bg-[#c8a35c]/10 border border-[#c8a35c]/30 rounded-full flex items-center justify-center mx-auto text-[#c8a35c]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">انتهى الاجتماع بنجاح</h2>
            <p className="text-sm text-gray-400">شكراً لمشاركتك في هذا الاجتماع عبر منصة Vixcell AI.</p>
          </div>

          <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 space-y-2 text-right">
            <p className="text-xs text-gray-500 font-mono text-center">MEETING LOG SUMMARY</p>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
              <span className="text-gray-400">كود الغرفة:</span>
              <span className="font-mono text-[#c8a35c] font-bold">{code}</span>
            </div>
            {userProfile && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">اسم المشارك:</span>
                  <span className="text-white font-bold">{userProfile.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">البريد الإلكتروني:</span>
                  <span className="text-white font-mono">{userProfile.email}</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold rounded-lg text-sm hover:shadow-[0_0_15px_rgba(200,163,92,0.3)] transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  if (isAuthenticated && userProfile) {
    return (
      <div className="h-screen w-screen bg-[#08080a] p-4 overflow-hidden relative">
        <MeetingRoom
          callId={code}
          userRole="Client"
          deviceRole="control"
          onEnd={() => setMeetingEnded(true)}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#0c0c0e] text-[#e8e8ed] p-6 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#c8a35c]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0a0a0d]/80 border border-white/5 rounded-2xl p-8 space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-gradient-to-tr from-[#c8a35c] to-[#e5c07b] rounded-xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(200,163,92,0.2)]">
            <Sparkles className="h-6 w-6 text-[#0c0c0e]" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white font-mono">VIXCELL COLLABORATION</h1>
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Secured Client Portal</p>
        </div>

        {/* Meeting ID Badge */}
        <div className="bg-[#0c0c0e] border border-white/5 p-4 rounded-xl text-center space-y-1">
          <p className="text-xs text-gray-500 font-mono">INVITATION CODE</p>
          <p className="text-lg font-bold font-mono text-[#c8a35c] tracking-widest uppercase">{code}</p>
          <div className="flex items-center gap-1.5 justify-center text-[10px] text-green-500 font-mono mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
            <span>AES-256 SSL ENCRYPTED GATEWAY</span>
          </div>
        </div>

        {/* Sign In form container */}
        <div className="space-y-4">
          {!showManualForm ? (
            <>
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-xl transition flex items-center justify-center gap-3 text-sm focus:outline-none hover:border-[#c8a35c]/30 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              >
                {isLoggingIn ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                <span>الدخول بواسطة حساب Google</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-gray-600 text-[10px] uppercase font-mono">أو خيار بديل</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Guest Form Trigger */}
              <button
                onClick={() => setShowManualForm(true)}
                className="w-full py-2 text-xs text-gray-500 hover:text-white transition flex items-center justify-center gap-1"
              >
                <span>الدخول باسم مستخدم مخصص (ضيف)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <form onSubmit={handleManualSignIn} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold mb-1 block">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold mb-1 block">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="w-1/3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold border border-white/10 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-1 py-2 bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold rounded-lg text-xs hover:shadow-[0_0_12px_rgba(200,163,92,0.3)] transition flex items-center justify-center gap-2"
                >
                  {isLoggingIn && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
                  <span>انضم للاجتماع الآن</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Warning Notice */}
        <div className="flex items-start gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-right">
          <ShieldAlert className="h-4.5 w-4.5 text-yellow-500/80 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-yellow-500">ملاحظة أمنية</p>
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
              بدخولك هذه الغرفة، يتم تسجيل حضورك ومشاركة تدفقات الفيديو والصوت بطريقة آمنة ومشفرة. تخضع هذه الجلسة لسياسات حماية البيانات المعمول بها.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
