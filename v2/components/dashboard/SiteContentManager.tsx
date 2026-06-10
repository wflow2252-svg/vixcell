'use client'

import React, { useState } from 'react'
import { Image, FileText, Palette, Save, Upload, RefreshCw, Eye, Sparkles } from 'lucide-react'

export default function SiteContentManager() {
  const [heroTitle, setHeroTitle] = useState('ابدأ مشروعك الرقمي بالذكاء الاصطناعي')
  const [heroDesc, setHeroDesc] = useState('نقوم بتصميم وبرمجة المواقع الإلكترونية بالكامل في ثوانٍ معدودة وباحترافية كاملة لتناسب تطلعات شركتك.')
  const [ctaText, setCtaText] = useState('ابدأ المعاينة المجانية')
  const [brandColor, setBrandColor] = useState('#c8a35c')
  const [siteLogoText, setSiteLogoText] = useState('VIXCELL')
  const [heroImageUrl, setHeroImageUrl] = useState('/1080.png')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Features customization state
  const [features, setFeatures] = useState([
    { id: 'f1', title: 'سرعة بناء خيالية', desc: 'نولد الكود الكامل والتصميم في أقل من دقيقة.' },
    { id: 'f2', title: 'تخصيص متكامل للعلامة التجارية', desc: 'تعديل الصور والألوان والمحتوى مباشرة من لوحة التحكم.' },
    { id: 'f3', title: 'غرف اجتماعات ذكية', desc: 'اجتماعات فيديو مدمجة مع سبورة ذكية وتلخيص بالذكاء الاصطناعي.' }
  ])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    setIsUploading(true)
    const file = e.target.files[0]
    
    // Create a local object URL to simulate image storage upload
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setTimeout(() => {
          setHeroImageUrl(event.target!.result as string)
          setIsUploading(false)
        }, 1500)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveChanges = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      alert('تم حفظ المحتوى الجديد وتحديث الموقع المباشر بنجاح!')
    }, 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#e8e8ed]">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Palette className="h-6 w-6 text-[#c8a35c]" />
            تخصيص محتوى وصور الموقع
          </h2>
          <p className="text-xs text-gray-500 font-mono">SITE EDITOR — CUSTOMIZE WEBSITE TEXT & IMAGES</p>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold px-5 py-2.5 rounded-lg text-sm hover:shadow-[0_0_15px_rgba(200,163,92,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>حفظ التعديلات ونشر الموقع</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form Left */}
        <div className="space-y-6">
          {/* Logo & Brand Colors */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Sparkles className="h-4 w-4 text-[#c8a35c]" />
              الهوية العامة واللوجو
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">نص الشعار (Logo Text)</label>
                <input
                  type="text"
                  value={siteLogoText}
                  onChange={(e) => setSiteLogoText(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">اللون الأساسي للبراند</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="bg-transparent border border-white/10 rounded h-9 w-12 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section Edit */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-2.5">
              <FileText className="h-4 w-4 text-[#c8a35c]" />
              القسم الرئيسي للترحيب (Hero Section)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">العنوان العريض للموقع</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">الوصف التفصيلي</label>
                <textarea
                  value={heroDesc}
                  onChange={(e) => setHeroDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">زر الدعوة للإجراء (CTA Button)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                />
              </div>
            </div>
          </div>

          {/* Hero Image Edit */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Image className="h-4 w-4 text-[#c8a35c]" />
              الصورة الرئيسية للموقع
            </h3>
            
            <div className="flex items-center gap-6">
              <div className="h-24 w-40 relative rounded-lg border border-white/10 overflow-hidden bg-[#0c0c0e]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt="Hero Preview" className="h-full w-full object-cover" />
                {isUploading && (
                  <div className="absolute inset-0 bg-[#0c0c0e]/80 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-[#c8a35c] animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="relative cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#c8a35c]/30 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 w-fit transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  <span>رفع صورة جديدة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-gray-500">يدعم PNG, JPG, GIF، بحد أقصى 5 ميجابايت.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Mockup Preview Right */}
        <div className="bg-[#0a0a0d]/80 border border-white/5 rounded-xl overflow-hidden backdrop-blur-xl flex flex-col h-[650px]">
          <div className="bg-[#0c0c0e] border-b border-white/5 p-3 flex items-center justify-between">
            <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold">
              <Eye className="h-4 w-4 text-[#c8a35c]" />
              معاينة حية للموقع المعدل (Live Preview Mockup)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            </div>
          </div>

          <div className="flex-1 bg-[#0c0c0e] overflow-y-auto p-8 relative flex flex-col justify-between">
            {/* Header navbar preview */}
            <div className="flex justify-between items-center pb-8 border-b border-white/5">
              <span className="font-bold text-white tracking-widest font-mono text-sm" style={{ color: brandColor }}>{siteLogoText}</span>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>الرئيسية</span>
                <span>المميزات</span>
                <span>تواصل معنا</span>
              </div>
            </div>

            {/* Hero area preview */}
            <div className="py-12 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
              <h1 className="text-2xl font-black text-white max-w-md leading-snug">
                {heroTitle}
              </h1>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                {heroDesc}
              </p>
              
              <button
                className="text-[#0c0c0e] font-bold text-xs px-6 py-2.5 rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: brandColor }}
              >
                {ctaText}
              </button>

              <div className="mt-8 rounded-lg overflow-hidden border border-white/5 max-w-xs h-36 w-full shadow-2xl bg-[#08080a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt="Hero View Mock" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Features preview footer */}
            <div className="grid grid-cols-3 gap-2.5 border-t border-white/5 pt-6 text-left">
              {features.map(f => (
                <div key={f.id} className="p-2 border border-white/5 rounded-lg bg-[#08080a]">
                  <h4 className="text-[10px] font-bold text-white" style={{ color: brandColor }}>{f.title}</h4>
                  <p className="text-[9px] text-gray-500 mt-0.5 leading-normal">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
