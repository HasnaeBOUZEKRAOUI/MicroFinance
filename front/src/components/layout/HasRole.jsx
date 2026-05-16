// HasRole.jsx
import React from 'react';

export default function HasRole({ rolesAutorises, children }) {
    // Récupérer l'utilisateur depuis votre stockage (ici localStorage pour l'exemple)
    const user = JSON.parse(localStorage.getItem('user')); 
    
    if (!user || !rolesAutorises.includes(user.role)) {
        return null; // On n'affiche rien si le rôle n'est pas autorisé
    }

    return <>{children}</>;
}