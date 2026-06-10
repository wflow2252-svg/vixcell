import { useState } from 'react'
import { Plus, Play, Pause, GitBranch, Zap, Users, Mail, MessageSquare, CheckCircle } from 'lucide-react'

const flows = [
  { id:1, name:'New Lead → CRM + Email',     trigger:'Lead Added',         steps:4, status:'Active',   runs:284, lastRun:'2m ago' },
  { id:2, name:'Deal Won → Invoice Email',   trigger:'Deal Status: Won',   steps:3, status:'Active',   runs:54,  lastRun:'1h ago' },
  { id:3, name:'WhatsApp → Auto Reply',      trigger:'WhatsApp Message',   steps:2, status:'Active',   runs:1842, lastRun:'30s ago' },
  { id:4, name:'Weekly Report Generator',    trigger:'Every Monday 8AM',   steps:5, status:'Active',   runs:12,  lastRun:'3d ago' },
  { id:5, name:'Lead Score Updater',         trigger:'Lead Interaction',   steps:3, status:'Paused',   runs:0,   lastRun:'never' },
]

const nodeTypes = [
  { icon:'🎯', label:'Trigger',      color:'border-blue-500/40' },
  { icon:'⚙️', label:'Action',       color:'border-purple-500/40' },
  { icon:'🔀', label:'Condition',    color:'border-amber-500/40' },
  { icon:'📧', label:'Send Email',   color:'border-emerald-500/40' },
  { icon:'💬', label:'Send Message', color:'border-pink-500/40' },
  { icon:'⏱️', label:'Wait/Delay',   color:'border-slate-500/40' },
]

export default function FlowBuilderPage() {
  const [activeTab, setActiveTab] = useState<'list'|'builder'>('list')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Flow Builder — Automation</h1>
          <p className="text-slate-400 text-sm mt-1">Build visual automation workflows without code</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border border-surface-500">
            <button onClick={() => setActiveTab('list')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab==='list'?'bg-brand-500 text-white':'text-slate-400 hover:text-white'}`}>My Flows</button>
            <button onClick={() => setActiveTab('builder')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab==='builder'?'bg-brand-500 text-white':'text-slate-400 hover:text-white'}`}>Builder</button>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={15}/>New Flow</button>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label:'Active Flows', value:'4', color:'text-emerald-400' },
              { label:'Total Executions', value:'2,192', color:'text-brand-400' },
              { label:'Success Rate', value:'98.7%', color:'text-emerald-400' },
              { label:'Time Saved', value:'142h/mo', color:'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Flows Table */}
          <div className="glass-card overflow-hidden">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Flow Name</th><th>Trigger</th><th>Steps</th><th>Status</th><th>Runs</th><th>Last Run</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.map(flow => (
                    <tr key={flow.id}>
                      <td className="font-medium text-white flex items-center gap-2"><GitBranch size={14} className="text-brand-400"/>{flow.name}</td>
                      <td><span className="badge badge-blue">{flow.trigger}</span></td>
                      <td className="text-center">{flow.steps}</td>
                      <td>
                        <span className={flow.status==='Active'?'badge-green':'badge-yellow'}>
                          {flow.status}
                        </span>
                      </td>
                      <td className="font-medium text-white">{flow.runs.toLocaleString()}</td>
                      <td className="text-slate-400">{flow.lastRun}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="px-2 py-1 rounded text-xs bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">Edit</button>
                          <button className={`px-2 py-1 rounded text-xs transition-colors ${flow.status==='Active'?'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20':'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                            {flow.status==='Active'?'Pause':'Resume'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'builder' && (
        <div className="glass-card p-0 overflow-hidden" style={{ height:'60vh' }}>
          <div className="flex h-full">
            {/* Node palette */}
            <div className="w-48 border-r border-brand-500/10 p-3 space-y-2 flex-shrink-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">Nodes</p>
              {nodeTypes.map(({ icon, label, color }) => (
                <div key={label} className={`flex items-center gap-2 p-2.5 rounded-lg border ${color} bg-surface-700/50 cursor-grab hover:scale-105 transition-all text-xs font-medium text-slate-300`}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>
            {/* Canvas */}
            <div className="flex-1 relative bg-surface-900/50" style={{
              backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto">
                    <GitBranch size={24} className="text-brand-400" />
                  </div>
                  <p className="text-slate-400 text-sm">Drag nodes from the left panel to start building your flow</p>
                  <button className="btn-primary text-sm flex items-center gap-2 mx-auto">
                    <Zap size={14}/> Load Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
