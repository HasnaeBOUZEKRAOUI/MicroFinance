import api from './axios'

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
}
// ── Clients ──────────────────────────────────────
export const clientsApi = {
  list:    (params) => api.get('/clients', { params }),
  get:     (id)     => api.get(`/clients/${id}`),
  create:  (data)   => api.post('/clients', data),
  update:  (id, d)  => api.put(`/clients/${id}`, d),
  delete:  (id)     => api.delete(`/clients/${id}`),
  prets:   (id)     => api.get(`/clients/${id}/historique-prets`),
  blacklist:(id)    => api.get(`/clients/${id}/blacklist`),
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
  affecter:     (id, data)  => api.post(`/demande-credits/${id}/affecter`, data),
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
  echeancier:   (id)     => api.get(`/prets/${id}/echeancier`),
  soldeRestant: (id)     => api.get(`/prets/${id}/solde-restant`),
}

// ── Paiements ─────────────────────────────────────
export const paiementsApi = {
  list:   (params) => api.get('/paiements', { params }),
  get:    (id)     => api.get(`/paiements/${id}`),
  create: (data)   => api.post('/paiements', data),
  annuler:(id)     => api.delete(`/paiements/${id}`),
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
}
