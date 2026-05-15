import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Search } from 'lucide-react'
import { pretsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant, formatTaux } from '../../utils/helpers'
import { PageHeader, Badge, Modal, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

function PretForm({ onSave, loading, error }) {
  const [f, setF] = useState({
    demande_credit_id: '', montant_accorde: '',
    date_debut: '', taux_interet: '', periode_grace: '0',
  })
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
      <ErrorAlert message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">ID Demande approuvée *</label><input className="input" type="number" value={f.demande_credit_id} onChange={set('demande_credit_id')} required /></div>
        <div><label className="label">Montant accordé (MAD) *</label><input className="input" type="number" step="0.01" value={f.montant_accorde} onChange={set('montant_accorde')} required /></div>
        <div><label className="label">Date de début *</label><input className="input" type="date" value={f.date_debut} onChange={set('date_debut')} required /></div>
        <div><label className="label">Taux d'intérêt annuel *</label><input className="input" type="number" step="0.0001" min="0" max="1" placeholder="ex: 0.1200" value={f.taux_interet} onChange={set('taux_interet')} required /></div>
        <div><label className="label">Période de grâce (mois)</label><input className="input" type="number" min="0" value={f.periode_grace} onChange={set('periode_grace')} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? '…' : 'Décaisser le prêt'}</button>
      </div>
    </form>
  )
}

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
        action={<button className="btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Décaisser un prêt</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total prêts"  value={data?.meta?.total ?? '—'} icon={CreditCard}    color="brand" />
        <StatCard label="En cours"     value={stats.enCours}            icon={TrendingUp}     color="blue" />
        <StatCard label="En retard"    value={stats.enRetard}           icon={AlertTriangle}  color="red" />
        <StatCard label="Soldés"       value={stats.soldes}             icon={CheckCircle}    color="brand" />
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
                <tr>{['Référence', 'Client', 'Montant accordé', 'Taux', 'Début', 'Fin', 'Grâce', 'Statut', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {prets.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="td font-mono text-xs font-medium text-brand-700">{p.reference}</td>
                    <td className="td">{p.demande_credit?.client?.personne?.prenom} {p.demande_credit?.client?.personne?.nom}</td>
                    <td className="td font-mono text-xs">{formatMontant(p.montant_accorde)}</td>
                    <td className="td text-xs">{formatTaux(p.taux_interet)}</td>
                    <td className="td text-xs">{formatDate(p.date_debut)}</td>
                    <td className="td text-xs">{formatDate(p.date_fin)}</td>
                    <td className="td text-xs text-center">{p.periode_grace} mois</td>
                    <td className="td"><Badge statut={p.statut_pret} /></td>
                    <td className="td">
                      <button onClick={() => navigate(`/prets/${p.id}`)} className="p-1.5 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors" title="Voir l'échéancier">
                        <Eye size={14} />
                      </button>
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