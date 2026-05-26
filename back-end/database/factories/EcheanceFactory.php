<?php

namespace Database\Factories;

use App\Models\Echeance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Echeance>
 */
class EcheanceFactory extends Factory
{
    // Taux de pénalité par jour de retard (0.1% par jour)
    const TAUX_PENALITE_JOURNALIER = 0.001;

    public function definition(): array
    {
        $principal = $this->faker->randomFloat(2, 500, 8000);
        $interet   = $this->faker->randomFloat(2, 50, 800);
        $totalDu   = round($principal + $interet, 2);

        $statut = $this->faker->randomElement([
            'EN_ATTENTE', 'EN_ATTENTE',
            'PAYEE', 'PAYEE',
            'PARTIELLEMENT_PAYEE',
            'EN_RETARD',
        ]);

        // ── Date d'échéance selon le statut ──────────────────────────────
        $dateEcheance = match ($statut) {
            // Échéances passées → peuvent avoir du retard
            'EN_RETARD', 'PARTIELLEMENT_PAYEE'
                => $this->faker->dateTimeBetween('-6 months', '-1 day')->format('Y-m-d'),
            // Payées → dans le passé aussi mais sans retard restant
            'PAYEE'
                => $this->faker->dateTimeBetween('-2 years', '-1 month')->format('Y-m-d'),
            // En attente → dans le futur
            default
                => $this->faker->dateTimeBetween('+1 day', '+1 year')->format('Y-m-d'),
        };

        // ── Calcul des jours de retard réels ─────────────────────────────
        // Jours = aujourd'hui - date_échéance  (seulement si dépassée)
        $joursRetard = match ($statut) {
            'EN_RETARD', 'PARTIELLEMENT_PAYEE'
                => (int) now()->diffInDays($dateEcheance),
            default => 0,
        };

        // ── Pénalités = capital_restant × taux × jours ───────────────────
        // Sur la partie non encore payée
        $montantPaye = match ($statut) {
            'PAYEE'               => $totalDu,
            'PARTIELLEMENT_PAYEE' => $this->faker->randomFloat(2, 100, $totalDu - 1),
            default               => 0,
        };

        $capitalRestant = round($totalDu - $montantPaye, 2);

        $penalites = $joursRetard > 0
            ? round($capitalRestant * self::TAUX_PENALITE_JOURNALIER * $joursRetard, 2)
            : 0;

        return [
            'pret_id'          => null,
            'numero_echeance'  => 1,
            'date_echeance'    => $dateEcheance,
            'total_du'         => $totalDu,
            'montant_principal'=> $principal,
            'montant_interet'  => $interet,
            'montant_paye'     => $montantPaye,
            'jours_retard'     => $joursRetard,
            'penalites'        => $penalites,
            'statut'           => $statut,
        ];
    }

    public function payee(): static
    {
        return $this->state(function (array $attr) {
            return [
                'statut'        => 'PAYEE',
                'montant_paye'  => $attr['total_du'],
                'jours_retard'  => 0,
                'penalites'     => 0,
                'date_echeance' => $this->faker->dateTimeBetween('-2 years', '-1 month')->format('Y-m-d'),
            ];
        });
    }

    public function enAttente(): static
    {
        return $this->state(function () {
            return [
                'statut'        => 'EN_ATTENTE',
                'montant_paye'  => 0,
                'jours_retard'  => 0,
                'penalites'     => 0,
                'date_echeance' => $this->faker->dateTimeBetween('+1 day', '+1 year')->format('Y-m-d'),
            ];
        });
    }

    public function enRetard(): static
    {
        return $this->state(function (array $attr) {
            // Date dans le passé → retard réel calculé
            $dateEcheance = $this->faker->dateTimeBetween('-6 months', '-1 day')->format('Y-m-d');
            $jours        = (int) now()->diffInDays($dateEcheance);
            $penalites    = round($attr['total_du'] * self::TAUX_PENALITE_JOURNALIER * $jours, 2);

            return [
                'statut'        => 'EN_RETARD',
                'montant_paye'  => 0,
                'jours_retard'  => $jours,
                'penalites'     => $penalites,
                'date_echeance' => $dateEcheance,
            ];
        });
    }
}