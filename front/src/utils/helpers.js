// Formater un montant en MAD
export const formatMontant = (v) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 }).format(v ?? 0)
  
  // Formater une date locale
  export const formatDate = (d) => {
    if (!d) return '—'
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
  }
  
  // Formater un taux (décimal → %)
  export const formatTaux = (t) => `${((t ?? 0) * 100).toFixed(2)} %`
  
  // Classes de badge selon un statut
  export const statutBadge = (statut) => {
    const map = {
      EN_ATTENTE:         'bg-amber-100 text-amber-800',
      EN_COURS_ANALYSE:   'bg-blue-100 text-blue-800',
      APPROUVEE:          'bg-emerald-100 text-emerald-800',
      REJETEE:            'bg-red-100 text-red-800',
      ANNULEE:            'bg-surface-100 text-surface-800',
      DECAISSEE:          'bg-purple-100 text-purple-800',
      EN_COURS:           'bg-blue-100 text-blue-800',
      SOLDE:              'bg-emerald-100 text-emerald-800',
      EN_RETARD:          'bg-orange-100 text-orange-800',
      EN_CONTENTIEUX:     'bg-red-100 text-red-800',
      RESTRUCTURE:        'bg-purple-100 text-purple-800',
      ABANDONNE:          'bg-surface-100 text-surface-800',
      PAYEE:              'bg-emerald-100 text-emerald-800',
      PARTIELLEMENT_PAYEE:'bg-amber-100 text-amber-800',
      CONVERTI:           'bg-emerald-100 text-emerald-800',
      NOUVEAU:            'bg-sky-100 text-sky-800',
      INACTIF:            'bg-surface-100 text-surface-800',
      INFO:               'bg-sky-100 text-sky-800',
      AVERTISSEMENT:      'bg-amber-100 text-amber-800',
      CRITIQUE:           'bg-orange-100 text-orange-800',
      URGENCE:            'bg-red-100 text-red-800',
    }
    return map[statut] ?? 'bg-surface-100 text-surface-800'
  }
  
  export const statutLabel = (statut) => {
    const map = {
      EN_ATTENTE:          'En attente',
      EN_COURS_ANALYSE:    'En analyse',
      APPROUVEE:           'Approuvée',
      REJETEE:             'Rejetée',
      ANNULEE:             'Annulée',
      DECAISSEE:           'Décaissée',
      EN_COURS:            'En cours',
      SOLDE:               'Soldé',
      EN_RETARD:           'En retard',
      EN_CONTENTIEUX:      'Contentieux',
      RESTRUCTURE:         'Restructuré',
      ABANDONNE:           'Abandonné',
      PAYEE:               'Payée',
      PARTIELLEMENT_PAYEE: 'Partielle',
      CONVERTI:            'Converti',
      NOUVEAU:             'Nouveau',
      INACTIF:             'Inactif',
      INFO:                'Info',
      AVERTISSEMENT:       'Avertissement',
      CRITIQUE:            'Critique',
      URGENCE:             'Urgence',
    }
    return map[statut] ?? statut
  }
  
  export const paginationRange = (current, total) => {
    const delta = 2
    const range = []
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i)
    if (current - delta > 2) range.unshift('...')
    if (current + delta < total - 1) range.push('...')
    range.unshift(1)
    if (total > 1) range.push(total)
    return range
  }