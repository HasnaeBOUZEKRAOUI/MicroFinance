import { useState, useEffect } from 'react'
import { pretsApi,paiementsApi } from '../../api/services' // Assure-toi d'y avoir list() et echeancier()
import { formatMontant, formatDate } from '../../utils/helpers'
import { PageHeader, Spinner, ErrorAlert, Modal } from '../../components/ui'
import { Search, CreditCard, DollarSign, Calendar, PlusCircle } from 'lucide-react'

export default function EncaisserPage() {
  const [prets, setPrets] = useState([])
  const [selectedPretId, setSelectedPretId] = useState('')
  const [echeances, setEcheances] = useState([])
  
  // États de chargement
  const [loadingPrets, setLoadingPrets] = useState(false)
  const [loadingEcheances, setLoadingEcheances] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Gestion de la modale de paiement
  const [selectedEcheance, setSelectedEcheance] = useState(null)
  const [formPaiement, setFormPaiement] = useState({
    montant: '',
    mode_paiement: 'ESPECES',
    reference_transaction: '',
    observation: ''
  })

  // 1. Charger la liste des prêts actifs au démarrage
  useEffect(() => {
    const loadPrets = async () => {
      setLoadingPrets(true)
      try {
        const res = await pretsApi.list({ statut: 'EN_COURS', per_page: 100 })
        setPrets(res.data?.data || res.data || [])
      } catch (err) {
        setError('Impossible de charger la liste des prêts.')
      } finally {
        setLoadingPrets(false)
      }
    }
    loadPrets()
  }, [])

  // 2. Charger les échéances dès qu'un prêt est sélectionné
  useEffect(() => {
    if (!selectedPretId) {
      setEcheances([])
      return
    }

    const loadEcheances = async () => {
      setLoadingEcheances(true)
      try {
        const res = await pretsApi.echeancier(selectedPretId)
        // 🌟 CORRECTION : On prend directement res.data car le contrôleur renvoie un tableau direct
        setEcheances(res.data || [])
      } catch (err) {
        setError('Erreur lors de la récupération des échéances.')
      } finally {
        setLoadingEcheances(false)
      }
    }
    loadEcheances()
  }, [selectedPretId])

  // 4. Soumettre le paiement au PaiementController backend
  const handleSavePaiement = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        echeance_id: selectedEcheance.id,
        date_paiement: new Date().toISOString().split('T')[0],
        ...formPaiement
      }
    
      await paiementsApi.create(payload)
      
      // Fermer la modale
      setSelectedEcheance(null)
      
      // 🌟 CORRECTION ICI AUSSI POUR LE RECHARGEMENT :
      const reloadRes = await pretsApi.echeancier(selectedPretId)
      setEcheances(reloadRes.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors du paiement.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Guichet d'encaissement" subtitle="Enregistrer les remboursements de mensualités" />

      {error && <ErrorAlert message={error} />}

      {/* ─── BLOC SÉLECTEUR DE PRÊT ─── */}
      <div className="card bg-white p-5 shadow-sm border border-surface-100 rounded-xl">
        <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
          Sélectionner le dossier de prêt du client
        </label>
        <div className="relative max-w-xl">
          <select
            className="input pl-10 h-11 text-sm font-medium pr-10 appearance-none bg-white"
            value={selectedPretId}
            onChange={(e) => setSelectedPretId(e.target.value)}
            disabled={loadingPrets}
          >
            <option value="">── Choisir un contrat de prêt actif ──</option>
            {prets.map((p) => (
              <option key={p.id} value={p.id}>
                Ref: {p.reference} — {p.demande_credit?.client?.personne?.prenom} {p.demande_credit?.client?.personne?.nom} ({formatMontant(p.montant_accorde)})
              </option>
            ))}
          </select>
          <div className="absolute left-3.5 top-3.5 text-surface-400 pointer-events-none">
            <Search size={16} />
          </div>
        </div>
      </div>

      {/* ─── TABLEAU DES ÉCHÉANCES CHARGÉES ─── */}
      {selectedPretId && (
        <div className="card p-0 overflow-hidden bg-white border border-surface-100 shadow-sm rounded-xl">
          <div className="px-5 py-4 bg-surface-50/60 border-b border-surface-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-surface-800 flex items-center gap-2">
              <Calendar size={16} className="text-brand-500" /> Échéancier de remboursement du compte
            </h3>
          </div>

          {loadingEcheances ? (
            <div className="flex justify-center py-12"><Spinner className="w-6 h-6" /></div>
          ) : echeances.length === 0 ? (
            <div className="p-8 text-center text-sm text-surface-400">Aucune échéance trouvée pour ce prêt.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-50 text-surface-600 text-xs font-semibold border-b border-surface-100">
                  <tr>
                    <th className="py-3 px-5">N°</th>
                    <th className="py-3 px-4">Date Limite</th>
                    <th className="py-3 px-4 text-right">Du Mensuel</th>
                    <th className="py-3 px-4 text-right">Pénalités</th>
                    <th className="py-3 px-4 text-right">Déjà Réglé</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-xs">
                  {echeances.map((ech) => {
                    const totalDu = parseFloat(ech.total_du) + parseFloat(ech.penalites || 0);
                    const reste = totalDu - parseFloat(ech.montant_paye);
                    const isSolde = ech.statut === 'PAYEE';

                    return (
                      <tr key={ech.id} className={`hover:bg-surface-50/50 ${isSolde ? 'bg-emerald-50/10' : ''}`}>
                        <td className="py-3.5 px-5 font-mono font-bold text-surface-400">#{ech.numero_echeance}</td>
                        <td className="py-3.5 px-4 font-medium">{formatDate(ech.date_echeance)}</td>
                        <td className="py-3.5 px-4 font-mono text-right font-medium">{formatMontant(ech.total_du)}</td>
                        <td className="py-3.5 px-4 font-mono text-right text-red-600">{parseFloat(ech.penalites) > 0 ? formatMontant(ech.penalites) : '—'}</td>
                        <td className="py-3.5 px-4 font-mono text-right text-emerald-600 font-medium">{parseFloat(ech.montant_paye) > 0 ? formatMontant(ech.montant_paye) : '—'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isSolde ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ech.statut === 'EN_RETARD' ? 'bg-red-50 text-red-700 border-red-200' :
                            ech.statut === 'PARTIELLEMENT_PAYEE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {ech.statut}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleOpenPaiement(ech)}
                            disabled={isSolde}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                              isSolde 
                                ? 'bg-surface-100 text-surface-400 cursor-not-allowed shadow-none' 
                                : 'bg-brand-600 hover:bg-brand-700 text-white'
                            }`}
                          >
                            <CreditCard size={13} /> Encaisser ({formatMontant(reste)})
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODALE FORMULAIRE DE PAIEMENT ─── */}
      <Modal open={!!selectedEcheance} onClose={() => setSelectedEcheance(null)} title={`Enregistrer Encaissement — Échéance #${selectedEcheance?.numero_echeance}`}>
        {selectedEcheance && (
          <form onSubmit={handleSavePaiement} className="space-y-4">
            <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl grid grid-cols-2 text-xs text-brand-900">
              <div>Total initial : <strong>{formatMontant(selectedEcheance.total_du)}</strong></div>
              <div className="text-right">Déjà Payé : <strong className="text-emerald-600">{formatMontant(selectedEcheance.montant_paye)}</strong></div>
            </div>

            <div>
              <label className="label">Montant perçu (MAD) *</label>
              <div className="relative">
                <input
                  type="number" step="0.01" className="input font-mono font-bold text-base pl-9"
                  value={formPaiement.montant}
                  onChange={(e) => setFormPaiement(p => ({ ...p, montant: e.target.value }))}
                  required
                />
                <DollarSign size={16} className="absolute left-3 top-3.5 text-surface-400" />
              </div>
            </div>

            <div>
              <label className="label">Mode de règlement *</label>
              <select
                className="input text-sm"
                value={formPaiement.mode_paiement}
                onChange={(e) => setFormPaiement(p => ({ ...p, mode_paiement: e.target.value }))}
              >
                <option value="ESPECES">ESPECES</option>
                <option value="VIREMENT">VIREMENT</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="MOBILE_MONEY">MOBILE MONEY</option>
                <option value="PRELEVEMENT">PRELEVEMENT</option>
              </select>
            </div>

            <div>
              <label className="label">Référence de transaction (Numéro chèque, pièce bordereau...)</label>
              <input
                type="text" className="input text-sm font-mono" placeholder="ex: CHQ-0009823"
                value={formPaiement.reference_transaction}
                onChange={(e) => setFormPaiement(p => ({ ...p, reference_transaction: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Observations / Notes</label>
              <textarea
                className="input text-sm h-16 resize-none" placeholder="Versement partiel reçu par..."
                value={formPaiement.observation}
                onChange={(e) => setFormPaiement(p => ({ ...p, observation: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
              <button type="button" className="btn-secondary" onClick={() => setSelectedEcheance(null)} disabled={submitting}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Spinner className="w-4 h-4" /> : <PlusCircle size={14} />}
                {submitting ? 'Validation...' : 'Confirmer l\'encaissement'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}