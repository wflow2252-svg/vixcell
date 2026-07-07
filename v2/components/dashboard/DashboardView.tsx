'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import LiveMeetings from './LiveMeetings'
import MeetingRoom from './MeetingRoom'
import Archive from './Archive'
import CRM from './CRM'
import ProjectsManager from './ProjectsManager'
import SiteContentManager from './SiteContentManager'
import DeploymentsManager from './DeploymentsManager'

export default function DashboardView() {
  const [activeTab, setActiveTab] = useState('live-panel')
  const [userRole, setUserRole] = useState<'Admin' | 'Client' | 'Trainer'>('Admin')
  const [deviceRole, setDeviceRole] = useState<'control' | 'whiteboard' | 'chat'>('control')
  const [activeCallId, setActiveCallId] = useState<string | null>(null)

  // Parse room query parameters to auto-join meeting as client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const room = params.get('room')
      if (room) {
        setActiveCallId(room)
        setActiveTab('live-call')
        setUserRole('Client')
      }
    }
  }, [])
  
  // Real-time synchronization state for multi-device admin sessions
  const [multiDeviceSession, setMultiDeviceSession] = useState({
    sessionId: 'session_vixcell_core',
    devices: [
      { id: '1', name: 'PC (Control)', role: 'control', status: 'active' },
      { id: '2', name: 'Tablet (Whiteboard)', role: 'whiteboard', status: 'idle' },
      { id: '3', name: 'Mobile (Chat Logs)', role: 'chat', status: 'idle' }
    ]
  })

  // Auto transition to meeting view if call started
  const startCall = (callId: string) => {
    setActiveCallId(callId)
    setActiveTab('live-call')
  }

  const endCall = () => {
    setActiveCallId(null)
    setActiveTab('live-panel')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0e] text-[#e8e8ed] font-sans antialiased">
      {/* Translucent background glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#c8a35c]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Main Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeCallId={activeCallId}
      />

      {/* Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header 
          userRole={userRole} 
          setUserRole={setUserRole}
          deviceRole={deviceRole}
          setDeviceRole={setDeviceRole}
          activeCallId={activeCallId}
        />

        {/* Tab content screens */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {activeTab === 'live-panel' && (
            <LiveMeetings 
              startCall={startCall} 
              userRole={userRole} 
            />
          )}

          {activeTab === 'live-call' && (
            <MeetingRoom 
              callId={activeCallId || 'meeting_default'} 
              userRole={userRole} 
              deviceRole={deviceRole}
              onEnd={endCall} 
            />
          )}

          {activeTab === 'archive' && (
            <Archive />
          )}

          {activeTab === 'clients' && (
            <CRM />
          )}

          {activeTab === 'projects' && (
            <ProjectsManager />
          )}

          {activeTab === 'site-content' && (
            <SiteContentManager />
          )}

          {activeTab === 'deployments' && (
            <DeploymentsManager />
          )}
        </main>
      </div>
    </div>
  )
}
