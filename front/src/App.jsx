import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Importez le hook de contexte
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
// Composants temporaires pour les tests
import Dashboard from './pages/dashboards/Dashboard';
function App() {
  const { user, loading } = useAuth(); // Récupérez l'état de l'utilisateur

  // Si le contexte est encore en train de vérifier le token au démarrage
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <Router>
      <div className="flex h-screen bg-surface-50 font-sans">
        {user && <Sidebar />}
        {/* CONDITION : On affiche la Sidebar uniquement si l'utilisateur existe */}

        <div className="flex-1 flex flex-col overflow-hidden ml-60">
          <main className="flex-1  overflow-x-hidden overflow-y-auto px-10  py-10 bg-surface-100">
            <Routes>
              {/* Route publique */}
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/vision360Page" />} />

              {/* Routes protégées : si pas d'utilisateur, redirection vers login */}
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/vision360Page" element={user ? <Vision360Page /> : <Navigate to="/login" />} />
              <Route path="/clients/:id" element={user ? <Vision360Page /> : <Navigate to="/login" />}/>             
               <Route path="/employes"  element={user ? <EmployesPage /> : <Navigate to="/login" />} />
               <Route path="/produits"  element={user ? <ProduitsPage /> : <Navigate to="/login" />} />
              <Route path="/clients"   element={user ? <ClientsPage />   : <Navigate to="/login" />} />
              <Route path="/prets"     element={user ? <PretsPage />     : <Navigate to="/login" />} />
              <Route path="/demandes"  element={user ? <DemandesPage />  : <Navigate to="/login" />} />
              <Route path="/paiements" element={user ? <PaiementsPage /> : <Navigate to="/login" />} />
              <Route path="/alertes"   element={user ? <AlertesPage />   : <Navigate to="/login" />} />
              {/* Redirection par défaut */}
              <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
              
              <Route path="*" element={<div className="p-8">Page non trouvée</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;