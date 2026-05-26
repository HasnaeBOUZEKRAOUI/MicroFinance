<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'echeance_id'           => null, // affecté dans le seeder
            'employe_id'            => null, // affecté dans le seeder
            'date_paiement'         => $this->faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
            'montant'               => $this->faker->randomFloat(2, 200, 10000),
            'mode_paiement'         => $this->faker->randomElement([
                'ESPECES', 'ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY', 'PRELEVEMENT',
            ]),
            'reference_transaction' => $this->faker->boolean(70)
                ? 'TXN-' . strtoupper($this->faker->unique()->bothify('??########'))
                : null,
            'est_valide'            => $this->faker->boolean(95),
            'observation'           => $this->faker->optional(0.2)->sentence(),
        ];
    }

    public function especes(): static
    {
        return $this->state([
            'mode_paiement'         => 'ESPECES',
            'reference_transaction' => null,
        ]);
    }

    public function invalide(): static
    {
        return $this->state([
            'est_valide'  => false,
            'observation' => 'Paiement annulé par l\'agent',
        ]);
    }
}