import { useState, useCallback, useEffect } from 'react'
import {
  Search, User, FileText, Users, Briefcase,
  Clock, AlertCircle, XCircle, BarChart2,
  Star, ShieldAlert, Plus, Eye, Download,
  ChevronRight, ArrowRight, FileSearch
} from 'lucide-react'
import {
  clientsApi, demandesApi, pretsApi,
  paiementsApi
} from '../api/services'
import { useApi } from '../hooks/useApi'
import { formatDate, formatMontant, statutBadge } from '../utils/helpers'
import { Badge, Spinner, ErrorAlert } from '../components/ui'
import {useAuth} from '../context/AuthContext'

// ─────────────────────────────────────────────────────────────────
// Onglets 360° Horizontaux
// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'vision360',    label: 'Vision 360°' },
  { id: 'signaletique', label: 'Fiche Signalétique' },
  { id: 'documents',    label: 'Liste des Documents' },
  { id: 'portefeuille', label: 'Portefeuille' },
  { id: 'echeances',    label: 'Échéances à venir' },
  { id: 'retard',       label: 'Échéances en retard' },
  { id: 'impayes',      label: 'Échéances impayées' },
  { id: 'simulation',   label: 'Simulation de prêt' },
]

// ─────────────────────────────────────────────────────────────────
// Helpers de rendu
// ─────────────────────────────────────────────────────────────────
function Dl({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-surface-50 last:border-0 gap-4">
      <dt className="text-[11px] text-surface-800/50 shrink-0 w-36">{label}</dt>
      <dd className={`text-[11px] font-semibold text-right text-surface-900 break-all ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</dd>
    </div>
  )
}
function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-surface-100 shadow-card overflow-hidden ${className}`}>
      {title && (
        <div className="px-3 py-2 border-b border-surface-100 bg-surface-50/60">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-surface-800/50">{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}
 
function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">{children}</table>
    </div>
  )
}
 
function Thead({ cols }) {
  return (
    <thead className="bg-surface-50 border-b border-surface-100 text-[10px] uppercase text-surface-500">
      <tr>
        {cols.map(c => <th key={c} className="px-3 py-2">{c}</th>)}
      </tr>
    </thead>
  )
}
 
function EmptyRow({ cols, msg }) {
  return (
    <tr>
      <td colSpan={cols} className="p-6 text-center text-surface-400 text-xs">{msg}</td>
    </tr>
  )
}
 



// ─────────────────────────────────────────────────────────────────
// TabVision360 — utilise clientsApi.vision360(id) dédié
// ─────────────────────────────────────────────────────────────────
function TabVision360({ client }) {

  const fetcher = useCallback(
    () => clientsApi.vision360(client.id),
    [client.id]
  )
  const { data, loading } = useApi(fetcher, [client.id])

  const demandes    = data?.demandes    ?? []
  const prets       = data?.pretsActifs ?? []
  const echeances   = data?.echeances   ?? []

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-6 h-6"/>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

      {/* ── Demandes de crédit ── */}
      <Panel title={`(${demandes.length}) Demande(s) de crédit`}>
        <TableWrapper>
          <Thead cols={['Date', 'Objet', 'Montant', 'Durée', 'Statut']}/>
          <tbody className="divide-y divide-surface-100 text-xs">
            {demandes.length === 0
              ? <EmptyRow cols={5} msg="Aucune demande enregistrée."/>
              : demandes.map(d => (
                <tr key={d.id} className="hover:bg-surface-50/50">
                  <td className="px-3 py-2">{formatDate(d.date_demande)}</td>
                  <td className="px-3 py-2 text-surface-700 truncate max-w-[120px]">{d.objet_pret ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{formatMontant(d.montant)}</td>
                  <td className="px-3 py-2 text-center">{d.duree_demandee ? `${d.duree_demandee} mois` : '—'}</td>
                  <td className="px-3 py-2 text-center"><Badge statut={d.statut}/></td>
                </tr>
              ))
            }
          </tbody>
        </TableWrapper>
      </Panel>

      {/* ── Prêts actifs ── */}
      <Panel title={`(${prets.length}) Prêt(s) actif(s)`}>
        <TableWrapper>
          <Thead cols={['Référence', "Date d'octroi", 'Accordé', 'Restant dû', 'Statut']}/>
          <tbody className="divide-y divide-surface-100 text-xs">
            {prets.length === 0
              ? <EmptyRow cols={5} msg="Aucun prêt actif."/>
              : prets.map(p => (
                <tr key={p.id} className="hover:bg-surface-50/50">
                  <td className="px-3 py-2 font-mono font-bold text-brand-600">
                    {p.code ?? p.reference ?? `PRE-${p.id}`}
                  </td>
                  <td className="px-3 py-2">{formatDate(p.date_octroi)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatMontant(p.montant_accorde)}</td>
                  <td className="px-3 py-2 text-right font-mono text-red-600 font-bold">
                    {formatMontant(p.montant_restant ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge statut={p.statut}/>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </TableWrapper>
      </Panel>

      {/* ── Échéances ── */}
      <Panel title={`(${echeances.length}) Échéance(s)`} className="xl:col-span-2">
        <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
          <table className="w-full text-left">
            <Thead cols={['Prêt', 'N°', 'Date Éch.', 'Total dû', 'Payé', 'Restant', 'Retard (j)', 'Pénalités', 'Statut']}/>
            <tbody className="divide-y divide-surface-100 text-xs">
              {echeances.length === 0
                ? <EmptyRow cols={9} msg="Aucune échéance."/>
                : echeances.map(e => {
                  const restant = parseFloat(e.total_du ?? 0) - parseFloat(e.montant_paye ?? 0)
                  const enRetard = (e.jours_retard_reel ?? e.jours_retard ?? 0) > 0
                  return (
                    <tr key={e.id} className={`hover:bg-surface-50/50 ${enRetard ? 'bg-red-50/40' : ''}`}>
                      <td className="px-3 py-2 font-mono text-brand-600 font-bold">
                        {e.pret_code ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center">{e.numero_echeance}</td>
                      <td className="px-3 py-2">{formatDate(e.date_echeance)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {formatMontant(e.total_du)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">
                        {formatMontant(e.montant_paye)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-red-600 font-bold">
                        {formatMontant(restant)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-red-500">
                        {enRetard
                          ? (e.jours_retard_reel ?? e.jours_retard)
                          : <span className="text-surface-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600">
                        {parseFloat(e.penalites ?? 0) > 0
                          ? formatMontant(e.penalites)
                          : <span className="text-surface-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`badge text-[10px] ${statutBadge(e.statut)}`}>
                          {e.statut}
                        </span>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </Panel>

    </div>
  )
}
// ─────────────────────────────────────────────────────────────────
// ONGLET Fiche Signalétique
// ─────────────────────────────────────────────────────────────────
function TabSignaletique({ client }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Panel title="Données d'identification">
        <dl className="px-4 py-2">
          <Dl label="Code client"     value={client.code_client} mono />
          <Dl label="NIL"             value={client.nil} mono />
          <Dl label="Titre / Genre"   value={`${client.titre??''} ${client.genre??''}`.trim()} />
          <Dl label="Nom complet"     value={`${client.personne?.nom?.toUpperCase()} ${client.personne?.prenom}`} />
          <Dl label="Date naissance"  value={formatDate(client.personne?.date_naissance)} />
          <Dl label="Nationalité"     value={client.nationalite} />
          <Dl label="Ville / Pays"    value={`${client.ville_naissance??'—'} / ${client.pays_naissance??'—'}`} />
        </dl>
      </Panel>
      <div className="space-y-4">
        <Panel title="Pièce d'identité">
          <dl className="px-4 py-2">
            <Dl label="Type de pièce"     value={client.type_piece_identite} />
            <Dl label="Numéro de pièce"   value={client.numero_piece_identite} mono />
            <Dl label="Date d'expiration" value={formatDate(client.date_expiration_piece)} />
          </dl>
        </Panel>
        <Panel title="Coordonnées">
          <dl className="px-4 py-2">
            <Dl label="Téléphone" value={client.personne?.telephone} mono />
            <Dl label="Email"     value={client.email_client ?? client.personne?.email} />
            <Dl label="Adresse"   value={`${client.adresse_1??''} ${client.code_postal??''} ${client.ville??''}`.trim()||null} />
          </dl>
        </Panel>
      </div>
    </div>
  )
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

function TabDocuments({ client, refreshClient }) {
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [intitule, setIntitule] = useState('')
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null) // nom fichier sélectionné

  const docs = (client.documents ?? []).filter(d =>
    !search || d.intitule?.toLowerCase().includes(search.toLowerCase())
  )

  const BASE = 'http://127.0.0.1:8000'

// Construire l'URL correctement depuis ce qui est disponible
const getDocUrl = (doc) => {
  if (doc.url) return `${BASE}${doc.url}`                          // "/storage/clients/..."
  if (doc.chemin_fichier) return `${BASE}/storage/${doc.chemin_fichier}` // fallback
  return null
}

const handleView = (doc) => {
  const url = getDocUrl(doc)
  if (!url) return alert('URL du document introuvable')
  window.open(url, '_blank')
}

  // ── Upload (même pattern que TabPhoto) ───────────────────────
  const handleUpload = async () => {
    if (!intitule || !file) {
      alert('Veuillez remplir tous les champs')
      return
    }
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('intitule', intitule)
      fd.append('fichier', file)
      await clientsApi.uploadDocument(client.id, fd)
      setIntitule('')
      setFile(null)
      setPreview(null)
      if (refreshClient) await refreshClient()
    } catch (e) {
      console.error(e)
      alert('Erreur upload : ' + (e.response?.data?.message ?? e.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Supprimer ─────────────────────────────────────────────────
  const handleDelete = async (documentId) => {
    if (!confirm('Supprimer ce document ?')) return
    try {
      await clientsApi.deleteDocument(client.id, documentId)
      if (refreshClient) await refreshClient()
    } catch (e) {
      console.error(e)
      alert('Erreur suppression')
    }
  }

  return (
    <Panel title={`Gestion électronique des documents — Total : (${docs.length})`}>

      {/* HEADER recherche */}
      <div className="flex gap-3 px-4 py-2.5 border-b border-surface-100 bg-surface-50/40">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-surface-800/40 block mb-1">
            Recherche
          </label>
          <input
            className="input py-1 text-xs w-36"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
          />
        </div>
      </div>

      <div className="flex">

        {/* TABLE */}
        <div className="flex-1 border-r border-surface-100">
          <div className="px-4 py-1.5 border-b border-surface-100 bg-surface-50/40">
            <p className="text-[10px] font-bold text-surface-800/40">Liste des documents</p>
          </div>

          {!docs.length ? (
            <p className="text-xs text-center text-surface-800/40 py-8">Aucun document.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {['Intitulé', 'Taille', 'Extension', 'Actions'].map(h => (
                    <th key={h} className="th text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="td text-xs">{d.intitule}</td>
                    <td className="td text-xs font-mono">{d.taille_listible ?? '—'}</td>
                    <td className="td text-xs">
                      {d.type_mime?.split('/')[1]?.toUpperCase() ?? '—'}
                    </td>
                    <td className="td">
                      <div className="flex gap-1 flex-wrap">

                        <button
                          onClick={() => handleView(d)}
                          className="px-2 py-0.5 text-[10px] rounded hover:bg-brand-50 hover:text-brand-600 border border-surface-100 transition-colors"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="px-2 py-0.5 text-[10px] rounded hover:bg-red-50 hover:text-red-600 border border-surface-100 transition-colors"
                        >
                          Supprimer
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* UPLOAD — même structure que TabPhoto */}
        <div className="w-56 shrink-0 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-surface-800/40 mb-3">
            Nouveau document
          </p>

          <div className="space-y-2.5">

            <div>
              <label className="text-[10px] font-semibold text-surface-800/50 block mb-1">
                Intitulé fichier
              </label>
              <input
                className="input text-xs py-1"
                value={intitule}
                onChange={e => setIntitule(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-surface-800/50 block mb-1">
                Fichier
              </label>
              <label className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
                <span className="text-[11px] text-surface-800/50 truncate">
                  {preview ?? 'Parcourir un fichier'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0]
                    if (!f) return
                    setFile(f)
                    setPreview(f.name) // ← affiche le nom comme TabPhoto affiche l'aperçu
                  }}
                />
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file || !intitule}
              className="btn-primary w-full py-1.5 text-xs justify-center disabled:opacity-50"
            >
              {loading
                ? <span className="flex items-center gap-1.5 justify-center">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Upload…
                  </span>
                : 'Enregistrer'
              }
            </button>

          </div>
        </div>
      </div>
    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET Portefeuille
// ─────────────────────────────────────────────────────────────────
function TabPortefeuille({ client }) {
  const [sortCriterion, setSortCriterion] = useState(null)

  const fetchPortefeuille = useCallback(() =>
    clientsApi.list({ employe_id: client.employe_id }),
    [client.employe_id]
  )
  const { data, loading: portfolioLoading } = useApi(fetchPortefeuille, [client.employe_id])
  const clientsAgent = data?.data ?? []

  const filterOptions = [
    { id: 'age',     label: 'Par age' },
    { id: 'genre',   label: 'Par genre' },
    { id: 'secteur', label: "Par secteur d'activité" },
    { id: 'famille', label: 'Par situation familiale' },
  ]

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-surface-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-100 bg-surface-50/60">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-surface-800/50">
            Portefeuille clients de l'agent ({clientsAgent.length})
          </h3>
        </div>
        <div className="px-4 py-2 border-b border-surface-100 bg-surface-50/40">
          <div className="flex items-center gap-2">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortCriterion(sortCriterion === opt.id ? null : opt.id)}
                className={`inline-flex items-center px-2.5 py-1 text-[10px] font-semibold border rounded-lg transition-colors ${
                  sortCriterion === opt.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-surface-200 text-surface-700 bg-white hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {portfolioLoading ? (
            <div className="flex justify-center py-8"><Spinner className="w-5 h-5"/></div>
          ) : clientsAgent.length === 0 ? (
            <p className="text-xs text-center text-surface-400 py-8">Aucun client dans le portefeuille.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>{['Code Client','N° I.N.','Nom','Prénom','Téléphone','Ville'].map(h=><th key={h} className="th text-[10px]">{h}</th>)}</tr>
              </thead>
              <tbody>
                {clientsAgent.map(c=>(
                  <tr key={c.id} className="table-row">
                    <td className="td font-mono text-[11px] text-brand-700 font-semibold">{c.code_client}</td>
                    <td className="td font-mono text-[11px]">{c.nil??'—'}</td>
                    <td className="td text-[11px] font-medium">{c.personne?.nom?.toUpperCase()}</td>
                    <td className="td text-[11px]">{c.personne?.prenom}</td>
                    <td className="td font-mono text-[11px]">{c.personne?.telephone??'—'}</td>
                    <td className="td text-[11px]">{c.ville?.toUpperCase()??'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET Échéances générique
// ─────────────────────────────────────────────────────────────────
function TabEcheances({ client, type }) {
  const { data: prets, loading } = useApi(() => clientsApi.prets(client.id), [client.id])
  const [viewMode, setViewMode]  = useState('balance')

  const allEch = (prets ?? []).flatMap(p =>
    (p.echeances ?? [])
      .filter(e => {
        if (type==='venir')   return e.statut==='EN_ATTENTE' && (e.jours_retard??0)<=0
        if (type==='retard')  return (e.jours_retard??0)>0
        if (type==='impayes') return ['EN_RETARD','PARTIELLEMENT_PAYEE'].includes(e.statut) && parseFloat(e.montant_paye??0)<parseFloat(e.total_du??0)
        return false
      })
      .map(e => ({ ...e, pretRef: p.reference, clientLabel:`${client.personne?.nom} ${client.personne?.prenom}` }))
  )
  const totalEch = allEch.reduce((s,e)=>s+parseFloat(e.total_du??0),0)

  return (
    <Panel
      title={`Liste tombée d'échéance — Résultat(s) trouvé(s) : ${allEch.length}`}
      
    >
      {loading ? (
        <div className="flex justify-center py-10"><Spinner/></div>
      ) : allEch.length===0 ? (
        <p className="text-xs text-center text-surface-800/40 py-10">Aucune échéance.</p>
      ) : (
        <>
          <div className="flex items-center gap-4 px-4 py-2 bg-surface-50/60 border-b border-surface-100 text-xs">
            <span className="text-surface-800/50 font-semibold">Total :</span>
            <span className="font-mono font-bold text-brand-700">{formatMontant(totalEch)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="th text-[10px]" colSpan={5}>Information</th>
                  <th className="th text-[10px]" colSpan={6}>Montant</th>
                </tr>
                <tr>
                  {['Prêt','N°','Client','Jour retard','Date échéance','Échéances','Réglé','Restant','Principal','Intérêt','Frais'].map(h=>
                    <th key={h} className="th text-[10px] py-1 text-center">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {allEch.map(e=>(
                  <tr key={e.id} className={`table-row ${(e.jours_retard??0)>0?'bg-red-50/40':''}`}>
                    <td className="td py-1 font-mono text-[10px] text-brand-700">{e.pretRef}</td>
                    <td className="td py-1 text-center text-[10px]">{e.numero_echeance}</td>
                    <td className="td py-1 text-[10px]">{e.clientLabel}</td>
                    <td className="td py-1 text-center">
                      {(e.jours_retard??0)>0
                        ? <span className="font-bold text-red-600 text-[10px]">{e.jours_retard}</span>
                        : <span className="text-surface-800/20">—</span>}
                    </td>
                    <td className="td py-1 text-center text-[10px]">{formatDate(e.date_echeance)}</td>
                    <td className="td py-1 text-right font-mono text-[10px] font-semibold">{formatMontant(e.total_du)}</td>
                    <td className="td py-1 text-right font-mono text-[10px] text-emerald-600">{formatMontant(e.montant_paye)}</td>
                    <td className="td py-1 text-right font-mono text-[10px] text-red-600">{formatMontant(parseFloat(e.total_du??0)-parseFloat(e.montant_paye??0))}</td>
                    <td className="td py-1 text-right font-mono text-[10px]">{formatMontant(e.montant_principal)}</td>
                    <td className="td py-1 text-right font-mono text-[10px]">{formatMontant(e.montant_interet)}</td>
                    <td className="td py-1 text-right font-mono text-[10px]">{formatMontant(e.penalites)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET Simulation de prêt
// ─────────────────────────────────────────────────────────────────
function TabSimulation() {
  const [p, setP] = useState({
    montant:'50000', taux:'12', mode:'DEGRESSIF', nb:'12',
    date_octroi:new Date().toISOString().split('T')[0],
    unite:'Mois', duree:'1', jour:''
  })
  const [sim, setSim]       = useState(null)
  const [loading, setLoading] = useState(false)
  const set = k => e => setP(prev=>({...prev,[k]:e.target.value}))

  const simuler = () => {
    setLoading(true)
    setTimeout(()=>{
      const M=parseFloat(p.montant), t=parseFloat(p.taux)/100/12, n=parseInt(p.nb)
      const rows=[]
      let restant=M
      for(let i=1;i<=n;i++){
        const interet   = p.mode==='DEGRESSIF'?restant*t:M*t
        const principal = p.mode==='IN_FINE'?(i===n?M:0):M/n
        restant-=principal
        rows.push({
          num:i,
          date:new Date(new Date(p.date_octroi).setMonth(new Date(p.date_octroi).getMonth()+i)).toLocaleDateString('fr-FR'),
          j:30,
          ech:(principal+interet).toFixed(2),
          principal:principal.toFixed(2),
          interet:interet.toFixed(2),
          restant:Math.max(0,restant).toFixed(2)
        })
      }
      setSim({rows, totalEch:rows.reduce((s,r)=>s+parseFloat(r.ech),0), totalInt:rows.reduce((s,r)=>s+parseFloat(r.interet),0), M})
      setLoading(false)
    },300)
  }

  return (
    <div className="space-y-3">
      <Panel title="Paramètres">
        <div className="px-4 py-3 grid grid-cols-5 gap-3">
          {[['Montant','montant','number'],['Taux (%)','taux','number'],['Nb échéances','nb','number'],['Durée','duree','number']].map(([l,k,t])=>(
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input text-xs py-1.5" type={t} step="0.01" value={p[k]} onChange={set(k)}/>
            </div>
          ))}
          <div>
            <label className="label">Mode calcul</label>
            <select className="input text-xs py-1.5" value={p.mode} onChange={set('mode')}>
              {['DEGRESSIF','LINEAIRE','IN_FINE'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date d'octroi</label>
            <input className="input text-xs py-1.5" type="date" value={p.date_octroi} onChange={set('date_octroi')}/>
          </div>
          <div>
            <label className="label">Unité</label>
            <select className="input text-xs py-1.5" value={p.unite} onChange={set('unite')}>
              {['Jour','Semaine','Quinzaine','Mois','Trimestre','Semestre','Année'].map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Jour mois</label>
            <input className="input text-xs py-1.5" type="number" min="1" max="31" value={p.jour} onChange={set('jour')} placeholder="Ex: 1"/>
          </div>
          
          <div className="flex items-end">
            <button className="btn-primary w-full py-1.5 text-xs justify-center" onClick={simuler} disabled={loading}>
              {loading ? 'Calcul…' : 'Lancer la simulation'}
            </button>
          </div>
        </div>
      </Panel>

      {sim && (
        <Panel title="Tableau d'amortissement">
          <div className="flex gap-6 px-4 py-2 bg-surface-50/60 border-b border-surface-100 text-[11px] font-mono">
            <span>Capital : <strong>{formatMontant(sim.M)}</strong></span>
            <span>Intérêts : <strong className="text-amber-700">{formatMontant(sim.totalInt)}</strong></span>
            <span>Total : <strong>{formatMontant(sim.totalEch)}</strong></span>
          </div>
          <div className="overflow-auto max-h-64">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100 sticky top-0">
                <tr>{['N°','Date Échéances','J. Période','Montant Échéances','Montant principal','Montant intérêt','Frais','Capital restant'].map(h=>
                  <th key={h} className="th text-[10px] py-1 text-center">{h}</th>
                )}</tr>
              </thead>
              <tbody>
                {sim.rows.map((r,i)=>(
                  <tr key={r.num} className={`table-row ${i%2?'bg-surface-50/40':''}`}>
                    <td className="td py-1 text-center font-mono font-bold text-[11px] text-brand-700">{r.num}</td>
                    <td className="td py-1 text-center text-[11px]">{r.date}</td>
                    <td className="td py-1 text-center text-[10px] text-surface-800/30">{r.j}</td>
                    <td className="td py-1 text-right font-mono text-[11px] font-semibold">{formatMontant(r.ech)}</td>
                    <td className="td py-1 text-right font-mono text-[11px]">{formatMontant(r.principal)}</td>
                    <td className="td py-1 text-right font-mono text-[11px] text-amber-700">{formatMontant(r.interet)}</td>
                    <td className="td py-1 text-right text-[10px] text-surface-800/30">0,0</td>
                    <td className="td py-1 text-right font-mono text-[11px] text-brand-600">{formatMontant(r.restant)}</td>
                  </tr>
                ))}
                <tr className="bg-surface-100 font-bold text-[11px]">
                  <td className="td text-center" colSpan={3}>Total</td>
                  <td className="td text-right font-mono">{formatMontant(sim.totalEch)}</td>
                  <td className="td text-right font-mono">{formatMontant(sim.M)}</td>
                  <td className="td text-right font-mono text-amber-700">{formatMontant(sim.totalInt)}</td>
                  <td className="td text-right">0,00</td>
                  <td className="td text-right text-surface-800/30">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Panel 360° principal d'un client
// ─────────────────────────────────────────────────────────────────
function Client360Panel({ clientId }) {
  const [activeTab, setActiveTab] = useState('vision360')
  const fetcher = useCallback(() => clientsApi.get(clientId), [clientId])
  const { data: client, loading, error,execute: refreshClient } = useApi(fetcher, [clientId])
  const { user } = useAuth();
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-48 gap-2">
      <Spinner className="w-6 h-6"/>
      <p className="text-xs text-surface-800/40">Chargement vision 360°…</p>
    </div>
  )
  if (error || !client) return <div className="p-4"><ErrorAlert message={error||'Client introuvable.'}/></div>

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">

      {/* Bandeau identité */}
      <div className="bg-white border-b border-surface-100 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] text-surface-800/50">
            Client {client.id} —
            <strong className="text-surface-900 ml-1">
              {client.personne?.nom?.toUpperCase()} {client.personne?.prenom} / {client.nil??'—'}
            </strong>
          </span>
          {client.est_sur_liste_noire && (
            <span className="badge bg-red-100 text-red-700 text-[10px]">Liste noire</span>
          )}
          {client.est_vip && (
            <span className="badge bg-amber-100 text-amber-700 text-[10px]">VIP</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[10px] text-surface-800/40 flex-wrap">
          <span>N° I.N. : <strong className="text-surface-800">{client.nil??'—'}</strong></span>
          <span>Exp. : <strong className="text-surface-800">{formatDate(client.date_expiration_piece)}</strong></span>
          <span>Tél. : <strong className="text-surface-800">{client.personne?.telephone??'—'}</strong></span>

          <span className="ml-auto flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              N° Caisse : <strong>{user?.num_caisse ?? 'Non assignée'} </strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-200">
              Solde : <strong>{formatMontant(user?.montant_caisse ?? 0)}</strong>
            </span>
          </span>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="bg-white border-b border-surface-100 overflow-x-auto shrink-0">
        <div className="flex min-w-max">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-[10px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab===id
                  ? 'border-brand-600 text-brand-700 bg-brand-50/30'
                  : 'border-transparent text-surface-800/40 hover:text-surface-800 hover:bg-surface-50'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4 bg-surface-50/50">
        {activeTab==='vision360'    && <TabVision360    client={client}/>}
        {activeTab==='signaletique' && <TabSignaletique client={client}/>}
        {activeTab==='documents'    && <TabDocuments    client={client}   refreshClient={refreshClient}/>}
        {activeTab==='portefeuille' && <TabPortefeuille client={client}/>}
        {activeTab==='echeances'    && <TabEcheances    client={client} type="venir"/>}
        {activeTab==='retard'       && <TabEcheances    client={client} type="retard"/>}
        {activeTab==='simulation'   && <TabSimulation/>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Page principale exportée
// ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null)

  const fetcher = useCallback(
    () => clientsApi.list({ page, search: search || undefined }),
    [page, search]
  )
  const { data, loading, execute: refresh } = useApi(fetcher, [page, search])
  const clients = data?.data ?? []

  // Sélectionner le premier client par défaut
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id)
    }
  }, [clients, selectedClientId])

  return (
    <div className="space-y-4 w-full">

      {/* Bandeau de recherche */}
      <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-surface-900">Espace Relation Client</h1>
          <p className="text-[11px] text-surface-500">Vue intégrale à 360°</p>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-2xl justify-end">
          {/* Champ de recherche */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"/>
            <input
              className="input pl-9 py-1.5 text-xs w-full"
              placeholder="Rechercher par NIL, Nom, CIN…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); setSelectedClientId(null) }}
            />
          </div>

          {/* Sélecteurs clients rapides */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
            {loading ? (
              <Spinner className="w-4 h-4 text-brand-600"/>
            ) : (
              clients.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedClientId === c.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
                  }`}
                >
                  {c.personne?.nom?.toUpperCase()}
                  {c.est_vip && (
                    <span className={`text-[9px] font-bold px-1 rounded ${selectedClientId===c.id?'bg-white/20 text-white':'bg-amber-100 text-amber-700'}`}>
                      VIP
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Panel 360° */}
      <div className="w-full">
        {selectedClientId ? (
          <Client360Panel clientId={selectedClientId}/>
        ) : (
          <div className="bg-white rounded-xl border border-surface-100 p-12 text-center shadow-card">
            <p className="text-xs text-surface-500 font-medium">Aucun client sélectionné.</p>
          </div>
        )}
      </div>

    </div>
  )
}