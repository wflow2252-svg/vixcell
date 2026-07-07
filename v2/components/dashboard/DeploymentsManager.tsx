'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Server, 
  Terminal, 
  Layers, 
  Upload, 
  Globe, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Trash2, 
  CheckCircle, 
  Activity, 
  Settings, 
  FileCode,
  ExternalLink,
  Search,
  X
} from 'lucide-react'

interface Deployment {
  id: string
  name: string
  url: string
  framework: string
  status: 'Active' | 'Building' | 'Superseded' | 'Failed'
  version: string
  date: string
  customDomain?: string
}

export default function DeploymentsManager() {
  const [deployments, setDeployments] = useState<Deployment[]>([
    { id: 'dep-101', name: 'morsall', url: 'https://vixcell.com/morsall', framework: 'Next.js', status: 'Active', version: 'v1.2.0', date: '2026-06-15 14:30', customDomain: 'morsall.app' },
    { id: 'dep-102', name: 're-portfolio', url: 'https://vixcell.com/re-portfolio', framework: 'React', status: 'Superseded', version: 'v1.0.0', date: '2026-06-12 11:15' },
    { id: 'dep-103', name: 'gym-dashboard', url: 'https://vixcell.com/gym-dashboard', framework: 'Vue', status: 'Active', version: 'v2.1.4', date: '2026-06-10 09:40' }
  ])

  // Form states
  const [projectName, setProjectName] = useState('')
  const [selectedFramework, setSelectedFramework] = useState('Next.js')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  
  // Custom Domain map states
  const [targetDeployId, setTargetDeployId] = useState<string | null>(null)
  const [customDomainInput, setCustomDomainInput] = useState('')

  // Build console logs state
  const [isBuilding, setIsBuilding] = useState(false)
  const [currentBuildLogs, setCurrentBuildLogs] = useState<string[]>([])
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentBuildLogs])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const triggerDeployment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !uploadedFile) return

    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    const generatedUrl = `https://vixcell.com/${sanitizedName}`

    setIsBuilding(true)
    setCurrentBuildLogs([])

    const logs = [
      '🔄 Initializing deployment pipeline for project: ' + sanitizedName,
      '📁 Parsing uploaded bundle: ' + uploadedFile.name + ' (' + (uploadedFile.size / 1024).toFixed(1) + ' KB)',
      '⚙️ Framework preset detected: ' + selectedFramework,
      '🐳 Creating Docker container workspace...',
      '🛠️ Running build command: npm run build',
      '📦 Installing dependencies...',
      '✨ Compiling production static files...',
      '🛰️ Routing reverse proxy settings to Nginx...',
      '🛡️ Generating SSL certificates with Let\'s Encrypt...',
      '🌍 Provisioning subdomain ' + generatedUrl,
      '🚀 Deployment successful!'
    ]

    let currentLogIndex = 0
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setCurrentBuildLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logs[currentLogIndex]}`])
        currentLogIndex++
      } else {
        clearInterval(interval)
        setIsBuilding(false)
        setUploadedFile(null)
        setProjectName('')

        // Add to active deployments
        const newDep: Deployment = {
          id: `dep-${Date.now()}`,
          name: sanitizedName,
          url: generatedUrl,
          framework: selectedFramework,
          status: 'Active',
          version: 'v1.0.0',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }

        // Set previous matching name to superseded
        setDeployments(prev => {
          const updated = prev.map(d => d.name === sanitizedName ? { ...d, status: 'Superseded' as const } : d)
          return [newDep, ...updated]
        })
      }
    }, 1200)

    // Call API deploy route
    fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sanitizedName, framework: selectedFramework })
    }).catch(err => console.warn('Failed call to deploy api route:', err))
  }

  const handleRollback = (id: string) => {
    const target = deployments.find(d => d.id === id)
    if (!target) return

    setIsBuilding(true)
    setCurrentBuildLogs([
      `🔄 Initializing rollback sequence for ${target.name} to version ${target.version}...`,
      `⚙️ Pointing Nginx reverse proxy upstream to container hash of ${target.version}...`,
      `🛡️ Verifying SSL binding...`,
      `✅ Rollback successful. Version ${target.version} is now LIVE.`
    ])

    setTimeout(() => {
      setIsBuilding(false)
      setDeployments(prev => prev.map(d => {
        if (d.id === id) return { ...d, status: 'Active' as const }
        if (d.name === target.name && d.id !== id) return { ...d, status: 'Superseded' as const }
        return d
      }))
    }, 3000)
  }

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا النشر وإيقاف الحاوية بالكامل؟')) {
      setDeployments(deployments.filter(d => d.id !== id))
    }
  }

  const handleApplyCustomDomain = (id: string) => {
    if (!customDomainInput.trim()) return
    setDeployments(deployments.map(d => d.id === id ? { ...d, customDomain: customDomainInput } : d))
    setTargetDeployId(null)
    setCustomDomainInput('')
    alert('تم ربط النطاق وتعديل إعدادات DNS السحابية بنجاح!')
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#e8e8ed] font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Server className="h-6 w-6 text-[#c8a35c]" />
          إعدادات النشر وحاويات الاستضافة (Demo Hosting)
        </h2>
        <p className="text-xs text-gray-500 font-mono">CI/CD DEPLOYMENT ENGINE — DOCKER & NGINX PROXIES</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Deployment Wizard */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-2.5 flex items-center gap-2">
              <Upload className="h-4.5 w-4.5 text-[#c8a35c]" />
              رفع ونشر مشروع جديد
            </h3>

            <form onSubmit={triggerDeployment} className="space-y-4 text-right">
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">اسم المشروع (Subdomain)</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="مثال: morsall"
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">الرابط الناتج: https://vixcell.com/{projectName || 'name'}</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">إطار العمل (Framework)</label>
                <select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                >
                  {['Next.js', 'React', 'Vue', 'Nuxt', 'Static HTML'].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">حزمة الكود المصدري (.zip)</label>
                <label className="border border-dashed border-white/10 bg-[#0c0c0e] hover:bg-white/5 p-6 rounded-lg text-center cursor-pointer transition flex flex-col items-center justify-center gap-2">
                  <Upload className="h-6 w-6 text-[#c8a35c] animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">
                    {uploadedFile ? uploadedFile.name : 'اسحب ملف المشروع أو انقر هنا'}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">ZIP ARCHIVES UP TO 50MB</span>
                  <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                disabled={isBuilding || !projectName || !uploadedFile}
                className="w-full bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold py-2.5 rounded-lg text-sm hover:shadow-[0_0_15px_rgba(200,163,92,0.4)] transition-all disabled:opacity-20 flex items-center justify-center gap-1.5"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>بدء البناء والنشر التلقائي</span>
              </button>
            </form>
          </div>

          {/* Infrastructure Health Stats */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 p-4 rounded-xl backdrop-blur-xl space-y-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">حالة الخادم وحاويات Docker</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-[#0c0c0e] p-2.5 rounded border border-white/5">
                <span className="text-green-500 font-semibold font-mono">Running (3 Container)</span>
                <span className="text-gray-400">حالة Docker Engine:</span>
              </div>
              <div className="flex justify-between items-center bg-[#0c0c0e] p-2.5 rounded border border-white/5">
                <span className="text-green-500 font-semibold font-mono">Active (Port 80/443)</span>
                <span className="text-gray-400">بوابة Nginx Proxy:</span>
              </div>
              <div className="flex justify-between items-center bg-[#0c0c0e] p-2.5 rounded border border-white/5">
                <span className="text-white font-semibold font-mono">4.1% CPU / 1.8GB RAM</span>
                <span className="text-gray-400">استهلاك الموارد:</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Deployment List & Console Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Logs Console */}
          {currentBuildLogs.length > 0 && (
            <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-xs flex flex-col justify-between h-64 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2.5 opacity-10">
                <Terminal className="h-16 w-16 text-[#c8a35c]" />
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-[#c8a35c]" />
                  CICD BUILD ENGINE PIPELINE
                </span>
                {isBuilding ? (
                  <span className="text-yellow-500 animate-pulse">BUILDING...</span>
                ) : (
                  <span className="text-green-500">FINISHED</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 text-left scrollbar-thin">
                {currentBuildLogs.map((log, i) => (
                  <div key={i} className="text-gray-300">
                    &gt; {log}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>
          )}

          {/* Deployment list */}
          <div className="bg-[#0a0a0d]/80 border border-white/5 rounded-xl p-5 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3 block">
              سجل النشرات والإصدارات الفعالة
            </h3>

            <div className="space-y-4">
              {deployments.map((dep) => (
                <div
                  key={dep.id}
                  className="bg-[#0c0c0e] border border-white/5 hover:border-white/10 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1 text-right md:text-right flex-1">
                    <div className="flex items-center gap-2 justify-end md:justify-start">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        dep.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        dep.status === 'Building' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' :
                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {dep.status === 'Active' ? 'نشط (Live)' : dep.status === 'Building' ? 'جاري البناء' : 'مستبدل (Old)'}
                      </span>
                      <h4 className="text-sm font-bold text-white">{dep.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400">إطار العمل: <span className="text-gray-300 font-semibold">{dep.framework}</span> • الإصدار: <span className="font-mono text-yellow-500">{dep.version}</span></p>
                    
                    <div className="flex items-center gap-2 justify-end md:justify-start text-[11px] font-mono text-gray-500 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        <a href={dep.url} target="_blank" rel="noreferrer" className="hover:text-white underline">{dep.url}</a>
                      </span>
                      {dep.customDomain && (
                        <span className="flex items-center gap-1 text-[#c8a35c] border-l border-white/5 pl-2 ml-2">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <a href={`https://${dep.customDomain}`} target="_blank" rel="noreferrer" className="hover:underline font-bold">https://{dep.customDomain}</a>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2.5 justify-end">
                    {dep.status === 'Superseded' && (
                      <button
                        onClick={() => handleRollback(dep.id)}
                        className="bg-[#c8a35c]/10 hover:bg-[#c8a35c]/20 border border-[#c8a35c]/20 text-[#c8a35c] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Rollback to this version"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>تراجع (Rollback)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setTargetDeployId(dep.id)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      <span>ربط نطاق</span>
                    </button>

                    <button
                      onClick={() => handleDelete(dep.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                      title="Delete deployment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Custom Domain mapping Modal */}
      {targetDeployId && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50 animate-fade-in font-sans">
          <div className="bg-[#0a0a0d] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-sm font-bold text-white">ربط نطاق مخصص (Custom Domain)</span>
              <button onClick={() => setTargetDeployId(null)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-right">
              <p className="text-xs text-gray-400 leading-relaxed">
                يرجى إضافة سجل CNAME في لوحة التحكم الخاصة بنطاقك يشير إلى: <code className="bg-[#0c0c0e] px-1 py-0.5 rounded font-mono text-[#c8a35c]">vixcell-host.com</code>
              </p>
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">رابط النطاق الخاص بك</label>
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="morsall.app"
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTargetDeployId(null)}
                className="w-1/3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold border border-white/10"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleApplyCustomDomain(targetDeployId)}
                className="flex-1 py-2 bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold rounded-lg text-xs"
              >
                تحديث وحفظ النطاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
