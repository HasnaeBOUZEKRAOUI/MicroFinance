import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { 
  Users, FileText, CreditCard, DollarSign, 
  UserCheck, Bell, LogOut, Landmark, LayoutDashboard ,UserCircle
} from 'lucide-react'

// 1. On ajoute les rôles autorisés pour chaque lien.
// Si 'roles' n'est pas défini, le lien est visible par tout le monde.
const navItems = [
  { to: '/vision360Page', label: 'Vision 360°', icon: LayoutDashboard, roles: ['AGENT_CREDIT'] }, // Visible par tous les rôles
  { to: '/dashboard', label: 'Dashboard Admin', icon: LayoutDashboard ,roles: ['ADMIN'] }, // Visible par Admin et Agent de crédit
  { to: '/clients',   label: 'Clients',   icon: Users, roles: ['AGENT_CREDIT'] },
  { to: '/employes',  label: 'Employés',  icon: UserCheck, roles: ['ADMIN'] }, // Uniquement Admin
  { to: '/demandes',  label: 'Demandes de crédit', icon: FileText, roles: ['AGENT_CREDIT','MANAGER'] },
  { to: '/produits',  label: 'Produits',  icon: FileText, roles: ['ADMIN','MANAGER'] }, // Uniquement Admin
  { to: '/prets',     label: 'Prêts',     icon: CreditCard, roles: [ 'AGENT_CREDIT'] },
  { to: '/encaisser', label: 'Paiements', icon: DollarSign, roles: ['AGENT_CREDIT'] },
  { to: '/statistiques', label: 'Statistiques', icon: LayoutDashboard, roles: ['ADMIN'] }, // Uniquement Manager
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

  // 2. Filtrer les éléments de navigation selon le rôle de l'utilisateur
  const itemsFiltres = navItems.filter(item => {
    // Si aucune restriction de rôle n'est configurée, on affiche le lien
    if (!item.roles) return true;
    
    // Sinon, on vérifie si le rôle de l'utilisateur est inclus dans la liste
    return item.roles.includes(user?.role);
  });

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

      {/* Nav filtrée selon les rôles */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {itemsFiltres.map(({ to, label, icon: Icon }) => (
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
<div className="px-3 py-3 border-t border-surface-100 space-y-2">



{/* ✅ Bouton profil */}
<NavLink
  to="/profile"
  className={({ isActive }) => `
    flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
    ${isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}
  `}
>
  <UserCircle size={18} />
  <span>Mon Profil</span>
</NavLink>

{/* Logout */}
<button
  onClick={handleLogout}
  disabled={loggingOut}
  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
>
  <LogOut size={18} />
  <span>Déconnexion</span>
</button>
</div>
    </aside>
  )
}