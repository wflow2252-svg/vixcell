import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { aiAPI } from '@/api/client'
import { useAppStore } from '@/store'

interface LocalModel {
  name: string
  size_gb: number
  parameter_size?: string
  family?: string
  modified_at?: string
}

interface CatalogModel {
  name: string
  label: string
  size: string
  languages: string
  good_for: string
}

export default function AIModelsPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [status, setStatus] = useState<{ running: boolean; version?: string; model_storage?: string } | null>(null)
  const [catalog, setCatalog] = useState<CatalogModel[]>([])
  const [models, setModels] = useState<LocalModel[]>([])
  const [loading, setLoading] = useState(true)
  const [pulling, setPulling] = useState<Record<string, { percent: number | null; status: string }>>({})
  const pollers = useRef<Record<string, number>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const st = await aiAPI.status()
      setStatus(st.data)
      setCatalog(st.data.catalog || [])
      if (st.data.running) {
        const m = await aiAPI.models()
        setModels(m.data.models)
      }
    } catch {
      setStatus({ running: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => { Object.values(pollers.current).forEach(clearInterval) }
  }, [load])

  const startPull = async (name: string) => {
    try {
      await aiAPI.pull(name)
      setPulling(p => ({ ...p, [name]: { percent: 0, status: 'starting' } }))
      toast.success(isAr ? `بدأ تنزيل ${name}` : `Downloading ${name}`)
      pollers.current[name] = window.setInterval(async () => {
        try {
          const res = await aiAPI.pullProgress(name)
          const d = res.data
          setPulling(p => ({ ...p, [name]: { percent: d.percent, status: d.status } }))
          if (d.done) {
            clearInterval(pollers.current[name])
            delete pollers.current[name]
            setPulling(p => {
              const cp = { ...p }; delete cp[name]; return cp
            })
            if (d.error) toast.error(`${name}: ${d.error}`)
            else toast.success(isAr ? `اكتمل تنزيل ${name}` : `${name} downloaded`)
            load()
          }
        } catch { /* keep polling */ }
      }, 1500)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Pull failed')
    }
  }

  const removeModel = async (name: string) => {
    if (!confirm(isAr ? `حذف النموذج ${name}؟` : `Delete model ${name}?`)) return
    try {
      await aiAPI.deleteModel(name)
      toast.success(isAr ? 'تم حذف النموذج' : 'Model deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Delete failed')
    }
  }

  const installedNames = new Set(models.map(m => m.name))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'نماذج الذكاء الاصطناعي' : 'AI Models'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? 'نماذج محلية تعمل على جهازك — بياناتك لا تغادر الجهاز' : 'Local models running on your machine — your data never leaves it'}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <Icon name="refresh" size={18} />{isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Engine status */}
      <div className="glass-card p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.running ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <Icon name="neurology" size={22} className={status?.running ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              Ollama Engine
              {status?.running
                ? <span className="badge-green">{isAr ? 'يعمل' : 'Running'} {status.version && `v${status.version}`}</span>
                : <span className="badge-red">{isAr ? 'متوقف' : 'Stopped'}</span>}
            </p>
            {status?.model_storage && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1" dir="ltr">
                <Icon name="hard_drive" size={13} />{status.model_storage}
              </p>
            )}
          </div>
        </div>
        {!status?.running && !loading && (
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <Icon name="warning" size={15} />
            {isAr ? 'شغّل Ollama أولاً ليعمل الذكاء الاصطناعي' : 'Start Ollama to enable AI features'}
          </p>
        )}
      </div>

      {/* Installed models */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Icon name="download_done" size={18} className="text-emerald-400" />
          {isAr ? 'النماذج المثبتة' : 'Installed Models'}
        </h2>
        {loading ? (
          <div className="glass-card flex items-center justify-center py-10 text-slate-500 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin" />
            {isAr ? 'جارٍ التحميل...' : 'Loading...'}
          </div>
        ) : models.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-10 gap-2">
            <Icon name="deployed_code" size={28} className="text-slate-500" />
            <p className="text-sm text-slate-400">{isAr ? 'لا توجد نماذج مثبتة بعد — نزّل واحدًا من القائمة بالأسفل' : 'No models installed yet — pull one from the catalog below'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {models.map(m => (
              <div key={m.name} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <Icon name="smart_toy" size={20} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white" dir="ltr">{m.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {m.parameter_size || ''} • {m.size_gb} GB {m.family ? `• ${m.family}` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeModel(m.name)}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-600 transition-colors"
                  title={isAr ? 'حذف' : 'Delete'}>
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Icon name="storefront" size={18} className="text-brand-400" />
          {isAr ? 'نماذج موصى بها' : 'Recommended Models'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {catalog.map(c => {
            const installed = installedNames.has(c.name)
            const pull = pulling[c.name]
            return (
              <div key={c.name} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white" dir="ltr">{c.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.languages} • {c.size}</p>
                    <p className="text-xs text-slate-400 mt-1">{c.good_for}</p>
                  </div>
                  {installed ? (
                    <span className="badge-green flex items-center gap-1">
                      <Icon name="check" size={13} />{isAr ? 'مثبت' : 'Installed'}
                    </span>
                  ) : pull ? (
                    <div className="text-end min-w-[90px]">
                      <p className="text-xs text-brand-300 font-medium">{pull.percent != null ? `${pull.percent}%` : '...'}</p>
                      <div className="w-20 h-1.5 bg-surface-500 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${pull.percent || 2}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startPull(c.name)}
                      disabled={!status?.running}
                      className="btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-40">
                      <Icon name="download" size={15} />{isAr ? 'تنزيل' : 'Pull'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
