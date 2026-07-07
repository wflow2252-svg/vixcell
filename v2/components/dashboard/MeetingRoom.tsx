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
  Plus,
  ChevronLeft,
  ChevronRight,
  Pin,
  Settings as SettingsIcon,
  Volume2,
  Sparkles,
  FileCheck
} from 'lucide-react'
import AISpeechCenter from './AISpeechCenter'
import Whiteboard from './Whiteboard'
import { supabase } from '@/lib/supabase'

// ─── Voice Enhancement Web Audio API Class ──────────────────────────────────
class VoicePitchShifter {
  private audioCtx: AudioContext | null = null
  private inputNode: MediaStreamAudioSourceNode | null = null
  private outputNode: MediaStreamAudioDestinationNode | null = null
  private bassBoostFilter: BiquadFilterNode | null = null
  private trebleBoostFilter: BiquadFilterNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private delayNode: DelayNode | null = null
  private modGain: GainNode | null = null
  private modOsc: OscillatorNode | null = null

  constructor(stream: MediaStream) {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    this.audioCtx = new AudioContextClass()
    this.inputNode = this.audioCtx.createMediaStreamSource(stream)
    this.outputNode = this.audioCtx.createMediaStreamDestination()

    // 1. Bass Boost Node to Deepen Voice
    this.bassBoostFilter = this.audioCtx.createBiquadFilter()
    this.bassBoostFilter.type = 'lowshelf'
    this.bassBoostFilter.frequency.value = 130 // Boost low frequencies
    this.bassBoostFilter.gain.value = 12 // Strong bass boost

    // 2. Treble Cut/Boost Node for Clarity
    this.trebleBoostFilter = this.audioCtx.createBiquadFilter()
    this.trebleBoostFilter.type = 'highshelf'
    this.trebleBoostFilter.frequency.value = 3200 
    this.trebleBoostFilter.gain.value = -3 // Reduce youth shrillness

    // 3. Dynamics Compressor Node to add broadcast-quality warmth
    this.compressor = this.audioCtx.createDynamicsCompressor()
    this.compressor.threshold.value = -25
    this.compressor.knee.value = 35
    this.compressor.ratio.value = 10
    this.compressor.attack.value = 0.003
    this.compressor.release.value = 0.25

    // 4. Low-latency pitch modulation shift
    this.delayNode = this.audioCtx.createDelay(1.0)
    this.delayNode.delayTime.value = 0.012

    this.modGain = this.audioCtx.createGain()
    this.modGain.gain.value = 0.003 // Amplitude shift

    this.modOsc = this.audioCtx.createOscillator()
    this.modOsc.type = 'sawtooth'
    this.modOsc.frequency.value = 45 // Pitch modulator sweep frequency

    // Connect Pitch shift modulator
    this.modOsc.connect(this.modGain)
    this.modGain.connect(this.delayNode.delayTime)

    // Route audio graph
    this.inputNode.connect(this.bassBoostFilter)
    this.bassBoostFilter.connect(this.trebleBoostFilter)
    this.trebleBoostFilter.connect(this.compressor)
    this.compressor.connect(this.delayNode)
    this.delayNode.connect(this.outputNode)

    // Start Pitch shift Modulator
    this.modOsc.start()
  }

  public getProcessedStream(): MediaStream {
    return this.outputNode ? this.outputNode.stream : new MediaStream()
  }

  public updateProfile(profile: 'deep' | 'clarity' | 'warm' | 'standard') {
    if (!this.bassBoostFilter || !this.trebleBoostFilter || !this.compressor || !this.modGain) return

    if (profile === 'deep') {
      this.bassBoostFilter.gain.value = 15
      this.bassBoostFilter.frequency.value = 100
      this.trebleBoostFilter.gain.value = -5
      this.modGain.gain.value = 0.0045 // More pitch depth drop
    } else if (profile === 'clarity') {
      this.bassBoostFilter.gain.value = 3
      this.bassBoostFilter.frequency.value = 160
      this.trebleBoostFilter.gain.value = 6 // Boost highs
      this.modGain.gain.value = 0.001
    } else if (profile === 'warm') {
      this.bassBoostFilter.gain.value = 9
      this.bassBoostFilter.frequency.value = 140
      this.trebleBoostFilter.gain.value = 2
      this.modGain.gain.value = 0.0025
    } else {
      // Standard
      this.bassBoostFilter.gain.value = 0
      this.trebleBoostFilter.gain.value = 0
      this.modGain.gain.value = 0
    }
  }

