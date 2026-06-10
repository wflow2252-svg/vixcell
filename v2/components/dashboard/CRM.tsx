'use client'

import React, { useState } from 'react'
import { Users, FileText, CheckCircle, Clock, Link2, DollarSign, Plus } from 'lucide-react'

interface ClientProfile {
  id: string
  name: string
  company: string
  meetingsCount: number
  invoicesCount: number
  projectsCount: number
  status: 'Active' | 'Lead' | 'Completed'
  invoices: Array<{ id: string, amount: string, status: string, date: string }>
  projects: Array<{ name: string, status: string }>
  timeline: Array<{ time: string, event: string }>
}

export default function CRM() {
  const [clients, setClients] = useState<ClientProfile[]>([
    {
      id: 'c1',
      name: 'أحمد محمد',
      company: 'شركة النور للمقاولات',
      meetingsCount: 12,
      invoicesCount: 3,
      projectsCount: 2,
      status: 'Active',
      invoices: [
        { id: 'INV-101', amount: '$1,200', status: 'Paid', date: '2026-05-15' },
        { id: 'INV-102', amount: '$850', status: 'Paid', date: '2026-06-01' },
        { id: 'INV-103', amount: '$1,500', status: 'Pending', date: '2026-06-09' }
      ],
      projects: [
        { name: 'تصميم الهوية والموقع التعريفي', status: 'Completed' },
        { name: 'بناء لوحة إدارة المبيعات المخصصة', status: 'In Progress' }
      ],
      timeline: [
        { time: '10:45 ص', event: 'تم الاتفاق على السعر النهائي وتوقيع العقد' },
        { time: '09:00 ص', event: 'انعقاد الاجتماع رقم 12 لمراجعة نماذج الصفحات' },
        { time: 'الأسبوع الماضي', event: 'إرسال فاتورة الدفعة الثانية وتجهيز الاستضافة' }
      ]
    },
    {
      id: 'c2',
      name: 'سارة خالد',
      company: 'متجر سارة للأزياء العصرية',
      meetingsCount: 5,
      invoicesCount: 1,
      projectsCount: 1,
      status: 'Lead',
      invoices: [
        { id: 'INV-098', amount: '$450', status: 'Paid', date: '2026-06-02' }
      ],
      projects: [
        { name: 'متجر Shopify مخصص مع بوابة دفع', status: 'In Progress' }
      ],
      timeline: [
        { time: 'أمس', event: 'بدء مشاركة الشرح ورفع ملفات الصور للمنتجات' },
        { time: '2026-06-02', event: 'دفع الفاتورة المبدئية لبدء حجز النطاق' }
      ]
    }
  ])

  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(clients[0])

  return (
    <div className="space-y-6 animate-fade-in text-[#e8e8ed]">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-[#c8a35c]" />
          إدارة العملاء والـ CRM المدمج
        </h2>
        <p className="text-xs text-gray-500 font-mono">CLIENT RELATIONS OS — LINK CLIENT RECORDS TO CALLS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Clients List */}
        <div className="space-y-4">
          <div className="bg-[#0a0a0d]/80 border border-white/5 p-4 rounded-xl backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-white">قائمة العملاء المسجلين</span>
              <button 
                onClick={() => {
                  const newClient: ClientProfile = {
                    id: `c-${Date.now()}`,
                    name: 'عميل جديد',
                    company: 'شركة جديدة',
                    meetingsCount: 1,
                    invoicesCount: 1,
                    projectsCount: 1,
                    status: 'Lead',
                    invoices: [],
                    projects: [],
                    timeline: [{ time: 'الآن', event: 'تمت إضافة العميل لقاعدة البيانات' }]
                  }
                  setClients([...clients, newClient])
                  setSelectedClient(newClient)
                }}
                className="text-xs bg-[#c8a35c]/10 hover:bg-[#c8a35c]/20 text-[#c8a35c] border border-[#c8a35c]/25 px-2.5 py-1 rounded-lg transition"
              >
                + عميل جديد
              </button>
            </div>

            <div className="space-y-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full text-right p-3.5 rounded-xl border transition-all ${
                    selectedClient?.id === client.id
                      ? 'bg-[#c8a35c]/10 border-[#c8a35c]/30 text-white'
                      : 'bg-[#0c0c0e]/80 border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <h4 className="text-sm font-bold">{client.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{client.company}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Selected Client Profile Details */}
        {selectedClient ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Header info card */}
            <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a35c] font-bold">Client profile file</span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedClient.name}</h3>
                <p className="text-xs text-gray-400">{selectedClient.company}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center font-mono">
                <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Meetings</p>
                  <h4 className="text-lg font-bold text-[#c8a35c]">{selectedClient.meetingsCount}</h4>
                </div>
                <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Invoices</p>
                  <h4 className="text-lg font-bold text-blue-400">{selectedClient.invoicesCount}</h4>
                </div>
                <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Projects</p>
                  <h4 className="text-lg font-bold text-emerald-400">{selectedClient.projectsCount}</h4>
                </div>
              </div>
            </div>

            {/* Invoices & Projects Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Projects */}
              <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <CheckCircle className="h-4 w-4 text-[#c8a35c]" />
                  المشاريع الفعالة
                </h4>
                {selectedClient.projects.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">لا توجد مشاريع مسجلة حالياً.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.projects.map((proj, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-[#0c0c0e] p-2.5 rounded-lg border border-white/5">
                        <span className="font-semibold text-white">{proj.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          proj.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#c8a35c]/10 text-[#c8a35c] border border-[#c8a35c]/20'
                        }`}>
                          {proj.status === 'Completed' ? 'منتهي' : 'قيد العمل'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <DollarSign className="h-4 w-4 text-[#c8a35c]" />
                  الفواتير والمعاملات المالية
                </h4>
                {selectedClient.invoices.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">لا توجد فواتير صادرة.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.invoices.map((inv, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-[#0c0c0e] p-2.5 rounded-lg border border-white/5 font-mono">
                        <div className="text-right">
                          <p className="font-semibold text-white">{inv.id}</p>
                          <p className="text-[10px] text-gray-500">{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{inv.amount}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            inv.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400 animate-pulse'
                          }`}>
                            {inv.status === 'Paid' ? 'تم الدفع' : 'معلق'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Client Activity Timeline */}
            <div className="bg-[#0a0a0d]/80 border border-white/5 p-5 rounded-xl backdrop-blur-xl">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Clock className="h-4 w-4 text-[#c8a35c]" />
                سجل النشاطات والجلسات
              </h4>

              <div className="space-y-4 relative pl-3.5 before:absolute before:left-3 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-white/5">
                {selectedClient.timeline.map((log, i) => (
                  <div key={i} className="relative flex gap-4 text-xs">
                    <span className="absolute left-[8px] top-1.5 h-2 w-2 rounded-full bg-[#c8a35c] shadow-[0_0_8px_#c8a35c]" />
                    <div className="flex-1 bg-[#0c0c0e] p-3 rounded-lg border border-white/5 text-right space-y-1">
                      <span className="text-[10px] text-gray-500 font-mono">{log.time}</span>
                      <p className="text-gray-300 font-medium">{log.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 text-center py-20 text-gray-500 font-mono">
            الرجاء تحديد عميل لعرض الملف.
          </div>
        )}
      </div>
    </div>
  )
}
