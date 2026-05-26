<?php

namespace Database\Factories;

use App\Models\MouvementCaisse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MouvementCaisse>
 */
class MouvementCaisseFactory extends Factory
{
    private array $libelles = [
        'Encaissement remboursement échéance',
        'Décaissement prêt accordé',
        'Frais de dossier perçus',
        'Pénalité de retard encaissée',
        'Remboursement anticipé',
        'Assurance mensuelle',
        'Versement fond de caisse',
        'Reversement fin de journée',
        'Régularisation comptable',
    ];
 
    public function definition(): array
    {
        return [
            'employe_id'      => null, // affecté dans le seeder
            'num_caisse'      => $this->faker->numerify('CAISSE-###'),
            'type_mouvement'  => $this->faker->randomElement(['ENTREE', 'SORTIE']),
            'montant'         => $this->faker->randomFloat(2, 100, 50000),
            'libelle'         => $this->faker->randomElement($this->libelles),
            'reference_id'    => null,
            'reference_type'  => $this->faker->optional(0.6)
                ->randomElement(['App\\Models\\Paiement', 'App\\Models\\Pret']),
        ];
    }
 
    public function entree(): static
    {
        return $this->state(['type_mouvement' => 'ENTREE']);
    }
 
    public function sortie(): static
    {
        return $this->state(['type_mouvement' => 'SORTIE']);
    }
}