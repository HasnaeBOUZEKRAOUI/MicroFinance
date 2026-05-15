import { useParams, useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { ArrowLeft, Plus, CheckCircle } from 'lucide-react'
import { pretsApi, paiementsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant, formatTaux } from '../../utils/helpers'
import { Spinner, ErrorAlert, Badge, Modal, StatCard } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function PaiementForm({ echeanceId, onSave, loading, error }) {
  const [f, setF] = useState({
    echeance_id: echeanceId, employe_id: '',
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
        <div><label className="label">Date de paiement *</label><input className="input" type="date" value={f.date_paiement} onChange={set('date_paiement')} required /></div>
        <div><label className="label">Montant (MAD) *</label><input className="input" type="number" step="0.01" value={f.montant} onChange={set('montant')} required /></div>
        <div>
          <label className="label">Mode de paiement *</label>
          <select className="input" value={f.mode_paiement} onChange={set('mode_paiement')}>
            {MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div><label className="label">Réf. transaction</label><input className="input" value={f.reference_transaction} onChange={set('reference_transaction')} /></div>
        <div><label className="label">ID Employé (caissier)</label><input className="input" type="number" value={f.employe_id} onChange={set('employe_id')} /></div>
        <div><label className="label">Observation</label><input className="input" value={f.observation} onChange={set('observation')} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? '…' : 'Enregistrer le paiement'}</button>
      </div>
    </form>
  )
}

export default function PretDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [modal, setModal]   = useState(null) // null | { echeanceId }
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const fetcher = useCallback(() => pretsApi.get(id), [id])
  const { data: pret, loading, error } = useApi(fetcher, [id])

  const echFetcher = useCallback(() => pretsApi.echeancier(id), [id])
  const { data: echData, loading: echLoading, execute: refreshEch } = useApi(echFetcher, [id])

  const echeances = echData?.echeances ?? []

  const handlePaiement = async (form) => {
    setSaving(true); setSaveErr('')
    try { await paiementsApi.create(form); setModal(null); refreshEch() }
    catch (e) { setSaveErr(e.response?.data?.message || 'Erreur lors du paiement.') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner className="w-7 h-7" /></div>
  if (error)   return <div className="p-6"><ErrorAlert message={error} /></div>
  if (!pret)   return null

  // Chart data
  const chartData = echeances.slice(0, 24).map(e => ({
    num: `E${e.numero_echeance}`,
    principal: parseFloat(e.montant_principal),
    interet:   parseFloat(e.montant_interet),
    paye:      parseFloat(e.montant_paye),
  }))

  const totalPaye  = echeances.reduce((s, e) => s + parseFloat(e.montant_paye ?? 0), 0)
  const totalDu    = echeances.reduce((s, e) => s + parseFloat(e.total_du ?? 0), 0)
  const progression = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-surface-800/60 hover:text-brand-600 mb-5 transition-colors">
        <ArrowLeft size={15} /> Retour aux prêts
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">{pret.reference}</h1>
          <p className="text-sm text-surface-800/50 mt-0.5">
            {pret.demande_credit?.client?.personne?.prenom} {pret.demande_credit?.client?.personne?.nom}
          </p>
        </div>
        <Badge statut={pret.statut_pret} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1">Montant accordé</p>
          <p className="font-display font-bold text-xl text-surface-900">{formatMontant(pret.montant_accorde)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1">Taux d'intérêt</p>
          <p className="font-display font-bold text-xl text-surface-900">{formatTaux(pret.taux_interet)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1">Période</p>
          <p className="font-display font-bold text-xl text-surface-900">{formatDate(pret.date_debut)} → {formatDate(pret.date_fin)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1">Capital restant</p>
          <p className="font-display font-bold text-xl text-brand-600">{formatMontant(echData?.solde_restant ?? pret.capital_restant)}</p>
        </div>
      </div>

      {/* Progression bar */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-surface-900">Progression du remboursement</span>
          <span className="font-mono text-sm font-bold text-brand-600">{progression}%</span>
        </div>
        <div className="h-3 rounded-full bg-surface-100 overflow-hidden">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${progression}%` }} />
        </div>
        <div className="flex justify-between text-xs text-surface-800/50 mt-2">
          <span>Payé : {formatMontant(totalPaye)}</span>
          <span>Total dû : {formatMontant(totalDu)}</span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-display font-semibold text-base mb-4">Répartition principal / intérêts (24 premières échéances)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={12}>
              <XAxis dataKey="num" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 8)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [formatMontant(v), n === 'principal' ? 'Principal' : 'Intérêts']} />
              <Bar dataKey="principal" stackId="a" fill="#1a9d74" radius={[0,0,0,0]} />
              <Bar dataKey="interet"   stackId="a" fill="#a9e6cc" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Échéancier */}
      <div className="card p-0">
        <div className="px-6 py-4 border-b border-surface-100">
          <h2 className="font-display font-semibold text-base">Échéancier ({echeances.length} échéances)</h2>
        </div>
        {echLoading ? <div className="flex justify-center py-10"><Spinner className="w-5 h-5" /></div>
        : echeances.length === 0 ? <p className="text-sm text-center text-surface-800/50 py-10">Aucune échéance générée.</p>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>{['N°', 'Date', 'Principal', 'Intérêts', 'Total dû', 'Payé', 'Retard', 'Statut', 'Action'].map(h => <th key={h} className="th text-center">{h}</th>)}</tr>
              </thead>
              <tbody>
                {echeances.map(e => (
                  <tr key={e.id} className={`table-row ${e.statut === 'EN_RETARD' ? 'bg-red-50/50' : ''}`}>
                    <td className="td text-center font-mono text-xs font-medium">{e.numero_echeance}</td>
                    <td className="td text-center text-xs">{formatDate(e.date_echeance)}</td>
                    <td className="td text-center font-mono text-xs">{formatMontant(e.montant_principal)}</td>
                    <td className="td text-center font-mono text-xs text-brand-600">{formatMontant(e.montant_interet)}</td>
                    <td className="td text-center font-mono text-xs font-semibold">{formatMontant(e.total_du)}</td>
                    <td className="td text-center font-mono text-xs text-emerald-600">{formatMontant(e.montant_paye)}</td>
                    <td className="td text-center text-xs">{e.jours_retard > 0 ? <span className="text-red-600 font-semibold">{e.jours_retard}j</span> : '—'}</td>
                    <td className="td text-center"><Badge statut={e.statut} /></td>
                    <td className="td text-center">
                      {e.statut !== 'PAYEE' && (
                        <button
                          onClick={() => { setSaveErr(''); setModal({ echeanceId: e.id }) }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                        >
                          <Plus size={11} /> Payer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paiement modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={`Paiement — Échéance #${modal?.echeanceId}`} size="lg">
        {modal && <PaiementForm echeanceId={modal.echeanceId} onSave={handlePaiement} loading={saving} error={saveErr} />}
      </Modal>
    </div>
  )
}