import { NavLink } from 'react-router-dom'
import { useAppStore, useAuthStore } from '@/store'
import { startMeeting } from '@/lib/meeting'
import Icon from './Icon'
import clsx from 'clsx'

const navItems = [
  { label: 'Dashboard', labelAr: 'لوحة التحكم',      icon: 'dashboard',     path: '/dashboard' },
  { label: 'Leads',     labelAr: 'العملاء المحتملون', icon: 'person_search', path: '/leads' },
  { label: 'WhatsApp',  labelAr: 'واتساب',           icon: 'chat',          path: '/whatsapp' },
  { label: 'Tasks',     labelAr: 'مهام الموقع',      icon: 'task_alt',      path: '/tasks' },
  { label: 'CRM',       labelAr: 'إدارة العلاقات',   icon: 'handshake',     path: '/crm' },
  { label: 'Projects',  labelAr: 'المشاريع',         icon: 'folder',        path: '/projects' },
  { label: 'Meetings',  labelAr: 'محاضر الاجتماعات', icon: 'record_voice_over', path: '/meetings' },
  { label: 'Social',    labelAr: 'التواصل الاجتماعي', icon: 'share',         path: '/social' },
  { label: 'Content',   labelAr: 'إنشاء المحتوى',    icon: 'edit_square',   path: '/content' },
  { label: 'Analytics', labelAr: 'التحليلات',        icon: 'monitoring',    path: '/analytics' },
  { label: 'Knowledge', labelAr: 'قاعدة المعرفة',    icon: 'menu_book',     path: '/knowledge' },
  { label: 'Flows',     labelAr: 'الأتمتة',          icon: 'account_tree',  path: '/flows' },
  { label: 'AI Models', labelAr: 'نماذج الذكاء',     icon: 'neurology',     path: '/ai-models' },
  { label: 'Training',  labelAr: 'مركز التدريب',     icon: 'school',        path: '/training' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, language } = useAppStore()
  const { user, logout } = useAuthStore()
  const isAr = language === 'ar'

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-surface-800 border-e border-line transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-line">
        {sidebarOpen ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-white">V</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Vixcell AI OS</p>
              <p className="text-xs text-slate-500 truncate">Business OS</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center mx-auto">
            <span className="text-sm font-black text-white">V</span>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
          >
            <Icon name={isAr ? 'chevron_right' : 'chevron_left'} size={20} />
          </button>
        )}
      </div>

      {/* Toggle when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
        >
          <Icon name={isAr ? 'chevron_left' : 'chevron_right'} size={20} />
        </button>
      )}

      {/* Tenant badge */}
      {sidebarOpen && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-surface-700 border border-line flex items-center gap-2">
          <Icon name="apartment" size={16} className="text-brand-400" />
          <span className="text-xs text-slate-300 truncate font-medium">
            {user?.full_name || 'Company'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map(({ label, labelAr, icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx('sidebar-item', isActive && 'active', !sidebarOpen && 'justify-center px-0')
            }
            title={!sidebarOpen ? (isAr ? labelAr : label) : undefined}
          >
            <Icon name={icon} size={20} />
            {sidebarOpen && (
              <span className="truncate text-sm">
                {isAr ? labelAr : label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Meeting + Settings + user */}
      <div className="border-t border-line p-2 space-y-0.5">
        <button
          onClick={() => startMeeting(isAr)}
          className={clsx('sidebar-item w-full', !sidebarOpen && 'justify-center px-0')}
          title={isAr ? 'افتح الميتنج (أدمن)' : 'Open Meeting (admin)'}
        >
          <Icon name="videocam" size={20} className="text-brand-400" />
          {sidebarOpen && <span className="text-sm">{isAr ? 'الميتنج (أدمن)' : 'Meeting (admin)'}</span>}
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx('sidebar-item', isActive && 'active', !sidebarOpen && 'justify-center px-0')
          }
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Icon name="settings" size={20} />
          {sidebarOpen && <span className="text-sm">{isAr ? 'الإعدادات' : 'Settings'}</span>}
        </NavLink>

        {sidebarOpen && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        )}

        {!sidebarOpen && (
          <button
            onClick={logout}
            className="sidebar-item justify-center px-0 w-full text-slate-500 hover:text-red-400"
            title="Logout"
          >
            <Icon name="logout" size={20} />
          </button>
        )}
      </div>
    </aside>
  )
}
