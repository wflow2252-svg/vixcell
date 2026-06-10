'use client'

import React, { useState } from 'react'
import { 
  FolderArchive, 
  Search, 
  Video, 
  FileText, 
  FileCheck, 
  Paperclip, 
  Download, 
  ChevronRight,
  Play,
  ArrowLeft,
  SearchCode
} from 'lucide-react'

interface PastMeeting {
  id: string
  title: string
  date: string
  client: string
  videoUrl: string
  duration: string
  summary: string
  transcript: Array<{ speaker: string, text: string, time: string }>
  tasks: string[]
  attachments: Array<{ name: string, type: string, size: string }>
}

export default function Archive() {
  const [meetings] = useState<PastMeeting[]>([
    {
      id: 'm-2026-101',
      title: 'جلسة انطلاق مشروع لوحة التحكم Vixcell UI',
      date: '2026-06-10',
      client: 'أحمد محمد',
      videoUrl: '#',
      duration: '14:02',
      summary: 'تم الاتفاق على تصميم لوحة التحكم بالكامل وتجهيز السيرفرات السحابية. تم إقرار مدة تنفيذ تبلغ 14 يوماً مع تفعيل ميزات الذكاء الاصطناعي الفورية.',
      tasks: [
        'تصميم واجهات الصفحة الرئيسية المتجاوبة.',
        'إعداد خادم التطوير وربط قاعدة بيانات Supabase.',
        'تثبيت محرك Fabric.js لبناء السبورة الذكية.'
      ],
      attachments: [
        { name: 'Wireframe_Layout_v1.pdf', type: 'PDF', size: '2.4 MB' },
        { name: 'Color_Palette_Config.json', type: 'JSON', size: '12 KB' }
      ],
      transcript: [
        { speaker: 'الأدمن (Admin)', text: 'أهلاً يا أحمد، هنبدأ مشروع الموقع الأسبوع الجاي إن شاء الله.', time: '00:02' },
        { speaker: 'العميل (Client)', text: 'أهلاً بك. هل سنقوم بتثبيت السيرفر على خوادم AWS أو Cloudflare؟', time: '02:15' },
        { speaker: 'الأدمن (Admin)', text: 'هنقوم بحجز السيرفر ونشره على Cloudflare R2 للحصول على سرعة استجابة خيالية.', time: '04:30' },
        { speaker: 'العميل (Client)', text: 'عظيم جداً، هذا ما كنت أبحث عنه تماماً.', time: '08:12' },
        { speaker: 'الأدمن (Admin)', text: 'تم الاتفاق على السعر الإجمالي، وهنبسط لوحة التحكم للعملاء.', time: '10:45' }
      ]
    },
    {
      id: 'm-2026-102',
      title: 'جلسة مراجعة متجر سارة للأزياء',
      date: '2026-06-08',
      client: 'سارة خالد',
      videoUrl: '#',
      duration: '22:15',
      summary: 'مراجعة الهوية البصرية لمتجر الأزياء وتعديل صور القائمة الرئيسية. تم استخراج مهام تحسين الصور واستيراد المنتجات.',
      tasks: [
        'تحميل وتجهيز صور المنتجات عالية الجودة.',
        'ربط بوابة الدفع الإلكتروني المحلية بالمتجر.'
      ],
      attachments: [
        { name: 'Logo_Mockup_Dubai.png', type: 'PNG', size: '1.8 MB' }
      ],
      transcript: [
        { speaker: 'الأدمن (Admin)', text: 'أهلاً سارة، كيف قمت بتنسيق المنتجات؟', time: '01:00' },
        { speaker: 'العميل (Client)', text: 'أهلاً بك. قمت بوضع الصور، ولكن أحتاج لتعديل صور الموقع بالكامل لتبدو بريميوم.', time: '03:45' },
        { speaker: 'الأدمن (Admin)', text: 'تمام، سنقوم بتوفير محرر صور مباشر في لوحة التحكم لتعديل محتوى موقعك.', time: '06:10' }
      ]
    }
  ])

  const [selectedMeeting, setSelectedMeeting] = useState<PastMeeting | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'video' | 'transcript' | 'summary' | 'attachments'>('video')

  // Search through transcripts globally
  const globalSearchMatches = meetings.flatMap(meeting => 
    meeting.transcript
      .filter(line => line.text.includes(searchTerm) && searchTerm.length > 1)
      .map(line => ({
        meeting,
        line
      }))
  )

  // Function to highlight match keys in transcripts
  const highlightMatch = (text: string, search: string) => {
    if (!search) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${search})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5 border border-yellow-500/20">{part}</mark>
            : part
        )}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#e8e8ed]">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FolderArchive className="h-6 w-6 text-[#c8a35c]" />
          مكتبة وأرشيف الاجتماعات القديمة
        </h2>
        <p className="text-xs text-gray-500 font-mono">MEETINGS ARCHIVE — TRANSLATE, PLAYBACK & SEMANTIC TRANSCRIPTS</p>
      </div>

      {/* Global Semantic Search Input */}
      <div className="bg-[#0a0a0d]/80 border border-white/5 p-4 rounded-xl backdrop-blur-xl space-y-3">
        <label className="text-xs font-semibold text-[#c8a35c] flex items-center gap-1.5 font-mono">
          <SearchCode className="h-4 w-4" />
          البحث الذكي داخل محتوى وتفريغات الاجتماعات القديمة
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="ابحث عن كلمة معينة قيلت في الاجتماع (مثال: 'السيرفر'، 'AWS'، 'AWS'، 'الصور' ...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-sans"
          />
        </div>

        {/* Global matches results */}
        {searchTerm.length > 1 && (
          <div className="mt-4 p-3 bg-[#0c0c0e]/80 border border-white/5 rounded-xl space-y-3 animate-fade-in">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">تم العثور على {globalSearchMatches.length} تطابق في تفريغات النصوص:</p>
            {globalSearchMatches.length === 0 ? (
              <p className="text-xs text-gray-500 italic">لا توجد تطابقات للبحث الحالي.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {globalSearchMatches.map((match, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedMeeting(match.meeting)
                      setActiveTab('transcript')
                    }}
                    className="w-full text-right p-3 rounded-lg bg-white/5 border border-white/5 hover:border-[#c8a35c]/30 transition flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] bg-[#c8a35c]/10 text-[#c8a35c] px-2 py-0.5 rounded-full font-mono mb-1 inline-block">
                        {match.meeting.title}
                      </span>
                      <p className="text-xs text-gray-300 font-sans">
                        <strong className="text-[#c8a35c]">{match.line.speaker}: </strong>
                        {highlightMatch(match.line.text, searchTerm)}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{match.line.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!selectedMeeting ? (
        /* Grid of past sessions */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meet) => (
            <div
              key={meet.id}
              onClick={() => setSelectedMeeting(meet)}
              className="bg-[#0a0a0d]/80 border border-white/5 hover:border-white/10 p-5 rounded-xl backdrop-blur-xl cursor-pointer group transition-all duration-300 flex flex-col justify-between h-56"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                  <span>{meet.date}</span>
                  <span>{meet.duration}</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#c8a35c] transition-colors leading-snug">
                  {meet.title}
                </h3>
                <p className="text-xs text-gray-400">العميل: {meet.client}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">{meet.summary}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-xs font-mono text-[#c8a35c]">
                <span className="flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  تشغيل الفيديو والتفريغ
                </span>
                <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Detailed Single Meeting View */
        <div className="bg-[#0a0a0d]/80 border border-white/5 rounded-xl p-5 backdrop-blur-xl space-y-6 animate-fade-in">
          {/* Top header back button */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <button
              onClick={() => setSelectedMeeting(null)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-all bg-white/5 py-1.5 px-3 rounded-lg border border-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              الرجوع للمكتبة
            </button>
            <div className="text-left">
              <span className="text-[10px] text-gray-500 font-mono">{selectedMeeting.date}</span>
              <h3 className="text-lg font-bold text-white mt-1">{selectedMeeting.title}</h3>
            </div>
          </div>

          {/* Sub menu navigation */}
          <div className="flex gap-2 border-b border-white/5 pb-2">
            {[
              { id: 'video', label: 'تسجيل الفيديو المفرغ', icon: Video },
              { id: 'transcript', label: 'محادثات الاجتماع التفصيلية', icon: FileText },
              { id: 'summary', label: 'الملخص الذكي والمهام', icon: FileCheck },
              { id: 'attachments', label: 'الملفات المرفقة', icon: Paperclip }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#c8a35c]/10 border-[#c8a35c]/30 text-[#c8a35c]'
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab contents details */}
          <div className="p-4 bg-[#0c0c0e] border border-white/5 rounded-xl min-h-[350px]">
            {activeTab === 'video' && (
              <div className="flex flex-col items-center justify-center h-80 space-y-4">
                {/* Simulated high-end Loom style video player mock */}
                <div className="h-60 w-96 relative border border-white/10 rounded-xl overflow-hidden bg-[#08080a] shadow-2xl flex items-center justify-center group cursor-pointer">
                  {/* Glow active */}
                  <div className="absolute inset-0 bg-[#c8a35c]/5 group-hover:bg-[#c8a35c]/10 transition-colors pointer-events-none" />
                  
                  {/* Digital mockup canvas grid in player */}
                  <div className="absolute top-4 left-4 p-2.5 rounded-lg bg-black/60 backdrop-blur text-[10px] text-gray-400 border border-white/5 flex items-center gap-2 font-mono">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span>Loom Rec: {selectedMeeting.duration}</span>
                  </div>

                  <div className="absolute bottom-4 right-4 p-2 rounded bg-black/60 text-[9px] text-gray-400 font-mono">
                    meeting_rec.mp4
                  </div>

                  <div className="h-14 w-14 rounded-full bg-[#c8a35c] text-[#0c0c0e] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(200,163,92,0.4)]">
                    <Play className="h-6 w-6 fill-current translate-x-[2px]" />
                  </div>
                </div>

                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 px-5 rounded-lg text-xs transition flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  تحميل تسجيل الفيديو بالكامل (.mp4)
                </button>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {selectedMeeting.transcript.map((line, i) => (
                  <div key={i} className="p-3 bg-[#0a0a0d] border border-white/5 rounded-lg text-right">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mb-1.5">
                      <span className={`font-bold ${line.speaker.includes('الأدمن') ? 'text-[#c8a35c]' : 'text-blue-400'}`}>
                        {line.speaker}
                      </span>
                      <span>{line.time}</span>
                    </div>
                    <p className="text-sm text-gray-200 font-sans leading-relaxed">
                      {highlightMatch(line.text, searchTerm)}
                    </p>
                  </div>
                ))}

                <div className="pt-2 flex justify-center">
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    تحميل التفريغ النصي بالكامل (.txt)
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-6 text-right">
                <div className="space-y-2 bg-[#0a0a0d] border border-white/5 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-[#c8a35c] flex items-center gap-2 justify-end">
                    الملخص الذكي للاجتماع
                    <FileText className="h-4 w-4" />
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-sans">{selectedMeeting.summary}</p>
                </div>

                <div className="space-y-3 bg-[#0a0a0d] border border-white/5 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-[#c8a35c] flex items-center gap-2 justify-end">
                    المهام المستخرجة (AI Tasks List)
                    <FileCheck className="h-4 w-4" />
                  </h4>
                  <ul className="space-y-2">
                    {selectedMeeting.tasks.map((task, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-center gap-2 justify-end">
                        <span>{task}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c8a35c]" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white mb-2 text-right">ملفات تم مشاركتها أثناء الاجتماع</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMeeting.attachments.map((file, i) => (
                    <div key={i} className="bg-[#0a0a0d] border border-white/5 p-3 rounded-lg flex items-center justify-between font-mono">
                      <button className="text-gray-400 hover:text-white transition">
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block truncate max-w-xs">{file.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{file.type} • {file.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
