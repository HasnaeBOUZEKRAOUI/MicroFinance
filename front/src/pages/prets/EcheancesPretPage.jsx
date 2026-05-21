import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { pretsApi } from '../../api/services'
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
  
    // 🌟 ÉTATS POUR LA PAGINATION LARAVEL
    const [echeances, setEcheances] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [fromItem, setFromItem] = useState(0)
    const [toItem, setToItem] = useState(0)
    
    // États de chargement et d'infos globales
    const [infoPret, setInfoPret] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
// 🌟 1. On inclut proprement id et currentPage dans le useCallback
const loadEcheances = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // On passe bien currentPage à l'API
      const res = await pretsApi.echeancier(id, currentPage)
      const paginationResult = res.data
      
      setEcheances(paginationResult.data || [])
      setCurrentPage(paginationResult.current_page || 1)
      setTotalPages(paginationResult.last_page || 1)
      setTotalItems(paginationResult.total || 0)
      setFromItem(paginationResult.from || 0)
      setToItem(paginationResult.to || 0)
  
      if (paginationResult.data && paginationResult.data[0]?.pret) {
        setInfoPret(paginationResult.data[0].pret)
      }
    } catch (err) {
      setError('Erreur lors de la récupération des échéances paginées.')
    } finally {
      setLoading(false)
    }
  }, [id, currentPage]) // 🌟 AJOUT DE currentPage ICI
  
  // 🌟 2. Le useEffect doit écouter les changements de la fonction de chargement
  useEffect(() => {
    loadEcheances()
  }, [loadEcheances])

    // Calculs dynamiques pour les indicateurs financiers de la page courante
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
            className="p-2 bg-white hover:bg-surface-50 rounded-xl border border-surface-200 text-surface-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <PageHeader
            title={`Échéancier — Prêt ${infoPret?.reference ?? `#${id}`}`}
            subtitle={`Suivi et situation des remboursements du contrat`}
           
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
        
            {/* 🗓️ Tableau principal de l'échéancier */}
            <div className="card p-0 overflow-hidden border border-surface-100 shadow-sm bg-white rounded-xl">
              <div className="px-5 py-4 bg-surface-50/50 border-b border-surface-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
                  <Calendar size={16} className="text-brand-500" /> Plan de remboursement détaillé
                </h3>
                {totalPages > 1 && (
                  <span className="text-xs font-medium text-surface-500">
                    Page {currentPage} sur {totalPages}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-surface-50 border-b border-surface-100">
                    <tr>
                      <th className="py-3 px-5 text-xs font-bold text-surface-500">N°</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500">Date d'échéance</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-center">Retard</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-right">Principal (Capital)</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-right">Intérêts</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-right">Pénalités</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-right">Total mensuel dû</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-right">Montant Réglé</th>
                      <th className="py-3 px-4 text-xs font-bold text-surface-500 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 text-xs">
                    {echeances.map((ech) => {
                      const joursRetard = parseInt(ech.jours_retard) || 0;
                      // Extraction sécurisée de la config de style du statut
                      const ConfigStatut = STATUT_ECHEANCE[ech.statut] || { label: ech.statut, color: 'bg-surface-100 text-surface-700' };

                      return (
                        <tr key={ech.id} className="hover:bg-surface-50/40 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-xs font-bold text-surface-400">
                            #{String(ech.numero_echeance).padStart(2, '0')}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-surface-800">
                            {formatDate(ech.date_echeance)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-center font-medium">
                            {ech.statut === 'EN_RETARD' || joursRetard > 0 ? (
                              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[11px] font-bold border border-red-100 whitespace-nowrap">
                                {joursRetard || 10} jours
                              </span>
                            ) : (
                              <span className="text-surface-300">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right text-surface-900">
                            {parseFloat(ech.montant_principal) === 0 ? (
                              <span className="text-amber-600 font-medium text-[11px] bg-amber-50 px-1.5 py-0.5 rounded">Grâce</span>
                            ) : (
                              formatMontant(ech.montant_principal)
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right text-surface-600">
                            {formatMontant(ech.montant_interet)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right text-red-600 font-medium">
                            {parseFloat(ech.penalites) > 0 ? formatMontant(ech.penalites) : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right font-semibold text-surface-900">
                            {formatMontant(parseFloat(ech.total_du) + parseFloat(ech.penalites || 0))}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right font-medium text-emerald-600">
                            {parseFloat(ech.montant_paye) > 0 ? formatMontant(ech.montant_paye) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${ConfigStatut.color}`}>
                              {ConfigStatut.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 🌟 BLOC DE NAVIGATION DE PAGINATION CRÉÉ POUR LE SQUELETTE LARAVEL */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-surface-100 bg-surface-50/40 flex items-center justify-between text-xs text-surface-600">
                  <div>
                    Affichage de <span className="font-semibold text-surface-800">{fromItem}</span> à{' '}
                    <span className="font-semibold text-surface-800">{toItem}</span> sur{' '}
                    <span className="font-semibold text-surface-800">{totalItems}</span> mensualités
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-surface-200 rounded-lg bg-white hover:bg-surface-50 text-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-8 h-8 font-semibold rounded-lg border transition-all ${
                          currentPage === pageNumber
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-surface-200 rounded-lg bg-white hover:bg-surface-50 text-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
}