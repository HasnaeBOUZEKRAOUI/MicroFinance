<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProduitCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProduitCreditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProduitCredit::with('frais');

        if ($request->filled('actif')) {
            $query->where('actif', filter_var($request->actif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('famille')) {
            $query->where('famille_produit', $request->famille);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type_produit'     => 'required|string|max:100',
            'famille_produit'  => 'required|string|max:100',
            'montant_min'      => 'required|numeric|min:0',
            'montant_max'      => 'required|numeric|gt:montant_min',
            'taux_interet_min' => 'required|numeric|min:0|max:1',
            'taux_interet_max' => 'required|numeric|gt:taux_interet_min|max:1',
            'mode_calcul'      => 'required|in:LINEAIRE,DEGRESSIF,CONSTANT,IN_FINE',
            'actif'            => 'nullable|boolean',
        ]);

        $produit = ProduitCredit::create($validated);

        return response()->json($produit, 201);
    }

    public function show(ProduitCredit $produitCredit): JsonResponse
    {
        return response()->json($produitCredit->load('frais'));
    }

    public function update(Request $request, ProduitCredit $produitCredit): JsonResponse
    {
        $validated = $request->validate([
            'type_produit'     => 'sometimes|string|max:100',
            'famille_produit'  => 'sometimes|string|max:100',
            'montant_min'      => 'sometimes|numeric|min:0',
            'montant_max'      => 'sometimes|numeric|min:0',
            'taux_interet_min' => 'sometimes|numeric|min:0|max:1',
            'taux_interet_max' => 'sometimes|numeric|min:0|max:1',
            'mode_calcul'      => 'sometimes|in:LINEAIRE,DEGRESSIF,CONSTANT,IN_FINE',
            'actif'            => 'sometimes|boolean',
        ]);

        $produitCredit->update($validated);

        return response()->json($produitCredit);
    }

    public function destroy(ProduitCredit $produitCredit): JsonResponse
    {
        $produitCredit->delete();

        return response()->json(['message' => 'Produit crédit supprimé avec succès.']);
    }

    /** Valider si un montant/taux est compatible avec le produit */
    public function valider(Request $request, ProduitCredit $produitCredit): JsonResponse
    {
        $validated = $request->validate([
            'montant' => 'required|numeric|min:0',
            'taux'    => 'required|numeric|min:0|max:1',
        ]);

        $valide = $produitCredit->validerParametres($validated['montant'], $validated['taux']);

        return response()->json([
            'valide'  => $valide,
            'message' => $valide ? 'Paramètres valides.' : 'Montant ou taux hors plage autorisée.',
        ]);
    }
}
