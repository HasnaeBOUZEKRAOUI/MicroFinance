<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Frais;
use App\Models\ProduitCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FraisController extends Controller
{
    /** Liste des frais d'un produit crédit */
    public function index(ProduitCredit $produitCredit): JsonResponse
    {
        return response()->json($produitCredit->frais()->get());
    }

    public function store(Request $request, ProduitCredit $produitCredit): JsonResponse
    {
        $validated = $request->validate([
            'libelle_frais'   => 'required|string|max:150',
            'taux'            => 'nullable|numeric|min:0|max:1',
            'montant_fixe'    => 'nullable|numeric|min:0',
            'est_capitalisable' => 'nullable|boolean',
        ]);

        // Au moins l'un des deux doit être fourni
        if (empty($validated['taux']) && empty($validated['montant_fixe'])) {
            return response()->json([
                'message' => 'Veuillez fournir un taux ou un montant fixe.',
            ], 422);
        }

        $frais = $produitCredit->frais()->create($validated);

        return response()->json($frais, 201);
    }

    public function show(ProduitCredit $produitCredit, Frais $frais): JsonResponse
    {
        return response()->json($frais);
    }

    public function update(Request $request, ProduitCredit $produitCredit, Frais $frais): JsonResponse
    {
        $validated = $request->validate([
            'libelle_frais'    => 'sometimes|string|max:150',
            'taux'             => 'nullable|numeric|min:0|max:1',
            'montant_fixe'     => 'nullable|numeric|min:0',
            'est_capitalisable'=> 'sometimes|boolean',
        ]);

        $frais->update($validated);

        return response()->json($frais);
    }

    public function destroy(ProduitCredit $produitCredit, Frais $frais): JsonResponse
    {
        $frais->delete();

        return response()->json(['message' => 'Frais supprimé avec succès.']);
    }

    /** Simuler le montant des frais pour un montant de prêt donné */
    public function simuler(Request $request, ProduitCredit $produitCredit, Frais $frais): JsonResponse
    {
        $validated = $request->validate([
            'montant_pret' => 'required|numeric|min:0',
        ]);

        return response()->json([
            'libelle'      => $frais->libelle_frais,
            'montant_pret' => $validated['montant_pret'],
            'frais_calcule'=> $frais->calculerMontant($validated['montant_pret']),
        ]);
    }
}
