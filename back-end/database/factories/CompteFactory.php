<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CompteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'client_id'      => \App\Models\Client::factory(),
            'numero_compte'  => 'CPT-' . $this->faker->unique()->numerify('##########'),
            'code_banque'    => $this->faker->optional(0.8)->numerify('###'),
            'solde_actuel'   => $this->faker->randomFloat(2, 0, 500000),
            'type_compte'    => $this->faker->randomElement(['COURANT', 'EPARGNE', 'DEPOT_A_TERME', 'MICROCREDIT']),
            'statut'         => $this->faker->randomElement(['ACTIF', 'ACTIF', 'ACTIF', 'SUSPENDU', 'CLOTURE']),
        ];
    }

    public function actif(): static   { return $this->state(['statut' => 'ACTIF']); }
    public function suspendu(): static { return $this->state(['statut' => 'SUSPENDU']); }
    public function epargne(): static
    {
        return $this->state([
            'type_compte'  => 'EPARGNE',
            'solde_actuel' => $this->faker->randomFloat(2, 500, 100000),
        ]);
    }
}