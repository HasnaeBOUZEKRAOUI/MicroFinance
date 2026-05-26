<?php
// ══════════════════════════════════════════════════════════════
//  PretFactory.php
// ══════════════════════════════════════════════════════════════
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PretFactory extends Factory
{
    public function definition(): array
    {
        $dateDebut     = $this->faker->dateTimeBetween('-3 years', '-3 months');
        $dureesMois    = $this->faker->randomElement([6, 12, 18, 24, 36, 48, 60]);
        $dateFin       = (clone $dateDebut)->modify("+{$dureesMois} months");
        $montant       = $this->faker->randomFloat(2, 2000, 150000);
        $taux          = $this->faker->randomFloat(4, 0.06, 0.20);

        $statuts = ['EN_COURS', 'EN_COURS', 'EN_COURS', 'SOLDE', 'EN_RETARD', 'EN_CONTENTIEUX', 'RESTRUCTURE'];

        return [
            'demande_credit_id' => null, // affecté dans le seeder
            'reference'         => 'PRE-' . strtoupper(Str::random(3)) . '-' . $this->faker->numerify('######'),
            'montant_accorde'   => $montant,
            'date_debut'        => $dateDebut->format('Y-m-d'),
            'date_fin'          => $dateFin->format('Y-m-d'),
            'taux_interet'      => $taux,
            'statut_pret'       => $this->faker->randomElement($statuts),
            'periode_grace'     => $this->faker->randomElement([0, 0, 0, 1, 2, 3]),
            'capital_restant'   => $this->faker->randomFloat(2, 0, $montant),
        ];
    }

    public function enCours(): static
    {
        return $this->state([
            'statut_pret'    => 'EN_COURS',
            'date_debut'     => now()->subMonths(6)->format('Y-m-d'),
            'date_fin'       => now()->addMonths(18)->format('Y-m-d'),
            'capital_restant'=> $this->faker->randomFloat(2, 5000, 80000),
        ]);
    }

    public function solde(): static
    {
        return $this->state([
            'statut_pret'    => 'SOLDE',
            'capital_restant'=> 0,
            'date_fin'       => $this->faker->dateTimeBetween('-1 year', '-1 month')->format('Y-m-d'),
        ]);
    }

    public function enRetard(): static
    {
        return $this->state([
            'statut_pret'    => 'EN_RETARD',
            'capital_restant'=> $this->faker->randomFloat(2, 2000, 50000),
        ]);
    }
}


