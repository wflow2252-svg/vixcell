'use client'

import React, { useState } from 'react'
import { Link2, Plus, ExternalLink, Trash2, Folder, Globe } from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  url: string
  github?: string
  status: 'In Progress' | 'Completed' | 'Maintenance'
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'موقع شركة عقارات الخليج', client: 'عقارات الخليج', url: 'https://khalij-realestate.vixcell.app', github: 'https://github.com/vixcell/khalij-re', status: 'Completed' },
    { id: 'p2', name: 'منصة التدريب الشخصي الكابتن علي', client: 'كابتن علي', url: 'https://coach-ali.vixcell.app', status: 'In Progress' },
    { id: 'p3', name: 'متجر الأزياء العصرية المطور', client: 'أزياء دبي', url: 'https://dubai-fashion.vixcell.app', github: 'https://github.com/vixcell/dubai-fash', status: 'Maintenance' }
  ])

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [url, setUrl] = useState('')
  const [github, setGithub] = useState('')
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'Maintenance'>('In Progress')

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !url) return
    
    const newProj: Project = {
      id: `p-${Date.now()}`,
      name,
      client: client || 'عميل مجهول',
      url,
      github: github || undefined,
      status
    }
    setProjects([...projects, newProj])
    
    // Reset form
    setName('')
    setClient('')
    setUrl('')
    setGithub('')
    setStatus('In Progress')
  }

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#e8e8ed]">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Folder className="h-6 w-6 text-[#c8a35c]" />
          إدارة المشاريع والروابط
        </h2>
        <p className="text-xs text-gray-500 font-mono">PROJECTS & LINKS CURATOR — MANAGE CLIENT BUILDS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Project Form */}
        <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl h-fit">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2.5 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#c8a35c]" />
            إضافة مشروع جديد
          </h3>

          <form onSubmit={handleAddProject} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">اسم المشروع</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: متجر الإلكترونيات"
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">اسم العميل</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="مثال: شركة النور"
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">رابط المعاينة المباشر (URL)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">رابط كود المشروع (GitHub - اختياري)</label>
              <div className="relative">
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#c8a35c] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">حالة التطوير</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c8a35c]"
              >
                <option value="In Progress">قيد التنفيذ (In Progress)</option>
                <option value="Completed">مكتمل (Completed)</option>
                <option value="Maintenance">صيانة (Maintenance)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c8a35c] to-[#e5c07b] text-[#0c0c0e] font-bold py-2.5 rounded-lg text-sm hover:shadow-[0_0_15px_rgba(200,163,92,0.4)] transition-all"
            >
              إضافة المشروع
            </button>
          </form>
        </div>

        {/* Right: Projects Grid */}
        <div className="lg:col-span-2 space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#0a0a0d]/80 border border-white/5 hover:border-white/10 p-5 rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-base font-bold text-white group-hover:text-[#c8a35c] transition-colors">{project.name}</h4>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    project.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    project.status === 'In Progress' ? 'bg-[#c8a35c]/10 text-[#c8a35c] border-[#c8a35c]/20' :
                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>
                    {project.status === 'Completed' ? 'مكتمل' : project.status === 'In Progress' ? 'جاري العمل' : 'صيانة'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">العميل: <span className="text-gray-300 font-semibold">{project.client}</span></p>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    <a href={project.url} target="_blank" rel="noreferrer" className="hover:text-white underline truncate max-w-xs">{project.url}</a>
                  </span>
                  {project.github && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                      <a href={project.github} target="_blank" rel="noreferrer" className="hover:text-white underline truncate max-w-xs">{project.github}</a>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all"
                  title="فتح الرابط"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 p-2.5 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                  title="حذف المشروع"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-20 text-gray-500 font-mono border border-dashed border-white/5 rounded-xl">
              لا توجد مشاريع مضافة حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
