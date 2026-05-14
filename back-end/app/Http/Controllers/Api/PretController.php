<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pret;
use App\Models\DemandeCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class PretController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pret::with(['demandeCredit.client.personne', 'demandeCredit.produitCredit']);

        if ($request->filled('statut')) {
            $query->where('statut_pret', $request->statut);
        }

        if ($request->filled('client_id')) {
            $query->whereHas('demandeCredit', fn($q) =>
                $q->where('client_id', $request->client_id)
            );
        }

        return response()->json($query->latest()->paginate(20));
    }

    /** Décaisser un prêt (création depuis une demande approuvée) */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'demande_credit_id' => 'required|exists:demande_credits,id',
            'montant_accorde'   => 'required|numeric|min:1',
            'date_debut'        => 'required|date',
            'taux_interet'      => 'required|numeric|min:0|max:1',
            'periode_grace'     => 'nullable|integer|min:0',
        ]);

        $demande = DemandeCredit::findOrFail($validated['demande_credit_id']);

        if ($demande->statut_demande !== 'APPROUVEE') {
            return response()->json([
                'message' => 'Seules les demandes approuvées peuvent être décaissées.',
            ], 422);
        }

        if ($demande->pret()->exists()) {
            return response()->json([
                'message' => 'Un prêt existe déjà pour cette demande.',
            ], 409);
        }

        $duree = $demande->duree_demandee;
        $debut = \Carbon\Carbon::parse($validated['date_debut']);

        $pret = Pret::create([
            'demande_credit_id' => $demande->id,
            'reference'         => 'PRE-' . strtoupper(Str::random(8)),
            'montant_accorde'   => $validated['montant_accorde'],
            'date_debut'        => $debut->toDateString(),
            'date_fin'          => $debut->copy()->addMonths($duree)->toDateString(),
            'taux_interet'      => $validated['taux_interet'],
            'statut_pret'       => 'EN_COURS',
            'periode_grace'     => $validated['periode_grace'] ?? 0,
            'capital_restant'   => $validated['montant_accorde'],
        ]);

        // Marquer la demande comme décaissée
        $demande->update(['statut_demande' => 'DECAISSEE']);

        return response()->json($pret->load('demandeCredit.client.personne'), 201);
    }

    public function show(Pret $pret): JsonResponse
    {
        $pret->load(['demandeCredit.client.personne', 'demandeCredit.produitCredit', 'echeances', 'alertes']);

        return response()->json($pret);
    }

    public function update(Request $request, Pret $pret): JsonResponse
    {
        $validated = $request->validate([
            'statut_pret'    => 'sometimes|in:EN_COURS,SOLDE,EN_RETARD,EN_CONTENTIEUX,RESTRUCTURE,ABANDONNE',
            'periode_grace'  => 'sometimes|integer|min:0',
            'capital_restant'=> 'sometimes|numeric|min:0',
        ]);

        $pret->update($validated);

        return response()->json($pret);
    }

    public function destroy(Pret $pret): JsonResponse
    {
        if ($pret->statut_pret === 'EN_COURS') {
            return response()->json([
                'message' => 'Impossible de supprimer un prêt en cours.',
            ], 422);
        }

        $pret->delete();

        return response()->json(['message' => 'Prêt supprimé avec succès.']);
    }

    /** Écheancier du prêt */
    public function echeancier(Pret $pret): JsonResponse
    {
        $echeances = $pret->echeances()->orderBy('numero_echeance')->get();

        return response()->json([
            'pret_id'         => $pret->id,
            'reference'       => $pret->reference,
            'montant_accorde' => $pret->montant_accorde,
            'solde_restant'   => $pret->calculerSoldeRestant(),
            'echeances'       => $echeances,
        ]);
    }

    /** Solde restant dû */
    public function soldeRestant(Pret $pret): JsonResponse
    {
        return response()->json([
            'pret_id'       => $pret->id,
            'reference'     => $pret->reference,
            'solde_restant' => $pret->calculerSoldeRestant(),
        ]);
    }
}
