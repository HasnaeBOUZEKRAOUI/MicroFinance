<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Client;
use App\Models\Employe;
use App\Models\DemandeCredit;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        try {
            // Uniquement des comptes simples sur les tables principales
            $totalClients = class_exists(Client::class) ? Client::count() : 0;
            $totalEmployes = class_exists(Employe::class) ? Employe::count() : 0;
            $demandesAttente = class_exists(DemandeCredit::class) ? DemandeCredit::count() : 0;

            // On envoie des données simulées pour les blocs restants pour éviter l'erreur 500
            return response()->json([
                'total_clients'      => $totalClients,
                'total_employes'     => $totalEmployes,
                'demandes_attente'   => $demandesAttente,
                'encours_credits'    => 1550000, // Valeur statique temporaire
                'derniers_paiements' => [
                    [
                        'id' => 1,
                        'client_nom' => 'Simulé - Ahmed Alami',
                        'created_at' => now()->toDateTimeString(),
                        'montant' => 2500,
                        'mode_paiement' => 'CASH'
                    ]
                ], 
                'alertes_recentes'   => []
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur persistante',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}