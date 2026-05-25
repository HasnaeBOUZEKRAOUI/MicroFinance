import { useState, useEffect, useRef } from 'react'
import { profileApi } from '../api/services'
import {
  User, Lock, Camera, Save, Eye, EyeOff,
  Wallet, TrendingUp, TrendingDown, CreditCard,
  ArrowUpCircle, ArrowDownCircle, Shield, Calendar,
  Phone, Mail, Edit3, CheckCircle, AlertCircle
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 })
    .format(n ?? 0)

const ROLE_LABELS = {
  ADMIN: 'Administrateur', AGENT_CREDIT: 'Agent Crédit',
  MANAGER: 'Manager', SUPERVISEUR: 'Superviseur'
}

const ROLE_COLORS = {
  ADMIN:        'bg-red-100 text-red-700 border-red-200',
  AGENT_CREDIT: 'bg-blue-100 text-blue-700 border-blue-200',
  MANAGER:      'bg-purple-100 text-purple-700 border-purple-200',
  SUPERVISEUR:  'bg-amber-100 text-amber-700 border-amber-200',
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all
      ${type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  )
}

function SectionCard({ title, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60 flex items-center justify-between">
        <h3 className="text-sm font-bold text-surface-800 flex items-center gap-2">
        
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-surface-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      </div>
      <div>
        <p className="text-xs text-surface-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-surface-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-surface-800">{value || '—'}</p>
    </div>
  )
}

