<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeCredit;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DemandeCreditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DemandeCredit::with(['client.personne', 'produitCredit', 'employe.personne']);

        if ($request->filled('statut')) {
            $query->where('statut_demande', $request->statut);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('employe_id')) {
            $query->where('employe_id', $request->employe_id);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id'         => 'required|exists:clients,id',
            'produit_credit_id' => 'required|exists:produit_credits,id',
            'montant_demande'   => 'required|numeric|min:1',
            'duree_demandee'    => 'required|integer|min:1|max:360',
            'objet_pret'        => 'required|string|max:255',
            'garantie'          => 'nullable|string|max:255',
            'nom_garant'        => 'nullable|string|max:150',
        ]);

        // Vérifier que le client n'est pas sur liste noire
        $client = \App\Models\Client::findOrFail($validated['client_id']);
        if ($client->verifierBlacklist()) {
            return response()->json([
                'message' => 'Ce client est sur liste noire et ne peut pas soumettre de demande.',
            ], 403);
        }

        $demande = DemandeCredit::create(array_merge($validated, [
            'statut_demande'  => 'EN_ATTENTE',
            'date_soumission' => now(),
        ]));

        return response()->json($demande->load('client.personne', 'produitCredit'), 201);
    }

    public function show(DemandeCredit $demandeCredit): JsonResponse
    {
        $demandeCredit->load(['client.personne', 'produitCredit.frais', 'employe.personne', 'pret']);

        return response()->json($demandeCredit);
    }

    public function update(Request $request, DemandeCredit $demandeCredit): JsonResponse
    {
        $validated = $request->validate([
            'montant_demande' => 'sometimes|numeric|min:1',
            'duree_demandee'  => 'sometimes|integer|min:1|max:360',
            'objet_pret'      => 'sometimes|string|max:255',
            'garantie'        => 'nullable|string|max:255',
            'nom_garant'      => 'nullable|string|max:150',
        ]);

        if (!in_array($demandeCredit->statut_demande, ['EN_ATTENTE'])) {
            return response()->json([
                'message' => 'Seules les demandes en attente peuvent être modifiées.',
            ], 422);
        }

        $demandeCredit->update($validated);

        return response()->json($demandeCredit->load('client.personne', 'produitCredit'));
    }

    public function destroy(DemandeCredit $demandeCredit): JsonResponse
    {
        if (!in_array($demandeCredit->statut_demande, ['EN_ATTENTE', 'REJETEE', 'ANNULEE'])) {
            return response()->json([
                'message' => 'Impossible de supprimer une demande en cours de traitement.',
            ], 422);
        }

        $demandeCredit->delete();

        return response()->json(['message' => 'Demande supprimée avec succès.']);
    }

    /** Affecter un agent à la demande */
    public function affecter(Request $request, DemandeCredit $demandeCredit): JsonResponse
    {
        $validated = $request->validate([
            'employe_id' => 'required|exists:employes,id',
        ]);

        $agent = Employe::findOrFail($validated['employe_id']);
        $demandeCredit->affecter($agent);

        return response()->json([
            'message' => "Demande affectée à {$agent->nom_complet}.",
            'demande' => $demandeCredit->load('employe.personne'),
        ]);
    }

    /** Évaluer le risque de la demande */
    public function evaluerRisque(DemandeCredit $demandeCredit): JsonResponse
    {
        $score = $demandeCredit->evaluerRisque();

        return response()->json([
            'demande_id'   => $demandeCredit->id,
            'score_risque' => $score,
        ]);
    }

    /** Approuver une demande */
    public function approuver(Request $request, DemandeCredit $demandeCredit): JsonResponse
    {
        if ($demandeCredit->statut_demande !== 'EN_COURS_ANALYSE') {
            return response()->json([
                'message' => 'Seules les demandes en cours d\'analyse peuvent être approuvées.',
            ], 422);
        }

        $demandeCredit->update([
            'statut_demande' => 'APPROUVEE',
            'date_decision'  => now(),
        ]);

        return response()->json(['message' => 'Demande approuvée.', 'demande' => $demandeCredit]);
    }

    /** Rejeter une demande */
    public function rejeter(Request $request, DemandeCredit $demandeCredit): JsonResponse
    {
        $validated = $request->validate([
            'motif_rejet' => 'required|string|max:500',
        ]);

        $demandeCredit->update([
            'statut_demande' => 'REJETEE',
            'motif_rejet'    => $validated['motif_rejet'],
            'date_decision'  => now(),
        ]);

        return response()->json(['message' => 'Demande rejetée.', 'demande' => $demandeCredit]);
    }
}
