import api from './axios'

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
}
// ── Clients ──────────────────────────────────────
export const clientsApi = {
  list:     (params) => api.get('/clients', { params }),
  get:      (id)     => api.get(`/clients/${id}`),
  create:   (data)   => api.post('/clients', data),
  update:   (id, d)  => api.put(`/clients/${id}`, d),
  delete:   (id)     => api.delete(`/clients/${id}`),

  blacklist:    (id) => api.get(`/clients/${id}/blacklist`),
  options:      ()   => api.get('/clients/options'),
  portefeuille: (id, config = {}) => api.get(`/clients/${id}/portefeuille`, config),
  vision360:    (id) => api.get(`/vision360/${id}`),
  prets:        (id) => api.get(`/clients/${id}/historique-prets`),

  // GED
  documents: (id) =>
    api.get(`/clients/${id}/documents`),

  uploadDocument: (id, data) =>
    api.post(`/clients/${id}/documents`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deleteDocument: (clientId, documentId) =>
    api.delete(`/clients/${clientId}/documents/${documentId}`),
}
 

// ── Employés ─────────────────────────────────────
export const employesApi = {
  list:   (params) => api.get('/employes', { params }),
  get:    (id)     => api.get(`/employes/${id}`),
  create: (data)   => api.post('/employes', data),
  update: (id, d)  => api.put(`/employes/${id}`, d),
  delete: (id)     => api.delete(`/employes/${id}`),
}

// ── Demandes de crédit ────────────────────────────
export const demandesApi = {
  list:         (params)    => api.get('/demande-credits', { params }),
  get:          (id)        => api.get(`/demande-credits/${id}`),
  create:       (data)      => api.post('/demande-credits', data),
  update:       (id, d)     => api.put(`/demande-credits/${id}`, d),
  delete:       (id)        => api.delete(`/demande-credits/${id}`),
  affecter: (id, data) => api.post(`/demande-credits/${id}/affecter`, data),
    evaluerRisque:(id)        => api.post(`/demande-credits/${id}/evaluer-risque`),
  approuver:    (id)        => api.post(`/demande-credits/${id}/approuver`),
  rejeter:      (id, data)  => api.post(`/demande-credits/${id}/rejeter`, data),
}

// ── Prêts ─────────────────────────────────────────
export const pretsApi = {
  list:         (params) => api.get('/prets', { params }),
  get:          (id)     => api.get(`/prets/${id}`),
  create:       (data)   => api.post('/prets', data),
  update:       (id, d)  => api.put(`/prets/${id}`, d),
  echeancier: (pretId, page = 1) => api.get(`/prets/${pretId}/echeances?page=${page}`),
  soldeRestant: (id)     => api.get(`/prets/${id}/solde-restant`),
}

// ── Paiements ─────────────────────────────────────
export const paiementsApi = {
  list: (params) => api.get('/paiements', { params }),
  create: (data) => api.post('/paiements', data),
  show: (id) => api.get(`/paiements/${id}`),
  cancel: (id) => api.delete(`/paiements/${id}`),
  validate: (id) => api.post(`/paiements/${id}/valider`),
}

// ── Alertes ───────────────────────────────────────
export const alertesApi = {
  list:      (params)   => api.get('/alertes', { params }),
  get:       (id)       => api.get(`/alertes/${id}`),
  create:    (data)     => api.post('/alertes', data),
  acquitter: (id, data) => api.post(`/alertes/${id}/acquitter`, data),
  parPret:   (pretId)   => api.get(`/prets/${pretId}/alertes`),
}

// ── Produits crédit ───────────────────────────────
export const produitsApi = {
  list:   (params) => api.get('/produits', { params }),
  get:    (id)     => api.get(`/produits/${id}`),
  create: (data)   => api.post('/produits', data),
  update: (id, d)  => api.put(`/produits/${id}`, d),
  delete: (id)     => api.delete(`/produits/${id}`),
  options: ()      => api.get('/produits-credits/options'),

}
export const vision360Api = {
  search: (searchTerm) =>
    api.get('/vision360/search', {
      params: { search: searchTerm }
    }),

  getById: (id) =>
    api.get(`/vision360/${id}`)
}

// ── Statistiques Caisse ───────────────────────────────────────────────────
export const statistiquesApi = {
  caisse:      (params) => api.get('/statistiques/caisse', { params }),
  detailAgent: (id, params) => api.get(`/statistiques/agent/${id}`, { params }),
}

export const profileApi = {
  get:            ()      => api.get('/profile'),
  update:         (data)  => api.put('/profile', data),
  updatePassword: (data)  => api.put('/profile/password', data),
  updatePhoto:    (data)  => api.post('/profile/photo', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}
export const assistantApi = {
  analyser: (demandeId) =>
    api.post(`/assistant/analyser/${demandeId}`),

  chat: (demandeId, payload) =>
    api.post(`/assistant/chat/${demandeId}`, payload),
}