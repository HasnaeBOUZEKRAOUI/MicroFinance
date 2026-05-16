<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Employe;
use App\Models\DemandeCredit;
use App\Models\Pret;
use App\Models\Paiement;
use App\Models\Alerte;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        try {
            $totalClients = Client::count();
            $totalEmployes = Employe::count();
            $demandesAttente = DemandeCredit::whereIn('statut', ['SOUMIS', 'EN_COURS', 'ETUDE'])->count();

            // Gestion dynamique de la colonne montante du portefeuille global
            $encoursCredits = 0;
            if (Schema::hasColumn('prets', 'capital_restant_du')) {
                $encoursCredits = Pret::where('statut', 'ACTIF')->sum('capital_restant_du');
            } elseif (Schema::hasColumn('prets', 'montant')) {
                $encoursCredits = Pret::where('statut', 'ACTIF')->sum('montant');
            }

            // Récupération des 5 derniers paiements
            $derniersPaiements = [];
            if (Schema::hasTable('paiements')) {
                $derniersPaiements = Paiement::select(
                        'paiements.id',
                        'paiements.montant',
                        'paiements.mode_paiement',
                        'paiements.created_at',
                        DB::raw("CONCAT(personnes.prenom, ' ', personnes.nom) as client_nom")
                    )
                    ->join('prets', 'paiements.pret_id', '=', 'prets.id')
                    ->join('clients', 'prets.client_id', '=', 'clients.id')
                    ->join('personnes', 'clients.personne_id', '=', 'personnes.id')
                    ->orderBy('paiements.created_at', 'desc')
                    ->limit(5)
                    ->get();
            }

            // Récupération des 5 dernières alertes non acquittées (avec vos vraies colonnes !)
            $alertesRecentes = Alerte::where('est_acquittee', false)
                ->orderBy('date_alerte', 'desc')
                ->limit(5)
                ->get(['id', 'message', 'niveau_gravite', 'date_alerte']);

            return response()->json([
                'total_clients'      => $totalClients,
                'total_employes'     => $totalEmployes,
                'demandes_attente'   => $demandesAttente,
                'encours_credits'    => (float) $encoursCredits,
                'derniers_paiements' => $derniersPaiements,
                'alertes_recentes'   => $alertesRecentes
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques du tableau de bord.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}