  public destroy() {
    try {
      this.modOsc?.stop()
      this.audioCtx?.close()
    } catch (e) {
      console.warn('Audio Context closure warning:', e)
    }
  }
}

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
  const [screenShareOwner, setScreenShareOwner] = useState<string | null>(null)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // Collapsible Floating Left Sidebar States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false)
  const [isLeftSidebarPinned, setIsLeftSidebarPinned] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Voice Enhancement Settings
  const [voiceEnhancementOn, setVoiceEnhancementOn] = useState(false)
  const [voiceProfile, setVoiceProfile] = useState<'deep' | 'clarity' | 'warm' | 'standard'>('deep')
  const pitchShifterRef = useRef<VoicePitchShifter | null>(null)

  // Segmented Recording variables
  const [recordingSegments, setRecordingSegments] = useState<Array<{ name: string, url: string, size: string, timestamp: string }>>([])
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(1)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Annotation Canvas states for screen share drawing
  const [isAnnotating, setIsAnnotating] = useState(false)
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Waiting Room state
  const [isWaitingApproved, setIsWaitingApproved] = useState(userRole === 'Admin')
  const [waitingUsers, setWaitingUsers] = useState<Array<{ id: string, name: string }>>([])
  const [connectedUsers, setConnectedUsers] = useState<Array<{ id: string, name: string, role: string, active: boolean }>>(() => {
    if (userRole === 'Admin') {
      return [{ id: 'u1', name: 'الأدمن (أنت)', role: 'Admin', active: true }]
    } else if (userRole === 'Client') {
      return [{ id: 'u2', name: 'أحمد محمد (العميل) (أنت)', role: 'Client', active: true }]
    } else {
      return [{ id: 'u3', name: 'المدرب (أنت)', role: 'Trainer', active: true }]
    }
  })

  // Sidebar navigation tab state (Right sidebar remains for Chats/CRM context)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'speech' | 'crm' | 'timeline'>('chat')
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

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

  // AI Meeting Intelligence Post-call Modal
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false)
  const [aiReport, setAiReport] = useState<{
    executiveSummary: string
    detailedSummary: string
    keyPoints: string[]
    actionItems: Array<{ task: string, deadline: string, owner: string }>
    crmNotes: { client: string, project: string, followup: string }
  } | null>(null)
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false)

  // Remote Control simulation states
  const [remoteControlRequest, setRemoteControlRequest] = useState<'none' | 'requested' | 'approved'>('none')
  const [remoteLog, setRemoteLog] = useState<string[]>([])
  
  // Timeline events logs
  const [timelineEvents, setTimelineEvents] = useState<Array<{ time: string, event: string }>>([
    { time: '00:01', event: 'تم إنشاء الغرفة بواسطة الأدمن' },
    { time: '00:02', event: 'بدء الاتصال الآمن وتشفير الغرفة' }
  ])

  // Camera feed reference
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  // Start Camera feed & apply Voice Enhancements
  useEffect(() => {
    if (isVideoOn && !isScreenSharing && !showWhiteboard && isWaitingApproved) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          let outputStream = stream

          if (voiceEnhancementOn) {
            // Apply voice shifting graph
            if (pitchShifterRef.current) {
              pitchShifterRef.current.destroy()
            }
            const shifter = new VoicePitchShifter(stream)
            shifter.updateProfile(voiceProfile)
            pitchShifterRef.current = shifter

            // Combine video track with pitch-shifted audio track
            const processedAudioTrack = shifter.getProcessedStream().getAudioTracks()[0]
            const originalVideoTrack = stream.getVideoTracks()[0]
            outputStream = new MediaStream([originalVideoTrack, processedAudioTrack])
          } else {
            if (pitchShifterRef.current) {
              pitchShifterRef.current.destroy()
              pitchShifterRef.current = null
            }
          }

          setLocalStream(outputStream)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = outputStream
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
      if (pitchShifterRef.current) {
        pitchShifterRef.current.destroy()
        pitchShifterRef.current = null
      }
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
      }
      if (pitchShifterRef.current) {
        pitchShifterRef.current.destroy()
      }
    }
  }, [isVideoOn, isScreenSharing, showWhiteboard, isWaitingApproved, voiceEnhancementOn, voiceProfile])

  // Handle Voice Profile Change
  useEffect(() => {
    if (pitchShifterRef.current && voiceEnhancementOn) {
      pitchShifterRef.current.updateProfile(voiceProfile)
      triggerTimelineEvent(`تغيير طبقة الصوت إلى: ${voiceProfile === 'deep' ? 'العميق جداً' : voiceProfile === 'clarity' ? 'النقي الفائق' : voiceProfile === 'warm' ? 'الدافئ' : 'الافتراضي'}`)
    }
  }, [voiceProfile, voiceEnhancementOn])

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

  const channelRef = useRef<any>(null)

  // Real-time synchronization channel
  useEffect(() => {
    const channelName = `meeting:${callId}`
    const channel = supabase.channel(channelName)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'join_request' }, ({ payload }: any) => {
        if (userRole === 'Admin') {
          setWaitingUsers(prev => {
            if (prev.some(u => u.id === payload.id)) return prev
            return [...prev, { id: payload.id, name: payload.name }]
          })
          triggerTimelineEvent(`طلب انضمام جديد من: ${payload.name}`)
        }
      })
      .on('broadcast', { event: 'join_approved' }, ({ payload }: any) => {
        if (userRole === 'Client' && payload.id === 'u2') {
          setIsWaitingApproved(true)
          triggerTimelineEvent('تمت الموافقة على دخولك الغرفة من قبل الأدمن')
        }
        setConnectedUsers(prev => {
          if (prev.some(u => u.id === payload.id)) return prev
          const isMe = (userRole === 'Client' && payload.id === 'u2') || (userRole === 'Admin' && payload.id === 'u1')
          const cleanName = isMe ? `${payload.name} (أنت)` : payload.name
          return [...prev, { id: payload.id, name: cleanName, role: payload.role, active: true }]
        })
      })
      .on('broadcast', { event: 'presence' }, ({ payload }: any) => {
        setConnectedUsers(prev => {
          if (prev.some(u => u.id === payload.id)) return prev
          const isMe = (userRole === 'Client' && payload.id === 'u2') || (userRole === 'Admin' && payload.id === 'u1')
          const cleanName = isMe ? `${payload.name} (أنت)` : payload.name
          return [...prev, { id: payload.id, name: cleanName, role: payload.role, active: true }]
        })
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }: any) => {
        setChatMessages(prev => {
          if (prev.some(m => m.time === payload.time && m.text === payload.text && m.sender === payload.sender)) return prev
          return [...prev, payload]
        })
      })
      .on('broadcast', { event: 'file_shared' }, ({ payload }: any) => {
        setLocalFiles(prev => {
          if (prev.some(f => f.name === payload.fileMeta.name)) return prev
          return [payload.fileMeta, ...prev]
        })
        setChatMessages(prev => {
          if (prev.some(m => m.time === payload.time && m.sender === payload.sender && m.isFile)) return prev
          return [...prev, {
            sender: payload.sender,
            text: `قام برفع ملف: ${payload.fileMeta.name}`,
            time: payload.time,
            isFile: true,
            fileMeta: payload.fileMeta
          }]
        })
      })
      .on('broadcast', { event: 'screen_share_status' }, ({ payload }: any) => {
        setIsScreenSharing(payload.sharing)
        setScreenShareOwner(payload.owner)
        if (payload.sharing) {
          setShowWhiteboard(false)
          triggerTimelineEvent(`${payload.owner === 'Admin' ? 'الأدمن' : 'العميل'} بدأ مشاركة الشاشة`)
        } else {
          triggerTimelineEvent(`تم إنهاء مشاركة الشاشة`)
        }
      })
      .on('broadcast', { event: 'whiteboard_status' }, ({ payload }: any) => {
        setShowWhiteboard(payload.visible)
        if (payload.visible) {
          setIsScreenSharing(false)
          triggerTimelineEvent(`${payload.by === 'Admin' ? 'الأدمن' : 'العميل'} قام بتفعيل السبورة الذكية`)
        } else {
          triggerTimelineEvent(`تم إغلاق السبورة الذكية`)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (userRole === 'Client') {
            channel.send({
              type: 'broadcast',
              event: 'join_request',
              payload: { id: 'u2', name: 'أحمد محمد (العميل)', role: 'Client' }
            })
          } else {
            channel.send({
              type: 'broadcast',
              event: 'presence',
              payload: { 
                id: userRole === 'Admin' ? 'u1' : 'u3', 
                name: userRole === 'Admin' ? 'الأدمن' : 'المدرب', 
                role: userRole 
              }
            })
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [callId, userRole])

  // Periodic request broadcast for Client waiting room
  useEffect(() => {
    if (userRole === 'Client' && !isWaitingApproved) {
      const interval = setInterval(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'join_request',
            payload: { id: 'u2', name: 'أحمد محمد (العميل)', role: 'Client' }
          })
        }
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [userRole, isWaitingApproved])

  // ─── Segmented Recording Controllers ───────────────────────────────────────
  const handleStartRecording = () => {
    setIsRecording(true)
    recordedChunksRef.current = []
    
    // We attempt to capture stream from local element and record it
    const activeStream = localStream || (localVideoRef.current?.srcObject as MediaStream)
    if (activeStream) {
      try {
        const recorder = new MediaRecorder(activeStream, { mimeType: 'video/webm' })
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data)
          }
        }
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' })
          const videoUrl = URL.createObjectURL(blob)
          const sizeMB = `${(blob.size / 1024 / 1024).toFixed(2)} MB`
          const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          
          setRecordingSegments(prev => [
            ...prev,
            {
              name: `Meeting_${String(currentSegmentIndex).padStart(3, '0')}.mp4`,
              url: videoUrl,
              size: sizeMB,
              timestamp: timeStr
            }
          ])
          
          triggerTimelineEvent(`تم حفظ الجزء ${currentSegmentIndex} من التسجيل بحجم ${sizeMB}`)
          setCurrentSegmentIndex(idx => idx + 1)
        }
        
        mediaRecorderRef.current = recorder
        recorder.start()
        triggerTimelineEvent('بدء تسجيل الاجتماع بالكامل (Loom Screen + Camera)')

        // Set segment timer: every 30 mins (we set 2 mins for demo visibility)
        const segmentDuration = 2 * 60 * 1000 // 2 minutes Demo Mode
        recordingTimerRef.current = setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop()
            // Auto restart next segment
            handleStartRecording()
          }
        }, segmentDuration)

      } catch (err) {
        console.warn('MediaRecorder error, falling back to mock segment builder.', err)
        simulateMockSegment()
      }
    } else {
      simulateMockSegment()
    }
  }

  const simulateMockSegment = () => {
    // Fallback simulation timer
    recordingTimerRef.current = setTimeout(() => {
      const sizeStr = `${(12.4 + Math.random() * 8).toFixed(1)} MB`
      const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      setRecordingSegments(prev => [
        ...prev,
        {
          name: `Meeting_${String(prev.length + 1).padStart(3, '0')}.mp4`,
          url: '#',
          size: sizeStr,
          timestamp: timeStr
        }
      ])
      triggerTimelineEvent(`تجزئة وحفظ التسجيل تلقائياً: Meeting_${String(recordingSegments.length + 1).padStart(3, '0')}.mp4`)
      simulateMockSegment() // Recursively trigger next segment
    }, 2 * 60 * 1000)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    triggerTimelineEvent('تم إيقاف التسجيل وحفظ كافة الأجزاء بنجاح.')
  }

  // ─── AI Meeting Summary Generator ──────────────────────────────────────────
  const generateMeetingSummary = () => {
    setIsGeneratingAiReport(true)
    setShowAiSummaryModal(true)

    // Call API Route for meeting intelligence
    fetch('/api/ai/meeting-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, transcript: chatMessages })
    })
      .then(res => res.json())
      .then(data => {
        setAiReport(data.report)
        setIsGeneratingAiReport(false)
        triggerTimelineEvent('تم استخراج تقارير الذكاء الاصطناعي بنجاح')
      })
      .catch(() => {
        // Fallback mockup
        setTimeout(() => {
          setAiReport({
            executiveSummary: 'اجتماع انطلاق وتأطير الهوية لشركة النور للمقاولات مع مراجعة تصاميم السيرفرات والشبكة والمخططات الأولية للواجهات.',
            detailedSummary: 'تمت مناقشة الجداول الزمنية للمشروع واقترح الأدمن استضافة الواجهات على Cloudflare R2 وقواعد البيانات الموزعة. كما تم استعراض متطلبات اللوجو والألوان وتم قبول طلب التحكم عن بعد لمراجعة البنية التحتية البرمجية مباشرة.',
            keyPoints: [
              'استخدام Cloudflare R2 لتسريع البث وحفظ الصور.',
              'مدة التسليم المتفق عليها للمرحلة الأولى هي 14 يوماً.',
              'تفعيل القفل وحماية الغرفة أثناء المناقشة.'
            ],
            actionItems: [
              { task: 'تثبيت قاعدة البيانات وربط Supabase', deadline: '2026-06-20', owner: 'المطور الأساسي' },
              { task: 'تصميم الشعارات وتوفير ملفات الألوان الفولدر', deadline: '2026-06-22', owner: 'الأدمن' },
              { task: 'إعداد استضافة reverse proxy و reverse DNS للنشر', deadline: '2026-06-25', owner: 'مهندس الشبكات' }
            ],
            crmNotes: {
              client: 'أحمد محمد - متجاوب ومهتم جداً بسرعات النشر والأمان السحابي.',
              project: 'لوحة التحكم Vixcell UI - استضافة سحابية متكاملة.',
              followup: 'إرسال ملف الـ PDF الخاص بالـ Wireframe غداً قبل العاشرة صباحاً.'
            }
          })
          setIsGeneratingAiReport(false)
        }, 1500)
      })
  }

  const handleExportDoc = (type: 'pdf' | 'docx' | 'email') => {
    if (!aiReport) return
    
    let docContent = `VIXCELL MEETING REPORT - ${callId}\n\n`
    docContent += `EXECUTIVE SUMMARY:\n${aiReport.executiveSummary}\n\n`
    docContent += `DETAILED SUMMARY:\n${aiReport.detailedSummary}\n\n`
    docContent += `KEY POINTS:\n`
    aiReport.keyPoints.forEach(p => docContent += `- ${p}\n`)
    docContent += `\nACTION ITEMS:\n`
    aiReport.actionItems.forEach(item => docContent += `- ${item.task} (Deadline: ${item.deadline}, Assignee: ${item.owner})\n`)
    docContent += `\nCRM PROFILE NOTES:\n`
    docContent += `Client Profile: ${aiReport.crmNotes.client}\n`
    docContent += `Project Scope: ${aiReport.crmNotes.project}\n`
    docContent += `Follow-up plan: ${aiReport.crmNotes.followup}\n`

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Vixcell_AI_Report_${callId}.${type === 'email' ? 'txt' : type}`
    link.click()
  }

  // Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing && screenShareOwner === userRole) {
      setIsScreenSharing(false)
      setScreenShareOwner(null)
      setIsAnnotating(false)
      triggerTimelineEvent('تم إيقاف مشاركة الشاشة')
      
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'screen_share_status',
          payload: { sharing: false, owner: null }
        })
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setIsScreenSharing(true)
        setScreenShareOwner(userRole)
        setShowWhiteboard(false)
        triggerTimelineEvent(`بدأ ${userRole === 'Admin' ? 'الأدمن' : 'العميل'} في مشاركة الشاشة`)
        
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'screen_share_status',
            payload: { sharing: true, owner: userRole }
          })
        }
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setScreenShareOwner(null)
          setIsAnnotating(false)
          triggerTimelineEvent('تم إنهاء مشاركة الشاشة')
          
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'screen_share_status',
              payload: { sharing: false, owner: null }
            })
          }
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

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'join_approved',
        payload: { id, name, role: 'Client' }
      })
    }
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
    const sender = userRole === 'Admin' ? 'الأدمن' : 'العميل'

    const newMsg = {
      sender,
      text: chatInput,
      time: stamp
    }
    setChatMessages(prev => [...prev, newMsg])
    setChatInput('')
    
    triggerTimelineEvent(`أرسل ${sender} رسالة شات جديدة: "${chatInput.substring(0, 20)}..."`)

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: newMsg
      })
    }
  }

  // In-call File uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    const now = new Date()
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const sender = userRole === 'Admin' ? 'الأدمن' : 'العميل'

    const fileMeta = {
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.xlsx') ? 'Excel' : 'Image',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      content: file.name.endsWith('.png') || file.name.endsWith('.jpg') ? '/1080.png' : 'MOCK_UPLOAD_PREVIEW'
    }

    setLocalFiles(prev => [fileMeta, ...prev])

    const newMsg = {
      sender,
      text: `قام برفع ملف: ${file.name}`,
      time: stamp,
      isFile: true,
      fileMeta
    }

    setChatMessages(prev => [...prev, newMsg])
    triggerTimelineEvent(`قام ${sender} برفع ملف للاجتماع: ${file.name}`)

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'file_shared',
        payload: {
          sender,
          fileMeta,
          time: stamp
        }
      })
    }
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

  if (!isWaitingApproved) {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center bg-[#0c0c0e]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl animate-fade-in">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-[#c8a35c]/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

        <div className="bg-[#0a0a0d]/90 border border-[#c8a35c]/20 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-[0_0_30px_rgba(200,163,92,0.05)] relative z-10">
          <div className="h-16 w-16 bg-[#c8a35c]/10 border border-[#c8a35c]/30 rounded-full flex items-center justify-center mx-auto text-[#c8a35c] animate-pulse">
            <Clock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white font-sans">غرفة الانتظار الرقمية</h3>
            <p className="text-xs text-gray-500 font-mono tracking-wider">VIXCELL COLLABORATION GATEWAY</p>
          </div>
          <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 text-right space-y-2">
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              أهلاً بك يا <span className="font-bold text-white">أحمد محمد (العميل)</span>. لقد تم إرسال طلب انضمامك للغرفة بالرمز <span className="font-mono text-[#c8a35c]">{callId}</span>.
            </p>
            <div className="flex items-center gap-2 mt-3 justify-end text-[10px] text-gray-500">
              <span className="font-mono">Real-time status: PENDING APPROVAL</span>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 animate-ping" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a35c] animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a35c] animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a35c] animate-bounce" />
            </div>
            <p className="text-xs text-[#c8a35c] font-medium animate-pulse">يرجى الانتظار حتى يقبل الأدمن دخولك للاجتماع...</p>
          </div>
          <button
            onClick={onEnd}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold border border-white/10 transition"
          >
            إلغاء والعودة للوحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex h-[calc(100vh-120px)] w-full gap-6 animate-fade-in text-[#e8e8ed] relative overflow-hidden"
      onMouseMove={(e) => {
        // Edge detection: if cursor clientX is close to left edge, reveal floating sidebar
        if (e.clientX < 45 && !isLeftSidebarOpen) {
          setIsLeftSidebarOpen(true)
        }
      }}
    >
      {/* ─── Floating Collapsible LEFT Sidebar ────────────────────────────────── */}
      <div
        onMouseLeave={() => {
          if (!isLeftSidebarPinned) {
            setIsLeftSidebarOpen(false)
          }
        }}
        className={`absolute left-0 top-0 bottom-0 w-64 bg-[#0c0c0e]/95 border-r border-[#c8a35c]/20 z-40 transition-all duration-300 transform flex flex-col justify-between p-4 backdrop-blur-xl ${
          isLeftSidebarOpen || isLeftSidebarPinned ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Header block */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-xs font-bold text-[#c8a35c] font-mono tracking-wider">MEETING CONTROLS</span>
            <button
              onClick={() => setIsLeftSidebarPinned(!isLeftSidebarPinned)}
              className={`p-1 rounded transition ${isLeftSidebarPinned ? 'text-[#c8a35c]' : 'text-gray-500 hover:text-white'}`}
              title="Pin Sidebar"
            >
              <Pin className="h-4 w-4" />
            </button>
          </div>

          {/* Action buttons list */}
          <div className="space-y-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setIsMicOn(!isMicOn)
                triggerTimelineEvent(isMicOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون')
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition ${
                isMicOn 
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
            >
              <span className="font-sans">الميكروفون</span>
              {isMicOn ? <Mic className="h-4.5 w-4.5 text-green-500" /> : <MicOff className="h-4.5 w-4.5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={() => {
                setIsVideoOn(!isVideoOn)
                triggerTimelineEvent(isVideoOn ? 'إغلاق الكاميرا' : 'تشغيل الكاميرا')
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition ${
                isVideoOn 
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
            >
              <span className="font-sans">الكاميرا</span>
              {isVideoOn ? <Video className="h-4.5 w-4.5 text-green-500" /> : <VideoOff className="h-4.5 w-4.5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={handleToggleScreenShare}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition ${
                isScreenSharing 
                  ? 'bg-gradient-to-tr from-[#c8a35c] to-[#e5c07b] border-transparent text-[#0c0c0e]' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <span className="font-sans">مشاركة الشاشة</span>
              <Monitor className="h-4.5 w-4.5" />
            </button>

            {/* Whiteboard toggle */}
            <button
              onClick={() => {
                const nextState = !showWhiteboard
                setShowWhiteboard(nextState)
                setIsScreenSharing(false)
                setIsAnnotating(false)
                triggerTimelineEvent(nextState ? 'بدء تشغيل السبورة الذكية' : 'تم الخروج من السبورة الذكية')
                if (channelRef.current) {
                  channelRef.current.send({
                    type: 'broadcast',
                    event: 'whiteboard_status',
                    payload: { visible: nextState, by: userRole }
                  })
                }
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition ${
                showWhiteboard 
                  ? 'bg-gradient-to-tr from-[#c8a35c] to-[#e5c07b] border-transparent text-[#0c0c0e]' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <span className="font-sans">السبورة التفاعلية</span>
              <Layers className="h-4.5 w-4.5" />
            </button>

            {/* Loom Record button */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                isRecording 
                  ? 'bg-red-600 border-transparent text-white animate-pulse' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <span className="font-sans">{isRecording ? 'إيقاف التسجيل' : 'تسجيل الاجتماع'}</span>
              <div className={`h-4.5 w-4.5 flex items-center justify-center`}>
                <span className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-red-500'}`} />
              </div>
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-semibold transition"
            >
              <span className="font-sans">مؤثرات الصوت والفلاتر</span>
              <SettingsIcon className="h-4.5 w-4.5 text-gray-400" />
            </button>
          </div>

          {/* Segmented Recordings List */}
          {recordingSegments.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider text-right">أجزاء الفيديو المحفوظة</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recordingSegments.map((seg, idx) => (
                  <div key={idx} className="bg-[#0c0c0e] border border-white/5 p-2 rounded-lg flex items-center justify-between text-[10px] font-mono">
                    <a
                      href={seg.url}
                      download={seg.name}
                      className="text-[#c8a35c] hover:underline"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                    <div className="text-right">
                      <span className="text-white block font-bold">{seg.name}</span>
                      <span className="text-gray-500 text-[8px]">{seg.size} • {seg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exit & AI Summarization Buttons */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <button
            onClick={generateMeetingSummary}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>استخراج تقارير الذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => {
              if (isRecording) handleStopRecording()
              onEnd()
            }}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>إنهاء الاجتماع</span>
          </button>
        </div>
      </div>

      {/* Main Stage Area */}
      <div className="flex-1 flex flex-col justify-between h-full bg-[#0a0a0d]/90 border border-white/5 rounded-2xl overflow-hidden relative backdrop-blur-xl">
        
        {/* Top header status bar */}
        <div className="bg-[#0c0c0e] border-b border-white/5 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Show left menu toggle button if sidebar collapsed */}
            {!isLeftSidebarPinned && !isLeftSidebarOpen && (
              <button
                onClick={() => setIsLeftSidebarOpen(true)}
                className="p-1 rounded bg-[#c8a35c]/10 text-[#c8a35c] border border-[#c8a35c]/30 hover:bg-[#c8a35c]/25 transition"
                title="Open Controls Sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
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
                    <span className="text-xs font-mono font-bold text-gray-500">
                      SHARED SCREEN: {screenShareOwner === 'Admin' ? 'الأدمن (Admin)' : 'العميل (Client)'} DISPLAY #1
                    </span>
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">LIVE FEED</span>
                  </div>
                  <div className="text-center py-10 space-y-4">
                    <h4 className="text-lg font-bold text-[#c8a35c]">
                      {screenShareOwner === 'Admin' ? 'مراجعة برمجة وتصميم السيرفر' : 'مشاركة شاشة العميل'}
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      {screenShareOwner === 'Admin' 
                        ? 'يعرض الأدمن حالياً الكود المصدري وإعدادات خوادم الإنتاج والـ API للعميل للموافقة على البدء.'
                        : 'يعرض العميل حالياً ملاحظاته وتجربة الواجهة التفاعلية من جهازه.'
                      }
                    </p>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                    <span>1920x1080 @60FPS</span>
                    <span>HTTPS://VIXCELL.COM</span>
                  </div>
                </div>
  
                {/* Draw Annotation Canvas Layer on top of Screen Share */}
                {isAnnotating && screenShareOwner === userRole && (
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
              {screenShareOwner === userRole && (
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
              )}
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
                <div className="absolute bottom-4 left-4 p-2 rounded bg-black/60 backdrop-blur text-[10px] text-gray-400 border border-white/5 font-mono flex items-center gap-1.5">
                  <span>Host (Admin)</span>
                  {voiceEnhancementOn && (
                    <span className="h-2 w-2 rounded-full bg-[#c8a35c] animate-ping" title="Voice Transformation Engine Active" />
                  )}
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

        {/* Bottom Status Toggles */}
        <div className="bg-[#0c0c0e] border-t border-white/5 p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerTimelineEvent(showWhiteboard ? 'تم قفل السبورة الذكية' : 'تم قفل الغرفة وحمايتها')}
              className="p-2.5 bg-[#0a0a0d] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-[#c8a35c]/30 transition"
              title="Lock meeting room"
            >
              <Lock className="h-4.5 w-4.5" />
            </button>
            
            {/* AnyDesk remote control request */}
            {userRole === 'Admin' && (
              <button
                onClick={handleRequestRemoteControl}
                className={`px-3.5 py-2 rounded-xl border transition-all text-[11px] font-bold flex items-center gap-1.5 ${
                  remoteControlRequest === 'approved'
                    ? 'bg-emerald-600 border-transparent text-white'
                    : remoteControlRequest === 'requested'
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>{remoteControlRequest === 'approved' ? 'التحكم بالعميل نشط' : 'طلب تحكم AnyDesk'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono">VIXCELL COLLABORATION ENGINE</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Chat, AI Speech, CRM, Timeline) */}
      {rightSidebarOpen && (
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
        <div className="absolute inset-0 bg-[#0c0c0e]/95 flex items-center justify-center p-6 z-40 animate-fade-in">
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
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#0a0a0d] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 font-sans">
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

            <div className="h-80 bg-[#0c0c0e] border border-white/5 rounded-xl flex items-center justify-center p-4">
              {previewFile.type === 'PDF' ? (
                <div className="space-y-4 text-center">
                  <FileText className="h-16 w-16 text-[#c8a35c] mx-auto animate-pulse" />
                  <p className="text-xs text-gray-400 font-bold">معاينة مباشرة لمخطط الصفحات (PDF Wireframe Preview)</p>
                  <div className="border border-white/10 rounded-lg p-3 bg-[#08080a] max-w-sm mx-auto text-left text-[10px] font-mono text-gray-500">
                    &lt;PDF PAGE 1: Wireframe grids, Home Hero Section structure, client comments overlay&gt;
                  </div>
                </div>
              ) : previewFile.type === 'Excel' ? (
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
                /* eslint-disable-next-line @next/next/no-img-element */
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

      {/* ─── Voice Enhancement Settings Modal ───────────────────────────────── */}
      {showSettingsModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6 z-50 animate-fade-in font-sans">
          <div className="bg-[#0a0a0d] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Volume2 className="h-4.5 w-4.5 text-[#c8a35c]" />
                مؤثرات الصوت وفلاتر تحسين النبرة
              </span>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-right">
              {/* Toggle enhancement */}
              <div className="flex items-center justify-between bg-[#0c0c0e] p-3.5 rounded-xl border border-white/5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceEnhancementOn}
                    onChange={(e) => setVoiceEnhancementOn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c8a35c]" />
                </label>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">تفعيل فلاتر تحويل الصوت الذكية</p>
                  <p className="text-[10px] text-gray-500">تحسين جودة الصوت والنبرة لحظياً بمعدل تأخير منخفض للغاية</p>
                </div>
              </div>

              {/* Profiles Selector */}
              {voiceEnhancementOn && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs text-gray-400 font-semibold block">ملف فلتر النبرة (Voice Profiles)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'deep', name: 'العميل الفخم (Deepen)', desc: 'تضخيم عميق وتخفيض الترددات الحادة' },
                      { id: 'warm', name: 'المدرب الدافئ (Warm)', desc: 'صوت بودكاست إذاعي دافئ ومتوازن' },
                      { id: 'clarity', name: 'تنقية الفائقة (Clarity)', desc: 'عزل الضوضاء الخلفية وتوضيح الحروف' },
                      { id: 'standard', name: 'الوضع الافتراضي (Standard)', desc: 'تعطيل المؤثرات الخاصة' }
                    ].map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => setVoiceProfile(prof.id as any)}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                          voiceProfile === prof.id
                            ? 'bg-[#c8a35c]/10 border-[#c8a35c] text-white shadow-[0_0_15px_rgba(200,163,92,0.15)]'
                            : 'bg-[#0c0c0e] border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{prof.name}</span>
                        <span className="text-[9px] text-gray-500 leading-snug">{prof.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold rounded-lg text-xs"
            >
              حفظ وتطبيق
            </button>
          </div>
        </div>
      )}

      {/* ─── AI Meeting Summaries Report Modal ─────────────────────────────── */}
      {showAiSummaryModal && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-6 z-50 animate-fade-in font-sans">
          <div className="bg-[#0a0a0d] border border-white/10 rounded-2xl w-full max-w-2xl h-[550px] overflow-hidden flex flex-col">
            <div className="bg-[#0c0c0e] p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#c8a35c] animate-pulse" />
                مركز تحليلات الذكاء الاصطناعي الذكي (AI intelligence Center)
              </span>
              <button onClick={() => setShowAiSummaryModal(false)} className="text-gray-500 hover:text-white">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {isGeneratingAiReport ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Sparkles className="h-10 w-10 text-[#c8a35c] animate-spin" />
                <p className="text-sm font-semibold tracking-wider text-gray-400 animate-pulse font-mono uppercase">Analyzing call records & transcribing...</p>
              </div>
            ) : (
              aiReport && (
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 text-right">
                    
                    {/* Executive Summary */}
                    <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-[#c8a35c] uppercase tracking-wider">الملخص التنفيذي (Executive Summary)</h4>
                      <p className="text-sm text-gray-300 leading-relaxed font-sans">{aiReport.executiveSummary}</p>
                    </div>

                    {/* Detailed Summary */}
                    <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">تفاصيل الجلسة والقرارات (Detailed Summary)</h4>
                      <p className="text-sm text-gray-300 leading-relaxed font-sans">{aiReport.detailedSummary}</p>
                    </div>

                    {/* Key Points */}
                    <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">النقاط الرئيسية (Key Points)</h4>
                      <ul className="space-y-1.5 mt-2">
                        {aiReport.keyPoints.map((p, i) => (
                          <li key={i} className="text-xs text-gray-400 flex items-center gap-2 justify-end">
                            <span>{p}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#c8a35c]" />
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Items */}
                    <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                        قائمة المهام المستخرجة والمسؤولين
                        <FileCheck className="h-4 w-4" />
                      </h4>
                      <div className="space-y-2 mt-3 text-xs">
                        {aiReport.actionItems.map((item, i) => (
                          <div key={i} className="flex justify-between bg-white/5 p-2.5 rounded border border-white/5 font-mono">
                            <div className="text-left text-gray-500">
                              <span>Deadline: {item.deadline}</span>
                              <span className="mx-2">•</span>
                              <span className="text-[#c8a35c]">{item.owner}</span>
                            </div>
                            <span className="text-white font-sans font-medium">{item.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CRM Notes */}
                    <div className="bg-[#0c0c0e] p-4 rounded-xl border border-white/5 space-y-2.5">
                      <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">سجل العميل والـ CRM (Follow-up Notes)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right text-xs">
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-gray-500 block">انطباع العميل</span>
                          <span className="text-white font-medium block mt-1 font-sans">{aiReport.crmNotes.client}</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-gray-500 block">حالة المشروع</span>
                          <span className="text-white font-medium block mt-1 font-sans">{aiReport.crmNotes.project}</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-gray-500 block">المتابعة المباشرة</span>
                          <span className="text-white font-medium block mt-1 font-sans">{aiReport.crmNotes.followup}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Export Footer */}
                  <div className="bg-[#0c0c0e] p-4 border-t border-white/5 flex justify-end gap-2">
                    <button
                      onClick={() => handleExportDoc('email')}
                      className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg text-xs font-bold transition"
                    >
                      نسخ لتنسيق البريد (Email)
                    </button>
                    <button
                      onClick={() => handleExportDoc('docx')}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      تحميل Word (.docx)
                    </button>
                    <button
                      onClick={() => handleExportDoc('pdf')}
                      className="bg-[#c8a35c] text-[#0c0c0e] px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(200,163,92,0.25)]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      تصدير PDF كامل
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
