import { useState, useCallback, useEffect } from 'react'
import { AlertTriangle, ShieldCheck, Eye, Trash2, CheckCircle2 } from 'lucide-react'
import { alertesApi } from '../../api/services' // Ajustez le chemin selon votre projet
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/helpers'
import { PageHeader, ConfirmDialog, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'

export default function AlertesPage() {
  const [page, setPage]             = useState(1)
  const [gravite, setGravite]       = useState('')
  const [statut, setStatut]         = useState('false') // 'false' = non acquittées par défaut
  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Préparation de l'appel API filtré
  const fetcher = useCallback(() => {
    const params = { page }
    if (gravite) params.niveau_gravite = gravite
    if (statut) params.acquittee = statut
    return alertesApi.list(params)
  }, [page, gravite, statut])

  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, gravite, statut])
  const alertes = data?.data ?? []

  // Déclenchement automatique du fetch au changement des filtres
  useEffect(() => {
    refresh()
  }, [page, gravite, statut, refresh])

  const closeModal = () => { setModal(null); setSelected(null) }

  // Action d'acquittement de l'alerte
  const handleAcquitter = async () => {
    setActionLoading(true)
    try {
      // On récupère l'ID de l'employé connecté (à adapter selon votre gestion de l'auth)
      const user = JSON.parse(localStorage.getItem('user')) 
      const employeId = user?.employe_id || 1 // Fallback ID 1 si non trouvé

      await alertesApi.acquitter(selected.id, { employe_id: employeId })
      closeModal()
      refresh()
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors de l'acquittement")
    } finally {
      setActionLoading(false)
    }
  }

  // Styles de couleur selon la gravité
  const graviteColor = {
    INFO: 'bg-blue-100 text-blue-700 border-blue-200',
    AVERTISSEMENT: 'bg-amber-100 text-amber-700 border-amber-200',
    CRITIQUE: 'bg-orange-100 text-orange-700 border-orange-200',
    URGENCE: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes Système"
        subtitle="Suivi des retards de paiement et anomalies de crédits"
      />

      {/* ── Indicateurs rapides ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Alertes en cours" value={statut === 'false' ? (data?.meta?.total ?? '—') : '—'} icon={AlertTriangle} color="red" />
        <StatCard label="Traitées / Acquittées" value={statut === 'true' ? (data?.meta?.total ?? '—') : '—'} icon={ShieldCheck} color="brand" />
      </div>

      {/* ── Zone de recherche et filtres ── */}
      <div className="card p-0">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-surface-100 bg-surface-50/50">
          <div className="w-48">
            <label className="text-[10px] uppercase font-bold text-surface-800/50 block mb-1">Statut d'alerte</label>
            <select className="input py-1.5 text-xs" value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}>
              <option value="false">⚠️ En cours (Non acquittées)</option>
              <option value="true">✅ Archivées (Acquittées)</option>
              <option value="">Tous les statuts</option>
            </select>
          </div>

          <div className="w-48">
            <label className="text-[10px] uppercase font-bold text-surface-800/50 block mb-1">Gravité</label>
            <select className="input py-1.5 text-xs" value={gravite} onChange={e => { setGravite(e.target.value); setPage(1) }}>
              <option value="">Toutes les gravités</option>
              <option value="INFO">INFO</option>
              <option value="AVERTISSEMENT">AVERTISSEMENT</option>
              <option value="CRITIQUE">CRITIQUE</option>
              <option value="URGENCE">URGENCE</option>
            </select>
          </div>
        </div>

        {/* ── Liste des alertes sous forme de tableau ── */}
        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : alertes.length === 0 ? <Empty message="Aucune alerte correspondante." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {['ID Prêt', 'Date alerte', 'Message / Incident', 'Niveau', 'Statut', ''].map(h => (
                    <th key={h} className="th text-[11px] py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alertes.map(a => (
                  <tr key={a.id} className="table-row hover:bg-surface-50/40 transition-colors">
                    <td className="td font-mono text-xs text-brand-600 font-semibold">
                      #{a.pret_id}
                    </td>
                    <td className="td text-xs text-surface-800/60">
                      {formatDate(a.date_alerte || a.created_at)}
                    </td>
                    <td className="td max-w-md">
                      <p className="text-xs font-medium text-surface-900 leading-relaxed">{a.message}</p>
                      {a.pret?.demande_credit?.client?.personne && (
                        <span className="text-[10px] text-surface-600 block mt-0.5 font-normal">
                          Client : {a.pret.demande_credit.client.personne.prenom} {a.pret.demande_credit.client.personne.nom}
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <span className={`badge border text-[10px] font-bold ${graviteColor[a.niveau_gravite]}`}>
                        {a.niveau_gravite}
                      </span>
                    </td>
                    <td className="td">
                      {a.est_acquittee ? (
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} /> Acquittée
                          {a.acquitte_par_personne && <span className="text-[10px] text-surface-600 font-normal">par {a.acquitte_par_personne.nom}</span>}
                        </div>
                      ) : (
                        <span className="badge bg-red-50 text-red-600 border border-red-100">À traiter</span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1 justify-end">
                        {!a.est_acquittee && (
                          <button 
                            onClick={() => { setSelected(a); setModal('acquitter') }} 
                            className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-surface-800/60 transition-colors flex items-center gap-1 text-xs font-medium"
                            title="Acquitter l'incident"
                          >
                            <ShieldCheck size={14} /> <span className="hidden sm:inline">Acquitter</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 pb-4 border-t border-surface-100 pt-4">
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>

      {/* ── Boîte de dialogue d'Acquittement ── */}
      <ConfirmDialog 
        open={modal === 'acquitter'} 
        onClose={closeModal} 
        onConfirm={handleAcquitter}
        title="Confirmer l'acquittement" 
        message="Confirmez-vous avoir pris connaissance et résolu l'incident lié à cette alerte de crédit ?" 
        loading={actionLoading} 
      />
    </div>
  )
}