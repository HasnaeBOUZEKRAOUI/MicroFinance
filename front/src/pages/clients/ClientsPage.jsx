import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, ShieldAlert, Star } from 'lucide-react'
import { clientsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMontant } from '../../utils/helpers'
import {
  PageHeader, Badge, Modal, ConfirmDialog,
  Pagination, Spinner, Empty, ErrorAlert, StatCard
} from '../../components/ui'
import { Users, UserCheck, AlertTriangle } from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────
const TITRES          = ['M.', 'Mme', 'Mlle', 'Dr', 'Pr']
const GENRES          = ['HOMME', 'FEMME', 'AUTRE']
const SITUATIONS      = ['CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF', 'UNION_LIBRE']
const PIECES          = ['CIN', 'Passeport', 'Permis', 'Carte de séjour', 'Titre de séjour']
const SECTEURS        = ['Agriculture', 'Commerce', 'Artisanat', 'Services', 'Industrie', 'Transport', 'Autre']
const CATEGORIES      = ['Micro-entrepreneur', 'Salarié', 'Commerçant', 'Agriculteur', 'Artisan', 'Autre']
const NIVEAUX_ETUDE   = ['Aucun', 'Primaire', 'Collège', 'Lycée', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat']
const LANGUES         = ['Arabe', 'Français', 'Anglais', 'Amazigh', 'Espagnol']

// ── Tabs du formulaire ────────────────────────────────────────────
const TABS = [
  { id: 'identite',     label: 'Identité' },
  { id: 'infos',        label: 'Infos clients' },
  { id: 'adresse',      label: 'Adresse' },
  { id: 'credit',       label: 'Profil crédit' },
]

const INITIAL_FORM = {
  // Identité
  personne_id: '', employe_id: '', nil: '', est_vip: false,
  type_piece_identite: 'CIN', numero_piece_identite: '',
  date_expiration_piece: '',
  // Infos clients
  categorie_client: '', titre: 'M.', fonction: '',
  secteur_activite: '', niveau_etude: '', nom_mere: '',
  genre: 'HOMME', langue: 'Arabe',
  pays_naissance: 'Maroc', ville_naissance: '',
  situation_familiale: 'CELIBATAIRE', nombre_enfants: 0,
  nom_conjoint: '', prenom_conjoint: '',
  // Adresse
  telephone_secondaire: '', email_client: '',
  code_postal: '', adresse_1: '', adresse_2: '',
  ville: '', pays: 'Maroc', coordonnees_gps: '',
  // Crédit
  nationalite: 'Marocaine', revenu_mensuel: '',
  score_eligibilite: '',
}

// ── Composant formulaire multi-onglets ────────────────────────────
function ClientForm({ initial = {}, onSave, loading, error }) {
  const [activeTab, setActiveTab] = useState('identite')
  const [f, setF] = useState({ ...INITIAL_FORM, ...initial })
  const set  = k => e   => setF(p => ({ ...p, [k]: e.target.value }))
  const setB = k => e   => setF(p => ({ ...p, [k]: e.target.checked }))
  const setN = k => e   => setF(p => ({ ...p, [k]: parseInt(e.target.value) || 0 }))

  const inputClass = "input"
  const sel = (k, options) => (
    <select className={inputClass} value={f[k]} onChange={set(k)}>
      <option value="">-- Choisir --</option>
      {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  )

  return (
    <div>
      {/* Onglets */}
      <div className="flex border-b border-surface-100 mb-6 -mx-6 px-6">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-surface-800/60 hover:text-surface-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); onSave(f) }} className="space-y-4">
        <ErrorAlert message={error} />

        {/* ── Onglet Identité ──────────────────────────────────── */}
        {activeTab === 'identite' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-800/40">Identification légale</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">NIL — Numéro d'Identification Légal *</label>
                <input className={inputClass} value={f.nil} onChange={set('nil')} required placeholder="Unique et obligatoire" />
              </div>
              <div>
                <label className="label">ID Personne *</label>
                <input className={inputClass} type="number" value={f.personne_id} onChange={set('personne_id')} required />
              </div>
              <div>
                <label className="label">Type de pièce d'identité *</label>
                {sel('type_piece_identite', PIECES)}
              </div>
              <div>
                <label className="label">N° de pièce *</label>
                <input className={inputClass} value={f.numero_piece_identite} onChange={set('numero_piece_identite')} required />
              </div>
              <div>
                <label className="label">Date d'expiration</label>
                <input className={inputClass} type="date" value={f.date_expiration_piece} onChange={set('date_expiration_piece')} />
              </div>
              <div>
                <label className="label">Employé gestionnaire</label>
                <input className={inputClass} type="number" value={f.employe_id} onChange={set('employe_id')} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <input type="checkbox" id="vip" checked={f.est_vip} onChange={setB('est_vip')} className="w-4 h-4 accent-amber-500" />
              <label htmlFor="vip" className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" /> Marquer ce client comme VIP
              </label>
            </div>
          </div>
        )}

        {/* ── Onglet Infos clients ─────────────────────────────── */}
        {activeTab === 'infos' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-800/40">Profil personnel</p>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Titre</label>{sel('titre', TITRES)}</div>
              <div><label className="label">Genre *</label>{sel('genre', GENRES)}</div>
              <div><label className="label">Situation familiale</label>{sel('situation_familiale', SITUATIONS)}</div>
              <div><label className="label">Catégorie client</label>{sel('categorie_client', CATEGORIES)}</div>
              <div><label className="label">Secteur d'activité *</label>{sel('secteur_activite', SECTEURS)}</div>
              <div><label className="label">Fonction / Profession</label><input className={inputClass} value={f.fonction} onChange={set('fonction')} /></div>
              <div><label className="label">Niveau d'étude</label>{sel('niveau_etude', NIVEAUX_ETUDE)}</div>
              <div><label className="label">Langue préférée</label>{sel('langue', LANGUES)}</div>
              <div><label className="label">Nombre d'enfants</label><input className={inputClass} type="number" min="0" value={f.nombre_enfants} onChange={setN('nombre_enfants')} /></div>
              <div><label className="label">Nom de la mère</label><input className={inputClass} value={f.nom_mere} onChange={set('nom_mere')} /></div>
              <div><label className="label">Pays de naissance</label><input className={inputClass} value={f.pays_naissance} onChange={set('pays_naissance')} /></div>
              <div><label className="label">Ville de naissance</label><input className={inputClass} value={f.ville_naissance} onChange={set('ville_naissance')} /></div>
            </div>
            {(f.situation_familiale === 'MARIE' || f.situation_familiale === 'UNION_LIBRE') && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
                <p className="col-span-2 text-xs font-semibold uppercase tracking-widest text-surface-800/40">Conjoint</p>
                <div><label className="label">Nom du conjoint</label><input className={inputClass} value={f.nom_conjoint} onChange={set('nom_conjoint')} /></div>
                <div><label className="label">Prénom du conjoint</label><input className={inputClass} value={f.prenom_conjoint} onChange={set('prenom_conjoint')} /></div>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Adresse ───────────────────────────────────── */}
        {activeTab === 'adresse' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-800/40">Coordonnées</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Téléphone secondaire</label><input className={inputClass} value={f.telephone_secondaire} onChange={set('telephone_secondaire')} placeholder="+212 6XX XXX XXX" /></div>
              <div><label className="label">Email</label><input className={inputClass} type="email" value={f.email_client} onChange={set('email_client')} /></div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-800/40 pt-2">Adresse</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Adresse ligne 1 *</label><input className={inputClass} value={f.adresse_1} onChange={set('adresse_1')} placeholder="N°, rue, quartier…" /></div>
              <div className="col-span-2"><label className="label">Adresse ligne 2</label><input className={inputClass} value={f.adresse_2} onChange={set('adresse_2')} /></div>
              <div><label className="label">Code postal</label><input className={inputClass} value={f.code_postal} onChange={set('code_postal')} /></div>
              <div><label className="label">Ville *</label><input className={inputClass} value={f.ville} onChange={set('ville')} /></div>
              <div><label className="label">Pays</label><input className={inputClass} value={f.pays} onChange={set('pays')} /></div>
              <div><label className="label">Coordonnées GPS</label><input className={inputClass} value={f.coordonnees_gps} onChange={set('coordonnees_gps')} placeholder="33.5731, -7.5898" /></div>
            </div>
          </div>
        )}

        {/* ── Onglet Profil crédit ─────────────────────────────── */}
        {activeTab === 'credit' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-800/40">Informations financières</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nationalité *</label><input className={inputClass} value={f.nationalite} onChange={set('nationalite')} required /></div>
              <div><label className="label">Revenu mensuel (MAD) *</label><input className={inputClass} type="number" step="0.01" min="0" value={f.revenu_mensuel} onChange={set('revenu_mensuel')} required /></div>
              <div><label className="label">Score d'éligibilité (0 – 100)</label><input className={inputClass} type="number" min="0" max="100" step="0.01" value={f.score_eligibilite} onChange={set('score_eligibilite')} /></div>
            </div>
            <div className="mt-2 p-4 bg-surface-50 rounded-xl border border-surface-100 text-sm text-surface-800/60">
              ℹ️ Le NIL et le numéro de téléphone doivent être vérifiés avant la sauvegarde. Un code PIN sera envoyé par SMS au client.
            </div>
          </div>
        )}

        {/* Navigation onglets */}
        <div className="flex justify-between items-center pt-4 border-t border-surface-100">
          <button
            type="button"
            onClick={() => {
              const idx = TABS.findIndex(t => t.id === activeTab)
              if (idx > 0) setActiveTab(TABS[idx - 1].id)
            }}
            className="btn-secondary"
            disabled={activeTab === TABS[0].id}
          >
            ← Précédent
          </button>

          {activeTab !== TABS[TABS.length - 1].id ? (
            <button
              type="button"
              onClick={() => {
                const idx = TABS.findIndex(t => t.id === activeTab)
                setActiveTab(TABS[idx + 1].id)
              }}
              className="btn-primary"
            >
              Suivant →
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Spinner className="w-4 h-4" /> : null}
              {initial?.id ? 'Enregistrer' : 'Créer le client'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function ClientsPage() {
  const navigate = useNavigate()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState('')

  const fetcher = useCallback(() => clientsApi.list({ page, search: search || undefined }), [page, search])
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, search])
  const clients = data?.data ?? []
  const meta    = data?.meta

  const openEdit   = c => { setSelected(c); setModal('edit') }
  const openDelete = c => { setSelected(c); setModal('delete') }
  const closeModal = () => { setModal(null); setSaveError(''); setSelected(null) }

  const handleSave = async (form) => {
    setSaving(true); setSaveError('')
    try {
      if (modal === 'create') await clientsApi.create(form)
      else                    await clientsApi.update(selected.id, form)
      closeModal(); refresh()
    } catch (e) {
      setSaveError(e.response?.data?.message || 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try { await clientsApi.delete(selected.id); closeModal(); refresh() }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Gestion du portefeuille clients"
        action={
          <button className="btn-primary" onClick={() => setModal('create')}>
            <Plus size={16} /> Nouveau client
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total clients" value={meta?.total ?? '—'} icon={Users}         color="brand" />
        <StatCard label="VIP"           value={clients.filter(c => c.est_vip).length}   icon={UserCheck} color="blue" />
        <StatCard label="Liste noire"   value={clients.filter(c => c.est_sur_liste_noire).length} icon={AlertTriangle} color="red" />
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input
              className="input pl-9 py-2"
              placeholder="NIL, nom, prénom, n° pièce…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : error   ? <div className="p-6"><ErrorAlert message={error} /></div>
        : clients.length === 0 ? <Empty message="Aucun client trouvé." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {['Code', 'NIL', 'Nom complet', 'Secteur', 'Ville', 'Revenu mensuel', 'Statut', ''].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="td font-mono text-xs text-brand-600">{c.code_client ?? `#${c.id}`}</td>
                    <td className="td font-mono text-xs text-surface-800/70">{c.nil ?? '—'}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {c.est_vip && <Star size={12} className="text-amber-400 fill-amber-400" />}
                        <span className="font-medium">{c.personne?.prenom} {c.personne?.nom}</span>
                      </div>
                      <p className="text-xs text-surface-800/50">{c.titre} · {c.genre}</p>
                    </td>
                    <td className="td text-xs">{c.secteur_activite ?? '—'}</td>
                    <td className="td text-xs">{c.ville ?? '—'}</td>
                    <td className="td font-mono text-xs">{formatMontant(c.revenu_mensuel)}</td>
                    <td className="td">
                      <div className="flex flex-col gap-1">
                        {c.est_sur_liste_noire
                          ? <span className="badge bg-red-100 text-red-700"><ShieldAlert size={10} className="mr-1" />Liste noire</span>
                          : <span className="badge bg-emerald-100 text-emerald-700">Actif</span>}
                        {!c.pin_verifie && <span className="badge bg-amber-100 text-amber-700 text-[10px]">PIN non vérifié</span>}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/clients/${c.id}`)} className="p-1.5 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors" title="Voir"><Eye size={14} /></button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Modifier"><Pencil size={14} /></button>
                        <button onClick={() => openDelete(c)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 pb-4"><Pagination meta={meta} onPageChange={setPage} /></div>
      </div>

      {/* Modals */}
      <Modal open={modal === 'create'} onClose={closeModal} title="Nouveau client — Enrôlement" size="xl">
        <ClientForm onSave={handleSave} loading={saving} error={saveError} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={closeModal} title="Modifier le client" size="xl">
        <ClientForm initial={selected} onSave={handleSave} loading={saving} error={saveError} />
      </Modal>
      <ConfirmDialog
        open={modal === 'delete'} onClose={closeModal} onConfirm={handleDelete}
        title="Supprimer le client"
        message={`Voulez-vous vraiment supprimer le client ${selected?.code_client ?? '#' + selected?.id} ?`}
        loading={saving}
      />
    </div>
  )
}