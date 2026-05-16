import { useState, useCallback ,useEffect} from 'react'
import { Plus, Search, Pencil, Trash2, Layers } from 'lucide-react'
import { produitsApi } from '../../api/services' // Ajustez selon votre arborescence
import { useApi } from '../../hooks/useApi'
import { PageHeader, Modal, ConfirmDialog, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'

const MODES = ['CONSTANT', 'DEGRESSIF', 'LINEAIRE', 'IN_FINE']

function ProduitForm({ initial = {}, onSave, loading, error }) {
  const isEdit = !!initial?.id
  const [f, setF] = useState({
    type_produit: '', famille_produit: '', montant_min: '', montant_max: '',
    taux_interet_min: '', taux_interet_max: '', mode_calcul: 'CONSTANT', actif: true,
    ...initial
  })

  // Permet de repasser en % pour l'affichage utilisateur lors de l'édition
  useEffect(() => {
    if (isEdit) {
      setF(p => ({
        ...p,
        taux_interet_min: initial.taux_interet_min
          ? parseFloat(initial.taux_interet_min) * 100
          : '',
        taux_interet_max: initial.taux_interet_max
          ? parseFloat(initial.taux_interet_max) * 100
          : ''
      }))
    }
  }, [isEdit, initial])
  const set = k => e => setF(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Transformation des taux % en décimales pour Laravel (ex: 12% -> 0.12)
    const dataToSave = {
      ...f,
      montant_min: parseFloat(f.montant_min),
      montant_max: parseFloat(f.montant_max),
      taux_interet_min: parseFloat(f.taux_interet_min) / 100,
      taux_interet_max: parseFloat(f.taux_interet_max) / 100,
    }
    onSave(dataToSave)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} />
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1">Caractéristiques de base</p>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Nom du produit *</label><input className="input" value={f.type_produit} onChange={set('type_produit')} required placeholder="Ex: Crédit Express" /></div>
        <div><label className="label">Famille de produit *</label><input className="input" value={f.famille_produit} onChange={set('famille_produit')} required placeholder="Ex: Consommation" /></div>
        <div><label className="label">Montant Minimum *</label><input className="input" type="number" value={f.montant_min} onChange={set('montant_min')} required /></div>
        <div><label className="label">Montant Maximum *</label><input className="input" type="number" value={f.montant_max} onChange={set('montant_max')} required /></div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1 pt-2">Barèmes & Paramètres</p>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Taux Annuel Min (%) *</label><input className="input" type="number" step="0.01" value={f.taux_interet_min} onChange={set('taux_interet_min')} required placeholder="Ex: 5" /></div>
        <div><label className="label">Taux Annuel Max (%) *</label><input className="input" type="number" step="0.01" value={f.taux_interet_max} onChange={set('taux_interet_max')} required placeholder="Ex: 15" /></div>
        <div>
          <label className="label">Mode de calcul *</label>
          <select className="input" value={f.mode_calcul} onChange={set('mode_calcul')}>
            {MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" id="actif" checked={f.actif} onChange={set('actif')} className="rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
          <label htmlFor="actif" className="text-sm font-medium text-surface-900 select-none">Produit Actif</label>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? '…' : isEdit ? 'Enregistrer' : 'Créer'}</button>
      </div>
    </form>
  )
}

export default function ProduitsPage() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  const fetcher = useCallback(
    () => produitsApi.list({ page, search }),
    [page, search]
  )
    const { data, loading, error, execute: refresh } = useApi(fetcher, [page])

const produits = Array.isArray(data)
  ? data
  : data?.data ?? []

const meta = data?.meta
  
 
  // ── AJOUTEZ CE BLOC ICI ──────────────────────────────────────────
  // Cela force le hook useApi à s'exécuter dès que la page s'affiche
  useEffect(() => {
    refresh()
  }, [refresh, page])
  const closeModal = () => { setModal(null); setSaveErr(''); setSelected(null) }

  const handleSave = async (form) => {
    setSaving(true); setSaveErr('')
    try {
      if (modal === 'create') await produitsApi.create(form)
      else                    await produitsApi.update(selected.id, form)
      closeModal(); refresh()
    } catch (e) { setSaveErr(e.response?.data?.message || 'Erreur.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try { await produitsApi.delete(selected.id); closeModal(); refresh() }
    finally { setSaving(false) }
  }

  const modeColor = {
    CONSTANT: 'bg-blue-100 text-blue-700',
    DEGRESSIF: 'bg-purple-100 text-purple-700',
    LINEAIRE: 'bg-amber-100 text-amber-700',
    IN_FINE: 'bg-indigo-100 text-indigo-700',
  }

  return (
    <div>
      <PageHeader
        title="Produits de Crédit"
        subtitle="Configuration des offres de financement"
        action={
          <button className="btn-primary" onClick={() => setModal('create')}>
            <Plus size={16} /> Nouveau produit
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
      <StatCard
  label="Total produits"
  value={meta?.total ?? produits.length}
  icon={Layers}
  color="brand"
/>     <StatCard label="Produits actifs" value={produits.filter(p => p.actif).length} icon={Layers} color="blue" />
      </div>

      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input className="input pl-9 py-2" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : produits.length === 0 ? <Empty message="Aucun produit trouvé." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>{['ID', 'Désignation', 'Fourchette Montants', 'Taux d\'intérêt', 'Mode de calcul', 'Statut', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
              {produits.filter(p =>
                        (p.type_produit || '')
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||

                        (p.famille_produit || '')
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="td font-mono text-xs text-surface-800/60">#{p.id}</td>
                    <td className="td font-medium">
                      <div>{p.type_produit}</div>
                      <div className="text-[11px] font-normal text-surface-800/50 mt-0.5">{p.famille_produit}</div>
                    </td>
                    <td className="td text-xs font-mono">
                      {parseFloat(p.montant_min).toLocaleString()} - {parseFloat(p.montant_max).toLocaleString()}
                    </td>
                    <td className="td text-xs font-mono">
                      {(parseFloat(p.taux_interet_min) * 100).toFixed(2)}% - {(parseFloat(p.taux_interet_max) * 100).toFixed(2)}%
                    </td>
                    <td className="td"><span className={`badge ${modeColor[p.mode_calcul] ?? 'bg-surface-100 text-surface-800'}`}>{p.mode_calcul}</span></td>
                    <td className="td">
                      {p.actif 
                        ? <span className="badge bg-emerald-100 text-emerald-700">Actif</span>
                        : <span className="badge bg-surface-100 text-surface-600">Inactif</span>
                      }
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(p); setModal('edit') }} className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => { setSelected(p); setModal('delete') }} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
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

      <Modal open={modal === 'create'} onClose={closeModal} title="Nouveau produit" size="lg">
        <FormulaireProduitCree onSave={handleSave} loading={saving} error={saveErr} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={closeModal} title="Modifier le produit" size="lg">
        <FormulaireProduitCree initial={selected} onSave={handleSave} loading={saving} error={saveErr} />
      </Modal>
      <ConfirmDialog open={modal === 'delete'} onClose={closeModal} onConfirm={handleDelete}
        title="Supprimer le produit" message={`Supprimer le produit de crédit #${selected?.id} ?`} loading={saving} />
    </div>
  )
}

// Alias interne pour matcher le composant enfant
const FormulaireProduitCree = ProduitForm;