import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';   
import Sidebar from './components/layout/Sidebar';
import ClientsPage from './pages/clients/ClientsPage';
import DemandesPage from './pages/demandes/DemandesPage';
import PaiementsPage from './pages/paiements/PaiementsPage';
import PretsPage from './pages/prets/PretsPage';
import EmployesPage from './pages/employes/EmployesPage';
import Vision360Page from './pages/Vision360Page';
import ProduitsPage from './pages/produits/ProduitsPage';
import AlertesPage from './pages/alertes/AlertesPage';
import Dashboard from './pages/dashboards/Dashboard';

function App() {
  const { user, loading } = useAuth();

  // Si le contexte est encore en train de vérifier le token au démarrage
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-surface-50">Chargement...</div>;
  }

  // Fonction utilitaire pour déterminer la page d'accueil par défaut selon le rôle
  const getHomeRedirect = () => {
    if (!user) return "/login";
    return user.role === 'ADMIN' ? "/dashboard" : "/vision360Page";
  };

  return (
    <Router>
      <div className="flex h-screen bg-surface-50 font-sans">
        {/* On affiche la Sidebar uniquement si l'utilisateur est connecté */}
        {user && <Sidebar />}

        {/* Dynamic margin: évite d'avoir un espace blanc vide à gauche sur l'écran de Login */}
        <div className={`flex-1 flex flex-col overflow-hidden ${user ? 'ml-60' : 'ml-0'}`}>
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-10 py-10 bg-surface-100">
            <Routes>
              {/* ── Route Publique (Login) ── */}
              {/* Si déjà connecté, redirige instantanément vers sa page dédiée */}
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={getHomeRedirect()} replace />} />

              {/* ── Routes Protégées Générales ── */}
              <Route path="/vision360Page" element={user ? <Vision360Page /> : <Navigate to="/login" />} />
              <Route path="/clients/:id" element={user ? <Vision360Page /> : <Navigate to="/login" />} />            
              <Route path="/clients"   element={user ? <ClientsPage />   : <Navigate to="/login" />} />
              <Route path="/prets"     element={user ? <PretsPage />     : <Navigate to="/login" />} />
              <Route path="/demandes"  element={user ? <DemandesPage />  : <Navigate to="/login" />} />
              <Route path="/paiements" element={user ? <PaiementsPage /> : <Navigate to="/login" />} />
              <Route path="/alertes"   element={user ? <AlertesPage />   : <Navigate to="/login" />} />

              {/* ── Routes Protégées Réservées STRICTEMENT aux Admins ── */}
              <Route 
                path="/dashboard" 
                element={user && user.role === 'ADMIN' ? <Dashboard /> : <Navigate to={getHomeRedirect()} replace />} 
              />
              <Route 
                path="/employes"  
                element={user && user.role === 'ADMIN' ? <EmployesPage /> : <Navigate to={getHomeRedirect()} replace />} 
              />
              <Route 
                path="/produits"  
                element={user && user.role === 'ADMIN' ? <ProduitsPage /> : <Navigate to={getHomeRedirect()} replace />} 
              />

              {/* ── Redirections et Erreurs ── */}
              <Route path="/" element={<Navigate to={getHomeRedirect()} replace />} />
              <Route path="*" element={<div className="card p-8 text-center text-sm font-medium text-surface-800/60">Page non trouvée</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;