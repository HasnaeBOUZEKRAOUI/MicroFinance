import React, { useState, useEffect } from 'react'
import { Search, RotateCcw, CreditCard, Calendar, FileText, Rocket, RefreshCw } from 'lucide-react'
import api from '../api/axios' // Ajustez le chemin selon votre structure (ex: ../api/axios ou ../../api/axios)

export default function Vision360Page() {
  // Filtres calqués sur votre capture d'écran
  const [filters, setFilters] = useState({
    numGroupe: '',
    nil: '',
    nom: '',
    prenom: ''
  })

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  // ── CHARGEMENT PAR DÉFAUT AU DÉMARRAGE ──
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // Appel sans paramètres pour récupérer la vue globale de la base de données
      const response = await api.get('/vision360/client')
      setData(response.data)
    } catch (error) {
      console.error("Erreur lors du chargement initial 360", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.get('/vision360/client', {
        params: {
          nil: filters.nil,
          nom: filters.nom,
          prenom: filters.prenom
        }
      })
      setData(response.data)
    } catch (error) {
      console.error("Erreur de recherche 360", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFilters({ numGroupe: '', nil: '', nom: '', prenom: '' })
    fetchInitialData() // Recharge les données globales par défaut lors du reset
  }

  // Extraction sécurisée des sous-tableaux
  const clientInfo  = data?.infoClient ?? null
  const comptes     = data?.comptes ?? []
  const echeances   = data?.echeances ?? []
  const demandes    = data?.demandes ?? []
  const pretsActifs = data?.pretsActifs ?? []

  return (
    <div className="space-y-6">
      
      {/* ── Bloc des Critères de Recherche ── */}
      <div className="card p-5 bg-white shadow-sm border border-surface-200 rounded-xl">
        <h3 className="text-xs font-bold text-surface-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          🔍 Critères de recherche
        </h3>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-surface-700 block mb-1">N° Groupe</label>
              <input 
                type="text" 
                name="numGroupe"
                value={filters.numGroupe}
                onChange={handleInputChange}
                className="input py-1.5 text-xs" 
                placeholder="Ex: GR-502"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-surface-700 block mb-1">N° Client / NIL</label>
              <input 
                type="text" 
                name="nil"
                value={filters.nil}
                onChange={handleInputChange}
                className="input py-1.5 text-xs" 
                placeholder="Ex: NIL84920"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-surface-700 block mb-1">Nom</label>
              <input 
                type="text" 
                name="nom"
                value={filters.nom}
                onChange={handleInputChange}
                className="input py-1.5 text-xs" 
                placeholder="Ex: BENNANI"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-surface-700 block mb-1">Prénom</label>
              <input 
                type="text" 
                name="prenom"
                value={filters.prenom}
                onChange={handleInputChange}
                className="input py-1.5 text-xs" 
                placeholder="Ex: Karim"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-surface-100 pt-3">
            <button 
              type="button" 
              onClick={handleReset}
              className="px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} /> Réinitialiser
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              Rechercher
            </button>
          </div>
        </form>
      </div>

      {/* ── Synthèse d'identité si UN client spécifique est filtré et trouvé ── */}
      {clientInfo && (
        <div className="bg-brand-50/50 border border-brand-100 p-4 rounded-xl flex justify-between items-center">
          <div className="text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 block">Dossier client actif</span>
            <h2 className="text-sm font-bold text-surface-900 mt-0.5">{clientInfo.nom} {clientInfo.prenom}</h2>
            <p className="text-surface-600 mt-0.5 font-medium">NIL : <span className="font-mono">{clientInfo.nil}</span> | Tél : {clientInfo.telephone}</p>
          </div>
        </div>
      )}

      {/* ── Zone d'affichage des 4 Synthèses Métier ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* 1. COMPTES */}
        <div className="card p-0 flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-100 bg-surface-50/50">
            <CreditCard size={14} className="text-brand-500" />
            <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">Comptes de dépôt & Épargne ({comptes.length})</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-50/60 border-b text-[10px] font-bold text-surface-500 uppercase tracking-wider"><th className="px-5 py-2.5">Type</th><th className="px-5 py-2.5">Code</th><th className="px-5 py-2.5 text-right">Solde disponible</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {comptes.length === 0 ? (
                <tr><td colSpan="3" className="px-5 py-8 text-center text-surface-400 italic">Aucun enregistrement trouvé</td></tr>
              ) : (
                comptes.map((c, i) => (
                  <tr key={i} className="hover:bg-surface-50/40"><td className="px-5 py-3 font-semibold">{c.type_compte}</td><td className="px-5 py-3 font-mono text-surface-600">{c.code}</td><td className="px-5 py-3 text-right font-bold text-emerald-600">{c.solde.toLocaleString()} MAD</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 2. ÉCHÉANCES */}
        <div className="card p-0 flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-100 bg-surface-50/50">
            <Calendar size={14} className="text-red-500" />
            <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">Suivi des Échéances ({echeances.length})</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-50/60 border-b text-[10px] font-bold text-surface-500 uppercase tracking-wider"><th className="px-5 py-2.5">Réf Prêt</th><th className="px-5 py-2.5">Date Limite</th><th className="px-5 py-2.5 text-right">Retard</th><th className="px-5 py-2.5 text-right">Montant échu</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {echeances.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-surface-400 italic">Aucun enregistrement trouvé</td></tr>
              ) : (
                echeances.map((ech, i) => (
                  <tr key={i} className="hover:bg-surface-50/40 bg-red-50/10"><td className="px-5 py-3 font-semibold text-brand-600">#{ech.pret_code}</td><td className="px-5 py-3 text-surface-600">{ech.date_echeance}</td><td className="px-5 py-3 text-right font-bold text-red-600">{ech.jours_retard} jours</td><td className="px-5 py-3 text-right font-bold text-surface-900">{ech.montant.toLocaleString()} MAD</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. DEMANDES */}
        <div className="card p-0 flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-100 bg-surface-50/50">
            <FileText size={14} className="text-amber-500" />
            <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">Demandes en cours ({demandes.length})</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-50/60 border-b text-[10px] font-bold text-surface-500 uppercase tracking-wider"><th className="px-5 py-2.5">Date dépôt</th><th className="px-5 py-2.5">Dossier</th><th className="px-5 py-2.5 text-right">Montant</th><th className="px-5 py-2.5 text-center">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {demandes.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-surface-400 italic">Aucun enregistrement trouvé</td></tr>
              ) : (
                demandes.map((d, i) => (
                  <tr key={i} className="hover:bg-surface-50/40"><td className="px-5 py-3 text-surface-600">{d.date_demande}</td><td className="px-5 py-3 font-semibold">Dossier #{d.id}</td><td className="px-5 py-3 text-right font-bold">{d.montant.toLocaleString()} MAD</td><td className="px-5 py-3 text-center"><span className="badge bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">{d.statut}</span></td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PRÊTS ACCORDÉS */}
        <div className="card p-0 flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-100 bg-surface-50/50">
            <Rocket size={14} className="text-emerald-500" />
            <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">Prêts Accordés Actifs ({pretsActifs.length})</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-50/60 border-b text-[10px] font-bold text-surface-500 uppercase tracking-wider"><th className="px-5 py-2.5">Code Prêt</th><th className="px-5 py-2.5">Date octroi</th><th className="px-5 py-2.5 text-right">Capital accordé</th><th className="px-5 py-2.5 text-right">Encours restant</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {pretsActifs.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-surface-400 italic">Aucun enregistrement trouvé</td></tr>
              ) : (
                pretsActifs.map((p, i) => (
                  <tr key={i} className="hover:bg-surface-50/40"><td className="px-5 py-3 font-bold">#{p.code}</td><td className="px-5 py-3 text-surface-600">{p.date_debut}</td><td className="px-5 py-3 text-right font-medium">{p.montant_accorde.toLocaleString()} MAD</td><td className="px-5 py-3 text-right font-bold text-orange-600">{p.montant_restant.toLocaleString()} MAD</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}