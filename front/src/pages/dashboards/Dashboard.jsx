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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard 
          label="Portefeuille global" 
          value={`${stats.encours_credits.toLocaleString()} DH`} 
          icon={DollarSign} 
          color="brand" 
        />
      </div>

      {/* ── Section 2 : Activités récentes & Alertes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Gauche : Derniers Paiements Perçus (Prend 2/3 de l'espace) */}
        <div className="card p-0 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Flux récents de paiements
            </h3>
            <span className="text-[11px] text-surface-600 font-medium">Flux de caisse</span>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100 text-[10px] font-semibold text-surface-800/60 tracking-wider uppercase">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-xs">
                {stats.derniers_paiements.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-surface-600/50">Aucun paiement récent enregistré.</td>
                  </tr>
                ) : (
                  stats.derniers_paiements.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-50/40">
                      <td className="px-5 py-3.5 font-medium text-surface-900">{p.client_nom}</td>
                      <td className="px-5 py-3.5 text-surface-800/60">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">+{p.montant.toLocaleString()} DH</td>
                      <td className="px-5 py-3.5"><span className="badge bg-surface-100 text-surface-800">{p.mode_paiement}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne Droite : Alertes critiques (Prend 1/3 de l'espace) */}
        <div className="card p-0 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Alertes & Retards
            </h3>
            <span className="inline-flex w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[320px]">
            {stats.alertes_recentes.length === 0 ? (
              <p className="text-xs text-center text-surface-600/50 py-12">Le système est stable. Aucune alerte.</p>
            ) : (
              stats.alertes_recentes.map((a) => (
                <div key={a.id} className="p-3 bg-red-50/60 border border-red-100/50 rounded-xl flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-surface-900 truncate">{a.titre}</p>
                    <p className="text-[11px] text-surface-600 mt-0.5 line-clamp-2">{a.description}</p>
                    <span className="text-[10px] text-surface-800/40 block mt-1">{formatDate(a.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}