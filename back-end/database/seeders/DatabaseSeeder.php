<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\{
    Personne, Employe, Client, Compte,
    ProduitCredit, Frais, DemandeCredit,
    Pret, Echeance, Paiement,
    Garant, ClientDocument, MouvementCaisse
};

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $this->command->info('🌱 Démarrage du seeding...');

        // ────────────────────────────────────────────────
        // 1. EMPLOYÉS (admin + superviseurs + agents)
        // ────────────────────────────────────────────────
        $this->command->info('👤 Création des employés...');

        $admin = Employe::factory()->admin()->create();

        $superviseurs = Employe::factory()->count(3)->create([
            'role'           => 'SUPERVISEUR',
            'superviseur_id' => null,
        ]);

        $managers = Employe::factory()->count(5)->manager()->create([
            'superviseur_id' => fn() => $superviseurs->random()->id,
        ]);

        $agents = Employe::factory()->count(15)->agentCredit()->create([
            'superviseur_id' => fn() => $managers->random()->id,
        ]);

        $tousEmployes = Employe::all();

        // ────────────────────────────────────────────────
        // 2. PRODUITS CRÉDIT + FRAIS
        // ────────────────────────────────────────────────
        $this->command->info('💳 Création des produits crédit...');

        $produits = ProduitCredit::factory()->count(8)->actif()->create();

        $produits->each(function ($produit) {
            // 2 à 4 lignes de frais par produit
            Frais::factory()->count(rand(2, 4))->create([
                'produit_credit_id' => $produit->id,
            ]);
        });

        // ────────────────────────────────────────────────
        // 3. CLIENTS (100 clients avec comptes et documents)
        // ────────────────────────────────────────────────
        $this->command->info('👥 Création des clients...');

        $clients = Client::factory()->count(80)->create([
            'employe_id' => fn() => $agents->random()->id,
        ]);

        // 10 clients VIP
        $vips = Client::factory()->count(10)->vip()->create([
            'employe_id' => fn() => $agents->random()->id,
        ]);

        // 5 clients liste noire
        Client::factory()->count(5)->listeNoire()->create([
            'employe_id' => fn() => $agents->random()->id,
        ]);

        $tousClients = Client::all();

        // Comptes bancaires (1 à 2 par client)
        $tousClients->each(function ($client) {
            Compte::factory()->count(rand(1, 2))->actif()->create([
                'client_id' => $client->id,
            ]);
        });

        // Documents GED (2 à 5 par client)
        $tousClients->each(function ($client) use ($tousEmployes) {
            ClientDocument::factory()->count(rand(2, 5))->create([
                'client_id'  => $client->id,
                'ajoute_par' => $tousEmployes->random()->id,
            ]);
        });

        // ────────────────────────────────────────────────
        // 4. DEMANDES DE CRÉDIT
        // ────────────────────────────────────────────────
        $this->command->info('📋 Création des demandes de crédit...');

        // Demandes en attente (30)
        $demandesAttente = DemandeCredit::factory()
            ->count(30)
            ->enAttente()
            ->create([
                'client_id'         => fn() => $tousClients->random()->id,
                'produit_credit_id' => fn() => $produits->random()->id,
                'employe_id'        => fn() => $agents->random()->id,
                'manager_id'        => fn() => $managers->random()->id,
            ]);

        // Demandes approuvées (40)
        $demandesApprouvees = DemandeCredit::factory()
            ->count(40)
            ->approuvee()
            ->create([
                'client_id'         => fn() => $tousClients->random()->id,
                'produit_credit_id' => fn() => $produits->random()->id,
                'employe_id'        => fn() => $agents->random()->id,
                'manager_id'        => fn() => $managers->random()->id,
            ]);

        // Demandes rejetées (20)
        DemandeCredit::factory()
            ->count(20)
            ->rejetee()
            ->create([
                'client_id'         => fn() => $tousClients->random()->id,
                'produit_credit_id' => fn() => $produits->random()->id,
                'employe_id'        => fn() => $agents->random()->id,
                'manager_id'        => fn() => $managers->random()->id,
            ]);

        // Demandes décaissées (30) → généreront des prêts
        $demandesDecaissees = DemandeCredit::factory()
            ->count(30)
            ->decaissee()
            ->create([
                'client_id'         => fn() => $tousClients->random()->id,
                'produit_credit_id' => fn() => $produits->random()->id,
                'employe_id'        => fn() => $agents->random()->id,
                'manager_id'        => fn() => $managers->random()->id,
            ]);

        // Garants (1 par demande approuvée ou décaissée)
        $demandesApprouvees->merge($demandesDecaissees)->each(function ($demande) {
            if (rand(0, 1)) { // 50% ont un garant
                Garant::factory()->create([
                    'demande_credit_id' => $demande->id,
                ]);
            }
        });

        // ────────────────────────────────────────────────
        // 5. PRÊTS (depuis demandes décaissées)
        // ────────────────────────────────────────────────
        $this->command->info('💰 Création des prêts et échéances...');

        $demandesDecaissees->each(function ($demande) use ($agents) {
            $duree  = $demande->duree_demandee;
            $statut = collect(['EN_COURS', 'EN_COURS', 'EN_COURS', 'SOLDE', 'EN_RETARD'])
                ->random();

            $pret = Pret::factory()->create([
                'demande_credit_id' => $demande->id,
                'montant_accorde'   => $demande->montant_demande,
                'statut_pret'       => $statut,
                'capital_restant'   => $statut === 'SOLDE' ? 0 : $demande->montant_demande * rand(10, 90) / 100,
            ]);

            // Génération des échéances
            $montantMensuel = round($pret->montant_accorde / $duree, 2);
            $interet        = round($pret->montant_accorde * $pret->taux_interet / 12, 2);

            for ($i = 1; $i <= $duree; $i++) {
                $dateEcheance = now()
                    ->parse($pret->date_debut)
                    ->addMonths($i)
                    ->format('Y-m-d');

                $isPasse  = $dateEcheance < now()->format('Y-m-d');
                $echeance = Echeance::factory()->create([
                    'pret_id'          => $pret->id,
                    'numero_echeance'  => $i,
                    'date_echeance'    => $dateEcheance,
                    'montant_principal'=> $montantMensuel,
                    'montant_interet'  => $interet,
                    'total_du'         => $montantMensuel + $interet,
                    'statut'           => match(true) {
                        $statut === 'SOLDE'      => 'PAYEE',
                        !$isPasse               => 'EN_ATTENTE',
                        $statut === 'EN_RETARD' && $i >= $duree - 2 => 'EN_RETARD',
                        default                 => 'PAYEE',
                    },
                    'montant_paye'     => $statut === 'SOLDE' || ($isPasse && $statut !== 'EN_RETARD')
                        ? $montantMensuel + $interet
                        : 0,
                    'jours_retard'     => $statut === 'EN_RETARD' && $isPasse ? rand(5, 90) : 0,
                ]);

                // Paiements pour échéances payées
                if ($echeance->statut === 'PAYEE') {
                    Paiement::factory()->create([
                        'echeance_id'  => $echeance->id,
                        'employe_id'   => $agents->random()->id,
                        'montant'      => $echeance->total_du,
                        'date_paiement'=> $echeance->date_echeance,
                    ]);
                }
            }
        });

        // ────────────────────────────────────────────────
        // 6. MOUVEMENTS DE CAISSE
        // ────────────────────────────────────────────────
        $this->command->info('🏦 Création des mouvements de caisse...');

        $agents->each(function ($agent) {
            if ($agent->num_caisse) {
                MouvementCaisse::factory()->count(rand(10, 30))->create([
                    'employe_id' => $agent->id,
                    'num_caisse' => $agent->num_caisse,
                ]);
            }
        });

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('✅ Seeding terminé avec succès !');
        $this->command->table(
            ['Entité', 'Nombre créé'],
            [
                ['Employés',          Employe::count()],
                ['Clients',           Client::count()],
                ['Comptes',           Compte::count()],
                ['Produits crédit',   ProduitCredit::count()],
                ['Demandes crédit',   DemandeCredit::count()],
                ['Prêts',             Pret::count()],
                ['Échéances',         Echeance::count()],
                ['Paiements',         Paiement::count()],
                ['Documents clients', ClientDocument::count()],
                ['Mouvements caisse', MouvementCaisse::count()],
            ]
        );
    }
}