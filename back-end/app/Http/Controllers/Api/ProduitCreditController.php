<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\ProduitCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class ProduitCreditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProduitCredit::with('frais');
        $aujourdhui = Carbon::today()->toDateString();

        // ── 1. Gestion du filtre "actif" prenant en compte les dates ──
        if ($request->filled('actif')) {
            $estActifDemande = filter_var($request->actif, FILTER_VALIDATE_BOOLEAN);

            if ($estActifDemande) {
                // Un produit est VRAIMENT actif si : actif = true ET (date_fin est nulle OU date_fin >= aujourd'hui)
                $query->where('actif', true)
                      ->where(function ($q) use ($aujourdhui) {
                          $q->whereNull('date_fin')
                            ->orWhere('date_fin', '>=', $aujourdhui);
                      });
            } else {
                // Un produit est inactif si : actif = false OU date_fin < aujourd'hui
                $query->where(function ($q) use ($aujourdhui) {
                    $q->where('actif', false)
                      ->orWhere('date_fin', '<', $aujourdhui);
                });
            }
        }

        if ($request->filled('famille')) {
            $query->where('famille_produit', $request->famille);
        }

        $resultats = $query->paginate(20);

        // ── 2. Mutation dynamique du champ "actif" pour le Frontend ──
        // Même si 'actif' est à true en BDD, si la date est passée, on le renvoie comme faux à React
        $resultats->getCollection()->transform(function ($produit) use ($aujourdhui) {
            if ($produit->date_fin && $produit->date_fin < $aujourdhui) {
                $produit->actif = false; 
            }
            return $produit;
        });

        return response()->json($resultats);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type_produit'     => 'required|string|max:100',
            'famille_produit'  => 'required|string|max:100',
            'date_debut'       => 'nullable|date',
            'date_fin'         => 'nullable|date|after_or_equal:date_debut', // Rendues optionnelles au cas où
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
        // Ajuste l'attribut actif à la volée si on consulte un produit seul
        if ($produitCredit->date_fin && $produitCredit->date_fin < Carbon::today()->toDateString()) {
            $produitCredit->actif = false;
        }
        
        return response()->json($produitCredit->load('frais'));
    }

    public function update(Request $request, ProduitCredit $produitCredit): JsonResponse
    {
        $validated = $request->validate([
            'type_produit'     => 'sometimes|string|max:100',
            'famille_produit'  => 'sometimes|string|max:100',
            'date_debut'       => 'sometimes|nullable|date',
            'date_fin'         => 'sometimes|nullable|date|after_or_equal:date_debut',
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

    /** Valider si un montant/taux est compatible ET que le produit n'est pas expiré */
    public function valider(Request $request, ProduitCredit $produitCredit): JsonResponse
    {
        $validated = $request->validate([
            'montant' => 'required|numeric|min:0',
            'taux'    => 'required|numeric|min:0|max:1',
        ]);

        // ── 3. Sécurité Bloquante : Si la date de fin est dépassée, le produit est invalide ──
        if ($produitCredit->date_fin && $produitCredit->date_fin < Carbon::today()->toDateString()) {
            return response()->json([
                'valide'  => false,
                'message' => 'Ce produit de crédit a expiré (date de fin atteinte).',
            ], 422); // Code 422 pour entité non traitable
        }

        $valide = $produitCredit->validerParametres($validated['montant'], $validated['taux']);

        return response()->json([
            'valide'  => $valide,
            'message' => $valide ? 'Paramètres valides.' : 'Montant ou taux hors plage autorisée.',
        ]);
    }
    public function options(): JsonResponse
{
    $produits = ProduitCredit::select('id','type_produit', 'famille_produit','montant_min',
        'montant_max')
        ->where('actif', true) // optionnel : si vous gérez l'activation
        ->get()
        ->map(function ($p) {
            return [
                'id' => $p->id,
                'label' => "{$p->type_produit}-{$p->famille_produit} (Min: {$p->montant_min}, Max: {$p->montant_max})", 
            ];
        });
    return response()->json($produits);
}
}
