<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Personne;
use App\Models\Employe;
use Illuminate\Support\Facades\Hash;

class EmployeSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer l'ADMIN
        $p1 = Personne::create([
            'prenom' => 'Admin',
            'nom' => 'System',
            'date_naissance' => '1990-01-01',
            'email' => 'admin@microfinance.com',
            'telephone' => '0600000001',
            'date_creation' => now(),
        ]);

        Employe::create([
            'personne_id' => $p1->id,
            'nom_utilisateur' => 'admin',
            'mot_de_passe' => Hash::make('admin123'), 
            'role' => 'ADMIN',
            'date_embauche' => now(),
            'num_caisse' => null, // Pas de caisse pour l'admin
        ]);

        // 2. Créer le MANAGER
        $p2 = Personne::create([
            'prenom' => 'Jean',
            'nom' => 'Manager',
            'date_naissance' => '1985-05-12',
            'email' => 'manager@microfinance.com',
            'telephone' => '0600000002',
            'date_creation' => now(),
        ]);

        Employe::create([
            'personne_id' => $p2->id,
            'nom_utilisateur' => 'manager',
            'mot_de_passe' => Hash::make('manager123'),
            'role' => 'MANAGER',
            'date_embauche' => now(),
            'num_caisse' => null, // Pas de caisse pour le manager
        ]);

        // 3. Créer l'AGENT DE CRÉDIT (avec numéro de caisse automatique)
        $p3 = Personne::create([
            'prenom' => 'Sarah',
            'nom' => 'Agent',
            'date_naissance' => '1995-09-20',
            'email' => 'agent@microfinance.com',
            'telephone' => '0600000003',
            'date_creation' => now(),
        ]);

        Employe::create([
            'personne_id' => $p3->id,
            'nom_utilisateur' => 'agent',
            'mot_de_passe' => Hash::make('agent123'),
            'role' => 'AGENT_CREDIT', // Déclenche l'attribution automatique
            'date_embauche' => now(),
            'num_caisse' => 'CAISSE-' . rand(100, 999), // Génération automatique de sa caisse dédiée
        ]);
    }
}