<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ProduitCreditFactory extends Factory
{
    // Produits réalistes pour une IMF marocaine
    private array $produits = [
        ['type' => 'Microcrédit solidaire',     'famille' => 'SOLIDAIRE'],
        ['type' => 'Microcrédit individuel',     'famille' => 'INDIVIDUEL'],
        ['type' => 'Crédit équipement',          'famille' => 'EQUIPEMENT'],
        ['type' => 'Crédit agriculture',         'famille' => 'AGRICULTURE'],
        ['type' => 'Crédit habitat',             'famille' => 'HABITAT'],
        ['type' => 'Crédit éducation',           'famille' => 'EDUCATION'],
        ['type' => 'Crédit santé',               'famille' => 'SANTE'],
        ['type' => 'Crédit commerce',            'famille' => 'COMMERCE'],
    ];

    public function definition(): array
    {
        $produit     = $this->faker->randomElement($this->produits);
        $tauxMin     = $this->faker->randomFloat(4, 0.05, 0.10);
        $tauxMax     = $tauxMin + $this->faker->randomFloat(4, 0.02, 0.08);
        $montantMin  = $this->faker->randomElement([1000, 2000, 5000]);
        $montantMax  = $this->faker->randomElement([50000, 100000, 200000, 500000]);

        return [
            'type_produit'       => $produit['type'],
            'famille_produit'    => $produit['famille'],
            'montant_min'        => $montantMin,
            'montant_max'        => $montantMax,
            'date_debut'         => $this->faker->dateTimeBetween('-3 years', '-1 year')->format('Y-m-d'),
            'date_fin'           => $this->faker->optional(0.3)->dateTimeBetween('+1 year', '+5 years')?->format('Y-m-d'),
            'taux_interet_min'   => round($tauxMin, 4),
            'taux_interet_max'   => round($tauxMax, 4),
            'mode_calcul'        => $this->faker->randomElement(['LINEAIRE', 'DEGRESSIF', 'CONSTANT', 'IN_FINE']),
            'actif'              => $this->faker->boolean(85),
        ];
    }

    public function actif(): static    { return $this->state(['actif' => true, 'date_fin' => null]); }
    public function inactif(): static  { return $this->state(['actif' => false]); }
}