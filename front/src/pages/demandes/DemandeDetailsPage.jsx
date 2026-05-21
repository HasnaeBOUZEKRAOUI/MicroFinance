import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner ,Badge ,ErrorAlert} from '../../components/ui'
import { demandesApi } from '../../api/services'

const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatMontant = (montant) => {
    if (!montant) return '—'
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(montant)
}

export default function DemandeDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [demande, setDemande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    demandesApi.get(id)
      .then(res => {
        setDemande(res.data ?? res)
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Impossible de récupérer les détails de la demande.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="flex justify-center py-24"><Spinner className="w-8 h-8" /></div>
  if (error) return <div className="p-6"><ErrorAlert message={error} /></div>
  if (!demande) return <div className="p-6 text-center text-surface-500">Demande introuvable.</div>

  return (
    <div className="space-y-6">
      {/* Retour et En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/demandes')} className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-100 transition-colors border border-surface-200">
          ← Retour
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900">Demande #{demande.id}</h1>
            <Badge statut={demande.statut_demande} />
          </div>
          <p className="text-sm text-surface-500">Soumise le {formatDate(demande.date_soumission)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* COLONNE GAUCHE & CENTRE : INFOS CRÉDIT & GARANT */}
        <div className="col-span-2 space-y-6">
          
          {/* Détails du Crédit */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-surface-900 mb-4 border-b pb-2">
              Informations du crédit demandé
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div>
                  <span className="block text-xs text-surface-500 font-medium mb-1">Montant demandé</span>
                  <span className="text-lg font-bold font-mono text-surface-900">{formatMontant(demande.montant_demande)}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div>
                  <span className="block text-xs text-surface-500 font-medium mb-1">Durée du remboursement</span>
                  <span className="text-base font-semibold text-surface-800">{demande.duree_demandee} mois</span>
                </div>
              </div>
              <div className="flex items-start gap-3 col-span-2">
                <div className="w-full">
                  <span className="block text-xs text-surface-500 font-medium mb-1">Objet du prêt</span>
                  <p className="text-sm text-surface-800 bg-surface-50 p-3 rounded-lg border border-surface-100">{demande.objet_pret}</p>
                </div>
              </div>
              {demande.garantie && (
                <div className="flex items-start gap-3 col-span-2">
                  <div>
                    <span className="block text-xs text-surface-500 font-medium mb-1">Nature de la garantie</span>
                    <p className="text-sm text-surface-800">{demande.garantie}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations du Garant */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-surface-900 mb-4 border-b pb-2">
              Solvabilité & Garant rattaché
            </h2>
            {demande.garant ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-surface-500 border-b pb-0.5 mb-1">Nom complet du garant</span>
                  <span className="text-sm font-medium text-surface-900">{demande.garant.prenom} {demande.garant.nom}</span>
                </div>
                <div>
                  <span className="block text-xs text-surface-500 border-b pb-0.5 mb-1">Numéro de CIN</span>
                  <span className="text-sm font-mono font-medium text-surface-900">{demande.garant.cin}</span>
                </div>
                <div>
                  <span className="block text-xs text-surface-500 border-b pb-0.5 mb-1">Téléphone</span>
                  <span className="text-sm text-surface-800">{demande.garant.telephone}</span>
                </div>
                <div>
                  <span className="block text-xs text-surface-500 border-b pb-0.5 mb-1">Relation avec l'emprunteur</span>
                  <span className="text-sm text-surface-800">{demande.garant.relation_client}</span>
                </div>
                <div className="col-span-2 mt-2 p-3 bg-emerald-50 text-emerald-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="block text-xs text-emerald-700 font-medium">Revenu mensuel déclaré</span>
                    <span className="text-lg font-bold font-mono">{formatMontant(demande.garant.revenu_mensuel)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-surface-500 italic py-2">
                Aucun garant physique n'est rattaché à cette demande de crédit.
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : PROFIL CLIENT & CONTEXTE DOSSIER */}
        <div className="space-y-6">
          {/* Fiche Client Emprunteur */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-surface-900 mb-4 border-b pb-2">
              Profil Emprunteur
            </h2>
            {demande.client ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-surface-50 p-3 rounded-lg mb-2">
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {demande.client.personne?.prenom?.[0]}{demande.client.personne?.nom?.[0]}
                  </div>
                  <div>
                    <span className="block font-semibold text-surface-900">{demande.client.personne?.prenom} {demande.client.personne?.nom}</span>
                    <span className="block font-mono text-xs text-surface-500">{demande.client.code_client ?? demande.client.nil}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-xs text-surface-400">Type de produit ciblé</span>
                  <span className="text-sm font-medium text-surface-800">{demande.produit_credit?.type_produit ?? '—'}</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-surface-500">Données du client indisponibles.</span>
            )}
          </div>

          {/* Traitement Interne (Agent responsable) */}
          <div className="card p-6 bg-surface-50/50">
            <h3 className="text-xs font-bold uppercase text-surface-400 tracking-wider mb-3">Suivi du dossier</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-surface-500">Agent chargé :</span>
                <span className="font-medium text-surface-800">
                  {demande.employe?.personne 
                    ? `${demande.employe.personne.prenom} ${demande.employe.personne.nom}` 
                    : 'Non affecté'}
                </span>
              </div>
              {demande.date_decision && (
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-surface-500">Date de décision :</span>
                  <span className="font-medium text-surface-800">{formatDate(demande.date_decision)}</span>
                </div>
              )}
              {demande.motif_rejet && (
                <div className="border-t pt-2 mt-2">
                  <span className="block text-xs text-red-600 font-semibold mb-1">Motif du rejet :</span>
                  <p className="text-xs p-2 bg-red-50 text-red-800 rounded border border-red-100">{demande.motif_rejet}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}