<?php
// database/seeders/ClientSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\Personne;
use App\Models\Employe;
use Illuminate\Support\Str;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        // --- MÉTHODE 1 : Utilisation de la Factory (Pour générer 10 clients aléatoires) ---
        // Client::factory()->count(10)->create();


        // --- MÉTHODE 2 : Création manuelle (Pour des données de test précises) ---
        
        // S'assurer qu'un employé existe pour le test
        $employe = Employe::first() ?? Employe::create([
            'nom_utilisateur' => 'agent_test',
            'mot_de_passe' => bcrypt('password'),
            'role' => 'AGENT'
        ]);

        // Créer une personne
        $p1 = Personne::create([
            'nom' => 'ALAMI',
            'prenom' => 'Yassine',
            'email' => 'yassine.alami@example.com',
            'telephone' => '0661223344',
            'date_naissance' => '1990-05-15',
            'date_creation' => now(),
        ]);

        // Lui attacher un client
        Client::create([
            'personne_id' => $p1->id,
            'employe_id' => $employe->id,
            'nil' => 'NIL-123456',
            'code_client' => 'CLT-YASSINE1',
            'est_vip' => true,
            'type_piece_identite' => 'CIN',
            'numero_piece_identite' => 'BE123456',
            'titre' => 'M.',
            'genre' => 'HOMME',
            'secteur_activite' => 'Commerce',
            'nationalite' => 'Marocaine',
            'revenu_mensuel' => 7500.00,
            'ville' => 'Casablanca',
            'pays' => 'Maroc',
            'adresse_1' => 'Boulevard Anfa, N°45',
        ]);

        // Créer une deuxième personne (Femme)
        $p2 = Personne::create([
            'nom' => 'BENANI',
            'prenom' => 'Sara',
            'email' => 'sara.ben@example.com',
            'telephone' => '0661556677',
            'date_naissance' => '1995-10-20',
            'date_creation' => now(),
        ]);

        Client::create([
            'personne_id' => $p2->id,
            'employe_id' => $employe->id,
            'nil' => 'NIL-987654',
            'code_client' => 'CLT-SARA002',
            'est_vip' => false,
            'type_piece_identite' => 'Passeport',
            'numero_piece_identite' => 'GZ998877',
            'titre' => 'Mme',
            'genre' => 'FEMME',
            'secteur_activite' => 'Artisanat',
            'nationalite' => 'Marocaine',
            'revenu_mensuel' => 4200.00,
            'ville' => 'Marrakech',
            'pays' => 'Maroc',
            'adresse_1' => 'Médina, Rue de la Bahia',
        ]);
    }
}