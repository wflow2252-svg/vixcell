import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Eye } from 'lucide-react'

const weeklyData = [
  { day:'Mon', leads:12, revenue:4200, reach:2100, conversions:3 },
  { day:'Tue', leads:19, revenue:6800, reach:3400, conversions:5 },
  { day:'Wed', leads:15, revenue:5100, reach:2800, conversions:4 },
  { day:'Thu', leads:28, revenue:9200, reach:5100, conversions:8 },
  { day:'Fri', leads:22, revenue:7800, reach:4200, conversions:6 },
  { day:'Sat', leads:31, revenue:11200, reach:6500, conversions:10 },
  { day:'Sun', leads:18, revenue:6400, reach:3800, conversions:5 },
]

const TOOLTIP_STYLE = {
  contentStyle: { background:'#1a1a35', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, fontSize:12 },
  labelStyle:{ color:'#94a3b8' }, itemStyle:{ color:'#e2e8f0' },
}

const metrics = [
  { label:'Total Leads (30d)',  value:'1,284', change:'+12.5%', up:true,  icon:Users,      color:'text-blue-400',    bg:'bg-blue-500/10' },
  { label:'Revenue (30d)',      value:'$86K',  change:'+8.2%',  up:true,  icon:DollarSign, color:'text-emerald-400', bg:'bg-emerald-500/10' },
  { label:'Conversion Rate',    value:'6.8%',  change:'+1.2%',  up:true,  icon:Target,     color:'text-brand-400',   bg:'bg-brand-500/10' },
  { label:'Total Reach',        value:'142K',  change:'-2.1%',  up:false, icon:Eye,        color:'text-amber-400',   bg:'bg-amber-500/10' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Deep insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          {['7d','30d','90d','1y'].map(r => (
            <button key={r} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${r==='30d'?'bg-brand-500 text-white':'text-slate-400 hover:text-white hover:bg-surface-600'}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(({ label, value, change, up, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${up?'text-emerald-400':'text-red-400'}`}>
                {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}{change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue & Leads (This Week)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="leadG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
              <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#6366f1" strokeWidth={2} fill="url(#revG)" />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#10b981" strokeWidth={2} fill="url(#leadG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Reach & Conversions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barSize={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
              <Bar dataKey="reach" name="Reach" fill="#8b5cf6" radius={[4,4,0,0]} />
              <Bar dataKey="conversions" name="Conversions" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h3>
        <div className="flex items-center gap-2">
          {[
            { label:'Website Visits', value:12400, pct:100, color:'bg-brand-600' },
            { label:'Lead Captured',  value:1284,  pct:10.4, color:'bg-purple-500' },
            { label:'Qualified Leads',value:542,   pct:4.4,  color:'bg-blue-500' },
            { label:'Proposals Sent', value:124,   pct:1.0,  color:'bg-amber-500' },
            { label:'Deals Won',      value:54,    pct:0.4,  color:'bg-emerald-500' },
          ].map(({ label, value, pct, color }, i, arr) => (
            <div key={label} className="flex-1 text-center">
              <div
                className={`${color} rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto transition-all`}
                style={{ height: `${Math.max(pct/arr[0].pct * 100, 20)}px`, minHeight: 32 }}
              >
                {value.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-2">{label}</p>
              <p className="text-xs text-slate-500">{pct}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
