import { useState, useCallback, useEffect } from 'react'
import { 
  Users, UserCheck, FileText, CreditCard, 
  DollarSign, TrendingUp, AlertTriangle, ArrowUpRight 
} from 'lucide-react'
import { dashboardApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { PageHeader, StatCard, Spinner, ErrorAlert } from '../../components/ui'
import { formatDate } from '../../utils/helpers'

export default function Dashboard() {
  const fetcher = useCallback(() => dashboardApi.getStats(), [])
  const { data, loading, error, execute: refresh } = useApi(fetcher)

  // Force le fetch au montage si le hook a besoin d'un coup de pouce
  useEffect(() => {
    refresh()
  }, [refresh])

  // Données de secours (fallback) si l'API n'a pas encore répondu
  const stats = data ?? {
    total_clients: 0,
    total_employes: 0,
    demandes_attente: 0,
    encours_credits: 0,
    derniers_paiements: [],
    alertes_recentes: []
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner className="w-8 h-8 text-brand-600" />
      </div>
    )
  }

  if (error) {
    return <ErrorAlert message={error} />
  }

  return (
    <div className="space-y-6">
      {/* ── Entête du Dashboard ── */}
      <PageHeader 
        title="Tableau de bord" 
        subtitle="Vue d'ensemble de l'activité du système de MicroFinance"
      />

      {/* ── Section 1 : Les Chiffres Clés (KPIs) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          label="Total Clients" 
          value={stats.total_clients.toLocaleString()} 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          label="Équipe (Employés)" 
          value={stats.total_employes} 
          icon={UserCheck} 
          color="purple" 
        />
        <StatCard 
          label="Demandes en attente" 
          value={stats.demandes_attente} 
          icon={FileText} 
          color="amber" 
        />
       
      </div>

          </div>
       
  )
}