// ─── Onglet Infos personnelles ────────────────────────────────────────────────
function TabInfos({ profile, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    prenom:          profile.personne?.prenom ?? '',
    nom:             profile.personne?.nom ?? '',
    email:           profile.personne?.email ?? '',
    telephone:       profile.personne?.telephone ?? '',
    date_naissance:  profile.personne?.date_naissance ?? '',
    nom_utilisateur: profile.nom_utilisateur ?? '',
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await profileApi.update(form)
      onSaved('Profil mis à jour avec succès !', 'success')
      setEditing(false)
    } catch (e) {
      onSaved(e.response?.data?.message || 'Erreur lors de la mise à jour.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-4 py-2">
              Annuler
            </button>
            <button onClick={handleSave} disabled={loading}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              
              Enregistrer
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 px-3 py-1.5 rounded-lg transition-all">
             Modifier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editing ? (
          <>
            {[
              { key: 'prenom', label: 'Prénom', type: 'text' },
              { key: 'nom', label: 'Nom', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'telephone', label: 'Téléphone', type: 'tel' },
              { key: 'date_naissance', label: 'Date de naissance', type: 'date' },
              { key: 'nom_utilisateur', label: "Nom d'utilisateur", type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-surface-500 mb-1">{label}</label>
                <input type={type} className="input text-sm h-9"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </>
        ) : (
          <>
            <Field label="Prénom"           value={profile.personne?.prenom} />
            <Field label="Nom"              value={profile.personne?.nom} />
            <Field label="Email"            value={profile.personne?.email} />
            <Field label="Téléphone"        value={profile.personne?.telephone} />
            <Field label="Date naissance"   value={profile.personne?.date_naissance
              ? new Date(profile.personne.date_naissance).toLocaleDateString('fr-FR') : '—'} />
            <Field label="Nom d'utilisateur" value={profile.nom_utilisateur} />
            <Field label="Date d'embauche"  value={profile.date_embauche
              ? new Date(profile.date_embauche).toLocaleDateString('fr-FR') : '—'} />
            <Field label="Superviseur"      value={profile.superviseur?.nom_complet} />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Mot de passe ──────────────────────────────────────────────────────
function TabPassword({ onSaved }) {
  const [form, setForm] = useState({
    mot_de_passe_actuel:            '',
    nouveau_mot_de_passe:           '',
    nouveau_mot_de_passe_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState({ actuel: false, nouveau: false, confirm: false })

  const handleSave = async (e) => {
    e.preventDefault()
    if (form.nouveau_mot_de_passe !== form.nouveau_mot_de_passe_confirmation) {
      onSaved('Les mots de passe ne correspondent pas.', 'error')
      return
    }
    setLoading(true)
    try {
      await profileApi.updatePassword(form)
      onSaved('Mot de passe modifié avec succès !', 'success')
      setForm({ mot_de_passe_actuel: '', nouveau_mot_de_passe: '', nouveau_mot_de_passe_confirmation: '' })
    } catch (e) {
      onSaved(e.response?.data?.message || 'Erreur.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const PasswordField = ({ label, fieldKey, showKey }) => (
    <div>
      <label className="block text-xs font-semibold text-surface-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show[showKey] ? 'text' : 'password'}
          className="input text-sm h-9 pr-10"
          value={form[fieldKey]}
          onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
          required
        />
        <button type="button"
          onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3 top-2.5 text-surface-400 hover:text-surface-600">
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )

  // Indicateur de force
  const strength = (() => {
    const p = form.nouveau_mot_de_passe
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][strength]

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      <PasswordField label="Mot de passe actuel"    fieldKey="mot_de_passe_actuel"              showKey="actuel" />
      <PasswordField label="Nouveau mot de passe"   fieldKey="nouveau_mot_de_passe"              showKey="nouveau" />

      {form.nouveau_mot_de_passe && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-surface-200'}`} />
            ))}
          </div>
          <p className="text-xs text-surface-400">Force : <span className="font-semibold">{strengthLabel}</span></p>
        </div>
      )}

      <PasswordField label="Confirmer le mot de passe" fieldKey="nouveau_mot_de_passe_confirmation" showKey="confirm" />

      <div className="bg-surface-50 rounded-xl p-3 text-xs text-surface-500 space-y-1 border border-surface-100">
        <p className="font-semibold text-surface-700 mb-1">Le mot de passe doit contenir :</p>
        {[
          ['Au moins 8 caractères', form.nouveau_mot_de_passe.length >= 8],
          ['Au moins une lettre', /[A-Za-z]/.test(form.nouveau_mot_de_passe)],
          ['Au moins un chiffre', /[0-9]/.test(form.nouveau_mot_de_passe)],
        ].map(([label, ok]) => (
          <p key={label} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600' : 'text-surface-400'}`}>
            <CheckCircle size={11} className={ok ? 'opacity-100' : 'opacity-30'} /> {label}
          </p>
        ))}
      </div>

      <button type="submit" disabled={loading}
        className="btn-primary flex items-center gap-2 px-6 py-2 text-sm">
        Changer le mot de passe
      </button>
    </form>
  )
}

// ─── Onglet Photo ─────────────────────────────────────────────────────────────
function TabPhoto({ profile, onSaved, onPhotoUpdated }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await profileApi.updatePhoto(fd)
      onPhotoUpdated(res.data.photo_url)
      onSaved('Photo mise à jour avec succès !', 'success')
      setPreview(null)
      setFile(null)
    } catch (e) {
      onSaved(e.response?.data?.message || 'Erreur upload photo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const currentPhoto = preview || (profile.photo ? `/storage/${profile.photo}` : null)
  const initials = `${profile.personne?.prenom?.[0] ?? ''}${profile.personne?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Avatar */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-brand-100">
          {currentPhoto
            ? <img src={currentPhoto} alt="Photo" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-brand-600">{initials}</div>
          }
        </div>
        <button onClick={() => inputRef.current.click()}
          className="absolute bottom-0 right-0 w-9 h-9 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors">
          <Camera size={15} />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-surface-800">{profile.personne?.prenom} {profile.personne?.nom}</p>
        <p className="text-xs text-surface-400 mt-0.5">@{profile.nom_utilisateur}</p>
      </div>

      {preview && (
        <div className="flex gap-3">
          <button onClick={() => { setPreview(null); setFile(null) }} className="btn-secondary text-xs px-4 py-2">
            Annuler
          </button>
          <button onClick={handleUpload} disabled={loading}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
            {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
            Enregistrer la photo
          </button>
        </div>
      )}

      <p className="text-xs text-surface-400 text-center">
        JPG, PNG ou WebP — max 2 Mo
      </p>
    </div>
  )
}

// ─── Onglet Historique ────────────────────────────────────────────────────────
function TabHistorique({ historique }) {
  if (!historique?.length) {
    return <p className="text-sm text-surface-400 text-center py-8">Aucune activité enregistrée.</p>
  }
  return (
    <div className="space-y-2">
      {historique.map((h) => (
        <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-100 hover:bg-surface-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${h.type === 'ENTREE' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {h.type === 'ENTREE'
                ? <ArrowUpCircle size={15} className="text-emerald-600" />
                : <ArrowDownCircle size={15} className="text-red-600" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-800">{h.libelle ?? 'Mouvement de caisse'}</p>
              <p className="text-[10px] text-surface-400">{h.date} · {h.num_caisse}</p>
            </div>
          </div>
          <span className={`text-xs font-bold font-mono ${h.type === 'ENTREE' ? 'text-emerald-600' : 'text-red-600'}`}>
            {h.type === 'ENTREE' ? '+' : '-'}{fmt(h.montant)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'infos',      label: 'Infos personnelles', icon: User },
  { key: 'password',   label: 'Mot de passe',        icon: Lock },
  { key: 'photo',      label: 'Photo de profil',     icon: Camera },
  { key: 'historique', label: 'Historique',           icon: ArrowUpCircle },
]

export default function ProfilePage() {
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('infos')
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    profileApi.get()
      .then(res => setProfile(res.data))
      .catch(() => showToast('Impossible de charger le profil.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const showToast = (message, type) => setToast({ message, type })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-8 h-8 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const initials = `${profile.personne?.prenom?.[0] ?? ''}${profile.personne?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Header profil ── */}
      <div className="bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">
        {/* Bannière */}
        <div className="h-24 bg-gradient-to-r from-brand-600 to-brand-400" />
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-100 flex-shrink-0">
              {profile.photo
                ? <img src={`/storage/${profile.photo}`} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-600">{initials}</div>
              }
            </div>
            {/* Identité */}
            <div className="flex-1 pb-1">
              <h1 className="text-lg font-bold text-surface-900">
                {profile.personne?.prenom} {profile.personne?.nom}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[profile.role] ?? 'bg-surface-100 text-surface-600'}`}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </span>
                <span className="text-xs text-surface-400">@{profile.nom_utilisateur}</span>
                {profile.num_caisse && (
                  <span className="text-xs text-surface-400 flex items-center gap-1">
                    {profile.num_caisse}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Infos rapides */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-surface-500">
            {profile.personne?.email && (
              <span className="flex items-center gap-1.5"><Mail size={12} />{profile.personne.email}</span>
            )}
            {profile.personne?.telephone && (
              <span className="flex items-center gap-1.5"><Phone size={12} />{profile.personne.telephone}</span>
            )}
            {profile.date_embauche && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />Embauché le {new Date(profile.date_embauche).toLocaleDateString('fr-FR')}
              </span>
            )}
            {profile.superviseur && (
              <span className="flex items-center gap-1.5">
                <Shield size={12} />Supervisé par {profile.superviseur.nom_complet}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats caisse ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Solde caisse"      value={fmt(profile.stats?.solde_caisse)}           color="bg-brand-600" />
        <StatCard label="Total encaissé"    value={fmt(profile.stats?.total_entrees)}          color="bg-emerald-500" />
        <StatCard label="Total décaissé"    value={fmt(profile.stats?.total_sorties)}          color="bg-red-500" />
        <StatCard label="Paiements traités" value={profile.stats?.nb_paiements ?? 0}           color="bg-purple-500" />
      </div>

      {/* ── Onglets ── */}
      <div className="bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-surface-100 overflow-x-auto">
          {TABS.map(({ key, label}) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2
                ${activeTab === key
                  ? 'border-brand-600 text-brand-600 bg-brand-50/40'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:bg-surface-50'}`}>
              
              {label}
            </button>
          ))}
        </div>

        {/* Contenu onglet */}
        <div className="p-5">
          {activeTab === 'infos' && (
            <TabInfos profile={profile} onSaved={showToast} />
          )}
          {activeTab === 'password' && (
            <TabPassword onSaved={showToast} />
          )}
          {activeTab === 'photo' && (
            <TabPhoto
              profile={profile}
              onSaved={showToast}
              onPhotoUpdated={(url) => setProfile(p => ({ ...p, photo: url }))}
            />
          )}
          {activeTab === 'historique' && (
            <TabHistorique historique={profile.historique} />
          )}
        </div>
      </div>
    </div>
  )
}