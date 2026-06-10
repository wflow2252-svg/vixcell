import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { crmAPI, leadsAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface Deal {
  id: string
  title: string
  amount: number
  stage: string
  probability: number
  lead_id?: string
  lead_name?: string
  assignee_name?: string
}

const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']

const STAGE_META: Record<string, { ar: string; color: string; icon: string }> = {
  Discovery:   { ar: 'استكشاف',  color: '#6366f1', icon: 'search' },
  Proposal:    { ar: 'عرض سعر',  color: '#8b5cf6', icon: 'description' },
  Negotiation: { ar: 'تفاوض',    color: '#a855f7', icon: 'forum' },
  Won:         { ar: 'مكسوبة',   color: '#10b981', icon: 'check_circle' },
  Lost:        { ar: 'خاسرة',    color: '#64748b', icon: 'cancel' },
}

export default function CRMPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [deals, setDeals] = useState<Deal[]>([])
  const [pipeline, setPipeline] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leadOptions, setLeadOptions] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ title: '', amount: '', stage: 'Discovery', probability: '50', lead_id: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dealsRes, pipeRes] = await Promise.all([crmAPI.deals(), crmAPI.pipeline()])
      setDeals(dealsRes.data)
      setPipeline(pipeRes.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to load CRM data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = async () => {
    setForm({ title: '', amount: '', stage: 'Discovery', probability: '50', lead_id: '' })
    setModalOpen(true)
    try {
      const res = await leadsAPI.list({ page_size: 100 })
      setLeadOptions(res.data.items.map((l: any) => ({ id: l.id, name: l.name })))
    } catch { /* lead linking is optional */ }
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title is required'); return }
    setSaving(true)
    try {
      await crmAPI.createDeal({
        title: form.title.trim(),
        amount: form.amount ? parseFloat(form.amount) : 0,
        stage: form.stage,
        probability: parseInt(form.probability) || 0,
        lead_id: form.lead_id || null,
      })
      toast.success(isAr ? 'تمت إضافة الصفقة' : 'Deal created')
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const moveStage = async (deal: Deal, dir: 1 | -1) => {
    const idx = STAGES.indexOf(deal.stage)
    const next = STAGES[idx + dir]
    if (!next) return
    try {
      await crmAPI.updateDeal(deal.id, { stage: next })
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Update failed')
    }
  }

  const remove = async (deal: Deal) => {
    if (!confirm(isAr ? `حذف صفقة "${deal.title}"؟` : `Delete deal "${deal.title}"?`)) return
    try {
      await crmAPI.deleteDeal(deal.id)
      toast.success(isAr ? 'تم الحذف' : 'Deal deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Delete failed')
    }
  }

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'إدارة العلاقات والمبيعات' : 'CRM & Sales Pipeline'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? 'تابع صفقاتك عبر مراحل البيع' : 'Track your deals across sales stages'}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Icon name="add" size={18} />{isAr ? 'صفقة جديدة' : 'New Deal'}
        </button>
      </div>

      {/* Pipeline value summary */}
      {pipeline && (
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Icon name="work" size={16} className="text-brand-400" />
              {isAr ? 'قيمة الصفقات المفتوحة' : 'Open Pipeline Value'}
            </div>
            <p className="text-2xl font-bold text-white">{fmtMoney(pipeline.open_value)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Icon name="emoji_events" size={16} className="text-emerald-400" />
              {isAr ? 'إجمالي المكسوب' : 'Total Won'}
            </div>
            <p className="text-2xl font-bold text-emerald-400">{fmtMoney(pipeline.won_value)}</p>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
          <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
          {isAr ? 'جارٍ التحميل...' : 'Loading...'}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3 items-start">
          {STAGES.map(stage => {
            const meta = STAGE_META[stage]
            const stageDeals = deals.filter(d => d.stage === stage)
            const stageValue = stageDeals.reduce((s, d) => s + Number(d.amount || 0), 0)
            return (
              <div key={stage} className="glass-card p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon name={meta.icon} size={16} className="text-slate-300" />
                    <span className="text-xs font-semibold text-white">{isAr ? meta.ar : stage}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: `${meta.color}22`, color: meta.color }}>
                    {stageDeals.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{fmtMoney(stageValue)}</p>

                <div className="space-y-2">
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="bg-surface-800 border border-line rounded-lg p-3 group">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-white leading-snug">{deal.title}</p>
                        <button onClick={() => remove(deal)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity flex-shrink-0">
                          <Icon name="delete" size={14} />
                        </button>
                      </div>
                      {deal.lead_name && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Icon name="person" size={12} />{deal.lead_name}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{fmtMoney(Number(deal.amount || 0))}</span>
                        <span className="text-xs text-slate-500">{deal.probability}%</span>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t border-line-soft">
                        <button onClick={() => moveStage(deal, -1)} disabled={STAGES.indexOf(deal.stage) === 0}
                          className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20">
                          <Icon name={isAr ? 'arrow_forward' : 'arrow_back'} size={15} />
                        </button>
                        <button onClick={() => moveStage(deal, 1)} disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
                          className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20">
                          <Icon name={isAr ? 'arrow_back' : 'arrow_forward'} size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="border border-dashed border-line rounded-lg py-6 text-center text-xs text-slate-600">
                      {isAr ? 'لا صفقات' : 'No deals'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New deal modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalOpen(false)}>
          <div className="glass-card w-full max-w-md p-6 shadow-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{isAr ? 'صفقة جديدة' : 'New Deal'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'عنوان الصفقة *' : 'Deal Title *'}</label>
                <input className="input-field" value={form.title} onChange={e => setF('title', e.target.value)} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'القيمة ($)' : 'Amount ($)'}</label>
                  <input className="input-field" dir="ltr" type="number" min="0" value={form.amount} onChange={e => setF('amount', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'الاحتمالية %' : 'Probability %'}</label>
                  <input className="input-field" dir="ltr" type="number" min="0" max="100" value={form.probability} onChange={e => setF('probability', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'المرحلة' : 'Stage'}</label>
                <select className="input-field" value={form.stage} onChange={e => setF('stage', e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{isAr ? STAGE_META[s].ar : s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'مرتبطة بعميل (اختياري)' : 'Linked Lead (optional)'}</label>
                <select className="input-field" value={form.lead_id} onChange={e => setF('lead_id', e.target.value)}>
                  <option value="">{isAr ? '— بدون —' : '— None —'}</option>
                  {leadOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} className="btn-ghost text-sm">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isAr ? 'إضافة' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
