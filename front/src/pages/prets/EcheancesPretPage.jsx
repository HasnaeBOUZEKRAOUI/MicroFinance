import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { pretsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant } from '../../utils/helpers'
import { PageHeader, Spinner, ErrorAlert, StatCard, Empty } from '../../components/ui'

// Configuration visuelle des statuts d'échéance
const STATUT_ECHEANCE = {
  EN_ATTENTE:          { label: 'En attente',           color: 'bg-amber-50 text-amber-700 border-amber-200' },
  PARTIELLEMENT_PAYEE: { label: 'Partiellement Payée', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAYEE:               { label: 'Payée',                color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EN_RETARD:           { label: 'En retard',            color: 'bg-red-50 text-red-700 border-red-200' },
}

export default function EcheancesPretPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Appels API vers la fonction echeancier($pret) du PretController
  const fetcher = useCallback(() => pretsApi.echeancier(id), [id])
  const { data, loading, error, execute: refresh } = useApi(fetcher, [id])

  const echeances = data?.echeances ?? []

  // Calculs dynamiques pour les indicateurs financiers locaux
  const stats = echeances.reduce((acc, ech) => {
    const totalDu = parseFloat(ech.total_du) || 0
    const paye = parseFloat(ech.montant_paye) || 0
    
    acc.totalDu += totalDu
    acc.totalPaye += paye
    if (ech.statut === 'EN_RETARD') acc.totalRetard += (totalDu - paye)
    return acc
  }, { totalDu: 0, totalPaye: 0, totalRetard: 0 })

  const resteAPayer = stats.totalDu - stats.totalPaye

  return (
    <div className="space-y-5">
      {/* En-tête de page avec bouton retour arrière */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/prets')} 
          className="p-2 bg-surface-50 hover:bg-surface-100 rounded-xl border border-surface-200 text-surface-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <PageHeader
          title={`Échéancier — Prêt ${data?.reference ?? `#${id}`}`}
          subtitle={`Suivi et situation des remboursements du contrat`}
          action={
            <button className="btn-secondary py-2 text-xs" onClick={refresh}>
              <RefreshCw size={13} /> Actualiser
            </button>
          }
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner className="w-8 h-8" /></div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : echeances.length === 0 ? (
        <Empty message="Aucune échéance générée pour ce prêt." />
      ) : (
        <>
          {/* 📊 Bloc Indicateurs / KPI de la situation financière actuelle du prêt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Volume global accordé" value={formatMontant(data?.montant_accorde)} icon={DollarSign} color="brand" />
            <StatCard label="Total recouvré (Payé)" value={formatMontant(stats.totalPaye)} icon={CheckCircle} color="emerald" />
            <StatCard label="Capital restant dû" value={formatMontant(resteAPayer)} icon={Clock} color="blue" />
            <StatCard label="Arriérés / Retards cumulés" value={formatMontant(stats.totalRetard)} icon={AlertTriangle} color={stats.totalRetard > 0 ? 'red' : 'surface'} />
          </div>

          {/* 🗓️ Tableau principal de l'échéancier */}
          <div className="card p-0 overflow-hidden border border-surface-100 shadow-sm">
            <div className="px-5 py-4 bg-surface-50/50 border-b border-surface-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
                <Calendar size={16} className="text-brand-500" /> Plan de remboursement détaillé
              </h3>
              <span className="text-xs font-mono text-surface-500 bg-surface-100 px-2.5 py-1 rounded-md">
                {echeances.length} Mensualités
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    <th className="th py-3 px-5 text-xs font-bold text-surface-500">N°</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500">Date d'échéance</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500 text-right">Principal (Capital)</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500 text-right">Intérêts</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500 text-right">Pénalités</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500 text-right">Total mensuel dû</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500 text-right">Montant Réglé</th>
                    <th className="th py-3 px-4 text-xs font-bold text-surface-500 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 bg-white">
                  {echeances.map((ech) => {
                    const st = STATUT_ECHEANCE[ech.statut] || { label: ech.statut, color: 'bg-surface-100 text-surface-700' }
                    
                    return (
                      <tr key={ech.id} className="hover:bg-surface-50/40 transition-colors">
                        {/* Numéro de mensualité */}
                        <td className="td py-3.5 px-5 font-mono text-xs font-bold text-surface-400">
                          #{String(ech.numero_echeance).padStart(2, '0')}
                        </td>
                        
                        {/* Date de paiement limite */}
                        <td className="td py-3.5 px-4 text-xs font-medium text-surface-800">
                          {formatDate(ech.date_echeance)}
                        </td>
                        
                        {/* Part du capital amorti */}
                        <td className="td py-3.5 px-4 font-mono text-xs text-right text-surface-900">
                          {parseFloat(ech.montant_principal) === 0 ? (
                            <span className="text-amber-600 font-medium text-[11px] bg-amber-50 px-1.5 py-0.5 rounded">Grâce</span>
                          ) : (
                            formatMontant(ech.montant_principal)
                          )}
                        </td>
                        
                        {/* Part des intérêts générés */}
                        <td className="td py-3.5 px-4 font-mono text-xs text-right text-surface-600">
                          {formatMontant(ech.montant_interet)}
                        </td>
                        
                        {/* Pénalités de retard accumulées */}
                        <td className="td py-3.5 px-4 font-mono text-xs text-right text-red-600 font-medium">
                          {parseFloat(ech.penalites) > 0 ? formatMontant(ech.penalites) : '—'}
                        </td>
                        
                        {/* Total de l'échéance exigée */}
                        <td className="td py-3.5 px-4 font-mono text-xs text-right font-semibold text-surface-900">
                          {formatMontant(ech.total_du)}
                        </td>
                        
                        {/* Ce que le client a déjà remboursé */}
                        <td className="td py-3.5 px-4 font-mono text-xs text-right font-medium text-emerald-600">
                          {parseFloat(ech.montant_paye) > 0 ? formatMontant(ech.montant_paye) : '—'}
                        </td>
                        
                        {/* Badge de statut avec bordure texturée */}
                        <td className="td py-3.5 px-4 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}