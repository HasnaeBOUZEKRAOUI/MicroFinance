import { useState, useCallback, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Layers } from 'lucide-react'
import { produitsApi } from '../../api/services' 
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext' 
import { formatDate } from '../../utils/helpers'
import { PageHeader, Modal, ConfirmDialog, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'

const MODES = ['CONSTANT', 'DEGRESSIF', 'LINEAIRE', 'IN_FINE']

function ProduitForm({ initial = {}, onSave, loading, error }) {
  const isEdit = !!initial?.id
  const [f, setF] = useState({
    type_produit: '', famille_produit: '', montant_min: '', montant_max: '',
    taux_interet_min: '', taux_interet_max: '', mode_calcul: 'CONSTANT', actif: true,
    date_debut: '', date_fin: '', 
    ...initial
  })

  useEffect(() => {
    if (isEdit) {
      setF(p => ({
        ...p,
        taux_interet_min: initial.taux_interet_min ? parseFloat(initial.taux_interet_min) * 100 : '',
        taux_interet_max: initial.taux_interet_max ? parseFloat(initial.taux_interet_max) * 100 : '',
        date_debut: initial.date_debut ? initial.date_debut.split('T')[0] : '',
        date_fin: initial.date_fin ? initial.date_fin.split('T')[0] : ''
      }))
    }
  }, [isEdit, initial])

  const set = k => e => setF(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataToSave = {
      ...f,
      montant_min: parseFloat(f.montant_min),
      montant_max: parseFloat(f.montant_max),
      taux_interet_min: parseFloat(f.taux_interet_min) / 100,
      taux_interet_max: parseFloat(f.taux_interet_max) / 100,
      date_debut: f.date_debut || null,
      date_fin: f.date_fin || null
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
        <div><label className="label">Taux intérêt Min (%) *</label><input className="input" type="number" step="0.01" value={f.taux_interet_min} onChange={set('taux_interet_min')} required placeholder="Ex: 5" /></div>
        <div><label className="label">Taux intérêt Max (%) *</label><input className="input" type="number" step="0.01" value={f.taux_interet_max} onChange={set('taux_interet_max')} required placeholder="Ex: 15" /></div>
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

      <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1 pt-2">Période de Validité</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date de début</label>
          <input className="input" type="date" value={f.date_debut} onChange={set('date_debut')} />
        </div>
        <div>
          <label className="label">Date de fin</label>
          <input className="input" type="date" value={f.date_fin} onChange={set('date_fin')} min={f.date_debut} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? '…' : isEdit ? 'Enregistrer' : 'Créer'}</button>
      </div>
    </form>
  )
}

export default function ProduitsPage() {
  const { user } = useAuth() 
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  const fetcher = useCallback(() => produitsApi.list({ page, search }), [page, search])
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page])

  // Sécurité sur la récupération de la liste des produits
  const produits = Array.isArray(data) ? data : data?.data ?? []
  const meta = data?.meta
  
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

  // Filtrage sécurisé (évite les crashs si type_produit ou famille_produit est null/undefined)
  const produitsFilitres = produits.filter(p => {
    const nom = p?.type_produit ? String(p.type_produit).toLowerCase() : ''
    const famille = p?.famille_produit ? String(p.famille_produit).toLowerCase() : ''
    const recherche = search.toLowerCase()
    return nom.includes(recherche) || famille.includes(recherche)
  })

  return (
    <div>
      <PageHeader
        title="Produits de Crédit"
        subtitle="Configuration des offres de financement"
        action={
          user?.role === 'ADMIN' && (
            <button className="btn-primary" onClick={() => setModal('create')}>
              <Plus size={16} /> Nouveau produit
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Total produits" value={meta?.total ?? produits.length} icon={Layers} color="brand" />
        <StatCard label="Produits actifs" value={produits.filter(p => p?.actif).length} icon={Layers} color="blue" />
      </div>

      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input className="input pl-9 py-2" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : produitsFilitres.length === 0 ? <Empty message="Aucun produit trouvé." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="th py-3 px-4 text-left font-semibold text-sm">ID</th>
                  <th className="th py-1 px-4 text-left font-semibold text-sm">Désignation</th>
                  <th className="th py-3 px-4 text-left font-semibold text-sm">Fourchette Montants DH</th>
                  <th className="th py-3 px-4 text-left font-semibold text-sm">Taux d'intérêt</th>
                  <th className="th py-3 px-4 text-left font-semibold text-sm">Mode de calcul</th>
                  <th className="th py-3 px-4 text-left font-semibold text-sm">Validité</th>
                  <th className="th py-3 px-4 text-left font-semibold text-sm">Statut</th>
                  <th className="th py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {produitsFilitres.map(p => (
                  <tr key={p.id} className="table-row hover:bg-surface-50/50 transition-colors align-middle">
                    <td className="td py-3 px-4 font-mono text-xs text-surface-800/60">#{p.id}</td>
                    <td className="td py-3 px-4">
                      <div className="font-medium text-surface-900">{p.type_produit}</div>
                      <div className="text-[11px] text-surface-800/50 mt-0.5">{p.famille_produit}</div>
                    </td>
                    <td className="td py-3 px-4 text-xs font-mono text-surface-900">
                      {p.montant_min ? parseFloat(p.montant_min).toLocaleString() : 0} - {p.montant_max ? parseFloat(p.montant_max).toLocaleString() : 0}
                    </td>
                    <td className="td py-3 px-4 text-xs font-mono text-surface-900">
                      {p.taux_interet_min ? (parseFloat(p.taux_interet_min) * 100).toFixed(2) : '0.00'}% - {p.taux_interet_max ? (parseFloat(p.taux_interet_max) * 100).toFixed(2) : '0.00'}%
                    </td>
                    <td className="td py-3 px-4">
                      {/* Utilisation sécurisée d'une classe standard au lieu d'un composant Badge externe potentiellement conflictuel */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${modeColor[p.mode_calcul] ?? 'bg-surface-100 text-surface-800'}`}>
                        {p.mode_calcul}
                      </span>
                    </td>
                    <td className="td py-3 px-4 text-xs text-surface-800/70">
                      <div className="flex flex-col gap-0.5 justify-center">
                        <span>Du : {p.date_debut ? formatDate(p.date_debut) : '—'}</span>
                        <span>Au : {p.date_fin ? formatDate(p.date_fin) : '—'}</span>
                      </div>
                    </td>
                    <td className="td py-3 px-4">
                      {p.actif 
                        ? <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Actif</span>
                        : <span className="px-2 py-1 rounded text-xs font-medium bg-surface-100 text-surface-600">Inactif</span>
                      }
                    </td>
                    <td className="td py-3 px-4">
                      <div className="flex items-center gap-1 justify-end min-w-[60px]">
                        {user?.role === 'admin' ? (
                          <>
                            <button onClick={() => { setSelected(p); setModal('edit') }} className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => { setSelected(p); setModal('delete') }} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                          </>
                        ) : (
                          // Laisse un espace propre ou un texte descriptif léger si c'est le manager (lecture seule)
                          <span className="text-[11px] text-surface-800/40 italic pr-2">Lecture</span>
                        )}
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

const FormulaireProduitCree = ProduitForm;