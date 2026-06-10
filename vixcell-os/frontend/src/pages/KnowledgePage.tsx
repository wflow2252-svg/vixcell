import { useState } from 'react'
import { Plus, Search, BookOpen, FileText, Upload, Brain } from 'lucide-react'

const docs = [
  { id:1, title:'Company Product Catalog 2026',    category:'Products',   chunks:142, status:'Indexed',     updated:'2026-06-01' },
  { id:2, title:'Sales FAQ & Objection Handling',  category:'Sales',      chunks:87,  status:'Indexed',     updated:'2026-05-28' },
  { id:3, title:'Customer Support Playbook',       category:'Support',    chunks:213, status:'Indexed',     updated:'2026-06-05' },
  { id:4, title:'Pricing Guide Q3 2026',           category:'Finance',    chunks:54,  status:'Processing',  updated:'2026-06-10' },
  { id:5, title:'Brand Voice & Style Guide',       category:'Marketing',  chunks:98,  status:'Indexed',     updated:'2026-05-20' },
]

export default function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')

  const ask = () => {
    if (!query.trim()) return
    setAnswer(`Based on your knowledge base:\n\n"${query}"\n\nAccording to your Customer Support Playbook and Product Catalog, the recommended approach is to first acknowledge the customer's concern, then provide 2-3 specific product benefits that address their needs, and offer a free trial or demo. For pricing queries, refer them to the Q3 2026 Pricing Guide.\n\n📚 Sources: Customer Support Playbook (pg 14), Product Catalog (pg 8)`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base (RAG)</h1>
          <p className="text-slate-400 text-sm mt-1">Train your AI on company documents for accurate responses</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2 text-sm"><Upload size={15}/>Upload Document</button>
          <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={15}/>Add Source</button>
        </div>
      </div>

      {/* RAG Query Test */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Brain size={15} className="text-brand-400"/> Test Your AI Knowledge Base
        </h3>
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Ask anything about your company, products, pricing..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
          />
          <button onClick={ask} className="btn-primary flex items-center gap-2 text-sm px-6">
            <Search size={14}/>Ask AI
          </button>
        </div>
        {answer && (
          <div className="mt-4 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-brand-400" />
              <span className="text-xs font-medium text-brand-300">AI Answer (RAG)</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{answer}</p>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-brand-500/10">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen size={15} className="text-brand-400"/> Indexed Documents
          </h3>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th><th>Category</th><th>Chunks</th><th>Status</th><th>Last Updated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-brand-400 flex-shrink-0" />
                      <span className="font-medium text-white">{doc.title}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{doc.category}</span></td>
                  <td className="text-slate-300">{doc.chunks} chunks</td>
                  <td>
                    <span className={doc.status === 'Indexed' ? 'badge-green' : 'badge-yellow'}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="text-slate-400">{doc.updated}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded text-xs bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">View</button>
                      <button className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
