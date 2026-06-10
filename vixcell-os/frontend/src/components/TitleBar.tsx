// Custom Electron titlebar — draggable, with window controls
const eAPI = (window as any).electronAPI

export default function TitleBar() {
  return (
    <div className="drag-region h-10 bg-surface-900 border-b border-brand-500/10 flex items-center justify-between px-4 select-none flex-shrink-0">
      {/* Logo */}
      <div className="no-drag flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-brand-gradient flex items-center justify-center shadow-glow">
          <span className="text-xs font-black text-white">V</span>
        </div>
        <span className="text-sm font-bold gradient-text">Vixcell AI OS</span>
      </div>

      {/* Window controls */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={() => eAPI?.minimize()}
          className="w-8 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
        </button>
        <button
          onClick={() => eAPI?.maximize()}
          className="w-8 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
          title="Maximize"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="0.6" y="0.6" width="7.8" height="7.8" rx="1"/></svg>
        </button>
        <button
          onClick={() => eAPI?.close()}
          className="w-8 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
          title="Close"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="1" x2="8" y2="8"/><line x1="8" y1="1" x2="1" y2="8"/></svg>
        </button>
      </div>
    </div>
  )
}
