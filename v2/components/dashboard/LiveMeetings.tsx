'use client'

import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Users, 
  Settings, 
  Lock, 
  Video, 
  Activity, 
  UserCheck, 
  Link2, 
  Share2, 
  ShieldAlert,
  Server,
  Plus
} from 'lucide-react'

interface LiveMeetingsProps {
  startCall: (callId: string) => void
  userRole: 'Admin' | 'Client' | 'Trainer'
}

export default function LiveMeetings({ startCall, userRole }: LiveMeetingsProps) {
  const [meetings, setMeetings] = useState([
    { id: 'meeting-101', name: 'أحمد - مشروع متجر الأزياء', client: 'أحمد محمد', duration: '12:45', users: 2, isSecure: true, autoRecord: true },
    { id: 'meeting-102', name: 'جلسة تدريب سارة - Vixcell UI', client: 'سارة خالد', duration: '05:12', users: 3, isSecure: false, autoRecord: true }
  ])

  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'أحمد محمد (عميل)', role: 'Client', status: 'In Meeting', device: 'PC' },
    { id: '2', name: 'محمد علي (مدرب)', role: 'Trainer', status: 'Online', device: 'Tablet' },
    { id: '3', name: 'سارة خالد (عميل)', role: 'Client', status: 'In Meeting', device: 'Mobile' },
    { id: '4', name: 'محمود حسن (أدمن ثان)', role: 'Admin', status: 'Offline', device: 'None' }
  ])

  // Form states for creating new meeting
  const [newMeetingName, setNewMeetingName] = useState('جلسة عمل جديدة')
  const [meetingPassword, setMeetingPassword] = useState('vix-123')
  const [useWaitingRoom, setUseWaitingRoom] = useState(true)
  const [useAutoRecord, setUseAutoRecord] = useState(true)
  const [createdInviteUrl, setCreatedInviteUrl] = useState('')

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault()
    const newId = `meeting-${Math.floor(100 + Math.random() * 900)}`
    
    // Auto-generate invite URL
    const cleanUrl = `${window.location.origin}/dashboard?room=${newId}&pass=${meetingPassword}`
    setCreatedInviteUrl(cleanUrl)

    const newRoom = {
      id: newId,
      name: newMeetingName,
      client: 'عميل زائر',
      duration: '00:00',
      users: 1,
      isSecure: !!meetingPassword,
      autoRecord: useAutoRecord
    }

    setMeetings([newRoom, ...meetings])
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#e8e8ed]">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#c8a35c]" />
            لوحة التحكم المباشرة
          </h2>
          <p className="text-xs text-gray-500 font-mono">LIVE PANEL — REAL-TIME COLLABORATION SYSTEMS</p>
        </div>
      </div>

      {/* Real-time stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'الاجتماعات النشطة', value: meetings.length, desc: 'Active Meetings', icon: Video, color: 'text-[#c8a35c]' },
          { label: 'المستخدمون المتصلون', value: teamMembers.filter(t => t.status !== 'Offline').length, desc: 'Connected Clients', icon: Users, color: 'text-blue-400' },
          { label: 'وقت التسجيل الإجمالي', value: '48 دقيقة', desc: 'Total Recording', icon: Server, color: 'text-emerald-400' },
          { label: 'مستوى حماية الغرف', value: 'عالي جداً', desc: 'Encryption SSL', icon: Lock, color: 'text-indigo-400' }
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-[#0a0a0d]/80 border border-white/5 p-4 rounded-xl backdrop-blur-xl relative overflow-hidden group hover:border-[#c8a35c]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Icon className="h-12 w-12 text-[#c8a35c]" />
              </div>
              <p className="text-xs text-gray-500 font-mono tracking-wider">{stat.desc}</p>
              <h3 className="text-xl font-bold text-white mt-1">{stat.value}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Left is Meetings & Creator, Right is Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Meetings & Quick Creator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Meetings List */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 rounded-xl p-5 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <span>الاجتماعات الجارية حالياً</span>
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse font-mono">
                {meetings.length} Live
              </span>
            </h3>

            {meetings.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-mono">
                No active rooms found. Start one below.
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meet) => (
                  <div key={meet.id} className="bg-[#0c0c0e] border border-white/5 hover:border-white/10 p-4 rounded-xl flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <Video className="h-5 w-5 text-red-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#c8a35c] transition-colors">{meet.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-mono">
                          <span>العميل: {meet.client}</span>
                          <span>•</span>
                          <span>المدة: {meet.duration}</span>
                          <span>•</span>
                          <span>متصلين: {meet.users}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {meet.isSecure && (
                        <span title="محمية بكلمة مرور">
                          <Lock className="h-3.5 w-3.5 text-yellow-500" />
                        </span>
                      )}
                      <button
                        onClick={() => startCall(meet.id)}
                        className="bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold px-4 py-2 rounded-lg text-xs hover:shadow-[0_0_15px_rgba(200,163,92,0.4)] transition-all flex items-center gap-1.5"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>دخول الغرفة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Creator Wizard */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 rounded-xl p-5 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Plus className="h-5 w-5 text-[#c8a35c]" />
              إنشاء اجتماع سريع ومحمي
            </h3>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1 block">عنوان الاجتماع / العميل</label>
                  <input
                    type="text"
                    value={newMeetingName}
                    onChange={(e) => setNewMeetingName(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1 block">كلمة مرور الغرفة</label>
                  <input
                    type="text"
                    value={meetingPassword}
                    onChange={(e) => setMeetingPassword(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 py-2 border-t border-b border-white/5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={useWaitingRoom}
                    onChange={(e) => setUseWaitingRoom(e.target.checked)}
                    className="rounded border-white/10 bg-[#0c0c0e] text-[#c8a35c] focus:ring-[#c8a35c]/50 h-4.5 w-4.5"
                  />
                  <span>تفعيل غرفة الانتظار (Waiting Room)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={useAutoRecord}
                    onChange={(e) => setUseAutoRecord(e.target.checked)}
                    className="rounded border-white/10 bg-[#0c0c0e] text-[#c8a35c] focus:ring-[#c8a35c]/50 h-4.5 w-4.5"
                  />
                  <span>تسجيل تلقائي عند دخول الأدمن (Auto Record)</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  className="bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 px-5 py-2.5 rounded-lg text-sm transition-all"
                >
                  توليد وإضافة للغرف
                </button>
              </div>
            </form>

            {/* Invite link generator details */}
            {createdInviteUrl && (
              <div className="mt-4 p-3.5 bg-[#0c0c0e] border border-[#c8a35c]/20 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#c8a35c] flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    رابط الدعوة الخاص بالعميل
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteUrl)
                      alert('تم نسخ الرابط الحصري للاجتماع!')
                    }}
                    className="text-[10px] bg-[#c8a35c]/10 text-[#c8a35c] border border-[#c8a35c]/20 px-2 py-0.5 rounded hover:bg-[#c8a35c]/25 transition-all flex items-center gap-1"
                  >
                    <Share2 className="h-2.5 w-2.5" />
                    نسخ الرابط
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-400 break-all select-all">{createdInviteUrl}</p>
                <p className="text-[10px] text-gray-500">كلمة المرور: <span className="font-mono text-yellow-500 font-bold">{meetingPassword}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: User Presence Status */}
        <div className="space-y-6">
          {/* User status tracker */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 rounded-xl p-5 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3">
              حالة المستخدمين المتصلين
            </h3>

            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* Avatar placeholder */}
                      <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {member.name[0]}
                      </div>
                      {/* Live state dot indicator */}
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0d] ${
                        member.status === 'In Meeting' ? 'bg-red-500 animate-pulse' :
                        member.status === 'Online' ? 'bg-green-500' : 'bg-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{member.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{member.role} • Device: {member.device}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    member.status === 'In Meeting' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    member.status === 'Online' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  }`}>
                    {member.status === 'In Meeting' ? 'في اجتماع' :
                     member.status === 'Online' ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Secure system stats */}
          <div className="bg-gradient-to-tr from-[#c8a35c]/5 to-transparent border border-[#c8a35c]/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#c8a35c] text-xs font-bold font-mono">
              <ShieldAlert className="h-4 w-4" />
              <span>SECURITY LOG</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              يتم تشفير كافة تدفقات الاجتماع والبيانات باستخدام WebRTC SRTP ونظام Supabase Realtime مشفر بالكامل. التلخيص الصوتي live-summarizer يتم معالجته محلياً.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
