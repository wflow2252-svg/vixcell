'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  Video, 
  FolderArchive, 
  Users, 
  Link2, 
  Sparkles,
  Volume2
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  activeCallId: string | null
}

export default function Sidebar({ activeTab, setActiveTab, activeCallId }: SidebarProps) {
  const menuItems = [
    { id: 'live-panel', label: 'لوحة المراقبة', desc: 'Live Panel', icon: LayoutDashboard },
    { id: 'live-call', label: 'الاجتماع المباشر', desc: 'Live Meeting', icon: Video, highlight: !!activeCallId },
    { id: 'archive', label: 'أرشيف الجلسات', desc: 'Meetings Library', icon: FolderArchive },
    { id: 'clients', label: 'إدارة العملاء CRM', desc: 'Client Relations', icon: Users },
    { id: 'projects', label: 'المشاريع والروابط', desc: 'Projects & Links', icon: Link2 },
    { id: 'site-content', label: 'محتوى الموقع', desc: 'Site Customizer', icon: Sparkles }
  ]

  return (
    <aside className="w-72 bg-[#0a0a0d]/90 border-r border-white/5 flex flex-col justify-between relative backdrop-blur-xl z-20">
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-[#c8a35c] to-[#e5c07b] shadow-[0_0_15px_rgba(200,163,92,0.3)]">
            <Volume2 className="h-5 w-5 text-[#0c0c0e] stroke-[2.5]" />
            <div className="absolute inset-0 rounded-lg animate-ping bg-[#c8a35c]/20 opacity-75 pointer-events-none" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
              VIXCELL <span className="text-xs px-1.5 py-0.5 rounded bg-[#c8a35c]/10 text-[#c8a35c] border border-[#c8a35c]/20">OS</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Collaborative Suite</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-2.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#c8a35c]/15 to-[#c8a35c]/5 text-white border border-[#c8a35c]/30 shadow-[0_0_20px_rgba(200,163,92,0.08)]' 
                    : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/5'
                }`}
              >
                {/* Visual active tab left indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c8a35c] shadow-[0_0_10px_#c8a35c]" />
                )}

                {/* Content */}
                <div className="flex items-center gap-3.5 z-10">
                  <div className={`p-2 rounded-lg transition-colors duration-300 ${
                    isActive ? 'bg-[#c8a35c]/25 text-[#c8a35c]' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    <Icon className={`h-[18px] w-[18px] ${item.highlight ? 'animate-pulse text-red-500' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold tracking-wide font-sans">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{item.desc}</p>
                  </div>
                </div>

                {/* Hot indicators */}
                {item.highlight && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 bg-[#08080a]/50">
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>SERVER SECURE</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 font-semibold uppercase">ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
