<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Echeance;

/**
 * Commande à scheduler chaque jour à minuit :
 * php artisan echeances:recalculer-penalites
 */
class RecalculerPenalitesCommand extends Command
{
    protected $signature   = 'echeances:recalculer-penalites';
    protected $description = 'Recalcule les jours de retard et pénalités de toutes les échéances impayées';

    public function handle(): void
    {
        $echeances = Echeance::impayees()
            ->where('date_echeance', '<', now())
            ->get();

        $this->info("🔄 {$echeances->count()} échéances à traiter...");

        $updated = 0;
        foreach ($echeances as $echeance) {
            $ancienJours    = $echeance->jours_retard;
            $ancienPenalite = $echeance->penalites;

            $echeance->recalculerPenalites();

            if ($echeance->jours_retard !== $ancienJours) {
                $this->line("  Échéance #{$echeance->id} — retard : {$ancienJours}j → {$echeance->jours_retard}j | pénalités : {$ancienPenalite} → {$echeance->penalites} MAD");
                $updated++;
            }
        }

        $this->info("{$updated} échéances mises à jour.");
    }
}