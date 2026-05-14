<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compte;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CompteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Compte::with('client.personne');

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('type_compte')) {
            $query->where('type_compte', $request->type_compte);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id'      => 'required|exists:clients,id',
            'numero_compte'  => 'required|string|unique:comptes,numero_compte',
            'code_banque'    => 'nullable|string|max:10',
            'solde_actuel'   => 'nullable|numeric|min:0',
            'type_compte'    => 'required|in:COURANT,EPARGNE,DEPOT_A_TERME,MICROCREDIT',
            'statut'         => 'nullable|in:ACTIF,SUSPENDU,CLOTURE',
        ]);

        $compte = Compte::create($validated);

        return response()->json($compte->load('client.personne'), 201);
    }

    public function show(Compte $compte): JsonResponse
    {
        return response()->json($compte->load('client.personne'));
    }

    public function update(Request $request, Compte $compte): JsonResponse
    {
        $validated = $request->validate([
            'code_banque' => 'nullable|string|max:10',
            'type_compte' => 'sometimes|in:COURANT,EPARGNE,DEPOT_A_TERME,MICROCREDIT',
            'statut'      => 'sometimes|in:ACTIF,SUSPENDU,CLOTURE',
        ]);

        $compte->update($validated);

        return response()->json($compte);
    }

    public function destroy(Compte $compte): JsonResponse
    {
        $compte->delete();

        return response()->json(['message' => 'Compte supprimé avec succès.']);
    }

    /** Débiter un compte */
    public function debiter(Request $request, Compte $compte): JsonResponse
    {
        $validated = $request->validate([
            'montant' => 'required|numeric|min:0.01',
        ]);

        try {
            $compte->debiter($validated['montant']);

            return response()->json([
                'message'      => 'Débit effectué avec succès.',
                'solde_actuel' => $compte->fresh()->solde_actuel,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** Créditer un compte */
    public function crediter(Request $request, Compte $compte): JsonResponse
    {
        $validated = $request->validate([
            'montant' => 'required|numeric|min:0.01',
        ]);

        $compte->crediter($validated['montant']);

        return response()->json([
            'message'      => 'Crédit effectué avec succès.',
            'solde_actuel' => $compte->fresh()->solde_actuel,
        ]);
    }
}
