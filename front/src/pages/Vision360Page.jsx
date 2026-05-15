import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, User, FileText, Users, Briefcase,
  Clock, AlertCircle, XCircle, PhoneCall,
  BarChart2, Plus, ChevronRight, RefreshCw,
  MapPin, Mail, Phone, Calendar, Star,
  CreditCard, TrendingUp, TrendingDown,
  CheckCircle, AlertTriangle, Banknote,
  Eye, Download, Printer, Search, Loader2,
  Building2, IdCard, Wallet, Home, PieChart,
  CalendarDays, ClockAlert, Receipt, Gavel
} from 'lucide-react'
import {
  clientsApi, demandesApi, pretsApi, paiementsApi, alertesApi
} from '../api/services'
import { useApi } from '../hooks/useApi'
import { formatDate, formatMontant, formatTaux, statutBadge, statutLabel } from '../utils/helpers'
import { Badge, Modal, ErrorAlert, Spinner } from '../components/ui'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts'

// ─────────────────────────────────────────────────────────────────
// Constantes tabs avec icônes modernisées
// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'signaletique',    label: 'Fiche Signalétique',  icon: IdCard, color: 'blue' },
  { id: 'documents',      label: 'Documents',            icon: FileText, color: 'purple' },
  { id: 'appartenances',  label: 'Appartenance',         icon: Users, color: 'green' },
  { id: 'portefeuille',   label: 'Portefeuille',         icon: Wallet, color: 'emerald' },
  { id: 'echeances',      label: 'Échéances',            icon: CalendarDays, color: 'orange' },
  { id: 'retard',         label: 'Retards',              icon: ClockAlert, color: 'red' },
  { id: 'impayes',        label: 'Impayés',              icon: Receipt, color: 'rose' },
  { id: 'recouvrement',   label: 'Recouvrement',         icon: Gavel, color: 'amber' },
  { id: 'simulation',     label: 'Simulation',           icon: PieChart, color: 'indigo' },
]

