<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Echeance;
use App\Models\Pret;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EcheanceController extends Controller
{
    /** Liste des échéances d'un prêt */
    public function index(Pret $pret): JsonResponse
    {
        $echeances = $pret->echeances()
            ->orderBy('numero_echeance')
            ->get();

        return response()->json($echeances);
    }

    public function show(Pret $pret, Echeance $echeance): JsonResponse
    {
        $echeance->load('paiements.employe.personne');

        return response()->json($echeance);
    }

    /** Mettre à jour une échéance (admin/correction) */
    public function update(Request $request, Pret $pret, Echeance $echeance): JsonResponse
    {
        $validated = $request->validate([
            'date_echeance'     => 'sometimes|date',
            'montant_paye'      => 'sometimes|numeric|min:0',
            'jours_retard'      => 'sometimes|integer|min:0',
            'penalites'         => 'sometimes|numeric|min:0',
            'statut'            => 'sometimes|in:EN_ATTENTE,PARTIELLEMENT_PAYEE,PAYEE,EN_RETARD',
        ]);

        $echeance->update($validated);

        return response()->json($echeance);
    }

    /** Calculer les pénalités d'une échéance */
    public function penalites(Request $request, Pret $pret, Echeance $echeance): JsonResponse
    {
        $taux = $request->input('taux_penalite', 0.002);
        $montant = $echeance->calculerPenalites((float) $taux);

        return response()->json([
            'echeance_id'    => $echeance->id,
            'jours_retard'   => $echeance->jours_retard,
            'taux_penalite'  => $taux,
            'penalites'      => $montant,
        ]);
    }

    /** Marquer une échéance comme payée */
    public function marquerPayee(Pret $pret, Echeance $echeance): JsonResponse
    {
        $echeance->marquerCommePayee();

        return response()->json([
            'message'  => 'Échéance marquée comme payée.',
            'echeance' => $echeance->fresh(),
        ]);
    }
}
