import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, CheckCircle, XCircle, UserPlus, BarChart2 } from 'lucide-react'
import { demandesApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant } from '../../utils/helpers'
import { PageHeader, Badge, Modal, ConfirmDialog, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'
import { FileText, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'

function DemandeForm({ onSave, loading, error }) {
  const [f, setF] = useState({
    client_id: '', produit_credit_id: '', montant_demande: '',
    duree_demandee: '', objet_pret: '', garantie: '', nom_garant: '',
  })
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
      <ErrorAlert message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">ID Client *</label><input className="input" type="number" value={f.client_id} onChange={set('client_id')} required /></div>
        <div><label className="label">ID Produit crédit *</label><input className="input" type="number" value={f.produit_credit_id} onChange={set('produit_credit_id')} required /></div>
        <div><label className="label">Montant demandé (MAD) *</label><input className="input" type="number" step="0.01" value={f.montant_demande} onChange={set('montant_demande')} required /></div>
        <div><label className="label">Durée (mois) *</label><input className="input" type="number" min="1" max="360" value={f.duree_demandee} onChange={set('duree_demandee')} required /></div>
        <div className="col-span-2"><label className="label">Objet du prêt *</label><input className="input" value={f.objet_pret} onChange={set('objet_pret')} required /></div>
        <div><label className="label">Garantie</label><input className="input" value={f.garantie} onChange={set('garantie')} /></div>
        <div><label className="label">Nom du garant</label><input className="input" value={f.nom_garant} onChange={set('nom_garant')} /></div>
      </div>
      <div className="flex justify-end pt-2"><button className="btn-primary" disabled={loading}>{loading ? '…' : 'Soumettre la demande'}</button></div>
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
    catch (e) { setSaveErr(e.response?.data?.message || 'Erreur.') }
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
        <StatCard label="En attente" value={demandes.filter(d => d.statut_demande === 'EN_ATTENTE').length} icon={Clock} color="amber" />
        <StatCard label="Approuvées" value={demandes.filter(d => d.statut_demande === 'APPROUVEE').length} icon={ThumbsUp} color="blue" />
        <StatCard label="Rejetées"   value={demandes.filter(d => d.statut_demande === 'REJETEE').length}   icon={ThumbsDown} color="red" />
      </div>

      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <select className="input w-48 py-2" value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}>
            {STATUTS.map(s => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
          </select>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : demandes.length === 0 ? <Empty message="Aucune demande trouvée." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>{['ID', 'Client', 'Produit', 'Montant', 'Durée', 'Soumission', 'Statut', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="td font-mono text-xs text-surface-800/60">#{d.id}</td>
                    <td className="td font-medium">{d.client?.personne?.prenom} {d.client?.personne?.nom}</td>
                    <td className="td text-xs">{d.produit_credit?.type_produit ?? '—'}</td>
                    <td className="td font-mono text-xs">{formatMontant(d.montant_demande)}</td>
                    <td className="td text-xs">{d.duree_demandee} mois</td>
                    <td className="td text-xs">{formatDate(d.date_soumission)}</td>
                    <td className="td"><Badge statut={d.statut_demande} /></td>
                    <td className="td">
                      <div className="flex items-center gap-1">
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