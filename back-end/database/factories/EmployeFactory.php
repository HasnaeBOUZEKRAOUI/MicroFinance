<?php

namespace Database\Factories;

use App\Models\Personne;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class EmployeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'personne_id'    => PersonneFactory::new()->create()->id,
            'superviseur_id' => null, // géré dans le seeder
            'nom_utilisateur'=> $this->faker->unique()->userName(),
            'mot_de_passe'   => Hash::make('password'),
            'role'           => $this->faker->randomElement(['AGENT_CREDIT', 'MANAGER', 'SUPERVISEUR']),
            'date_embauche'  => $this->faker->dateTimeBetween('-10 years', '-6 months')->format('Y-m-d'),
            'num_caisse'     => $this->faker->optional(0.6)->numerify('CAISSE-###'),
            'photo'          => null,
        ];
    }

    // ── États prédéfinis ──────────────────────────────
    public function admin(): static
    {
        return $this->state(['role' => 'ADMIN']);
    }

    public function agentCredit(): static
    {
        return $this->state([
            'role'      => 'AGENT_CREDIT',
            'num_caisse' => 'CAISSE-' . $this->faker->unique()->numerify('###'),
        ]);
    }

    public function manager(): static
    {
        return $this->state(['role' => 'MANAGER', 'num_caisse' => null]);
    }
}