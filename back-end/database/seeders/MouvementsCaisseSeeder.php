<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employe;
use App\Models\MouvementCaisse;

class MouvementsCaisseSeeder extends Seeder
{
    public function run(): void
    {
        $agents = Employe::where('role', 'AGENT_CREDIT')
            ->whereNotNull('num_caisse')
            ->get();

        foreach ($agents as $agent) {

            // ── Étape 1 : ENTREES initiales pour alimenter la caisse ──
            // 10 à 15 entrées en premier → solde de départ positif
            MouvementCaisse::factory()
                ->count(rand(10, 15))
                ->entree()
                ->create([
                    'employe_id' => $agent->id,
                    'num_caisse' => $agent->num_caisse,
                ]);

            // ── Étape 2 : SORTIES limitées (max 30% du total entrees) ──
            // Calcul du solde actuel de la caisse
            $totalEntrees = MouvementCaisse::where('num_caisse', $agent->num_caisse)
                ->where('type_mouvement', 'ENTREE')
                ->sum('montant');

            $totalSorties = MouvementCaisse::where('num_caisse', $agent->num_caisse)
                ->where('type_mouvement', 'SORTIE')
                ->sum('montant');

            $soldeDisponible = $totalEntrees - $totalSorties;

            // Générer des sorties sans dépasser 60% du solde disponible
            $nbSorties     = rand(3, 8);
            $maxParSortie  = ($soldeDisponible * 0.6) / $nbSorties;

            for ($i = 0; $i < $nbSorties; $i++) {
                // Recalculer le solde à chaque itération
                $soldeActuel = MouvementCaisse::where('num_caisse', $agent->num_caisse)
                    ->selectRaw("
                        SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) -
                        SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as solde
                    ")
                    ->value('solde') ?? 0;

                // Ne créer une sortie que si le solde est suffisant
                if ($soldeActuel < 500) break;

                $montantSortie = min(
                    round(rand(100, (int) $maxParSortie), 2),
                    $soldeActuel * 0.3  // jamais plus de 30% du solde restant
                );

                MouvementCaisse::factory()
                    ->sortie()
                    ->create([
                        'employe_id' => $agent->id,
                        'num_caisse' => $agent->num_caisse,
                        'montant'    => max(100, $montantSortie),
                    ]);
            }

            // ── Étape 3 : Quelques entrées supplémentaires (activité normale) ──
            MouvementCaisse::factory()
                ->count(rand(5, 10))
                ->entree()
                ->create([
                    'employe_id' => $agent->id,
                    'num_caisse' => $agent->num_caisse,
                ]);
        }

        // Afficher le résumé par caisse
        $this->command->info('Résumé des caisses :');
        $agents->each(function ($agent) {
            $entrees = MouvementCaisse::where('num_caisse', $agent->num_caisse)
                ->where('type_mouvement', 'ENTREE')->sum('montant');
            $sorties = MouvementCaisse::where('num_caisse', $agent->num_caisse)
                ->where('type_mouvement', 'SORTIE')->sum('montant');
            $solde   = $entrees - $sorties;

            $this->command->line(sprintf(
                '   %s → Entrées: %s MAD | Sorties: %s MAD | Solde: %s MAD %s',
                $agent->num_caisse,
                number_format($entrees, 2),
                number_format($sorties, 2),
                number_format($solde, 2),
                $solde >= 0 ? 'yes' : 'no'
            ));
        });
    }
}