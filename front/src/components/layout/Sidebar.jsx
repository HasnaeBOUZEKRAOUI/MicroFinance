import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { 
  Users, FileText, CreditCard, DollarSign, 
  UserCheck, Bell, LogOut, Landmark, LayoutDashboard // Ajoute LayoutDashboard
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Nouveau lien
  { to: '/clients',   label: 'Clients',   icon: Users },
  { to: '/employes',  label: 'Employés',  icon: UserCheck },
  { to: '/demandes',  label: 'Demandes de crédit', icon: FileText },
  { to: '/prets',     label: 'Prêts',     icon: CreditCard },
  { to: '/paiements', label: 'Paiements', icon: DollarSign },
  { to: '/alertes',   label: 'Alertes',   icon: Bell },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-surface-100 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-100">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-sm">
          <Landmark size={18} />
        </span>
        <div>
          <p className="font-display font-bold text-sm text-surface-900 leading-tight">MicroFinance</p>
          <p className="text-[10px] text-surface-800/50 font-medium tracking-wide uppercase">Pro</p>
        </div>
      </div>

      {/* Nav */}
     <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
  {navItems.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        text-sm font-medium
        ${isActive 
          ? 'bg-brand-50 text-brand-700 shadow-sm' 
          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}
      `}
    >
      <Icon size={20} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  ))}
</nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-surface-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-50">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-display font-bold text-sm">
            {user?.personne?.prenom?.[0] ?? user?.nom_utilisateur?.[0] ?? '?'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-surface-900 truncate">
              {user?.personne?.prenom} {user?.personne?.nom}
            </p>
            <p className="text-[10px] text-surface-800/50 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-surface-800/50 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}