<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class DemandeCreditFactory extends Factory
{
    private array $objetsPret = [
        'Achat de marchandises',
        'Acquisition d\'équipement professionnel',
        'Extension de commerce',
        'Financement de campagne agricole',
        'Achat de semences et intrants',
        'Construction / rénovation logement',
        'Financement de fonds de roulement',
        'Achat de matériel de pêche',
        'Création d\'activité génératrice de revenus',
        'Rachat de crédit existant',
    ];

    private array $typesGarantie = [
        'Caution solidaire',
        'Hypothèque',
        'Nantissement de matériel',
        'Garantie personnelle',
        'Dépôt de garantie',
        null,
    ];

    public function definition(): array
    {
        $statut        = $this->faker->randomElement([
            'EN_ATTENTE', 'EN_COURS_ANALYSE', 'APPROUVEE',
            'REJETEE', 'ANNULEE', 'DECAISSEE',
        ]);
        $dateDecision  = in_array($statut, ['APPROUVEE', 'REJETEE', 'DECAISSEE'])
            ? $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d H:i:s')
            : null;

        return [
            'client_id'          => \App\Models\Client::factory(),
            'produit_credit_id'  => \App\Models\ProduitCredit::factory()->actif(),
            'employe_id'         => null, // affecté dans le seeder
            'manager_id'         => null,
            'montant_demande'    => $this->faker->randomFloat(2, 2000, 200000),
            'duree_demandee'     => $this->faker->randomElement([6, 12, 18, 24, 36, 48, 60]),
            'objet_pret'         => $this->faker->randomElement($this->objetsPret),
            'garantie'           => $this->faker->randomElement($this->typesGarantie),
            'nom_garant'         => $this->faker->optional(0.5)->name(),
            'statut_demande'     => $statut,
            'motif_rejet'        => $statut === 'REJETEE'
                ? $this->faker->randomElement([
                    'Capacité de remboursement insuffisante',
                    'Dossier incomplet',
                    'Client sur liste noire',
                    'Garanties insuffisantes',
                    'Score d\'éligibilité trop faible',
                ])
                : null,
            'date_soumission'    => $this->faker->dateTimeBetween('-2 years', '-1 month'),
            'date_decision'      => $dateDecision,
        ];
    }

    public function approuvee(): static
    {
        return $this->state([
            'statut_demande' => 'APPROUVEE',
            'date_decision'  => now()->subDays(rand(1, 30))->toDateTimeString(),
            'motif_rejet'    => null,
        ]);
    }

    public function enAttente(): static
    {
        return $this->state([
            'statut_demande' => 'EN_ATTENTE',
            'date_decision'  => null,
            'motif_rejet'    => null,
        ]);
    }

    public function rejetee(): static
    {
        return $this->state([
            'statut_demande' => 'REJETEE',
            'date_decision'  => now()->subDays(rand(1, 60))->toDateTimeString(),
            'motif_rejet'    => 'Capacité de remboursement insuffisante',
        ]);
    }

    public function decaissee(): static
    {
        return $this->state([
            'statut_demande' => 'DECAISSEE',
            'date_decision'  => now()->subDays(rand(30, 365))->toDateTimeString(),
            'motif_rejet'    => null,
        ]);
    }
}