// ─────────────────────────────────────────────────────────────────
// Composants UI réutilisables modernisés
// ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono, highlight }) {
  return (
    <div className={`flex justify-between items-start py-2.5 border-b border-gray-100 last:border-0 ${highlight ? 'bg-gradient-to-r from-brand-50/30 to-transparent -mx-3 px-3 rounded-lg' : ''}`}>
      <dt className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
        {label}
      </dt>
      <dd className={`text-xs font-semibold text-right text-gray-900 ${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-700' : ''}`}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

function SectionCard({ title, children, action, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-brand-600" />}
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, trend, trendValue, color = 'brand' }) {
  const colors = {
    brand: 'from-brand-50 to-brand-100 border-brand-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    red: 'from-red-50 to-red-100 border-red-200',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl border p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? <TrendingUp size={12} className="text-emerald-600" /> : <TrendingDown size={12} className="text-red-600" />}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
          <Icon size={20} className={`text-${color === 'brand' ? 'brand' : color}-600`} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Fiche Signalétique amélioré
// ─────────────────────────────────────────────────────────────────
function TabSignaletique({ client }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche - Identité */}
      <div className="lg:col-span-2 space-y-6">
        <SectionCard title="Identité complète" icon={User}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <InfoRow label="Code client" value={client.code_client} mono highlight />
            <InfoRow label="NIL" value={client.nil} mono />
            <InfoRow label="Titre" value={client.titre} />
            <InfoRow label="Prénom & Nom" value={`${client.personne?.prenom} ${client.personne?.nom}`} />
            <InfoRow label="Genre" value={client.genre} />
            <InfoRow label="Date naissance" value={formatDate(client.personne?.date_naissance)} />
            <InfoRow label="Lieu naissance" value={`${client.ville_naissance}, ${client.pays_naissance}`} />
            <InfoRow label="Nationalité" value={client.nationalite} />
            <InfoRow label="Langue" value={client.langue} />
            <InfoRow label="Niveau d'étude" value={client.niveau_etude} />
            <InfoRow label="Nom de la mère" value={client.nom_mere} />
          </div>
        </SectionCard>

        <SectionCard title="Situation professionnelle" icon={Briefcase}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <InfoRow label="Catégorie client" value={client.categorie_client} />
            <InfoRow label="Fonction" value={client.fonction} />
            <InfoRow label="Secteur d'activité" value={client.secteur_activite} />
            <InfoRow label="Revenu mensuel" value={formatMontant(client.revenu_mensuel)} mono highlight />
            <InfoRow label="Score éligibilité" value={client.score_eligibilite ?? '—'} />
          </div>
        </SectionCard>
      </div>

      {/* Colonne droite - Contacts et pièces */}
      <div className="space-y-6">
        <SectionCard title="Coordonnées" icon={MapPin}>
          <InfoRow label="Téléphone" value={client.personne?.telephone} mono />
          <InfoRow label="Téléphone 2" value={client.telephone_secondaire} mono />
          <InfoRow label="Email" value={client.email_client ?? client.personne?.email} />
          <InfoRow label="Adresse" value={client.adresse_1} />
          <InfoRow label="Complément" value={client.adresse_2} />
          <InfoRow label="Code postal" value={client.code_postal} />
          <InfoRow label="Ville/Pays" value={`${client.ville}, ${client.pays}`} />
        </SectionCard>

        <SectionCard title="Pièce d'identité" icon={IdCard}>
          <InfoRow label="Type" value={client.type_piece_identite} />
          <InfoRow label="Numéro" value={client.numero_piece_identite} mono />
          <InfoRow label="Date expiration" value={formatDate(client.date_expiration_piece)} />
          <InfoRow label="Vérifié" value={client.pin_verifie ? '✅ Oui' : '❌ Non'} />
        </SectionCard>

        <SectionCard title="Situation familiale" icon={Users}>
          <InfoRow label="Situation" value={client.situation_familiale?.replace('_', ' ')} />
          <InfoRow label="Nombre d'enfants" value={client.nombre_enfants} />
          <InfoRow label="Nom du conjoint" value={`${client.prenom_conjoint} ${client.nom_conjoint}`} />
        </SectionCard>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Documents GED amélioré
// ─────────────────────────────────────────────────────────────────
function TabDocuments({ client }) {
  const fetcher = useCallback(() => clientsApi.get(client.id).then(r => r.data.documents), [client.id])
  const { data: docs, loading } = useApi(() => Promise.resolve({ data: client.documents ?? [] }), [])

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📄'
    if (type?.includes('image')) return '🖼️'
    if (type?.includes('sheet') || type?.includes('excel')) return '📊'
    return '📎'
  }

  return (
    <SectionCard title="Gestion documentaire" icon={FileText}
      action={
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-sm">
          <Plus size={14} /> Ajouter un document
        </button>
      }
    >
      {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
      : !docs?.length ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun document enregistré</p>
          <button className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium">
            + Télécharger un document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(d.type_mime)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.intitule}</p>
                  <p className="text-xs text-gray-500">{formatDate(d.created_at)} • {d.taille_listible || '—'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded hover:bg-white transition-colors" title="Voir"><Eye size={14} className="text-gray-600" /></button>
                <button className="p-1.5 rounded hover:bg-white transition-colors" title="Télécharger"><Download size={14} className="text-gray-600" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Appartenances amélioré
// ─────────────────────────────────────────────────────────────────
function TabAppartenances({ client }) {
  const liens = client.liens ?? []
  return (
    <SectionCard title={`Liens et relations (${liens.length})`} icon={Users}>
      {!liens.length ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun lien enregistré</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {liens.map(l => (
            <div key={l.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-brand-200 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{l.nom_complet ?? `${l.prenom} ${l.nom}`}</span>
                  <Badge statut={l.type_lien} className="text-xs" />
                  {l.ayant_droit && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ayant droit</span>}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  {l.cin && <span>CIN: {l.cin}</span>}
                  {l.gsm && <span>📱 {l.gsm}</span>}
                  {l.adresse && <span>📍 {l.adresse}</span>}
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-white transition-colors">
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Portefeuille amélioré
// ─────────────────────────────────────────────────────────────────
function TabPortefeuille({ client }) {
  const { data: prets, loading: pretsLoading } = useApi(
    () => clientsApi.prets(client.id), [client.id]
  )
  const { data: demandesData, loading: demLoading } = useApi(
    () => demandesApi.list({ client_id: client.id }), [client.id]
  )
  const demandes = demandesData?.data ?? []

  const encoursTotal = (prets ?? []).reduce((sum, p) => sum + parseFloat(p.capital_restant || 0), 0)
  const montantTotalAccorde = (prets ?? []).reduce((sum, p) => sum + parseFloat(p.montant_accorde || 0), 0)
  const tauxRemboursement = montantTotalAccorde > 0 ? ((montantTotalAccorde - encoursTotal) / montantTotalAccorde * 100) : 0

  const chartData = (prets ?? []).slice(0, 6).map(p => ({
    ref: p.reference?.slice(-6),
    accordé: parseFloat(p.montant_accorde),
    restant: parseFloat(p.capital_restant ?? p.montant_accorde),
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Encours total" value={formatMontant(encoursTotal)} icon={Wallet} color="brand" />
        <StatCard label="Montant total accordé" value={formatMontant(montantTotalAccorde)} icon={CreditCard} color="emerald" />
        <StatCard label="Taux de remboursement" value={`${tauxRemboursement.toFixed(1)}%`} icon={TrendingUp} trend="up" trendValue="+12%" color="blue" />
      </div>

      {/* Graphique */}
      {chartData.length > 0 && (
        <SectionCard title="Évolution des remboursements" icon={BarChart2}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={8}>
              <XAxis dataKey="ref" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatMontant(v)} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="accordé" fill="#a9e6cc" radius={[6,6,0,0]} name="Montant accordé" />
              <Bar dataKey="restant" fill="#1a9d74" radius={[6,6,0,0]} name="Capital restant" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Prêts actifs */}
      <SectionCard title={`Prêts en cours (${prets?.length ?? 0})`} icon={CreditCard}>
        {pretsLoading ? <div className="py-8 flex justify-center"><Spinner /></div>
        : !prets?.length ? (
          <div className="text-center py-8">
            <CreditCard size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Aucun prêt actif</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prets.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">{p.reference}</span>
                    <Badge statut={p.statut_pret} />
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div><span className="text-gray-500">Montant:</span> <span className="font-semibold">{formatMontant(p.montant_accorde)}</span></div>
                    <div><span className="text-gray-500">Restant:</span> <span className="font-semibold text-brand-700">{formatMontant(p.capital_restant)}</span></div>
                    <div><span className="text-gray-500">Date début:</span> {formatDate(p.date_debut)}</div>
                    <div><span className="text-gray-500">Échéances:</span> {p.nombre_echeances || '—'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-white transition-colors"><Eye size={14} className="text-gray-600" /></button>
                  <button className="p-2 rounded-lg hover:bg-white transition-colors"><Printer size={14} className="text-gray-600" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Demandes */}
      <SectionCard title={`Demandes récentes (${demandes.length})`} icon={FileText}>
        {demLoading ? <div className="py-8 flex justify-center"><Spinner /></div>
        : !demandes.length ? (
          <p className="text-sm text-center text-gray-400 py-8">Aucune demande récente</p>
        ) : (
          <div className="space-y-2">
            {demandes.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-xs text-gray-500">{formatDate(d.date_soumission)}</span>
                  <span className="font-medium text-sm">{d.objet_pret || 'Demande de crédit'}</span>
                  <span className="font-mono text-xs">{formatMontant(d.montant_demande)}</span>
                  <Badge statut={d.statut_demande} />
                </div>
                <button className="p-1.5 rounded hover:bg-gray-100"><Eye size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Échéances amélioré
// ─────────────────────────────────────────────────────────────────
function TabEcheances({ clientId, type }) {
  const config = {
    venir:   { statut: 'EN_ATTENTE', label: 'à venir', color: 'blue', icon: CalendarDays },
    retard:  { statut: 'EN_RETARD', label: 'en retard', color: 'amber', icon: ClockAlert },
    impayes: { statut: 'PARTIELLEMENT_PAYEE', label: 'impayées', color: 'red', icon: Receipt },
  }[type]

  const { data: pretsData } = useApi(
    () => clientsApi.prets(clientId), [clientId]
  )

  const allEch = (pretsData ?? []).flatMap(p =>
    (p.echeances ?? [])
      .filter(e => type === 'venir'
        ? e.statut === 'EN_ATTENTE'
        : type === 'retard'
        ? e.jours_retard > 0
        : e.statut === 'PARTIELLEMENT_PAYEE' || (e.statut === 'EN_RETARD' && parseFloat(e.montant_paye) === 0)
      )
      .map(e => ({ ...e, pretRef: p.reference }))
  )

  const montantTotalDu = allEch.reduce((sum, e) => sum + parseFloat(e.total_du), 0)
  const montantTotalPaye = allEch.reduce((sum, e) => sum + parseFloat(e.montant_paye), 0)

  return (
    <div className="space-y-6">
      {(type === 'retard' || type === 'impayes') && allEch.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <p className="font-semibold text-gray-900">Alertes de paiement</p>
                <p className="text-sm text-gray-600">{allEch.length} échéance(s) nécessitent une attention immédiate</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              Traiter les impayés
            </button>
          </div>
        </div>
      )}

      <SectionCard title={`Échéances ${config.label}`} icon={config.icon}>
        <div className="mb-4 grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Total à payer</p>
            <p className="text-xl font-bold text-gray-900">{formatMontant(montantTotalDu)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total payé</p>
            <p className="text-xl font-bold text-emerald-600">{formatMontant(montantTotalPaye)}</p>
          </div>
        </div>

        {!allEch.length ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-emerald-300 mb-3" />
            <p className="text-sm text-gray-400">Aucune échéance {config.label}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allEch.map(e => (
              <div key={e.id} className={`p-4 rounded-lg border ${e.jours_retard > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-brand-700">{e.pretRef}</span>
                    <span className="text-xs text-gray-500">Échéance n°{e.numero_echeance}</span>
                    {e.jours_retard > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        {e.jours_retard} jour(s) de retard
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(e.date_echeance)}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Échéance</p>
                    <p className="font-semibold">{formatMontant(e.total_du)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payé</p>
                    <p className="font-semibold text-emerald-600">{formatMontant(e.montant_paye)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Restant</p>
                    <p className="font-semibold text-red-600">{formatMontant(parseFloat(e.total_du) - parseFloat(e.montant_paye))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Intérêts</p>
                    <p className="text-sm">{formatMontant(e.montant_interet)}</p>
                  </div>
                </div>
                {e.jours_retard > 0 && (
                  <button className="mt-3 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Envoyer un rappel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Recouvrement amélioré
// ─────────────────────────────────────────────────────────────────
function TabRecouvrement({ clientId }) {
  const { data: alertes, loading } = useApi(
    () => alertesApi.list({ client_id: clientId }), [clientId]
  )
  const list = alertes?.data ?? []
  const niveauIcon = { INFO: 'ℹ️', AVERTISSEMENT: '⚠️', CRITIQUE: '🔴', URGENCE: '🚨' }
  const niveauColor = { INFO: 'blue', AVERTISSEMENT: 'amber', CRITIQUE: 'red', URGENCE: 'red' }

  return (
    <SectionCard title="Actions de recouvrement" icon={Gavel}>
      {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
      : !list.length ? (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto text-emerald-300 mb-3" />
          <p className="text-sm text-gray-400">Aucune action de recouvrement en cours</p>
          <p className="text-xs text-gray-400 mt-1">Toutes les échéances sont à jour</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(a => (
            <div key={a.id} className={`p-4 rounded-lg border-l-4 ${a.niveau_gravite === 'URGENCE' ? 'border-l-red-600 bg-red-50' : a.niveau_gravite === 'CRITIQUE' ? 'border-l-orange-600 bg-orange-50' : 'border-l-amber-500 bg-amber-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{niveauIcon[a.niveau_gravite]}</span>
                    <Badge statut={a.niveau_gravite} />
                    <span className="text-xs text-gray-500">{formatDate(a.date_alerte)}</span>
                    {a.est_acquittee && <Badge statut="ACQUITTEE" className="bg-emerald-100 text-emerald-700" />}
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{a.message}</p>
                  {a.est_acquittee && (
                    <p className="text-xs text-gray-500">Acquittée le {formatDate(a.date_acquittement)}</p>
                  )}
                </div>
                {!a.est_acquittee && (
                  <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                    Acquitter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab : Simulation de prêt amélioré
// ─────────────────────────────────────────────────────────────────
function TabSimulation() {
  const [params, setParams] = useState({
    montant: '50000', taux: '12', mode_calcul: 'DEGRESSIF',
    nb_echeances: '12', duree: '1', unite: 'Mois',
    date_octroi: new Date().toISOString().split('T')[0],
    jour_mois: '', date_premiere_echeance: '',
  })
  const [simulation, setSimulation] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = k => e => setParams(p => ({ ...p, [k]: e.target.value }))

  const simuler = () => {
    setLoading(true)
    setTimeout(() => {
      const M = parseFloat(params.montant)
      const t = parseFloat(params.taux) / 100 / 12
      const n = parseInt(params.nb_echeances)
      const rows = []
      let restant = M

      for (let i = 1; i <= n; i++) {
        const interet = params.mode_calcul === 'DEGRESSIF' ? restant * t : M * t
        const principal = params.mode_calcul === 'IN_FINE' ? (i === n ? M : 0) : (M / n)
        const echeance = principal + interet
        restant -= principal
        rows.push({
          num: i,
          date: new Date(new Date(params.date_octroi).setMonth(new Date(params.date_octroi).getMonth() + i))
            .toLocaleDateString('fr-FR'),
          echeance: echeance.toFixed(2),
          principal: principal.toFixed(2),
          interet: interet.toFixed(2),
          restant: Math.max(0, restant).toFixed(2),
        })
      }
      const totalEch = rows.reduce((s, r) => s + parseFloat(r.echeance), 0)
      const totalInt = rows.reduce((s, r) => s + parseFloat(r.interet), 0)
      setSimulation({ rows, totalEch, totalInt, capital: M })
      setLoading(false)
    }, 400)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Paramètres de simulation" icon={PieChart}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Montant (MAD)</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" type="number" value={params.montant} onChange={set('montant')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Taux annuel (%)</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" type="number" step="0.01" value={params.taux} onChange={set('taux')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mode de calcul</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" value={params.mode_calcul} onChange={set('mode_calcul')}>
              {['DEGRESSIF', 'LINEAIRE', 'IN_FINE'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre d'échéances</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="number" min="1" value={params.nb_echeances} onChange={set('nb_echeances')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date d'octroi</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="date" value={params.date_octroi} onChange={set('date_octroi')} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2" onClick={simuler} disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <BarChart2 size={15} />}
            {loading ? 'Simulation en cours...' : 'Lancer la simulation'}
          </button>
        </div>
      </SectionCard>

      {simulation && (
        <SectionCard title="Tableau d'amortissement" icon={Calendar}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-brand-50 to-emerald-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Capital emprunté</p>
              <p className="text-xl font-bold text-gray-900">{formatMontant(simulation.capital)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total intérêts</p>
              <p className="text-xl font-bold text-amber-700">{formatMontant(simulation.totalInt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Coût total</p>
              <p className="text-xl font-bold text-gray-900">{formatMontant(simulation.totalEch)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Mensualité moyenne</p>
              <p className="text-xl font-bold text-brand-700">{formatMontant(simulation.totalEch / simulation.rows.length)}</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['N°', 'Date Échéance', 'Montant', 'Principal', 'Intérêt', 'Restant'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {simulation.rows.map((r, idx) => (
                  <tr key={r.num} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm font-mono font-bold text-brand-700">{r.num}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{r.date}</td>
                    <td className="px-4 py-2 text-sm font-semibold">{formatMontant(r.echeance)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{formatMontant(r.principal)}</td>
                    <td className="px-4 py-2 text-sm text-amber-700">{formatMontant(r.interet)}</td>
                    <td className="px-4 py-2 text-sm text-brand-600">{formatMontant(r.restant)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-2 text-sm" colSpan={2}>Total</td>
                  <td className="px-4 py-2 text-sm">{formatMontant(simulation.totalEch)}</td>
                  <td className="px-4 py-2 text-sm">{formatMontant(simulation.capital)}</td>
                  <td className="px-4 py-2 text-sm text-amber-700">{formatMontant(simulation.totalInt)}</td>
                  <td className="px-4 py-2 text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Composant principal : Vision360Page modernisé
// ─────────────────────────────────────────────────────────────────
export default function Vision360Page() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'signaletique')

  const changeTab = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const fetcher = useCallback(() => clientsApi.get(id), [id])
  const { data: client, loading, error, execute: refresh } = useApi(fetcher, [id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 size={40} className="animate-spin text-brand-600" />
      <p className="text-sm text-gray-500">Chargement de la vision 360°...</p>
    </div>
  )
  if (error) return <div className="p-6"><ErrorAlert message={error} /></div>
  if (!client) return null

  // Calcul des KPIs
  const pretsActifs = (client.demande_credits ?? []).filter(d => d.statut_demande === 'EN_COURS').length
  const soldeTotal = (client.comptes ?? []).reduce((s, c) => s + parseFloat(c.solde_actuel ?? 0), 0)
  const demandesEnCours = (client.demande_credits ?? []).filter(d => d.statut_demande === 'EN_ATTENTE').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="p-6 lg:p-8">
        {/* ── Header avec bouton retour ── */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/clients')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Retour à la liste clients
          </button>
        </div>

        {/* ── Carte client principale ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {client.titre} {client.personne?.prenom} {client.personne?.nom}
                  </h1>
                  <p className="text-white/80 text-sm">Code client: {client.code_client}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={refresh} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Actualiser">
                  <RefreshCw size={16} />
                </button>
                <button className="p-2 roundead-lg bg-white/10 hover:bg-white/20 transition-colors" title="Imprimer">
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => navigate(`/demandes?client_id=${client.id}`)}
                  className="px-4 py-2 bg-white text-brand-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} /> Nouvelle demande
                </button>
              </div>
            </div>
          </div>

          {/* KPIs rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <CreditCard size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Solde compte</p>
                <p className="text-lg font-bold text-gray-900">{formatMontant(soldeTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Briefcase size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Prêts actifs</p>
                <p className="text-lg font-bold text-gray-900">{pretsActifs}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Demandes en cours</p>
                <p className="text-lg font-bold text-gray-900">{demandesEnCours}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Star size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Score éligibilité</p>
                <p className="text-lg font-bold text-gray-900">{client.score_eligibilite || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation par tabs modernisée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(({ id: tabId, label, icon: Icon, color }) => {
              const isActive = activeTab === tabId
              return (
                <button
                  key={tabId}
                  onClick={() => changeTab(tabId)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
                    isActive
                      ? `text-${color}-600 bg-${color}-50`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {isActive && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${color}-600`}></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Contenu de l'onglet actif avec animation ── */}
        <div className="animate-fadeIn">
          {activeTab === 'signaletique' && <TabSignaletique client={client} />}
          {activeTab === 'documents' && <TabDocuments client={client} />}
          {activeTab === 'appartenances' && <TabAppartenances client={client} />}
          {activeTab === 'portefeuille' && <TabPortefeuille client={client} />}
          {activeTab === 'echeances' && <TabEcheances clientId={id} type="venir" />}
          {activeTab === 'retard' && <TabEcheances clientId={id} type="retard" />}
          {activeTab === 'impayes' && <TabEcheances clientId={id} type="impayes" />}
          {activeTab === 'recouvrement' && <TabRecouvrement clientId={id} />}
          {activeTab === 'simulation' && <TabSimulation />}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}