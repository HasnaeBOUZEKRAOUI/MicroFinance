<?php
// ══════════════════════════════════════════════════════════════
//  GarantFactory.php
// ══════════════════════════════════════════════════════════════
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class GarantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'demande_credit_id' => null, // affecté dans le seeder
            'nom'               => $this->faker->lastName(),
            'prenom'            => $this->faker->firstName(),
            'cin'               => strtoupper($this->faker->unique()->regexify('[A-Z]{1,2}[0-9]{6}')),
            'telephone'         => $this->faker->numerify('06########'),
            'email'             => $this->faker->optional(0.5)->safeEmail(),
            'relation_client'   => $this->faker->randomElement([
                'Conjoint(e)', 'Parent', 'Frère/Sœur', 'Ami(e)', 'Collègue', 'Associé(e)'
            ]),
            'revenu_mensuel'    => $this->faker->randomFloat(2, 3000, 30000),
            'employeur'         => $this->faker->optional(0.7)->company(),
        ];
    }
}

