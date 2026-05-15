import axios from 'axios'

const api = axios.create({
  // Utilisez l'URL complète de votre serveur Laravel
  baseURL: 'http://localhost:8000/api', 
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  },
})

// Intercepteur pour ajouter le token à chaque requête automatiquement
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      // On évite window.location si possible pour ne pas casser l'état React, 
      // mais c'est une solution radicale qui fonctionne.
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api