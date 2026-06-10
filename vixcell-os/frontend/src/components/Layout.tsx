import { Outlet } from 'react-router-dom'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-900">
      {/* Custom Electron titlebar */}
      <TitleBar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 min-h-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
