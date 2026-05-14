<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Echeance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with(['echeance.pret.demandeCredit.client.personne', 'employe.personne']);

        if ($request->filled('echeance_id')) {
            $query->where('echeance_id', $request->echeance_id);
        }

        if ($request->filled('mode_paiement')) {
            $query->where('mode_paiement', $request->mode_paiement);
        }

        if ($request->filled('date_debut') && $request->filled('date_fin')) {
            $query->whereBetween('date_paiement', [$request->date_debut, $request->date_fin]);
        }

        return response()->json($query->latest('date_paiement')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'echeance_id'         => 'required|exists:echeances,id',
            'employe_id'          => 'nullable|exists:employes,id',
            'date_paiement'       => 'required|date',
            'montant'             => 'required|numeric|min:0.01',
            'mode_paiement'       => 'required|in:ESPECES,VIREMENT,CHEQUE,MOBILE_MONEY,PRELEVEMENT',
            'reference_transaction'=> 'nullable|string|unique:paiements,reference_transaction',
            'observation'         => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($validated, &$paiement) {
            $echeance = Echeance::findOrFail($validated['echeance_id']);

            $paiement = Paiement::create($validated);

            // Mise à jour du montant payé sur l'échéance
            $totalPaye = $echeance->montant_paye + $validated['montant'];
            $echeance->montant_paye = $totalPaye;

            if ($totalPaye >= $echeance->total_du) {
                $echeance->statut = 'PAYEE';
            } else {
                $echeance->statut = 'PARTIELLEMENT_PAYEE';
            }

            $echeance->save();
        });

        return response()->json($paiement->load('echeance', 'employe.personne'), 201);
    }

    public function show(Paiement $paiement): JsonResponse
    {
        return response()->json($paiement->load(['echeance.pret', 'employe.personne']));
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        if (!$paiement->est_valide) {
            return response()->json(['message' => 'Ce paiement est déjà annulé.'], 422);
        }

        DB::transaction(function () use ($paiement) {
            $echeance = $paiement->echeance;

            // Recalculer le montant payé sur l'échéance
            $totalPaye = max(0, $echeance->montant_paye - $paiement->montant);
            $echeance->montant_paye = $totalPaye;
            $echeance->statut = $totalPaye <= 0 ? 'EN_ATTENTE' : 'PARTIELLEMENT_PAYEE';
            $echeance->save();

            $paiement->update(['est_valide' => false]);
        });

        return response()->json(['message' => 'Paiement annulé avec succès.']);
    }

    /** Valider un paiement */
    public function valider(Paiement $paiement): JsonResponse
    {
        return response()->json([
            'paiement_id' => $paiement->id,
            'est_valide'  => $paiement->validerPaiement(),
        ]);
    }
}
