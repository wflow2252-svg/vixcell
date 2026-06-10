'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Edit, 
  Lock, 
  Unlock, 
  PhoneOff, 
  Users, 
  Layers, 
  ShieldAlert, 
  MessageSquare, 
  FileText, 
  Clock, 
  HelpCircle,
  TrendingUp,
  Download,
  Upload,
  Eye,
  RefreshCw,
  X,
  Plus
} from 'lucide-react'
import AISpeechCenter from './AISpeechCenter'
import Whiteboard from './Whiteboard'

interface MeetingRoomProps {
  callId: string
  userRole: 'Admin' | 'Client' | 'Trainer'
  deviceRole: 'control' | 'whiteboard' | 'chat'
  onEnd: () => void
}

export default function MeetingRoom({ callId, userRole, deviceRole, onEnd }: MeetingRoomProps) {
  // A/V States
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // Annotation Canvas states for screen share drawing
  const [isAnnotating, setIsAnnotating] = useState(false)
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Waiting Room state
  const [waitingUsers, setWaitingUsers] = useState<Array<{ id: string, name: string }>>([
    { id: 'u2', name: 'أحمد محمد (العميل)' }
  ])
  const [connectedUsers, setConnectedUsers] = useState<Array<{ id: string, name: string, role: string, active: boolean }>>([
    { id: 'u1', name: 'الأدمن (أنت)', role: 'Admin', active: true }
  ])

  // Sidebar navigation tab state
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'speech' | 'crm' | 'timeline'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Chat and File upload states
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string, text: string, time: string, isFile?: boolean, fileMeta?: any }>>([
    { sender: 'الأدمن', text: 'مرحباً، تم حجز غرفة الاجتماع المخصصة للمشروع.', time: '01:05' }
  ])
  
  // File Preview Modal states
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  const [localFiles, setLocalFiles] = useState<any[]>([
    { name: 'Wireframe_Mockups.pdf', type: 'PDF', size: '2.4 MB', content: 'PDF_PREVIEW_SCHEMATIC' },
    { name: 'Financials_Invoice.xlsx', type: 'Excel', size: '150 KB', content: 'EXCEL_PREVIEW_SHEETS' },
    { name: 'Logo_Transparent.png', type: 'Image', size: '540 KB', content: '/1080.png' }
  ])

  // Remote Control simulation states
  const [remoteControlRequest, setRemoteControlRequest] = useState<'none' | 'requested' | 'approved'>('none')
  const [remoteLog, setRemoteLog] = useState<string[]>([])
  
  // Timeline events logs
  const [timelineEvents, setTimelineEvents] = useState<Array<{ time: string, event: string }>>([
    { time: '00:01', event: 'تم إنشاء الغرفة بواسطة الأدمن' },
    { time: '00:02', event: 'بدء الاتصال الآمن وتشفير الغرفة' }
  ])

  // MediaRecorder references for recording
  const mediaRecorderRef = useRef<any>(null)
  const recordedChunksRef = useRef<any[]>([])

  // Camera feed reference
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  // Start Camera feed
  useEffect(() => {
    if (isVideoOn && !isScreenSharing && !showWhiteboard) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.warn('Microphone or Camera not available, rendering mock feeds.', err)
        })
    } else {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
        setLocalStream(null)
      }
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [isVideoOn, isScreenSharing, showWhiteboard])

  // Auto record when Admin joins
  useEffect(() => {
    if (userRole === 'Admin') {
      triggerTimelineEvent('الأدمن انضم للاجتماع. بدء التسجيل التلقائي (Auto Record)...')
      handleStartRecording()
    }
  }, [userRole])

  const triggerTimelineEvent = (eventText: string) => {
    const now = new Date()
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    setTimelineEvents(prev => [...prev, { time: stamp, event: eventText }])
  }

  // Loom-style Recording Controllers
  const handleStartRecording = () => {
    setIsRecording(true)
    recordedChunksRef.current = []
    
    // Simulate recording start
    triggerTimelineEvent('بدء تسجيل الاجتماع بالكامل (Loom Screen + Camera)')
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    triggerTimelineEvent('تم إيقاف التسجيل وحفظ ملف MP4 بنجاح.')
    alert('تم حفظ وتسجيل الاجتماع في مكتبة الأرشيف بنجاح!')
  }

  // Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false)
      setIsAnnotating(false)
      triggerTimelineEvent('تم إيقاف مشاركة الشاشة')
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setIsScreenSharing(true)
        setShowWhiteboard(false)
        triggerTimelineEvent('بدأ الأدمن في مشاركة الشاشة')
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setIsAnnotating(false)
          triggerTimelineEvent('تم إنهاء مشاركة الشاشة')
        }
      } catch (err) {
        console.warn('Screen share permission denied or not available.')
      }
    }
  }

  // Draw Screen Annotation Overlay
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating || !annotationCanvasRef.current) return
    const canvas = annotationCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating || !annotationCanvasRef.current) return
    const canvas = annotationCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.strokeStyle = '#ef4444' // Red annotation brush
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearAnnotations = () => {
    if (!annotationCanvasRef.current) return
    const canvas = annotationCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Waiting Room Approvals
  const approveUser = (id: string, name: string) => {
    setWaitingUsers(waitingUsers.filter(u => u.id !== id))
    setConnectedUsers([...connectedUsers, { id, name, role: 'Client', active: true }])
    triggerTimelineEvent(`تم قبول دخول العميل: ${name}`)
  }

  const rejectUser = (id: string, name: string) => {
    setWaitingUsers(waitingUsers.filter(u => u.id !== id))
    triggerTimelineEvent(`تم رفض دخول العميل: ${name}`)
  }

  // Chat message submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const now = new Date()
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const newMsg = {
      sender: userRole === 'Admin' ? 'الأدمن' : 'العميل',
      text: chatInput,
      time: stamp
    }
    setChatMessages([...chatMessages, newMsg])
    setChatInput('')
    
    triggerTimelineEvent(`أرسل الأدمن رسالة شات جديدة: "${chatInput.substring(0, 20)}..."`)
  }

  // In-call File uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    const now = new Date()
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const fileMeta = {
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.xlsx') ? 'Excel' : 'Image',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      content: file.name.endsWith('.png') || file.name.endsWith('.jpg') ? '/1080.png' : 'MOCK_UPLOAD_PREVIEW'
    }

    setLocalFiles([fileMeta, ...localFiles])

    const newMsg = {
      sender: 'الأدمن',
      text: `قام برفع ملف: ${file.name}`,
      time: stamp,
      isFile: true,
      fileMeta
    }

    setChatMessages([...chatMessages, newMsg])
    triggerTimelineEvent(`قام الأدمن برفع ملف للاجتماع: ${file.name}`)
  }

  // Simulated Remote Control AnyDesk triggers
  const handleRequestRemoteControl = () => {
    setRemoteControlRequest('requested')
    triggerTimelineEvent('طلب الأدمن التحكم عن بعد بجهاز العميل')
    setRemoteLog(['جاري إرسال الطلب للعميل...'])
    
    setTimeout(() => {
      setRemoteControlRequest('approved')
      triggerTimelineEvent('وافق العميل على طلب التحكم عن بعد')
      setRemoteLog(prev => [...prev, 'تم الاتصال بالعميل بنجاح!', 'دقة الشاشة: 1920x1080', 'في انتظار المدخلات...'])
    }, 2000)
  }

  const simulateRemoteControlAction = (action: string) => {
    setRemoteLog(prev => [...prev, action])
  }

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-6 animate-fade-in text-[#e8e8ed]">
      
      {/* Left: Meeting Main Stage Area */}
      <div className="flex-1 flex flex-col justify-between h-full bg-[#0a0a0d]/90 border border-white/5 rounded-2xl overflow-hidden relative backdrop-blur-xl">
        
        {/* Top header status bar */}
        <div className="bg-[#0c0c0e] border-b border-white/5 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white font-sans">{callId}</h3>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-mono">LIVE MEETING</span>
          </div>

          <div className="flex items-center gap-3">
            {isRecording && (
              <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg text-[10px] font-mono animate-pulse font-bold">
                ● Auto Recording Active
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <Lock className="h-3.5 w-3.5 text-green-500" />
              <span>AES-256 SSL ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Center Main Stage Area (Whiteboard, Screen Share, A/V grid) */}
        <div className="flex-1 relative bg-[#08080a] flex items-center justify-center overflow-hidden">
          
          {showWhiteboard ? (
            /* Fabric Whiteboard stage */
            <div className="absolute inset-0 p-4">
              <Whiteboard meetingId={callId} deviceRole={deviceRole} />
            </div>
          ) : isScreenSharing ? (
            /* Screen Sharing Stage with drawing annotations overlay */
            <div className="relative h-full w-full flex items-center justify-center p-4">
              <div className="w-[85%] h-[85%] relative border border-[#c8a35c]/30 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-[0_0_30px_rgba(200,163,92,0.15)]">
                {/* Simulated shared screen content */}
                <div className="absolute inset-0 bg-[#0c0c0e] flex flex-col justify-between p-6 select-none">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-xs font-mono font-bold text-gray-500">SHARED SCREEN: PC DISPLAY #1</span>
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">LIVE FEED</span>
                  </div>
                  <div className="text-center py-10 space-y-4">
                    <h4 className="text-lg font-bold text-[#c8a35c]">مراجعة برمجة وتصميم السيرفر</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      يعرض الأدمن حالياً الكود المصدري وإعدادات خوادم الإنتاج والـ API للعميل للموافقة على البدء.
                    </p>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                    <span>1920x1080 @60FPS</span>
                    <span>HTTPS://VIXCELL.COM</span>
                  </div>
                </div>

                {/* Draw Annotation Canvas Layer on top of Screen Share */}
                {isAnnotating && (
                  <canvas
                    ref={annotationCanvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute inset-0 w-full h-full cursor-crosshair z-20"
                  />
                )}
              </div>

              {/* Float controls for Annotator */}
              <div className="absolute top-6 left-6 z-30 bg-black/80 backdrop-blur border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5">
                <button
                  onClick={() => setIsAnnotating(!isAnnotating)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isAnnotating ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>{isAnnotating ? 'تعطيل الرسم على الشاشة' : 'تفعيل الرسم على الشاشة'}</span>
                </button>

                {isAnnotating && (
                  <button
                    onClick={clearAnnotations}
                    className="text-xs bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg"
                  >
                    مسح الرسم
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Traditional Video Feeds Grid (Host + Client) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full w-full items-center justify-center">
              {/* Host/Admin video feed */}
              <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-[#c8a35c]/30 shadow-[0_0_20px_rgba(200,163,92,0.1)] bg-[#0c0c0e] flex items-center justify-center">
                {isVideoOn ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                ) : (
                  <div className="text-center space-y-2">
                    <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-sm font-bold text-[#c8a35c]">
                      A
                    </div>
                    <p className="text-xs text-gray-500">الأدمن (أنت) - الكاميرا مغلقة</p>
                  </div>
                )}
                {/* Info badge */}
                <div className="absolute bottom-4 left-4 p-2 rounded bg-black/60 backdrop-blur text-[10px] text-gray-400 border border-white/5 font-mono">
                  Host (Admin)
                </div>
              </div>

              {/* Client video feed */}
              <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-white/5 bg-[#0c0c0e] flex items-center justify-center">
                {connectedUsers.length > 1 ? (
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mx-auto text-sm font-bold text-blue-400 animate-pulse">
                      C
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">أحمد محمد (العميل)</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">CONNECTED — AUDIO ACTIVE</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-sans">في انتظار انضمام العميل...</p>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 p-2 rounded bg-black/60 backdrop-blur text-[10px] text-gray-400 border border-white/5 font-mono">
                  Client (Guest)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom toolbar call controls */}
        <div className="bg-[#0c0c0e] border-t border-white/5 p-4 flex items-center justify-between">
          {/* Left: security locks */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerTimelineEvent(showWhiteboard ? 'تم قفل السبورة الذكية' : 'تم قفل الغرفة وحمايتها')}
              className="p-2.5 bg-[#0a0a0d] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-[#c8a35c]/30 transition"
              title="Lock meeting room"
            >
              <Lock className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Center: A/V + Tools controls */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setIsMicOn(!isMicOn)
                triggerTimelineEvent(isMicOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون')
              }}
              className={`p-3.5 rounded-xl border transition ${
                isMicOn 
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
              title="Toggle Mic"
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={() => {
                setIsVideoOn(!isVideoOn)
                triggerTimelineEvent(isVideoOn ? 'إغلاق الكاميرا' : 'تشغيل الكاميرا')
              }}
              className={`p-3.5 rounded-xl border transition ${
                isVideoOn 
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
              title="Toggle Camera"
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={handleToggleScreenShare}
              className={`p-3.5 rounded-xl border transition ${
                isScreenSharing 
                  ? 'bg-gradient-to-tr from-[#c8a35c] to-[#e5c07b] border-transparent text-[#0c0c0e] shadow-[0_0_12px_#c8a35c/30]' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              title="Screen Share"
            >
              <Monitor className="h-5 w-5" />
            </button>

            {/* Whiteboard toggle */}
            <button
              onClick={() => {
                setShowWhiteboard(!showWhiteboard)
                setIsScreenSharing(false)
                setIsAnnotating(false)
                triggerTimelineEvent(showWhiteboard ? 'تم الخروج من السبورة الذكية' : 'بدء تشغيل السبورة الذكية')
              }}
              className={`p-3.5 rounded-xl border transition ${
                showWhiteboard 
                  ? 'bg-gradient-to-tr from-[#c8a35c] to-[#e5c07b] border-transparent text-[#0c0c0e]' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              title="Toggle Whiteboard"
            >
              <Layers className="h-5 w-5" />
            </button>

            {/* Loom Record button */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`p-3.5 rounded-xl border transition-all ${
                isRecording 
                  ? 'bg-red-600 border-transparent text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              title="Record Meeting"
            >
              <div className={`h-5 w-5 flex items-center justify-center`}>
                <span className={`h-3 w-3 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-red-500'}`} />
              </div>
            </button>

            {/* Remote Control AnyDesk Simulator */}
            <button
              onClick={handleRequestRemoteControl}
              className={`px-4 py-3.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                remoteControlRequest === 'approved'
                  ? 'bg-emerald-600 border-transparent text-white'
                  : remoteControlRequest === 'requested'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              title="Request Remote Control"
            >
              <Monitor className="h-4 w-4" />
              <span>{remoteControlRequest === 'approved' ? 'التحكم بالعميل نشط' : 'طلب تحكم AnyDesk'}</span>
            </button>
          </div>

          {/* Right: End Call */}
          <button
            onClick={() => {
              if (isRecording) handleStopRecording()
              onEnd()
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold p-3.5 rounded-xl hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition"
            title="End Call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Right Collapsible Sidebar (Chat, AI Speech, CRM, Timeline) */}
      {sidebarOpen && (
        <div className="w-96 bg-[#0a0a0d]/90 border border-white/5 rounded-2xl flex flex-col justify-between backdrop-blur-xl h-full">
          {/* Tabs bar */}
          <div className="bg-[#0c0c0e] border-b border-white/5 p-2 flex gap-1 rounded-t-2xl">
            {[
              { id: 'chat', label: 'المحادثات والملفات', icon: MessageSquare },
              { id: 'speech', label: 'الذكاء الاصطناعي', icon: FileText },
              { id: 'crm', label: 'ملف العميل CRM', icon: Users },
              { id: 'timeline', label: 'الخط الزمني', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSidebarTab(tab.id as any)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition flex flex-col items-center gap-1 border ${
                  activeSidebarTab === tab.id
                    ? 'bg-[#c8a35c]/10 border-[#c8a35c]/30 text-[#c8a35c]'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-white'
                }`}
                title={tab.label}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Body content based on active tab */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 relative">
            
            {activeSidebarTab === 'chat' && (
              <div className="flex flex-col justify-between h-full space-y-4">
                {/* Chat feed */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-right">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="p-3 bg-[#0c0c0e] border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                        <span className="font-bold text-[#c8a35c]">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      
                      {msg.isFile ? (
                        <div className="bg-[#0a0a0d] p-2 rounded-lg border border-white/5 mt-1 flex justify-between items-center font-mono">
                          <button
                            onClick={() => setPreviewFile(msg.fileMeta)}
                            className="bg-[#c8a35c]/10 hover:bg-[#c8a35c]/25 border border-[#c8a35c]/25 text-[#c8a35c] p-1.5 rounded"
                            title="Direct Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <div className="text-right">
                            <span className="text-xs text-white block truncate max-w-xs">{msg.fileMeta.name}</span>
                            <span className="text-[9px] text-gray-500">{msg.fileMeta.type} • {msg.fileMeta.size}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 font-sans leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* File list quick viewer */}
                <div className="border-t border-white/5 pt-3 space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider text-right">الملفات المشاركة بالاجتماع</span>
                  <div className="grid grid-cols-2 gap-2">
                    {localFiles.map((file, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewFile(file)}
                        className="bg-[#0c0c0e] hover:bg-white/5 border border-white/5 p-2 rounded-lg flex items-center justify-between text-[10px] font-mono text-right"
                      >
                        <Eye className="h-3 w-3 text-[#c8a35c]" />
                        <span className="text-gray-300 truncate max-w-[80px]">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send chat & File upload form */}
                <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-white/5 pt-3">
                  <label className="bg-[#0c0c0e] hover:bg-white/5 border border-white/10 p-2.5 rounded-lg text-gray-400 hover:text-white cursor-pointer transition flex items-center justify-center">
                    <Upload className="h-4.5 w-4.5" />
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                  
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="اكتب رسالة للعميل..."
                    className="flex-1 bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c8a35c]"
                  />
                </form>
              </div>
            )}

            {activeSidebarTab === 'speech' && (
              <div className="absolute inset-0 p-4">
                <AISpeechCenter meetingId={callId} />
              </div>
            )}

            {activeSidebarTab === 'crm' && (
              <div className="space-y-4 text-right">
                <div className="p-3 bg-[#0c0c0e] border border-white/5 rounded-xl space-y-2">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#c8a35c] font-bold">Client Context</span>
                  <h4 className="text-sm font-bold text-white">أحمد محمد</h4>
                  <p className="text-xs text-gray-500 font-mono">شركة النور للمقاولات</p>
                </div>

                {/* Invoices and project stats */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="bg-[#0c0c0e] border border-white/5 p-3 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500">PROJECTS</p>
                    <h5 className="text-sm font-bold text-emerald-400">2 Active</h5>
                  </div>
                  <div className="bg-[#0c0c0e] border border-white/5 p-3 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500">INVOICES</p>
                    <h5 className="text-sm font-bold text-blue-400">3 Issued</h5>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">عقود مشاريع أحمد</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-white font-semibold">بناء لوحة إدارة المبيعات</span>
                      <span className="text-[#c8a35c]">جاري العمل</span>
                    </div>
                    <div className="flex justify-between bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-white font-semibold">الموقع التعريفي للشركة</span>
                      <span className="text-green-500">مكتمل</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'timeline' && (
              <div className="space-y-3 relative pl-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5 text-right">
                {timelineEvents.map((ev, i) => (
                  <div key={i} className="relative flex gap-3.5 text-xs">
                    <span className="absolute left-[7px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#c8a35c]" />
                    <div className="flex-1 bg-[#0c0c0e]/80 border border-white/5 p-2.5 rounded-lg space-y-1">
                      <span className="text-[9px] text-gray-500 font-mono">{ev.time}</span>
                      <p className="text-gray-300 font-medium leading-relaxed font-sans">{ev.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waiting Room Entrance Modal Toast (Host Alert) */}
      {waitingUsers.length > 0 && userRole === 'Admin' && (
        <div className="absolute top-24 left-6 z-50 bg-[#0c0c0e] border border-[#c8a35c]/30 p-4 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] max-w-sm animate-bounce space-y-3">
          <div className="flex items-center gap-2 text-[#c8a35c] text-xs font-bold font-mono">
            <ShieldAlert className="h-4.5 w-4.5 animate-pulse" />
            <span>طلب انضمام في الانتظار (Waiting Room Request)</span>
          </div>
          <p className="text-xs text-gray-300">العميل <span className="font-bold text-white">{waitingUsers[0].name}</span> يطلب دخول الغرفة الآن.</p>
          <div className="flex gap-2">
            <button
              onClick={() => approveUser(waitingUsers[0].id, waitingUsers[0].name)}
              className="bg-[#c8a35c] text-[#0c0c0e] text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              قبول الدخول
            </button>
            <button
              onClick={() => rejectUser(waitingUsers[0].id, waitingUsers[0].name)}
              className="bg-white/5 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10"
            >
              رفض
            </button>
          </div>
        </div>
      )}

      {/* Remote Control simulated canvas panel (AnyDesk style) */}
      {remoteControlRequest === 'approved' && (
        <div className="absolute inset-0 bg-[#0c0c0e]/95 flex items-center justify-center p-6 z-40">
          <div className="bg-[#0a0a0d] border border-[#c8a35c]/30 rounded-2xl w-full max-w-4xl h-[550px] overflow-hidden flex flex-col">
            <div className="bg-[#0c0c0e] p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#c8a35c] flex items-center gap-1.5 font-mono">
                <Monitor className="h-4.5 w-4.5" />
                محاكاة AnyDesk للتحكم عن بعد (Remote Desktop Simulator)
              </span>
              <button
                onClick={() => setRemoteControlRequest('none')}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3">
              {/* Virtual Client OS Feed */}
              <div className="md:col-span-2 bg-black flex flex-col justify-between p-6 border-r border-white/5 relative">
                {/* Simulated screen components */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-mono font-bold">CONTROL SESSION #901</span>
                  <span className="text-xs text-gray-500 font-mono">Client OS: Windows 11</span>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-xs text-gray-400">شاشة العميل الافتراضية</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => simulateRemoteControlAction('تم الضغط على الماوس الأيمن في شاشة العميل')}
                      className="bg-white/5 border border-white/10 text-white font-bold py-2 px-4 rounded text-xs hover:bg-white/10"
                    >
                      نقرة ماوس
                    </button>
                    <button
                      onClick={() => simulateRemoteControlAction('تمت كتابة "Vixcell Dashboard v2" في حقل الإدخال')}
                      className="bg-[#c8a35c] text-[#0c0c0e] font-bold py-2 px-4 rounded text-xs hover:shadow-[0_0_10px_rgba(200,163,92,0.3)]"
                    >
                      محاكاة كتابة نص
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-gray-600 font-mono text-center">انقر في الداخل للتحكم الفوري بالماوس والكيبورد</p>
              </div>

              {/* Event Logs panel */}
              <div className="p-4 flex flex-col justify-between h-full bg-[#0c0c0e]/80">
                <span className="text-xs font-semibold text-white border-b border-white/5 pb-2 block">سجل تحركات الفأرة والأوامر</span>
                <div className="flex-1 overflow-y-auto space-y-1.5 py-3 pr-1 text-left font-mono text-[10px] text-gray-400">
                  {remoteLog.map((log, i) => (
                    <div key={i} className="p-1 bg-white/5 rounded border border-white/5">
                      &gt; {log}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setRemoteControlRequest('none')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs"
                >
                  قطع الاتصال بالعميل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-[#0a0a0d] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="text-right">
                <h4 className="text-sm font-bold text-white">{previewFile.name}</h4>
                <p className="text-[10px] text-gray-500 font-mono uppercase">{previewFile.type} • {previewFile.size}</p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-white bg-white/5 p-1 rounded-lg border border-white/10"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Simulated file viewer based on metadata type */}
            <div className="h-80 bg-[#0c0c0e] border border-white/5 rounded-xl flex items-center justify-center p-4">
              {previewFile.type === 'PDF' ? (
                /* PDF Wireframe Preview Wireframe Layout */
                <div className="space-y-4 text-center">
                  <FileText className="h-16 w-16 text-[#c8a35c] mx-auto animate-pulse" />
                  <p className="text-xs text-gray-400 font-bold">معاينة مباشرة لمخطط الصفحات (PDF Wireframe Preview)</p>
                  <div className="border border-white/10 rounded-lg p-3 bg-[#08080a] max-w-sm mx-auto text-left text-[10px] font-mono text-gray-500">
                    &lt;PDF PAGE 1: Wireframe grids, Home Hero Section structure, client comments overlay&gt;
                  </div>
                </div>
              ) : previewFile.type === 'Excel' ? (
                /* Excel/Sheet Grid mock */
                <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[10px] text-gray-500">
                  <div className="grid grid-cols-4 gap-1 text-center font-bold text-white border-b border-white/5 pb-2">
                    <span>Item</span>
                    <span>Cost</span>
                    <span>Status</span>
                    <span>Due Date</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center py-1">
                    <span>Domain Register</span>
                    <span className="text-[#c8a35c]">$15</span>
                    <span className="text-green-500">Paid</span>
                    <span>2026-06-15</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center py-1">
                    <span>Cloud Hosting</span>
                    <span className="text-[#c8a35c]">$120</span>
                    <span className="text-yellow-500">Pending</span>
                    <span>2026-07-01</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center py-1">
                    <span>Dev Hours</span>
                    <span className="text-[#c8a35c]">$1200</span>
                    <span className="text-green-500">Paid</span>
                    <span>2026-06-09</span>
                  </div>
                </div>
              ) : (
                /* Image Previewer */
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewFile.content} alt="Preview file upload" className="h-full w-full object-contain rounded-lg" />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button 
                onClick={() => setPreviewFile(null)}
                className="bg-white/5 text-gray-400 text-xs font-bold px-4 py-2 rounded-lg border border-white/10"
              >
                إغلاق المعاينة
              </button>
              <button 
                onClick={() => {
                  alert('جاري تحميل الملف على جهازك المحلي...')
                  setPreviewFile(null)
                }}
                className="bg-[#c8a35c] text-[#0c0c0e] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                تحميل الملف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
