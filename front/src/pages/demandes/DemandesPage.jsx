import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Eye, CheckCircle, XCircle, FileText, Clock, ThumbsUp, ThumbsDown,
  ShieldCheck, Pencil, Trash2, ChevronRight, ChevronDown, 
  X, Banknote, Shield, ClipboardList, RefreshCw, Search,UserPlus
} from 'lucide-react'

import { demandesApi, clientsApi, produitsApi } from '../../api/services'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatMontant } from '../../utils/helpers'
import {
  PageHeader, Modal, Pagination, Empty, ErrorAlert, StatCard, Spinner
} from '../../components/ui'

// ─── CONFIGURATION WORKFLOW VISUEL ─────────────────────────────────
const WORKFLOW = {
  EN_ATTENTE:       { label: 'Instance',        color: 'bg-amber-100 text-amber-800',     icon: Clock },
  EN_COURS_ANALYSE: { label: 'En analyse',      color: 'bg-blue-100 text-blue-800',       icon: ClipboardList },
  APPROUVEE:        { label: 'Approuvée',       color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  REJETEE:          { label: 'Rejetée',         color: 'bg-red-100 text-red-800',         icon: XCircle },
  ANNULEE:          { label: 'Annulée',         color: 'bg-surface-100 text-surface-800', icon: X },
  DECAISSEE:        { label: 'Décaissée',       color: 'bg-purple-100 text-purple-800',   icon: Banknote },
}

const ETAPES = [
  { id: 'EN_ATTENTE',       label: 'En attente',     icon: FileText },
  { id: 'EN_COURS_ANALYSE', label: 'Analyse',      icon: ClipboardList },
  { id: 'APPROUVEE',        label: 'Comité',       icon: Shield },
  { id: 'DECAISSEE',        label: 'Décaissement', icon: Banknote },
]
const ETAPE_IDX = { EN_ATTENTE: 0, EN_COURS_ANALYSE: 1, APPROUVEE: 2, DECAISSEE: 3 }

function WorkflowBar({ statut }) {
  const cur = ETAPE_IDX[statut] ?? 0
  const rej = statut === 'REJETEE' || statut === 'ANNULEE'
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {ETAPES.map((e, i) => (
        <div key={e.id} className="flex items-center">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
            ${rej && i === cur ? 'bg-red-100 text-red-700' : i < cur ? 'bg-emerald-100 text-emerald-700' : i === cur && !rej ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-800/40'}`}>
            {i < cur ? <CheckCircle size={10} /> : <e.icon size={10} />} {e.label}
          </div>
          {i < 3 && <ChevronRight size={12} className={`mx-0.5 ${i < cur ? 'text-emerald-400' : 'text-surface-200'}`} />}
        </div>
      ))}
      {rej && (
        <div className="flex items-center gap-0.5 ml-1">
          <ChevronRight size={12} className="text-red-300" />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-700">
            <XCircle size={10} /> {statut === 'REJETEE' ? 'Rejetée' : 'Annulée'}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 1. MODALE DÉDIÉE POUR AJOUTER UN GARANT ───────────────────────────────────
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
          <button type="button" className="btn-primary" onClick={handleValid}>Valider le garant</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── 2. FORMULAIRE PRINCIPAL DE DEMANDE DE CRÉDIT (Création / Édition) ──────────────
function DemandeForm({ onSave, loading, error, initialData }) {
  const [f, setF] = useState({
    client_id: '', produit_credit_id: '', montant_demande: '',
    duree_demandee: '', objet_pret: '', garantie: '',
  })
  const [garant, setGarant] = useState(null)

  useEffect(() => {
    if (initialData) {
      setF({
        client_id: initialData.client_id ?? '',
        produit_credit_id: initialData.produit_credit_id ?? '',
        montant_demande: initialData.montant_demande ?? '',
        duree_demandee: initialData.duree_demandee ?? '',
        objet_pret: initialData.objet_pret ?? '',
        garantie: initialData.garantie ?? '',
      })
      if (initialData.garant) {
        setGarant({
          nom: initialData.garant.nom ?? '',
          prenom: initialData.garant.prenom ?? '',
          cin: initialData.garant.cin ?? '',
          telephone: initialData.garant.telephone ?? '',
          revenu_mensuel: initialData.garant.revenu_mensuel ?? '',
          relation_client: initialData.garant.relation_client ?? '',
        })
      } else {
        setGarant(null)
      }
    }
  }, [initialData])

  const [showGarantModal, setShowGarantModal] = useState(false)
  const { data: clientData, loading: loadingClients } = useApi(clientsApi.options)
  const { data: produitData, loading: loadingProduits } = useApi(produitsApi.options)

  const clientOptions = Array.isArray(clientData) ? clientData : (clientData?.data ?? [])
  const produitOptions = Array.isArray(produitData) ? produitData : (produitData?.data ?? [])

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...f, garant })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Client bénéficiaire *</label>
          {loadingClients ? (
            <div className="text-xs text-surface-800/50 pt-2 flex items-center gap-2"><Spinner className="w-3 h-3" /> Chargement...</div>
          ) : (
            <select className="input" value={f.client_id} onChange={set('client_id')} required>
              <option value="">-- Choisir un client --</option>
              {clientOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="label">Produit de crédit *</label>
          {loadingProduits ? (
            <div className="text-xs text-surface-800/50 pt-2 flex items-center gap-2"><Spinner className="w-3 h-3" /> Chargement...</div>
          ) : (
            <select className="input" value={f.produit_credit_id} onChange={set('produit_credit_id')} required>
              <option value="">-- Choisir un produit --</option>
              {produitOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
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
          <input className="input" value={f.objet_pret} onChange={set('objet_pret')} required placeholder="Ex: Achat d'équipement..." />
        </div>
        <div className="col-span-2">
          <label className="label">Nature de la Garantie physique</label>
          <input className="input" value={f.garantie} onChange={set('garantie')} placeholder="Optionnelle (ex: Hypothèque, Gage...)" />
        </div>
      </div>

      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 mt-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-900">Caution solidaire (Garant personnel)</p>
          <p className="text-xs text-surface-800/50">{garant ? `Garant : ${garant.prenom} ${garant.nom}` : "Aucun garant rattaché."}</p>
        </div>
        <button type="button" onClick={() => setShowGarantModal(true)} className={`btn text-xs px-3 py-1.5 flex items-center gap-1.5 ${garant ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-secondary'}`}>
          {garant ? <ShieldCheck size={14} /> : <UserPlus size={14} />} {garant ? 'Modifier le garant' : 'Ajouter un garant'}
        </button>
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={loading}>{loading ? 'Traitement...' : 'Soumettre la demande'}</button>
      </div>
      <AjouterGarantModal open={showGarantModal} onClose={() => setShowGarantModal(false)} onSave={setGarant} initialGarant={garant} />
    </form>
  )
}

// ─── 3. MODAUX WORKFLOW RESERVES AU MANAGER ─────────────────────────────────────
function ModalApprouver({ demande, onClose, onDone }) {
  const [form, setForm] = useState({ montant_accorde: demande.montant_demande, nb_echeances: demande.duree_demandee || 12, taux: '0.1200', date_octroi: new Date().toISOString().split('T')[0], grace: 0, commentaire: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  
  const save = async () => {
    setSaving(true); setErr('')
    try { await demandesApi.approuver(demande.id, form); onDone() }
    catch (e) { setErr(e.response?.data?.message || 'Erreur.') }
    finally { setSaving(false) }
  }
  return (
    <div className="space-y-4">
      <div className="p-3 bg-surface-50 rounded-xl border border-surface-100 grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-surface-800/50">Client:</span> <strong className="font-semibold">{demande.client?.personne?.prenom} {demande.client?.personne?.nom}</strong></div>
        <div><span className="text-surface-800/50">Demandé:</span> <strong className="font-semibold">{formatMontant(demande.montant_demande)} ({demande.duree_demandee} mois)</strong></div>
      </div>
      {demande.score_risque != null && (
        <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${demande.score_risque >= 50 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <Shield size={14} /> Score centrale des risques : {demande.score_risque}/100
        </div>
      )}
      <ErrorAlert message={err} />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Montant accordé (MAD)</label><input className="input" type="number" value={form.montant_accorde} onChange={set('montant_accorde')} /></div>
        <div><label className="label">Nb d'échéances</label><input className="input" type="number" value={form.nb_echeances} onChange={set('nb_echeances')} /></div>
        <div><label className="label">Taux annuel</label><input className="input" type="number" step="0.0001" value={form.taux} onChange={set('taux')} /></div>
        <div><label className="label">Date d'octroi</label><input className="input" type="date" value={form.date_octroi} onChange={set('date_octroi')} /></div>
        <div className="col-span-2"><label className="label">Période de grâce (mois)</label><input className="input" type="number" min="0" value={form.grace} onChange={set('grace')} /></div>
      </div>
      <div><label className="label">Commentaire de décision</label><textarea className="input h-16 resize-none" value={form.commentaire} onChange={set('commentaire')} placeholder="Avis favorable du comité..." /></div>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner className="w-4 h-4" /> : <ThumbsUp size={14} />} Valider en Comité</button>
      </div>
    </div>
  )
}

function ModalRejeter({ open, onClose, onConfirm, loading }) {
  const [motif, setMotif] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Rejeter la demande" size="sm">
      <div className="space-y-4">
        <div><label className="label">Motif de rejet *</label>
          <textarea className="input h-24 resize-none" value={motif} onChange={e => setMotif(e.target.value)} placeholder="Capacité d'endettement insuffisante, garanties fragiles…" />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-danger" onClick={() => onConfirm(motif)} disabled={!motif || loading}>Confirmer le rejet</button>
        </div>
      </div>
    </Modal>
  )
}

function ModalDecaisser({ demande, onClose, onDone }) {
  const [form, setForm] = useState({ montant_accorde: demande.montant_demande, date_debut: new Date().toISOString().split('T')[0], taux_interet: '0.1200', periode_grace: 0 })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  
  const save = async () => {
    setSaving(true); setErr('')
    try {
      const { pretsApi } = await import('../../api/services')
      await pretsApi.create({ demande_credit_id: demande.id, ...form })
      onDone()
    } catch (e) { setErr(e.response?.data?.message || 'Erreur au décaissement.') }
    finally { setSaving(false) }
  }
  return (
    <div className="space-y-4">
      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
        <p className="font-semibold">✅ Feu vert pour Décaissement — Prêt #{demande.id}</p>
      </div>
      <ErrorAlert message={err} />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Montant final (MAD) *</label><input className="input" type="number" step="0.01" value={form.montant_accorde} onChange={set('montant_accorde')} /></div>
        <div><label className="label">Date d'effet *</label><input className="input" type="date" value={form.date_debut} onChange={set('date_debut')} /></div>
        <div><label className="label">Taux d'intérêt annuel *</label><input className="input" type="number" step="0.0001" value={form.taux_interet} onChange={set('taux_interet')} /></div>
        <div><label className="label">Période de grâce</label><input className="input" type="number" min="0" value={form.periode_grace} onChange={set('periode_grace')} /></div>
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner className="w-4 h-4" /> : <Banknote size={14} />} Ordonner le décaissement</button>
      </div>
    </div>
  )
}

// ─── 4. LIGNE DU TABLEAU (Expansible & Contextuelle) ─────────────────────────────
function DemandeLigne({ demande, onAction, expanded, onToggle, role, onAnalyser }) {
  const navigate = useNavigate()
  const wf = WORKFLOW[demande.statut_demande] ?? {}
  const isManager = role === 'MANAGER'

  return (
    <>
      <tr className={`table-row cursor-pointer transition-colors ${expanded ? 'bg-brand-50/20' : 'hover:bg-surface-50/50'}`} onClick={onToggle}>
        <td className="td py-3 px-4 font-mono text-xs text-surface-800/60">#{demande.id}</td>
        <td className="td py-3 px-4">
          <p className="font-medium text-surface-900">{demande.client?.personne?.prenom} {demande.client?.personne?.nom}</p>
          <p className="text-[10px] text-surface-800/40">{demande.client?.numero_piece_identite ?? '—'}</p>
        </td>
        <td className="td py-3 px-4 text-xs text-surface-800/80">{demande.produit_credit?.type_produit ?? '—'}</td>
        <td className="td py-3 px-4 font-mono text-xs text-surface-900">{formatMontant(demande.montant_demande)}</td>
        <td className="td py-3 px-4 text-xs text-surface-800/80">{demande.duree_demandee} mois</td>
        <td className="td py-3 px-4 text-xs text-surface-800/80">{formatDate(demande.date_soumission)}</td>
        <td className="td py-3 px-4">
          <span className={`badge ${wf.color ?? 'bg-surface-100 text-surface-800'}`}>
            {wf.icon && <wf.icon size={10} className="mr-1" />} {wf.label ?? demande.statut_demande}
          </span>
        </td>
        <td className="td py-3 px-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => navigate(`/demandes/${demande.id}`)} className="p-1.5 rounded-lg hover:bg-surface-100" title="Voir détails complets"><Eye size={14} /></button>
            
            {/* ACTIONS AGENT */}
            {!isManager && demande.statut_demande === 'EN_ATTENTE' && (
              <>
                <button onClick={() => onAction('edit', demande)} className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600" title="Modifier"><Pencil size={14} /></button>
                <button onClick={() => onAction('delete', demande)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600" title="Supprimer"><Trash2 size={14} /></button>
              </>
            )}

            {/* ACTIONS MANAGER (Workflow direct sans affectation manuelle) */}
            {isManager && (
              <>
                {demande.statut_demande === 'EN_ATTENTE' && (
                  <button onClick={() => onAnalyser(demande)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">
                    <ClipboardList size={10}/> Prendre en charge & Analyser
                  </button>
                )}
                {demande.statut_demande === 'EN_COURS_ANALYSE' && (
                  <>
                    <button onClick={() => onAction('approuver', demande)} className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600" title="Passer en comité"><CheckCircle size={14} /></button>
                    <button onClick={() => onAction('rejeter', demande)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600" title="Rejeter"><XCircle size={14} /></button>
                  </>
                )}
                {demande.statut_demande === 'APPROUVEE' && (
                  <>
                    <button onClick={() => onAction('decaisser', demande)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100"><Banknote size={10}/> Décaisser</button>
                    <button onClick={() => onAction('annuler', demande)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600" title="Annuler la demande"><X size={14} /></button>
                  </>
                )}
              </>
            )}
            <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-800/30">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-brand-50/10 border-b border-surface-100 px-6 py-3">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-surface-800/40 mb-1.5">Progression Dossier</p>
                <WorkflowBar statut={demande.statut_demande} />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-1.5">
                {[
                  ['Objet du Prêt', demande.objet_pret],
                  ['Garantie Physique', demande.garantie ?? '—'],
                  ['Caution / Garant', demande.garant ? `${demande.garant.prenom} ${demande.garant.nom}` : '—'],
                  ['Date Décision', formatDate(demande.date_decision)],
                  ['Motif de Rejet', demande.motif_rejet ?? '—']
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs border-b border-surface-100/60 pb-1">
                    <span className="text-surface-800/40">{k}</span>
                    <span className="font-medium text-surface-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── 5. PAGE GLOBALE UNIFIEE ───────────────────────────────────────────────────
export default function DemandesPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)     // 'create', 'edit', 'rejeter', 'approuver', 'decaisser'
  const [selected, setSelected] = useState(null) 
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const isManager = user?.role === 'MANAGER'

  const fetcher = useCallback(() => 
    demandesApi.list({ page, statut: statut || undefined, search: search || undefined }), 
    [page, statut, search]
  )
  const { data, loading, error, execute: refresh } = useApi(fetcher, [page, statut, search])
  const demandes = data?.data ?? []

  const closeModal = () => { setModal(null); setSaveErr(''); setSelected(null) }
  const onDone = () => { closeModal(); refresh() }

  const handleSave = async (form) => {
    setSaving(true); setSaveErr('')
    try {
      if (modal === 'edit') {
        await demandesApi.update(selected.id, form)
      } else {
        await demandesApi.create(form)
      }
      onDone()
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Erreur lors de la soumission.')
    } finally { setSaving(false) }
  }

  const handleActionClick = (actionId, demande) => {
    setSelected(demande)
    if (actionId === 'delete') {
      handleDelete(demande.id)
    } else {
      setModal(actionId)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      try { await demandesApi.delete(id); refresh() } 
      catch (e) { alert(e.response?.data?.message || 'Erreur de suppression.') }
    }
  }

  // L'analyse passe directement le statut à EN_COURS_ANALYSE sans changer d'employe_id
  const handleAnalyserDirect = async (demande) => {
    if (!window.confirm(`Passer le dossier #${demande.id} en cours d'analyse ?`)) return
    try { 
      await demandesApi.affecter(demande.id, { employe_id: user?.id }) 
      refresh()
    } catch (e) {
      alert(e.response?.data?.message || "Impossible de lancer l'analyse.")
    }
  }

  const handleRejeter = async (motif) => {
    setSaving(true)
    try { await demandesApi.rejeter(selected.id, { motif_rejet: motif }); onDone() } 
    catch {} finally { setSaving(false) }
  }

  const handleAnnuler = async () => {
    setSaving(true)
    try { await demandesApi.rejeter(selected.id, { motif_rejet: 'Annulation manuelle manager' }); onDone() } 
    catch {} finally { setSaving(false) }
  }

  const STATUTS_OPTS = ['', 'EN_ATTENTE', 'EN_COURS_ANALYSE', 'APPROUVEE', 'REJETEE', 'ANNULEE', 'DECAISSEE']

  return (
    <div className="space-y-5">
      <PageHeader
        title="Demandes de crédit"
        subtitle={isManager ? "Supervision et validation du workflow d'octroi" : "Portefeuille et suivi des demandes de prêt"}
        action={!isManager && <button className="btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Nouvelle demande</button>}
      />

      {/* Bloc indicateurs KPI */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Dossiers" value={data?.total ?? data?.meta?.total ?? '—'} icon={FileText} color="brand" />
        <StatCard label="En Instance" value={(data?.total ?? data?.meta?.total) ? demandes.filter(d => d.statut_demande === 'EN_ATTENTE').length : '—'} icon={Clock} color="amber" />
        <StatCard label="Comités Approuvés" value={(data?.total ?? data?.meta?.total) ? demandes.filter(d => d.statut_demande === 'APPROUVEE').length : '—'} icon={ThumbsUp} color="blue" />
        <StatCard label="Dossiers Rejetés" value={(data?.total ?? data?.meta?.total) ? demandes.filter(d => d.statut_demande === 'REJETEE').length : '—'} icon={ThumbsDown} color="red" />
      </div>

      {/* Zone de Filtrage et Recherche */}
      <div className="card p-0">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input className="input pl-9 py-2 text-sm" placeholder="Rechercher client, ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input w-48 py-2 text-sm" value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}>
            {STATUTS_OPTS.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'Tous les statuts'}</option>)}
          </select>
          <button className="btn-secondary py-2 text-xs ml-auto" onClick={refresh}><RefreshCw size={13} /> Actualiser</button>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        : error ? <div className="p-5"><ErrorAlert message={error} /></div>
        : demandes.length === 0 ? <Empty message="Aucune demande trouvée." />
        : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {['ID', 'Client', 'Produit', 'Montant', 'Durée', 'Soumission', 'Statut', ''].map(h => (
                    <th key={h} className="th py-3 px-4 text-left font-semibold text-xs tracking-wider text-surface-800/60">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {demandes.map(d => (
                  <DemandeLigne 
                    key={d.id} 
                    demande={d} 
                    role={user?.role} 
                    expanded={expanded === d.id} 
                    onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                    onAction={handleActionClick}
                    onAnalyser={handleAnalyserDirect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-4 border-t border-surface-100"><Pagination meta={data?.meta} onPageChange={setPage} /></div>
      </div>

      {/* MODAL UNIQUE AGENT : CREATION & EDITION */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={closeModal} title={modal === 'edit' ? "Modifier la demande de crédit" : "Nouvelle demande de crédit"} size="lg">
        <DemandeForm onSave={handleSave} loading={saving} error={saveErr} initialData={selected} />
      </Modal>

      {/* MODALS DÉDIÉS MANAGER */}
      <Modal open={modal === 'approuver'} onClose={closeModal} title="Comité d'approbation financière" size="lg">
        {selected && <ModalApprouver demande={selected} onClose={closeModal} onDone={onDone} />}
      </Modal>

      <Modal open={modal === 'decaisser'} onClose={closeModal} title="Clôturer le dossier & Décaisser" size="md">
        {selected && <ModalDecaisser demande={selected} onClose={closeModal} onDone={onDone} />}
      </Modal>

      <ModalRejeter open={modal === 'rejeter'} onClose={closeModal} onConfirm={handleRejeter} loading={saving} />
    </div>
  )
}