import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Eye, CheckCircle, XCircle, FileText, Clock, 
  ThumbsUp, ThumbsDown, UserPlus, ShieldCheck 
} from 'lucide-react'
import { demandesApi, clientsApi, produitsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant } from '../../utils/helpers'
import { 
  PageHeader, Badge, Modal, Pagination, Empty, ErrorAlert, StatCard ,Spinner
} from '../../components/ui'

// ── 1. MODALE DÉDIÉE POUR AJOUTER UN GARANT (Slide 35) ──────────────────────────
function AjouterGarantModal({ open, onClose, onSave, initialGarant }) {
  const [g, setG] = useState({
    nom: '', prenom: '', cin: '', telephone: '', email: '',
    relation_client: 'Famille', revenu_mensuel: '', employeur: '',
    ...initialGarant
  })

  const set = k => e => setG(p => ({ ...p, [k]: e.target.value }))

  const handleValid = () => {
    onSave(g)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Informations détaillées du Garant" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nom *</label><input className="input" value={g.nom} onChange={set('nom')} required /></div>
          <div><label className="label">Prénom *</label><input className="input" value={g.prenom} onChange={set('prenom')} required /></div>
          <div><label className="label">N° CIN *</label><input className="input font-mono uppercase" value={g.cin} onChange={set('cin')} required /></div>
          <div><label className="label">Téléphone *</label><input className="input" value={g.telephone} onChange={set('telephone')} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={g.email} onChange={set('email')} /></div>
          <div>
            <label className="label">Relation avec le client *</label>
            <select className="input" value={g.relation_client} onChange={set('relation_client')}>
              <option value="Famille">Famille</option>
              <option value="Ami">Ami</option>
              <option value="Collègue">Collègue</option>
              <option value="Professionnelle">Professionnelle</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div><label className="label">Revenu mensuel (MAD) *</label><input className="input" type="number" step="0.01" value={g.revenu_mensuel} onChange={set('revenu_mensuel')} required /></div>
          <div><label className="label">Employeur / Société</label><input className="input" value={g.employeur} onChange={set('employeur')} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="btn-primary" onClick={handleValid}>
            Valider le garant
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── 2. FORMULAIRE PRINCIPAL DE DEMANDE DE CRÉDIT ─────────────────────────────────
function DemandeForm({ onSave, loading, error }) {
  const [f, setF] = useState({
    client_id: '', produit_credit_id: '', montant_demande: '',
    duree_demandee: '', objet_pret: '', garantie: '',
  })
  const [garant, setGarant] = useState(null)
  const [showGarantModal, setShowGarantModal] = useState(false)

  // Chargement des listes de sélection depuis l'API globale
  const { data: clientOptions, loading: loadingClients } = useApi(clientsApi.options)
  const { data: produitOptions, loading: loadingProduits } = useApi(produitsApi.options)

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...f, garant })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} />
      
      <div className="grid grid-cols-2 gap-4">
        {/* Sélection du Client */}
        <div>
          <label className="label">Client bénéficiaire *</label>
          {loadingClients ? (
            <div className="text-xs text-surface-800/50 pt-2 flex items-center gap-2">
              <Spinner className="w-3 h-3" /> Chargement du portefeuille clients...
            </div>
          ) : (
            <select className="input" value={f.client_id} onChange={set('client_id')} required>
              <option value="">-- Choisir un client --</option>
              {clientOptions?.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Sélection du Produit de Crédit */}
        <div>
          <label className="label">Produit de crédit *</label>
          {loadingProduits ? (
            <div className="text-xs text-surface-800/50 pt-2 flex items-center gap-2">
              <Spinner className="w-3 h-3" /> Chargement des barèmes...
            </div>
          ) : (
            <select className="input" value={f.produit_credit_id} onChange={set('produit_credit_id')} required>
              <option value="">-- Choisir un produit --</option>
              {produitOptions?.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="label">Montant demandé (MAD) *</label>
          <input className="input" type="number" step="0.01" value={f.montant_demande} onChange={set('montant_demande')} required />
        </div>
        
        <div>
          <label className="label">Durée (mois) *</label>
          <input className="input" type="number" min="1" max="360" value={f.duree_demandee} onChange={set('duree_demandee')} required />
        </div>

        <div className="col-span-2">
          <label className="label">Objet du prêt *</label>
          <input className="input" value={f.objet_pret} onChange={set('objet_pret')} required placeholder="Ex: Financement de matières premières, matériel..." />
        </div>

        <div className="col-span-2">
          <label className="label">Nature de la Garantie physique</label>
          <input className="input" value={f.garantie} onChange={set('garantie')} placeholder="Optionnelle (ex: Hypothèque, Gage, Stock...)" />
        </div>
      </div>

      {/* Section interactive d'affectation de la Caution solidaire (Garant) */}
      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 mt-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-900">Caution solidaire (Garant personnel)</p>
          <p className="text-xs text-surface-800/50">
            {garant ? `Garant configuré : ${garant.prenom} ${garant.nom}` : "Aucun garant rattaché pour le moment."}
          </p>
        </div>
        <button type="button" onClick={() => setShowGarantModal(true)} className={`btn text-xs px-3 py-1.5 flex items-center gap-1.5 ${garant ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'btn-secondary'}`}>
          {garant ? <ShieldCheck size={14} /> : <UserPlus size={14} />}
          {garant ? 'Modifier le garant' : 'Ajouter un garant'}
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading || loadingClients || loadingProduits}>
          {loading ? 'Traitement...' : 'Soumettre la demande'}
        </button>
      </div>

      <AjouterGarantModal open={showGarantModal} onClose={() => setShowGarantModal(false)} onSave={setGarant} initialGarant={garant} />
    </form>
  )
}

function RejetModal({ open, onClose, onConfirm, loading }) {
  const [motif, setMotif] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Rejeter la demande" size="sm">
      <div className="space-y-4">
        <div><label className="label">Motif de rejet *</label>
          <textarea className="input h-24 resize-none" value={motif} onChange={e => setMotif(e.target.value)} placeholder="Expliquez la raison du rejet…" />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-danger" onClick={() => onConfirm(motif)} disabled={!motif || loading}>Rejeter</button>
        </div>
      </div>
    </Modal>
  )
}

// ── 3. COMPOSANT DE LA PAGE PRINCIPALE ───────────────────────────────────────────
export default function DemandesPage() {
  const navigate = useNavigate()
  const [page, setPage]         = useState(1)
  const [statut, setStatut]     = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  const fetcher = useCallback(() => demandesApi.list({ page, statut: statut || undefined }), [page, statut])
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, statut])
  const demandes = data?.data ?? []

  const closeModal = () => { setModal(null); setSaveErr(''); setSelected(null) }

  const handleCreate = async (form) => {
    setSaving(true); setSaveErr('')
    try { await demandesApi.create(form); closeModal(); refresh() }
    catch (e) { setSaveErr(e.response?.data?.message || 'Erreur lors de la soumission.') }
    finally { setSaving(false) }
  }

  const handleApprouver = async (d) => {
    setSaving(true)
    try { await demandesApi.approuver(d.id); refresh() }
    finally { setSaving(false) }
  }

  const handleRejeter = async (motif) => {
    setSaving(true)
    try { await demandesApi.rejeter(selected.id, { motif_rejet: motif }); closeModal(); refresh() }
    finally { setSaving(false) }
  }

  const STATUTS = ['', 'EN_ATTENTE', 'EN_COURS_ANALYSE', 'APPROUVEE', 'REJETEE', 'DECAISSEE']

  return (
    <div>
      <PageHeader
        title="Demandes de crédit"
        subtitle="Suivi et traitement des demandes"
        action={<button className="btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Nouvelle demande</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={data?.meta?.total ?? '—'} icon={FileText} color="brand" />
        <StatCard label="En attente" value={data?.meta?.total ? demandes.filter(d => d.statut_demande === 'EN_ATTENTE').length : '—'} icon={Clock} color="amber" />
        <StatCard label="Approuvées" value={data?.meta?.total ? demandes.filter(d => d.statut_demande === 'APPROUVEE').length : '—'} icon={ThumbsUp} color="blue" />
        <StatCard label="Rejetées"   value={data?.meta?.total ? demandes.filter(d => d.statut_demande === 'REJETEE').length : '—'}  icon={ThumbsDown} color="red" />
      </div>

      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <select className="input w-48 py-2" value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}>
            {STATUTS.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'Tous les statuts'}</option>)}
          </select>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : demandes.length === 0 ? <Empty message="Aucune demande trouvée." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {['ID', 'Client', 'Produit', 'Montant', 'Durée', 'Soumission', 'Statut', ''].map(h => (
                    <th key={h} className="th py-3 px-4 text-left font-semibold text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {demandes.map(d => (
                  <tr key={d.id} className="table-row hover:bg-surface-50/50 transition-colors align-middle">
                    <td className="td py-3 px-4 font-mono text-xs text-surface-800/60">#{d.id}</td>
                    <td className="td py-3 px-4 font-medium text-surface-900">{d.client?.personne?.prenom} {d.client?.personne?.nom}</td>
                    <td className="td py-3 px-4 text-xs text-surface-800/80">{d.produit_credit?.type_produit ?? '—'}</td>
                    <td className="td py-3 px-4 font-mono text-xs text-surface-900">{formatMontant(d.montant_demande)}</td>
                    <td className="td py-3 px-4 text-xs text-surface-800/80">{d.duree_demandee} mois</td>
                    <td className="td py-3 px-4 text-xs text-surface-800/80">{formatDate(d.date_soumission)}</td>
                    <td className="td py-3 px-4"><Badge statut={d.statut_demande} /></td>
                    <td className="td py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => navigate(`/demandes/${d.id}`)} className="p-1.5 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors" title="Voir"><Eye size={14} /></button>
                        {d.statut_demande === 'EN_COURS_ANALYSE' && <>
                          <button onClick={() => handleApprouver(d)} className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Approuver"><CheckCircle size={14} /></button>
                          <button onClick={() => { setSelected(d); setModal('rejeter') }} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Rejeter"><XCircle size={14} /></button>
                        </>}
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

      <Modal open={modal === 'create'} onClose={closeModal} title="Nouvelle demande de crédit" size="lg">
        <DemandeForm onSave={handleCreate} loading={saving} error={saveErr} />
      </Modal>
      <RejetModal open={modal === 'rejeter'} onClose={closeModal} onConfirm={handleRejeter} loading={saving} />
    </div>
  )
}