<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FraisFactory extends Factory
{
    private array $typesFrais = [
        'Frais de dossier',
        'Frais d\'assurance',
        'Frais de gestion',
        'Frais de notaire',
        'Frais de déblocage',
        'Commission d\'engagement',
        'Frais d\'expertise',
        'Pénalité de remboursement anticipé',
    ];

    public function definition(): array
    {
        $hasTaux = $this->faker->boolean(60); // 60% taux, 40% montant fixe

        return [
            'produit_credit_id' => \App\Models\ProduitCredit::factory(),
            'libelle_frais'     => $this->faker->randomElement($this->typesFrais),
            'taux'              => $hasTaux ? $this->faker->randomFloat(4, 0.005, 0.05) : null,
            'montant_fixe'      => !$hasTaux ? $this->faker->randomFloat(2, 50, 1000) : null,
            'est_capitalisable' => $this->faker->boolean(25),
        ];
    }

    public function parTaux(): static
    {
        return $this->state([
            'taux'         => $this->faker->randomFloat(4, 0.005, 0.05),
            'montant_fixe' => null,
        ]);
    }

    public function fixe(): static
    {
        return $this->state([
            'taux'         => null,
            'montant_fixe' => $this->faker->randomFloat(2, 50, 1000),
        ]);
    }
}