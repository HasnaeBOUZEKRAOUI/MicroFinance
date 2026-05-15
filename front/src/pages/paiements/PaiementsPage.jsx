import { useState, useCallback } from 'react'
import { Plus, Search, Trash2, CheckCircle } from 'lucide-react'
import { paiementsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant } from '../../utils/helpers'
import { PageHeader, Modal, ConfirmDialog, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'
import { DollarSign, TrendingUp, XCircle } from 'lucide-react'

function PaiementForm({ onSave, loading, error }) {
  const [f, setF] = useState({
    echeance_id: '', employe_id: '',
    date_paiement: new Date().toISOString().split('T')[0],
    montant: '', mode_paiement: 'ESPECES',
    reference_transaction: '', observation: '',
  })
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const MODES = ['ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY', 'PRELEVEMENT']
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
      <ErrorAlert message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">ID Échéance *</label><input className="input" type="number" value={f.echeance_id} onChange={set('echeance_id')} required /></div>
        <div><label className="label">ID Employé (caissier)</label><input className="input" type="number" value={f.employe_id} onChange={set('employe_id')} /></div>
        <div><label className="label">Date de paiement *</label><input className="input" type="date" value={f.date_paiement} onChange={set('date_paiement')} required /></div>
        <div><label className="label">Montant (MAD) *</label><input className="input" type="number" step="0.01" value={f.montant} onChange={set('montant')} required /></div>
        <div>
          <label className="label">Mode de paiement *</label>
          <select className="input" value={f.mode_paiement} onChange={set('mode_paiement')}>
            {MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div><label className="label">Réf. transaction</label><input className="input" value={f.reference_transaction} onChange={set('reference_transaction')} /></div>
        <div className="col-span-2"><label className="label">Observation</label><textarea className="input h-20 resize-none" value={f.observation} onChange={set('observation')} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? '…' : 'Enregistrer le paiement'}</button>
      </div>
    </form>
  )
}

const modeColor = {
  ESPECES:      'bg-emerald-100 text-emerald-700',
  VIREMENT:     'bg-blue-100 text-blue-700',
  CHEQUE:       'bg-amber-100 text-amber-700',
  MOBILE_MONEY: 'bg-purple-100 text-purple-700',
  PRELEVEMENT:  'bg-sky-100 text-sky-700',
}

export default function PaiementsPage() {
  const [page, setPage]         = useState(1)
  const [dateDebut, setDebut]   = useState('')
  const [dateFin, setFin]       = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  const fetcher = useCallback(() =>
    paiementsApi.list({ page, date_debut: dateDebut || undefined, date_fin: dateFin || undefined }),
    [page, dateDebut, dateFin]
  )
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, dateDebut, dateFin])
  const paiements = data?.data ?? []

  const closeModal = () => { setModal(null); setSaveErr(''); setSelected(null) }

  const handleCreate = async (form) => {
    setSaving(true); setSaveErr('')
    try { await paiementsApi.create(form); closeModal(); refresh() }
    catch (e) { setSaveErr(e.response?.data?.message || 'Erreur.') }
    finally { setSaving(false) }
  }

  const handleAnnuler = async () => {
    setSaving(true)
    try { await paiementsApi.annuler(selected.id); closeModal(); refresh() }
    finally { setSaving(false) }
  }

  const totalMontant = paiements.reduce((s, p) => s + parseFloat(p.montant ?? 0), 0)
  const valides      = paiements.filter(p => p.est_valide).length
  const annules      = paiements.filter(p => !p.est_valide).length

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle="Historique de tous les paiements enregistrés"
        action={<button className="btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Nouveau paiement</button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total encaissé" value={formatMontant(totalMontant)} icon={DollarSign}  color="brand" />
        <StatCard label="Paiements valides" value={valides}                  icon={CheckCircle}  color="blue" />
        <StatCard label="Annulés"           value={annules}                  icon={XCircle}      color="red" />
      </div>

      <div className="card p-0">
        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-surface-800/60 uppercase tracking-wide">Du</label>
            <input className="input py-2 w-40" type="date" value={dateDebut} onChange={e => { setDebut(e.target.value); setPage(1) }} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-surface-800/60 uppercase tracking-wide">Au</label>
            <input className="input py-2 w-40" type="date" value={dateFin} onChange={e => { setFin(e.target.value); setPage(1) }} />
          </div>
          {(dateDebut || dateFin) && (
            <button className="btn-secondary py-2 text-xs" onClick={() => { setDebut(''); setFin('') }}>Réinitialiser</button>
          )}
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : error   ? <div className="p-6"><ErrorAlert message={error} /></div>
        : paiements.length === 0 ? <Empty message="Aucun paiement trouvé." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>{['ID', 'Échéance', 'Date', 'Montant', 'Mode', 'Réf. transaction', 'Caissier', 'Statut', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} className={`table-row ${!p.est_valide ? 'opacity-50' : ''}`}>
                    <td className="td font-mono text-xs text-surface-800/60">#{p.id}</td>
                    <td className="td text-xs">Éch. #{p.echeance_id}</td>
                    <td className="td text-xs">{formatDate(p.date_paiement)}</td>
                    <td className="td font-mono text-sm font-semibold text-brand-700">{formatMontant(p.montant)}</td>
                    <td className="td"><span className={`badge ${modeColor[p.mode_paiement] ?? 'bg-surface-100 text-surface-800'}`}>{p.mode_paiement?.replace('_', ' ')}</span></td>
                    <td className="td font-mono text-xs text-surface-800/60">{p.reference_transaction ?? '—'}</td>
                    <td className="td text-xs">{p.employe?.personne?.prenom ?? '—'}</td>
                    <td className="td">
                      {p.est_valide
                        ? <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle size={10} className="mr-1" />Valide</span>
                        : <span className="badge bg-surface-100 text-surface-800">Annulé</span>}
                    </td>
                    <td className="td">
                      {p.est_valide && (
                        <button onClick={() => { setSelected(p); setModal('annuler') }} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Annuler">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 pb-4"><Pagination meta={data?.meta} onPageChange={setPage} /></div>
      </div>

      <Modal open={modal === 'create'} onClose={closeModal} title="Nouveau paiement" size="lg">
        <PaiementForm onSave={handleCreate} loading={saving} error={saveErr} />
      </Modal>
      <ConfirmDialog
        open={modal === 'annuler'} onClose={closeModal} onConfirm={handleAnnuler}
        title="Annuler le paiement"
        message={`Voulez-vous annuler le paiement #${selected?.id} de ${formatMontant(selected?.montant)} ? L'échéance sera mise à jour.`}
        loading={saving}
      />
    </div>
  )
}