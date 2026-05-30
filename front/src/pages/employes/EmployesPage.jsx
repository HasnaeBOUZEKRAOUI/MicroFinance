import { useState, useCallback, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Users, UserCheck } from 'lucide-react'
import { employesApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/helpers'
import { PageHeader, Modal, ConfirmDialog, Pagination, Spinner, Empty, ErrorAlert, StatCard } from '../../components/ui'

// Liste mise à jour avec tous les rôles gérés par l'application
const ROLES = ['ADMIN', 'AGENT_CREDIT', 'SUPERVISEUR', 'MANAGER']

function EmployeForm({ initial = {}, onSave, loading, error }) {
  const isEdit = !!initial?.id
  const [f, setF] = useState({
    prenom: '', nom: '', date_naissance: '', email: '', telephone: '',
    nom_utilisateur: '', mot_de_passe: '',
    role: 'AGENT_CREDIT', date_embauche: '', superviseur_id: '',
    ...initial,
    prenom: initial?.personne?.prenom ?? '',
    nom:    initial?.personne?.nom ?? '',
    email:  initial?.personne?.email ?? '',
  })
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
      <ErrorAlert message={error} />
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1">Identité</p>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Prénom *</label><input className="input" value={f.prenom} onChange={set('prenom')} required /></div>
        <div><label className="label">Nom *</label><input className="input" value={f.nom} onChange={set('nom')} required /></div>
        <div><label className="label">Date naissance *</label><input className="input" type="date" value={f.date_naissance} onChange={set('date_naissance')} required={!isEdit} /></div>
        <div><label className="label">Email *</label><input className="input" type="email" value={f.email} onChange={set('email')} required={!isEdit} /></div>
        <div><label className="label">Téléphone</label><input className="input" value={f.telephone} onChange={set('telephone')} /></div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/50 mb-1 pt-2">Compte & rôle</p>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Nom d'utilisateur *</label><input className="input" value={f.nom_utilisateur} onChange={set('nom_utilisateur')} required /></div>
        {!isEdit && <div><label className="label">Mot de passe *</label><input className="input" type="password" value={f.mot_de_passe} onChange={set('mot_de_passe')} required /></div>}
        <div>
          <label className="label">Rôle *</label>
          <select className="input" value={f.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="label">Date d'embauche *</label><input className="input" type="date" value={f.date_embauche} onChange={set('date_embauche')} required={!isEdit} /></div>
        <div><label className="label">ID Superviseur</label><input className="input" type="number" value={f.superviseur_id} onChange={set('superviseur_id')} /></div>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? '…' : isEdit ? 'Enregistrer' : 'Créer'}</button>
      </div>
    </form>
  )
}

export default function EmployesPage() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  // ── 1. MODIFICATION : Ajout du paramètre de recherche envoyé au serveur
  const fetcher = useCallback(() => employesApi.list({ page, search }), [page, search])
  
  // ── 2. MODIFICATION : Déclenchement automatique du hook lors du changement de page ou recherche
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, search])
  
  const employes = data?.data ?? []

  useEffect(() => {
    refresh()
  }, [refresh, page, search])

  const closeModal = () => { setModal(null); setSaveErr(''); setSelected(null) }

  const handleSave = async (form) => {
    setSaving(true); setSaveErr('')
    try {
      if (modal === 'create') await employesApi.create(form)
      else                    await employesApi.update(selected.id, form)
      closeModal(); refresh()
    } catch (e) { setSaveErr(e.response?.data?.message || 'Erreur.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try { await employesApi.delete(selected.id); closeModal(); refresh() }
    finally { setSaving(false) }
  }

  const roleColor = {
    ADMIN: 'bg-purple-100 text-purple-700',
    AGENT_CREDIT: 'bg-blue-100 text-blue-700',
    CAISSIER: 'bg-amber-100 text-amber-700',
    DIRECTEUR: 'bg-brand-100 text-brand-700',
    SUPERVISEUR: 'bg-sky-100 text-sky-700',
  }

  return (
    <div>
      <PageHeader
        title="Employés"
        subtitle="Équipe et gestion des accès"
        action={
          <button className="btn-primary" onClick={() => setModal('create')}>
            <Plus size={16} /> Nouvel employé
          </button>
        }
      />

      

      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input className="input pl-9 py-2" placeholder="Rechercher…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : employes.length === 0 ? <Empty message="Aucun employé trouvé." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-50 border-b border-surface-100">
                {/* ── 3. MODIFICATION : Alignement strict des th avec les td */}
                <tr>
                  {['ID', 'Nom complet', 'Nom utilisateur', 'Rôle', 'Embauche', ''].map(h => (
                    <th key={h} className="th py-3 px-4 text-left font-semibold text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {employes.map(e => (
                  /* tr configuré en align-middle pour centrer verticalement toutes les cellules */
                  <tr key={e.id} className="table-row hover:bg-surface-50/50 transition-colors align-middle">
                    <td className="td py-3 px-4 font-mono text-xs text-surface-800/60">#{e.id}</td>
                    <td className="td py-3 px-4 font-medium text-surface-900">{e.personne?.prenom} {e.personne?.nom}</td>
                    <td className="td py-3 px-4 text-xs font-mono text-surface-800/70">{e.nom_utilisateur}</td>
                    <td className="td py-3 px-4">
                      <span className={`badge ${roleColor[e.role] ?? 'bg-surface-100 text-surface-800'}`}>{e.role}</span>
                    </td>
                    <td className="td py-3 px-4 text-xs text-surface-800/80">{formatDate(e.date_embauche)}</td>
                   
                    <td className="td py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setSelected(e); setModal('edit') }} className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => { setSelected(e); setModal('delete') }} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
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

      <Modal open={modal === 'create'} onClose={closeModal} title="Nouvel employé" size="lg">
        <FormulaireEmployeCree onSave={handleSave} loading={saving} error={saveErr} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={closeModal} title="Modifier l'employé" size="lg">
        <FormulaireEmployeCree initial={selected} onSave={handleSave} loading={saving} error={saveErr} />
      </Modal>
      <ConfirmDialog open={modal === 'delete'} onClose={closeModal} onConfirm={handleDelete}
        title="Supprimer l'employé" message={`Supprimer l'employé #${selected?.id} ?`} loading={saving} />
    </div>
  )
}

const FormulaireEmployeCree = EmployeForm;