'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  Search, 
  Languages, 
  Send,
  MessageSquare,
  Play
} from 'lucide-react'

interface TranscriptLine {
  speaker: string
  text: string
  translation?: string
  timestamp: string
}

interface AISpeechCenterProps {
  meetingId: string
  onTranscriptChange?: (lines: TranscriptLine[]) => void
}

export default function AISpeechCenter({ meetingId, onTranscriptChange }: AISpeechCenterProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { speaker: 'الأدمن (Admin)', text: 'أهلاً يا أحمد، كيف حالك؟', translation: 'Hello Ahmed, how are you?', timestamp: '00:01' },
    { speaker: 'العميل (Client)', text: 'أهلاً بحضرتك يا بشمهندس. أنا تمام الحمد لله.', translation: 'Hello engineer. I am fine, thank God.', timestamp: '00:03' },
    { speaker: 'الأدمن (Admin)', text: 'تمام، هنبدأ إن شاء الله العمل على برمجة وتصميم السيرفر والموقع الأسبوع الجاي.', translation: 'Alright, we will start working on programming and designing the server and website next week.', timestamp: '00:05' }
  ])

  const [activeSpeaker, setActiveSpeaker] = useState<'Admin' | 'Client' | 'Trainer'>('Admin')
  const [liveSpeech, setLiveSpeech] = useState('')
  const [liveTranslation, setLiveTranslation] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'ai', text: 'أنا المساعد الذكي للاجتماع. يمكنك كتابة "لخص الاجتماع" أو "استخرج المهام" أو طرح أي سؤال حول محادثات الاجتماع!' }
  ])
  const [aiLoading, setAiLoading] = useState(false)

  // Speech Recognition API reference
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'ar-EG' // Default Arabic transcription

    rec.onresult = (e: any) => {
      let finalText = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript
        } else {
          interimText += e.results[i][0].transcript
        }
      }

      const currentSpeech = finalText || interimText
      if (currentSpeech) {
        setLiveSpeech(currentSpeech)
        // Perform quick translation mockup (Ar -> En)
        mockTranslateArToEn(currentSpeech)
      }
    }

    rec.onerror = (err: any) => {
      console.error('Speech Recognition Error:', err)
    }

    rec.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = rec
  }, [])

  // Simple rule-based translation mocking to simulate live translations instantly
  const mockTranslateArToEn = (text: string) => {
    let trans = 'Translating...'
    if (text.includes('سيرفر') || text.includes('السيرفر')) trans = 'Server...'
    else if (text.includes('تصميم')) trans = 'Design...'
    else if (text.includes('تطوير')) trans = 'Development...'
    else if (text.includes('المهام')) trans = 'Tasks...'
    else if (text.includes('أهلاً')) trans = 'Hello...'
    
    setLiveTranslation(trans + ' (Live Translation)')
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('ميزة التعرف على الصوت غير مدعومة بالكامل في هذا المتصفح. يمكنك إدخال نصوص محاكاة بالأسفل!')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      // Push liveSpeech to transcript
      if (liveSpeech) {
        saveTranscriptLine(liveSpeech, liveTranslation)
      }
    } else {
      setLiveSpeech('')
      setLiveTranslation('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const saveTranscriptLine = (text: string, transText?: string) => {
    const speakerLabel = activeSpeaker === 'Admin' ? 'الأدمن (Admin)' : activeSpeaker === 'Client' ? 'العميل (Client)' : 'المدرب (Trainer)'
    const now = new Date()
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    const newLine: TranscriptLine = {
      speaker: speakerLabel,
      text,
      translation: transText || 'No translation available',
      timestamp: stamp
    }

    const updated = [...transcript, newLine]
    setTranscript(updated)
    if (onTranscriptChange) {
      onTranscriptChange(updated)
    }
    setLiveSpeech('')
    setLiveTranslation('')
  }

  // Live Simulated Speaks (Fast mockup typing tool for presentation/testing)
  const triggerMockSpeech = (arabic: string, english: string) => {
    const speakerLabel = activeSpeaker === 'Admin' ? 'الأدمن (Admin)' : activeSpeaker === 'Client' ? 'العميل (Client)' : 'المدرب (Trainer)'
    const now = new Date()
    const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const newLine: TranscriptLine = {
      speaker: speakerLabel,
      text: arabic,
      translation: english,
      timestamp: stamp
    }

    const updated = [...transcript, newLine]
    setTranscript(updated)
    if (onTranscriptChange) {
      onTranscriptChange(updated)
    }
  }

  // Handle AI Assistant queries
  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assistantInput.trim()) return

    const userText = assistantInput
    setAssistantMessages(prev => [...prev, { sender: 'user', text: userText }])
    setAssistantInput('')
    setAiLoading(true)

    // Simulate AI response stream
    setTimeout(() => {
      let aiResponse = ''
      const prompt = userText.toLowerCase()
      
      if (prompt.includes('لخص') || prompt.includes('summary')) {
        aiResponse = `**تلخيص الاجتماع (Meeting Summary):**\n\n- تم البدء بتأكيد جاهزية الفريق للمشروع.\n- سيتم برمجة السيرفر الخاص بالموقع الأسبوع المقبل.\n- تم الاتفاق على هيكلية لوحة التحكم والألوان المقترحة.\n- مدة تنفيذ المشروع المقدرة هي 14 يوماً.`
      } else if (prompt.includes('مهام') || prompt.includes('tasks')) {
        aiResponse = `**استخراج المهام الذكي (AI Tasks Extraction):**\n\n1. [الأدمن] تجهيز السيرفر وحجز الاستضافة السحابية.\n2. [المصمم] تسليم اللوجو وملفات الألوان المعتمدة للعميل.\n3. [المطور] ربط لوحة التحكم بالـ API الخاصة بالمشروع.`
      } else if (prompt.includes('محضر') || prompt.includes('minutes')) {
        aiResponse = `**محضر الاجتماع الرسمي (Meeting Minutes):**\n\n* **التاريخ:** 2026-06-10\n* **الحضور:** الأدمن، أحمد (العميل)\n* **الموضوع:** انطلاق مشروع لوحة تحكم Vixcell\n* **القرارات:** إعطاء الأولوية لبناء Whiteboard ونظام الترجمة الفورية.`
      } else {
        aiResponse = `لقد قمت بتحليل محادثات الغرفة. لقد تم ذكر كلمة "السيرفر" ${transcript.filter(t => t.text.includes('السيرفر')).length} مرات. هل ترغب في إعداد مهام حاسوبية حول هذا؟`
      }

      setAssistantMessages(prev => [...prev, { sender: 'ai', text: aiResponse }])
      setAiLoading(false)
    }, 1500)
  }

  // Filter transcript line matches
  const filteredTranscript = transcript.filter(line => 
    line.text.includes(searchQuery) || (line.translation && line.translation.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col bg-[#0a0a0d] border border-white/5 rounded-2xl overflow-hidden h-full">
      {/* Tab Navigation header */}
      <div className="bg-[#0c0c0e] border-b border-white/5 p-3 flex items-center justify-between">
        <span className="text-xs text-[#c8a35c] font-semibold flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          مركز الذكاء الاصطناعي للاجتماع (AI Speech Hub)
        </span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-gray-500 font-mono">LIVE SPEECH-TO-TEXT</span>
        </div>
      </div>

      {/* Main Content splits: Transcript, AI Control Panel */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
        {/* Left: Live Transcription Board */}
        <div className="border-r border-white/5 flex flex-col p-4 space-y-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-semibold text-white">النص الصوتي المفرغ</span>
            <div className="relative w-40">
              <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="ابحث عن كلمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-md pl-8 pr-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#c8a35c]"
              />
            </div>
          </div>

          {/* Transcript Lines container */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredTranscript.map((line, i) => (
              <div key={i} className="space-y-1 bg-[#0c0c0e]/80 border border-white/5 p-2.5 rounded-lg">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span className={`font-bold ${line.speaker.includes('الأدمن') ? 'text-[#c8a35c]' : 'text-blue-400'}`}>{line.speaker}</span>
                  <span>{line.timestamp}</span>
                </div>
                <p className="text-sm text-gray-200 text-left font-sans">{line.text}</p>
                {line.translation && (
                  <p className="text-xs text-gray-500 italic text-left flex items-center gap-1">
                    <Languages className="h-3 w-3 text-[#c8a35c]/60" />
                    {line.translation}
                  </p>
                )}
              </div>
            ))}

            {/* Live capture overlay */}
            {isListening && (
              <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-950/5 animate-pulse space-y-1">
                <span className="text-[10px] text-red-400 font-mono font-bold flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 animate-bounce" />
                  جاري الاستماع للـ {activeSpeaker === 'Admin' ? 'أدمن' : 'عميل'}...
                </span>
                <p className="text-sm text-gray-300 italic">{liveSpeech || 'تحدث الآن...'}</p>
                {liveTranslation && <p className="text-xs text-gray-500">{liveTranslation}</p>}
              </div>
            )}
          </div>

          {/* Micro controls and simulation speaker switch */}
          <div className="bg-[#0c0c0e] p-3 rounded-xl border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">تحديد المتحدث الحالي:</span>
              <div className="flex items-center gap-1">
                {(['Admin', 'Client', 'Trainer'] as const).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setActiveSpeaker(sp)}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      activeSpeaker === sp ? 'bg-[#c8a35c]/20 text-[#c8a35c] border border-[#c8a35c]/30' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {sp === 'Admin' ? 'الأدمن' : sp === 'Client' ? 'العميل' : 'المدرب'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleListening}
                className={`flex-1 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border transition ${
                  isListening 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                    : 'bg-[#c8a35c] border-transparent text-[#0c0c0e] hover:shadow-[0_0_12px_rgba(200,163,92,0.3)]'
                }`}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span>{isListening ? 'كتم التعرف الصوتي' : 'تفعيل التعرف الفوري'}</span>
              </button>

              {/* Simulation generator for testing without mic */}
              <button
                onClick={() => {
                  if (activeSpeaker === 'Admin') {
                    triggerMockSpeech('يجب فحص قواعد بيانات السيرفر والتأكد من الحماية.', 'We must inspect the server database and verify security.')
                  } else {
                    triggerMockSpeech('هل سأحصل على ملف الـ PDF الخاص بالـ Wireframe اليوم؟', 'Will I receive the wireframe PDF file today?')
                  }
                }}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3.5 rounded-lg text-xs"
                title="Simulate speech node addition"
              >
                محاكاة كلام
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Assistant & Tools */}
        <div className="flex flex-col p-4 min-h-0">
          <span className="text-xs font-semibold text-white border-b border-white/5 pb-2 block">مساعد الذكاء الاصطناعي التوليدي</span>
          
          {/* Chat message bubbles */}
          <div className="flex-1 space-y-3 overflow-y-auto py-3 pr-1 text-left">
            {assistantMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl max-w-[90%] text-sm ${
                  msg.sender === 'user' 
                    ? 'ml-auto bg-[#c8a35c]/10 text-white border border-[#c8a35c]/25' 
                    : 'mr-auto bg-white/5 text-gray-300 border border-white/5 vx-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))}

            {aiLoading && (
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl mr-auto max-w-[80%] flex items-center gap-2 text-xs text-gray-500 font-mono">
                <Sparkles className="h-4 w-4 animate-spin text-[#c8a35c]" />
                <span>AI is compiling transcripts...</span>
              </div>
            )}
          </div>

          {/* Quick prompt templates */}
          <div className="grid grid-cols-3 gap-1.5 pb-2">
            {[
              { label: 'لخص الاجتماع', prompt: 'لخص الاجتماع واستخرج أهم النقاط المتفق عليها' },
              { label: 'استخرج المهام', prompt: 'استخرج المهام المطلوبة من المتحدثين وحدد المسؤول عنها' },
              { label: 'اكتب المحضر', prompt: 'اكتب محضر الاجتماع الرسمي بتنسيق احترافي' }
            ].map((tpl, i) => (
              <button
                key={i}
                onClick={() => {
                  setAssistantInput(tpl.prompt)
                }}
                className="bg-[#0c0c0e] hover:bg-white/5 border border-white/5 text-[10px] text-gray-400 py-1.5 rounded transition"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          {/* Assistant input form */}
          <form onSubmit={handleAssistantSubmit} className="flex gap-2">
            <input
              type="text"
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              placeholder="اطلب تلخيص، مهام، أو اسأل المساعد..."
              className="flex-1 bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#c8a35c]"
            />
            <button
              type="submit"
              className="bg-[#c8a35c] text-[#0c0c0e] p-2.5 rounded-lg hover:shadow-[0_0_12px_rgba(200,163,92,0.3)] transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
