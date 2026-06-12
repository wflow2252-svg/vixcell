import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { leadsAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  rating?: number
  review_count?: number
  lead_score: number
  category?: string
  status?: string
  source?: string
  notes?: string
}

interface Candidate {
  name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  osm_type?: string
  already_exists?: boolean
}

const CATEGORY_BADGE: Record<string, string> = {
  Hot: 'badge-red', Warm: 'badge-yellow', Cold: 'badge-blue',
}

const EMPTY_FORM = {
  name: '', phone: '', email: '', website: '', address: '',
  rating: '', source: '', notes: '', status: 'new',
}

export default function LeadsPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Find-leads (discovery) dialog
  const [searchParams, setSearchParams] = useSearchParams()
  const [findOpen, setFindOpen] = useState(false)
  const [findForm, setFindForm] = useState({ what: '', where: '' })
  const [finding, setFinding] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsAPI.list({
        search: search || undefined,
        category: category === 'All' ? undefined : category,
        page_size: 100,
      })
      setLeads(res.data.items)
      setTotal(res.data.total)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  // Voice assistant deep-links: /leads?search=... and /leads?find=1&what=...
  useEffect(() => {
    const q = searchParams.get('search')
    const wantFind = searchParams.get('find') === '1'
    if (q) setSearch(q)
    if (wantFind) {
      setFindForm(f => ({ ...f, what: searchParams.get('what') || f.what }))
      setCandidates(null)
      setFindOpen(true)
    }
    if (q || wantFind) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const runDiscover = async () => {
    if (!findForm.what.trim() || !findForm.where.trim()) {
      toast.error(isAr ? 'اكتب نوع النشاط والمكان' : 'Enter business type and area')
      return
    }
    setFinding(true)
    setCandidates(null)
    try {
      const res = await leadsAPI.discover({ what: findForm.what.trim(), where: findForm.where.trim(), limit: 30 })
      const items: Candidate[] = res.data.items
      setCandidates(items)
      // preselect everything new — one click to import the lot
      setPicked(new Set(items.map((_, i) => i).filter(i => !items[i].already_exists)))
      if (!items.length) toast(isAr ? 'ملقناش نتايج — جرب كلمات تانية' : 'No results — try different terms')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل البحث — اتأكد من الإنترنت' : 'Search failed — check internet'))
    } finally {
      setFinding(false)
    }
  }

  const runImport = async () => {
    if (!candidates) return
    const items = candidates.filter((_, i) => picked.has(i))
    if (!items.length) { toast.error(isAr ? 'اختار عميل واحد على الأقل' : 'Pick at least one'); return }
    setImporting(true)
    try {
      const res = await leadsAPI.discoverImport(items)
      toast.success(isAr
        ? `تم استيراد ${res.data.imported} عميل${res.data.skipped ? ` (${res.data.skipped} مكرر)` : ''}`
        : `Imported ${res.data.imported} leads${res.data.skipped ? ` (${res.data.skipped} duplicates)` : ''}`)
      setFindOpen(false)
      setCandidates(null)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const togglePick = (i: number) =>
    setPicked(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setModalOpen(true)
  }

  const openEdit = (lead: Lead) => {
    setEditing(lead)
    setForm({
      name: lead.name, phone: lead.phone || '', email: lead.email || '',
      website: lead.website || '', address: lead.address || '',
      rating: lead.rating != null ? String(lead.rating) : '',
      source: lead.source || '', notes: lead.notes || '', status: lead.status || 'new',
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error(isAr ? 'الاسم مطلوب' : 'Name is required'); return }
    setSaving(true)
    const payload: any = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      address: form.address || null,
      rating: form.rating ? parseFloat(form.rating) : null,
      source: form.source || null,
      notes: form.notes || null,
      status: form.status,
    }
    try {
      if (editing) {
        await leadsAPI.update(editing.id, payload)
        toast.success(isAr ? 'تم تحديث العميل' : 'Lead updated')
      } else {
        await leadsAPI.create(payload)
        toast.success(isAr ? 'تمت إضافة العميل' : 'Lead added')
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (lead: Lead) => {
    if (!confirm(isAr ? `حذف "${lead.name}"؟` : `Delete "${lead.name}"?`)) return
    try {
      await leadsAPI.delete(lead.id)
      toast.success(isAr ? 'تم الحذف' : 'Lead deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Delete failed')
    }
  }

  const exportCsv = async () => {
    try {
      const res = await leadsAPI.exportCsv()
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'vixcell_leads.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success(isAr ? 'تم تصدير الملف' : 'CSV exported')
    } catch {
      toast.error(isAr ? 'فشل التصدير' : 'Export failed')
    }
  }

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'العملاء المحتملون' : 'Lead Generation'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? 'ابحث عن عملاء جدد وقيّمهم وتابعهم' : 'Find, score, and manage potential clients'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-ghost flex items-center gap-2 text-sm">
            <Icon name="download" size={18} />{isAr ? 'تصدير' : 'Export'}
          </button>
          <button onClick={() => { setCandidates(null); setFindOpen(true) }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Icon name="travel_explore" size={18} />{isAr ? 'البحث عن عملاء' : 'Find Leads'}
          </button>
          <button onClick={openCreate} className="btn-ghost flex items-center gap-2 text-sm">
            <Icon name="add" size={18} />{isAr ? 'إضافة عميل' : 'Add Lead'}
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line gap-3 flex-wrap">
          <div className="relative">
            <Icon name="search" size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-field ps-9 w-64 py-1.5 text-xs"
              placeholder={isAr ? 'ابحث عن عميل...' : 'Search leads...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {['All', 'Hot', 'Warm', 'Cold'].map(c => (
              <button key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  category === c ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white hover:bg-surface-600'
                }`}
              >{c === 'All' && isAr ? 'الكل' : c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
            {isAr ? 'جارٍ التحميل...' : 'Loading...'}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-600 flex items-center justify-center">
              <Icon name="person_search" size={28} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">{isAr ? 'لا يوجد عملاء بعد' : 'No leads yet'}</p>
            <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
              <Icon name="add" size={16} />{isAr ? 'أضف أول عميل' : 'Add your first lead'}
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'اسم النشاط' : 'Business Name'}</th>
                  <th>{isAr ? 'التواصل' : 'Contact'}</th>
                  <th>{isAr ? 'الموقع' : 'Location'}</th>
                  <th>{isAr ? 'التقييم' : 'Rating'}</th>
                  <th>{isAr ? 'النقاط' : 'Score'}</th>
                  <th>{isAr ? 'التصنيف' : 'Category'}</th>
                  <th>{isAr ? 'المصدر' : 'Source'}</th>
                  <th>{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td className="font-medium text-white">{lead.name}</td>
                    <td>
                      <div className="flex flex-col gap-0.5 text-xs">
                        {lead.phone && <span className="flex items-center gap-1"><Icon name="call" size={13} />{lead.phone}</span>}
                        {lead.email && <span className="flex items-center gap-1 text-slate-400"><Icon name="mail" size={13} />{lead.email}</span>}
                        {!lead.phone && !lead.email && <span className="text-slate-600">—</span>}
                      </div>
                    </td>
                    <td className="text-xs">
                      {lead.address
                        ? <span className="flex items-center gap-1"><Icon name="location_on" size={13} />{lead.address}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      {lead.rating != null
                        ? <span className="flex items-center gap-1 text-xs">
                            <Icon name="star" size={14} filled className="text-amber-400" />{Number(lead.rating).toFixed(1)}
                          </span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-500 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${lead.lead_score}%` }} />
                        </div>
                        <span className="text-xs font-medium text-white">{lead.lead_score}</span>
                      </div>
                    </td>
                    <td><span className={CATEGORY_BADGE[lead.category || ''] || 'badge-blue'}>{lead.category || '—'}</span></td>
                    <td>{lead.source ? <span className="badge badge-purple">{lead.source}</span> : <span className="text-slate-600 text-xs">—</span>}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(lead)} title={isAr ? 'تعديل' : 'Edit'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 transition-colors">
                          <Icon name="edit" size={16} />
                        </button>
                        <button onClick={() => remove(lead)} title={isAr ? 'حذف' : 'Delete'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-600 transition-colors">
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-line text-xs text-slate-500">
          {isAr ? `إجمالي ${total} عميل` : `${total} leads total`}
        </div>
      </div>

      {/* Find Leads (discovery) modal */}
      {findOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !importing && setFindOpen(false)}>
          <div className="glass-card w-full max-w-2xl p-6 shadow-pop max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Icon name="travel_explore" size={20} className="text-brand-400" />
                  {isAr ? 'البحث عن عملاء جدد' : 'Find New Leads'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'بيانات حقيقية من الخريطة — اسم النشاط ورقمه وعنوانه' : 'Real businesses from map data — name, phone, address'}
                </p>
              </div>
              <button onClick={() => setFindOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input className="input-field flex-1" autoFocus
                placeholder={isAr ? 'نوع النشاط — مطاعم، صيدليات، جيمات...' : 'Business type — restaurants, pharmacies...'}
                value={findForm.what}
                onChange={e => setFindForm(f => ({ ...f, what: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && runDiscover()} />
              <input className="input-field flex-1"
                placeholder={isAr ? 'المكان — القاهرة، مدينة نصر...' : 'Area — Cairo, Nasr City...'}
                value={findForm.where}
                onChange={e => setFindForm(f => ({ ...f, where: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && runDiscover()} />
              <button onClick={runDiscover} disabled={finding} className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap">
                {finding
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Icon name="search" size={16} />}
                {isAr ? 'دوّر' : 'Search'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[120px]">
              {finding && (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                  <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
                  {isAr ? 'بندور في الخريطة...' : 'Searching the map...'}
                </div>
              )}
              {!finding && candidates && candidates.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  {isAr ? 'مفيش نتايج — جرب نشاط تاني أو مدينة أكبر' : 'No results — try another type or a bigger city'}
                </div>
              )}
              {!finding && candidates && candidates.length > 0 && (
                <div className="space-y-1.5">
                  {candidates.map((c, i) => (
                    <label key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        c.already_exists
                          ? 'border-surface-500 bg-surface-700/30 opacity-50'
                          : picked.has(i)
                          ? 'border-brand-500/50 bg-brand-500/10'
                          : 'border-line bg-surface-700/40 hover:bg-surface-600/40'
                      }`}>
                      <input type="checkbox" disabled={c.already_exists}
                        checked={picked.has(i)} onChange={() => togglePick(i)}
                        className="accent-brand-500 w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-2">
                          {c.phone && <span className="flex items-center gap-1" dir="ltr"><Icon name="call" size={12} />{c.phone}</span>}
                          {c.address && <span className="flex items-center gap-1"><Icon name="location_on" size={12} />{c.address}</span>}
                        </p>
                      </div>
                      {c.already_exists
                        ? <span className="badge badge-blue text-[10px] flex-shrink-0">{isAr ? 'موجود' : 'Exists'}</span>
                        : c.phone
                        ? <span className="badge badge-green text-[10px] flex-shrink-0">{isAr ? 'برقم تليفون' : 'Has phone'}</span>
                        : null}
                    </label>
                  ))}
                </div>
              )}
              {!finding && !candidates && (
                <div className="text-center py-10 text-slate-500 text-xs leading-relaxed">
                  {isAr
                    ? 'أمثلة: «مطاعم» في «القاهرة» • «صيدليات» في «الإسكندرية» • «جيمات» في «مدينة نصر»'
                    : 'Examples: "restaurants" in "Cairo" • "pharmacies" in "Alexandria"'}
                </div>
              )}
            </div>

            {candidates && candidates.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-line mt-4">
                <span className="text-xs text-slate-400">
                  {isAr ? `${picked.size} محدد من ${candidates.length}` : `${picked.size} of ${candidates.length} selected`}
                </span>
                <button onClick={runImport} disabled={importing || picked.size === 0}
                  className="btn-primary text-sm flex items-center gap-2">
                  {importing && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isAr ? 'إضافة المحدد للعملاء' : 'Import Selected'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalOpen(false)}>
          <div className="glass-card w-full max-w-lg p-6 shadow-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editing ? (isAr ? 'تعديل عميل' : 'Edit Lead') : (isAr ? 'إضافة عميل جديد' : 'Add New Lead')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'اسم النشاط *' : 'Business Name *'}</label>
                <input className="input-field" value={form.name} onChange={e => setF('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'الهاتف' : 'Phone'}</label>
                <input className="input-field" dir="ltr" value={form.phone} onChange={e => setF('phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'البريد' : 'Email'}</label>
                <input className="input-field" dir="ltr" value={form.email} onChange={e => setF('email', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'الموقع الإلكتروني' : 'Website'}</label>
                <input className="input-field" dir="ltr" value={form.website} onChange={e => setF('website', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'التقييم (0-5)' : 'Rating (0-5)'}</label>
                <input className="input-field" dir="ltr" type="number" min="0" max="5" step="0.1"
                  value={form.rating} onChange={e => setF('rating', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'العنوان' : 'Address'}</label>
                <input className="input-field" value={form.address} onChange={e => setF('address', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'المصدر' : 'Source'}</label>
                <input className="input-field" placeholder={isAr ? 'مثال: Google Maps' : 'e.g. Google Maps'}
                  value={form.source} onChange={e => setF('source', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'الحالة' : 'Status'}</label>
                <select className="input-field" value={form.status} onChange={e => setF('status', e.target.value)}>
                  <option value="new">{isAr ? 'جديد' : 'New'}</option>
                  <option value="contacted">{isAr ? 'تم التواصل' : 'Contacted'}</option>
                  <option value="qualified">{isAr ? 'مؤهل' : 'Qualified'}</option>
                  <option value="nurturing">{isAr ? 'متابعة' : 'Nurturing'}</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'ملاحظات' : 'Notes'}</label>
                <textarea className="input-field min-h-[64px]" value={form.notes} onChange={e => setF('notes', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} className="btn-ghost text-sm">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editing ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة' : 'Add Lead')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
