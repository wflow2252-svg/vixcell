'use client'

import React, { useState, useEffect } from 'react'
import { 
  Laptop, 
  Tablet, 
  Smartphone, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  Activity
} from 'lucide-react'

interface HeaderProps {
  userRole: 'Admin' | 'Client' | 'Trainer'
  setUserRole: (role: 'Admin' | 'Client' | 'Trainer') => void
  deviceRole: 'control' | 'whiteboard' | 'chat'
  setDeviceRole: (role: 'control' | 'whiteboard' | 'chat') => void
  activeCallId: string | null
}

export default function Header({ 
  userRole, 
  setUserRole, 
  deviceRole, 
  setDeviceRole, 
  activeCallId 
}: HeaderProps) {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      }) + ' - ' + now.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-20 bg-[#0a0a0d]/80 border-b border-white/5 px-6 flex items-center justify-between backdrop-blur-md z-10 relative">
      {/* Left side: Ticking Clock */}
      <div className="flex items-center gap-2.5 text-gray-400 font-mono text-xs">
        <Clock className="h-4 w-4 text-[#c8a35c]" />
        <span className="bg-white/5 py-1 px-3 rounded-lg border border-white/5 tracking-wider font-semibold">{time || 'جاري التحميل...'}</span>
      </div>

      {/* Center/Right: Multi-Device Sync Panel */}
      <div className="flex items-center gap-6">
        {/* Multi-Device Role Coordinator */}
        <div className="flex items-center gap-2 bg-[#0c0c0e]/95 p-1 rounded-xl border border-white/5 shadow-inner">
          <span className="text-[10px] uppercase font-mono tracking-wider px-2 text-gray-500 font-semibold">Device Profile:</span>
          
          <button
            onClick={() => setDeviceRole('control')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceRole === 'control'
                ? 'bg-[#c8a35c] text-[#0c0c0e] font-bold shadow-[0_0_12px_rgba(200,163,92,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="PC Mode - Full Controls & Screen Share"
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>كمبيوتر</span>
          </button>

          <button
            onClick={() => setDeviceRole('whiteboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceRole === 'whiteboard'
                ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Tablet Draw Mode - Stealth drawing whiteboard sync"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span>تابلت</span>
          </button>

          <button
            onClick={() => setDeviceRole('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceRole === 'chat'
                ? 'bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(5,150,105,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Mobile Monitor Mode - Chat, AI Transcript log monitor"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>موبايل</span>
          </button>
        </div>

        {/* User Role Selector */}
        <div className="flex items-center gap-2 bg-[#0c0c0e]/95 p-1 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-mono tracking-wider px-2 text-gray-500 font-semibold">User Role:</span>
          
          {(['Admin', 'Client', 'Trainer'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setUserRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                userRole === role
                  ? 'bg-white/10 text-white border border-white/10 font-bold'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {role === 'Admin' ? 'الأدمن' : role === 'Client' ? 'العميل' : 'المدرب'}
            </button>
          ))}
        </div>

        {/* Active Call Status */}
        {activeCallId ? (
          <div className="flex items-center gap-2 bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs font-medium">
            <Activity className="h-3.5 w-3.5 animate-pulse text-red-500" />
            <span className="font-mono">LIVE MEETING ACTIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#0c0c0e]/95 px-3 py-1.5 rounded-lg border border-white/5 text-gray-500 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />
            <span>Standby</span>
          </div>
        )}
      </div>
    </header>
  )
}
