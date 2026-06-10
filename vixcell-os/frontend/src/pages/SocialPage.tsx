import { useState } from 'react'
import { Calendar, Clock, PenSquare, Plus, Share2, ThumbsUp, Eye, MessageCircle } from 'lucide-react'

const platforms = [
  { id:'fb',  name:'Facebook',  color:'#1877f2', icon:'f' },
  { id:'ig',  name:'Instagram', color:'#e1306c', icon:'📷' },
  { id:'li',  name:'LinkedIn',  color:'#0077b5', icon:'in' },
  { id:'tw',  name:'Twitter/X', color:'#000000', icon:'𝕏' },
  { id:'tg',  name:'Telegram',  color:'#0088cc', icon:'✈' },
  { id:'wa',  name:'WhatsApp',  color:'#25d366', icon:'💬' },
]

const scheduledPosts = [
  { id:1, platform:'fb', content:'🚀 We\'re excited to announce our new product launch...', scheduledAt:'2026-06-10 10:00', status:'Scheduled', reach:1200 },
  { id:2, platform:'ig', content:'✨ Behind the scenes at our Cairo workshop...', scheduledAt:'2026-06-10 14:00', status:'Scheduled', reach:800 },
  { id:3, platform:'li', content:'💼 Why Egyptian SMEs need AI-powered marketing tools...', scheduledAt:'2026-06-11 09:00', status:'Draft', reach:0 },
  { id:4, platform:'fb', content:'🎉 Customer spotlight: Cairo Coffee House increased...', scheduledAt:'2026-06-09 12:00', status:'Published', reach:3400 },
]

export default function SocialPage() {
  const [postText, setPostText] = useState('')
  const [selected, setSelected] = useState<string[]>(['fb','ig'])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Media Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Create, schedule, and track posts across all platforms</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={15}/>New Campaign</button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-6 gap-3">
        {platforms.map(p => (
          <div key={p.id} className="glass-card p-3 text-center hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold text-white" style={{ background: p.color }}>
              {p.icon}
            </div>
            <p className="text-xs text-slate-400">{p.name}</p>
            <p className="text-sm font-bold text-white mt-1">{Math.floor(Math.random()*10+2)}K</p>
            <p className="text-xs text-emerald-400">+{Math.floor(Math.random()*15+1)}%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Post Composer */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PenSquare size={15} className="text-brand-400"/> AI Post Composer
          </h3>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Select Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(s => s.includes(p.id) ? s.filter(x=>x!==p.id) : [...s, p.id])}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    selected.includes(p.id)
                      ? 'text-white border-brand-500/60 bg-brand-500/20'
                      : 'text-slate-400 border-surface-500 hover:border-brand-500/40'
                  }`}
                >{p.name}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Post Content</label>
            <textarea
              className="input-field min-h-32 resize-none text-sm"
              placeholder="Write your post or click AI Generate..."
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
          </div>
          <button className="w-full py-2 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors flex items-center justify-center gap-2">
            ✨ AI Generate (GPT-4)
          </button>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1"><Calendar size={11}/>Schedule Date</label>
              <input type="datetime-local" className="input-field text-xs" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1"><Clock size={11}/>Best Time</label>
              <select className="input-field text-xs">
                <option>Auto (AI Recommended)</option>
                <option>Morning (9:00 AM)</option>
                <option>Noon (12:00 PM)</option>
                <option>Evening (7:00 PM)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-sm">Save Draft</button>
            <button className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5"><Share2 size={13}/>Publish Now</button>
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-brand-400"/> Scheduled Posts
          </h3>
          <div className="space-y-3">
            {scheduledPosts.map(post => {
              const plat = platforms.find(p=>p.id===post.platform)
              const statusColor = post.status==='Published'?'badge-green':post.status==='Scheduled'?'badge-blue':'badge-yellow'
              return (
                <div key={post.id} className="p-3 rounded-xl bg-surface-700/50 border border-brand-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: plat?.color }}>
                        {plat?.icon}
                      </div>
                      <span className="text-xs text-slate-400">{plat?.name}</span>
                    </div>
                    <span className={statusColor}>{post.status}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{post.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1"><Clock size={10}/>{post.scheduledAt}</div>
                    {post.reach > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Eye size={10}/>{post.reach.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
