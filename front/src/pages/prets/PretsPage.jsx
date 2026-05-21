import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { pretsApi, demandesApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant, formatTaux } from '../../utils/helpers'
import { PageHeader, Badge, Modal, Pagination, Spinner, Empty, ErrorAlert } from '../../components/ui'

// ─── COMPOSANT FORMULAIRE (AVEC SELECT DE DEMANDES APPROUVÉES) ───────────────
function PretForm({ onSave, loading, error }) {
  const [f, setF] = useState({
    demande_credit_id: '', montant_accorde: '',
    date_debut: '', taux_interet: '', periode_grace: '0',
  })
  const [demandesApprouvees, setDemandesApprouvees] = useState([])
  const [loadingDemandes, setLoadingDemandes] = useState(false)

  useEffect(() => {
    const fetchDemandes = async () => {
      setLoadingDemandes(true)
      try {
        const res = await demandesApi.list({ statut: 'APPROUVEE', per_page: 100 })
        setDemandesApprouvees(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Erreur lors de la récupération des demandes approuvées", err)
      } finally {
        setLoadingDemandes(false)
      }
    }
    fetchDemandes()
  }, [])

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
      <ErrorAlert message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="label">Demande approuvée *</label>
          <select 
            className="input text-sm" 
            value={f.demande_credit_id} 
            onChange={set('demande_credit_id')} 
            required
            disabled={loadingDemandes}
          >
            <option value="">
              {loadingDemandes ? 'Chargement des demandes...' : '── Choisir une demande approuvée ──'}
            </option>
            {demandesApprouvees.map(d => (
              <option key={d.id} value={d.id}>
                N°{d.id} - {d.client?.personne?.prenom} {d.client?.personne?.nom} ({formatMontant(d.montant_demande)})
              </option>
            ))}
          </select>
        </div>

        <div><label className="label">Montant accordé (MAD) *</label><input className="input" type="number" step="0.01" value={f.montant_accorde} onChange={set('montant_accorde')} required /></div>
        <div><label className="label">Date de début *</label><input className="input" type="date" value={f.date_debut} onChange={set('date_debut')} required /></div>
        <div><label className="label">Taux d'intérêt annuel *</label><input className="input" type="number" step="0.0001" min="0" max="1" placeholder="ex: 0.1200" value={f.taux_interet} onChange={set('taux_interet')} required /></div>
        <div><label className="label">Période de grâce (mois)</label><input className="input" type="number" min="0" value={f.periode_grace} onChange={set('periode_grace')} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading || loadingDemandes}>
          {loading ? '…' : 'Décaisser le prêt'}
        </button>
      </div>
    </form>
  )
}

// ─── COMPOSANT PRINCIPAL (PAGE DES PRÊTS) ────────────────────────────────────
export default function PretsPage() {
  const navigate = useNavigate()
  const [page, setPage]         = useState(1)
  const [statut, setStatut]     = useState('')
  const [modal, setModal]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  const fetcher = useCallback(() => pretsApi.list({ page, statut: statut || undefined }), [page, statut])
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, statut])
  const prets = data?.data ?? []

  const closeModal = () => { setModal(null); setSaveErr('') }

  const handleCreate = async (form) => {
    setSaving(true); setSaveErr('')
    try { await pretsApi.create(form); closeModal(); refresh() }
    catch (e) { setSaveErr(e.response?.data?.message || 'Erreur lors du décaissement.') }
    finally { setSaving(false) }
  }

  const STATUTS = ['', 'EN_COURS', 'SOLDE', 'EN_RETARD', 'EN_CONTENTIEUX', 'RESTRUCTURE', 'ABANDONNE']

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Prêts"
          subtitle="Portefeuille de prêts actifs et archivés"
        />
        
      </div>

      <div className="card bg-transparent shadow-none p-0">
        <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-surface-150 mb-4">
          <select className="input w-52 py-2" value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}>
            {STATUTS.map(s => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
          </select>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : error   ? <div className="p-6 bg-white rounded-xl border"><ErrorAlert message={error} /></div>
        : prets.length === 0 ? <div className="bg-white rounded-xl border p-6"><Empty message="Aucun prêt trouvé." /></div>
        : (
          <div className="overflow-x-auto">
            {/* 🌟 Utilisation de border-separate et border-spacing-y-3 pour créer de la marge entre chaque prêt */}
            <table className="w-full border-separate" style={{ borderSpacing: '0 12px' }}>
              <thead>
                <tr className="bg-transparent">
                  {['Référence', 'Client', 'Montant demandé', 'Montant accordé', 'Taux', 'Début', 'Fin', 'Grâce', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs font-semibold text-surface-800/60 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prets.map(p => (
                  <tr key={p.id} className="bg-white hover:shadow-sm transition-all group">
                    {/* On ajoute des bordures spécifiques à chaque cellule pour simuler une ligne de carte autonome */}
                    <td className="td font-mono text-xs font-medium text-brand-700 py-4 px-4 border-y border-l border-surface-100 rounded-l-xl">{p.reference}</td>
                    <td className="td py-4 px-4 border-y border-surface-100">{p.demande_credit?.client?.personne?.prenom} {p.demande_credit?.client?.personne?.nom}</td>
                    <td className="td font-mono text-xs py-4 px-4 border-y border-surface-100">{formatMontant(p.demande_credit?.montant_demande)}</td>
                    <td className="td font-mono text-xs py-4 px-4 border-y border-surface-100">{formatMontant(p.montant_accorde)}</td>
                    <td className="td text-xs py-4 px-4 border-y border-surface-100">{formatTaux(p.taux_interet)}</td>
                    <td className="td text-xs py-4 px-4 border-y border-surface-100">{formatDate(p.date_debut)}</td>
                    <td className="td text-xs py-4 px-4 border-y border-surface-100">{formatDate(p.date_fin)}</td>
                    <td className="td text-xs text-center py-4 px-4 border-y border-surface-100">{p.periode_grace} mois</td>
                    <td className="td py-4 px-4 border-y border-surface-100"><Badge statut={p.statut_pret} /></td>
                    
                    <td className="td py-4 px-4 border-y border-r border-surface-100 rounded-r-xl">
                      <button 
                        onClick={() => navigate(`/prets/${p.id}/echeances`)}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors" 
                        title="Voir l'échéancier de paiements"
                      >
                        Échéancier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 bg-white rounded-xl border p-4"><Pagination meta={data?.meta} onPageChange={setPage} /></div>
      </div>

      <Modal open={modal === 'create'} onClose={closeModal} title="Décaisser un prêt" size="lg">
        <PretForm onSave={handleCreate} loading={saving} error={saveErr} />
      </Modal>
    </div>
  )
}