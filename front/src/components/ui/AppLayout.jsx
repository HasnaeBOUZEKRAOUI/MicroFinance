import Sidebar from '../layout/SideBar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}