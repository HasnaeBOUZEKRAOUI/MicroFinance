<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MouvementCaisseFactory extends Factory
{
    private array $libellesEntree = [
        'Encaissement remboursement échéance',
        'Frais de dossier perçus',
        'Pénalité de retard encaissée',
        'Remboursement anticipé',
        'Assurance mensuelle perçue',
        'Versement fond de caisse',
        'Dépôt client',
    ];

    private array $libellesSortie = [
        'Décaissement prêt accordé',
        'Reversement fin de journée',
        'Régularisation comptable',
        'Remboursement trop-perçu',
        'Frais opérationnels',
    ];

    public function definition(): array
    {
        // Par défaut : priorité aux ENTREES (70% entrée, 30% sortie)
        $type = $this->faker->randomElement([
            'ENTREE','ENTREE','ENTREE','ENTREE','ENTREE',
            'ENTREE','ENTREE',
            'SORTIE','SORTIE','SORTIE',
        ]);

        return [
            'employe_id'     => null,
            'num_caisse'     => $this->faker->numerify('CAISSE-###'),
            'type_mouvement' => $type,
            // ✅ Montants réalistes selon le type
            'montant'        => $type === 'ENTREE'
                ? $this->faker->randomFloat(2, 500, 20000)   // entrées plus grandes
                : $this->faker->randomFloat(2, 100, 8000),   // sorties plus petites
            'libelle'        => $type === 'ENTREE'
                ? $this->faker->randomElement($this->libellesEntree)
                : $this->faker->randomElement($this->libellesSortie),
            'reference_id'   => null,
            'reference_type' => $this->faker->optional(0.6)->randomElement([
                'App\\Models\\Paiement',
                'App\\Models\\Pret',
            ]),
        ];
    }

    public function entree(): static
    {
        return $this->state(function () {
            return [
                'type_mouvement' => 'ENTREE',
                'montant'        => $this->faker->randomFloat(2, 500, 20000),
                'libelle'        => $this->faker->randomElement($this->libellesEntree),
            ];
        });
    }

    public function sortie(): static
    {
        return $this->state(function () {
            return [
                'type_mouvement' => 'SORTIE',
                'montant'        => $this->faker->randomFloat(2, 100, 8000),
                'libelle'        => $this->faker->randomElement($this->libellesSortie),
            ];
        });
    }
}