import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { pretsApi, demandesApi } from '../../api/services' // 👈 Importation de demandesApi
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant, formatTaux } from '../../utils/helpers'
import { PageHeader, Badge, Modal, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
// ─── COMPOSANT FORMULAIRE (AVEC SELECT DE DEMANDES APPROUVÉES) ───────────────
function PretForm({ onSave, loading, error }) {
  const [f, setF] = useState({
    demande_credit_id: '', montant_accorde: '',
    date_debut: '', taux_interet: '', periode_grace: '0',
  })
  const [demandesApprouvees, setDemandesApprouvees] = useState([])
  const [loadingDemandes, setLoadingDemandes] = useState(false)

  // Chargement des demandes approuvées au montage du formulaire
  useEffect(() => {
    const fetchDemandes = async () => {
      setLoadingDemandes(true)
      try {
        // On filtre par statut APPROUVEE (adapte la clé ou la valeur selon ton API Laravel)
        const res = await demandesApi.list({ statut: 'APPROUVEE', per_page: 100 })
        setDemandesApprouvees(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Erreur lors de la récupération des demandes approuvées", err)
      } finally {
        setLoadingDemandes(false)
      }
    }
    fetchDemandes()
  } // eslint-disable-next-line react-hooks/exhaustive-deps
  , [])

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
      <ErrorAlert message={error} />
      <div className="grid grid-cols-2 gap-4">
        
        {/* Remplacement de l'input par un Select */}
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

  const stats = {
    total:    prets.length,
    enCours:  prets.filter(p => p.statut_pret === 'EN_COURS').length,
    enRetard: prets.filter(p => p.statut_pret === 'EN_RETARD').length,
    soldes:   prets.filter(p => p.statut_pret === 'SOLDE').length,
  }

  return (
    <div>
      <PageHeader
        title="Prêts"
        subtitle="Portefeuille de prêts actifs et archivés"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total prêts"  value={data?.meta?.total ?? '—'} icon={CreditCard}    color="brand" />
        <StatCard label="En cours"     value={stats.enCours}             icon={TrendingUp}     color="blue" />
        <StatCard label="En retard"    value={stats.enRetard}            icon={AlertTriangle}  color="red" />
        <StatCard label="Soldés"       value={stats.soldes}              icon={CheckCircle}    color="brand" />
      </div>

      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <select className="input w-52 py-2" value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}>
            {STATUTS.map(s => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
          </select>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
: error   ? <div className="p-6"><ErrorAlert message={error} /></div>
: prets.length === 0 ? <Empty message="Aucun prêt trouvé." />
: (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-surface-50 border-b border-surface-100">
        {/* 🌟 Changement ici : le dernier élément est 'Actions' */}
        <tr>{['Référence', 'Client', 'Montant demandé', 'Montant accordé', 'Taux', 'Début', 'Fin', 'Grâce', 'Statut', 'Actions'].map(h => <th key={h} className="th text-left py-3 px-4 text-xs font-semibold text-surface-800/60">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-surface-100">
        {prets.map(p => (
          <tr key={p.id} className="table-row hover:bg-surface-50/50 transition-colors">
            <td className="td font-mono text-xs font-medium text-brand-700">{p.reference}</td>
            <td className="td">{p.demande_credit?.client?.personne?.prenom} {p.demande_credit?.client?.personne?.nom}</td>
            <td className="td font-mono text-xs">{formatMontant(p.demande_credit?.montant_demande)}</td>
            <td className="td font-mono text-xs">{formatMontant(p.montant_accorde)}</td>
            <td className="td text-xs">{formatTaux(p.taux_interet)}</td>
            <td className="td text-xs">{formatDate(p.date_debut)}</td>
            <td className="td text-xs">{formatDate(p.date_fin)}</td>
            <td className="td text-xs text-center">{p.periode_grace} mois</td>
            <td className="td"><Badge statut={p.statut_pret} /></td>
            
            {/* 🌟 Double bouton d'action en fin de ligne */}
            <td className="td">
              <div className="flex items-center gap-1.5">
                {/* Bouton 1 : Voir la fiche générale du prêt */}
                <button 
                  onClick={() => navigate(`/prets/${p.id}`)} 
                  className="p-1.5 rounded-lg text-surface-600 hover:bg-brand-50 hover:text-brand-600 transition-colors" 
                  title="Voir la fiche du prêt"
                >
                  <Eye size={14} />
                </button>

                {/* Bouton 2 : Accéder directement aux échéances / tableau d'amortissement */}
                <button 
                  onClick={() => navigate(`/prets/${p.id}/echeances`)} // 👈 Ton lien vers la liste des échéances
                  className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-colors" 
                  title="Voir l'échéancier de paiements"
                >
                  <Calendar size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
        <div className="px-5 pb-4"><Pagination meta={data?.meta} onPageChange={setPage} /></div>
      </div>

      <Modal open={modal === 'create'} onClose={closeModal} title="Décaisser un prêt" size="lg">
        <PretForm onSave={handleCreate} loading={saving} error={saveErr} />
      </Modal>
    </div>
  )
}