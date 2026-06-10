import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { aiAPI } from '@/api/client'
import { useAppStore } from '@/store'

const CONTENT_TYPES = [
  { id: 'facebook_post',       icon: 'thumb_up',      label: 'Facebook Post',       labelAr: 'منشور فيسبوك' },
  { id: 'instagram_caption',   icon: 'photo_camera',  label: 'Instagram Caption',   labelAr: 'كابشن انستجرام' },
  { id: 'tiktok_script',       icon: 'movie',         label: 'TikTok Script',       labelAr: 'سكريبت تيك توك' },
  { id: 'ad_copy',             icon: 'campaign',      label: 'Ad Copy',             labelAr: 'نص إعلاني' },
  { id: 'email',               icon: 'mail',          label: 'Email Campaign',      labelAr: 'حملة إيميل' },
  { id: 'blog_article',        icon: 'article',       label: 'Blog Article',        labelAr: 'مقال مدونة' },
  { id: 'product_description', icon: 'sell',          label: 'Product Description', labelAr: 'وصف منتج' },
]

const TONES = [
  { id: 'professional', label: 'Professional', labelAr: 'احترافي' },
  { id: 'friendly',     label: 'Friendly',     labelAr: 'ودود' },
  { id: 'funny',        label: 'Funny',        labelAr: 'مرح' },
  { id: 'luxury',       label: 'Luxury',       labelAr: 'فاخر' },
  { id: 'urgent',       label: 'Urgent',       labelAr: 'عاجل' },
]

export default function ContentPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [type, setType] = useState('facebook_post')
  const [topic, setTopic] = useState('')
  const [outLang, setOutLang] = useState(isAr ? 'ar' : 'en')
  const [tone, setTone] = useState('professional')
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [aiRunning, setAiRunning] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [output, setOutput] = useState('')

  useEffect(() => {
    aiAPI.status().then(async st => {
      setAiRunning(st.data.running)
      if (st.data.running) {
        try {
          const m = await aiAPI.models()
          const names = m.data.models.map((x: any) => x.name)
          setModels(names)
          // Prefer instruct variants — thinking models are slow for content
          const preferred = names.find((n: string) => n.includes('instruct')) || names[0]
          if (preferred) setModel(preferred)
        } catch { /* models list optional */ }
      }
    }).catch(() => setAiRunning(false))
  }, [])

  const generate = async () => {
    if (!topic.trim()) { toast.error(isAr ? 'اكتب الموضوع أولاً' : 'Enter a topic first'); return }
    if (!model) { toast.error(isAr ? 'لا يوجد نموذج مثبت — نزّل نموذجًا من صفحة نماذج الذكاء' : 'No model installed — pull one from AI Models'); return }
    setGenerating(true)
    setOutput('')
    try {
      const res = await aiAPI.content({
        model,
        content_type: type,
        topic: topic.trim(),
        language: outLang,
        tone,
      })
      setOutput(res.data.text)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const copyOut = () => {
    navigator.clipboard.writeText(output)
    toast.success(isAr ? 'تم النسخ' : 'Copied')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{isAr ? 'إنشاء المحتوى بالذكاء الاصطناعي' : 'AI Content Creation'}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? 'منشورات، إعلانات، إيميلات ومقالات — بالعربي أو الإنجليزي' : 'Posts, ads, emails and articles — in Arabic or English'}
        </p>
      </div>

      {!aiRunning && (
        <div className="glass-card p-4 flex items-center gap-3 border-amber-500/30">
          <Icon name="warning" size={20} className="text-amber-400" />
          <p className="text-sm text-amber-300">
            {isAr ? 'محرك الذكاء الاصطناعي (Ollama) متوقف — شغّله من صفحة نماذج الذكاء' : 'AI engine (Ollama) is stopped — start it from the AI Models page'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4 items-start">
        {/* Settings column */}
        <div className="col-span-2 space-y-4">
          {/* Content type */}
          <div className="glass-card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {isAr ? 'نوع المحتوى' : 'Content Type'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setType(ct.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-start ${
                    type === ct.id
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/40'
                      : 'bg-surface-800 text-slate-400 border border-line hover:text-white'
                  }`}>
                  <Icon name={ct.icon} size={17} />
                  {isAr ? ct.labelAr : ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic + options */}
          <div className="glass-card p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{isAr ? 'الموضوع / المنتج' : 'Topic / Product'}</label>
              <textarea
                className="input-field min-h-[80px]"
                placeholder={isAr ? 'مثال: عرض افتتاح كوفي شوب جديد في المعادي' : 'e.g. Grand opening offer for a new coffee shop in Maadi'}
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">{isAr ? 'لغة الناتج' : 'Output Language'}</label>
                <select className="input-field" value={outLang} onChange={e => setOutLang(e.target.value)}>
                  <option value="ar">{isAr ? 'العربية الفصحى' : 'Arabic (MSA)'}</option>
                  <option value="ar-eg">{isAr ? 'مصري عامية' : 'Egyptian Arabic'}</option>
                  <option value="en">{isAr ? 'الإنجليزية' : 'English'}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">{isAr ? 'الأسلوب' : 'Tone'}</label>
                <select className="input-field" value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{isAr ? 'النموذج' : 'Model'}</label>
              <select className="input-field" dir="ltr" value={model} onChange={e => setModel(e.target.value)}>
                {models.length === 0 && <option value="">{isAr ? '— لا نماذج مثبتة —' : '— no models installed —'}</option>}
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button onClick={generate} disabled={generating || !aiRunning}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {generating
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isAr ? 'جارٍ الإنشاء...' : 'Generating...'}</>
                : <><Icon name="auto_awesome" size={18} />{isAr ? 'أنشئ المحتوى' : 'Generate Content'}</>}
            </button>
          </div>
        </div>

        {/* Output column */}
        <div className="col-span-3 glass-card p-5 min-h-[480px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Icon name="draft" size={17} className="text-brand-400" />
              {isAr ? 'الناتج' : 'Output'}
            </h3>
            {output && (
              <div className="flex gap-1">
                <button onClick={copyOut} className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5">
                  <Icon name="content_copy" size={14} />{isAr ? 'نسخ' : 'Copy'}
                </button>
                <button onClick={generate} disabled={generating} className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5">
                  <Icon name="refresh" size={14} />{isAr ? 'إعادة' : 'Retry'}
                </button>
              </div>
            )}
          </div>

          {generating ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center animate-pulse-glow">
                <Icon name="auto_awesome" size={24} className="text-brand-400" />
              </div>
              <p className="text-sm text-slate-400">{isAr ? 'النموذج المحلي بيكتب المحتوى...' : 'Local model is writing...'}</p>
              <p className="text-xs text-slate-600">{isAr ? 'قد يستغرق دقيقة حسب سرعة جهازك' : 'May take a minute depending on your hardware'}</p>
            </div>
          ) : output ? (
            <div className="flex-1 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-sans">{output}</pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Icon name="edit_square" size={28} className="text-slate-600" />
              <p className="text-sm text-slate-500">{isAr ? 'اختر النوع واكتب الموضوع ثم اضغط "أنشئ المحتوى"' : 'Pick a type, enter a topic, then hit Generate'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
