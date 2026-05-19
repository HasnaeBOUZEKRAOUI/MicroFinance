<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeCredit;
use App\Models\Employe;
use App\Models\Garant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DemandeCreditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DemandeCredit::with(['client.personne', 'produitCredit', 'employe.personne', 'garant']);

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
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'produit_credit_id' => 'required|exists:produit_credits,id',
            'montant_demande' => 'required|numeric|min:0',
            'duree_demandee' => 'required|integer|min:1',
            'objet_pret' => 'required|string',
            'garantie' => 'nullable|string',
            
            // Validation des données du garant si présentes
            'garant' => 'nullable|array',
            'garant.nom' => 'required_with:garant|string',
            'garant.prenom' => 'required_with:garant|string',
            'garant.cin' => 'required_with:garant|string',
            'garant.telephone' => 'required_with:garant|string',
            'garant.revenu_mensuel' => 'required_with:garant|numeric|min:0',
            'garant.relation_client' => 'required_with:garant|string',
        ]);
    
        try {
            $resultat = DB::transaction(function () use ($request) {
                // 1. Création de la demande
                $demande = DemandeCredit::create([
                    'client_id' => $request->client_id,
                    'produit_credit_id' => $request->produit_credit_id,
                    'montant_demande' => $request->montant_demande,
                    'duree_demandee' => $request->duree_demandee,
                    'objet_pret' => $request->objet_pret,
                    'garantie' => $request->garantie,
                    'statut_demande' => 'EN_ATTENTE',
                    'date_soumission' => now()->toDateString(),
                ]);
    
                // 2. Création du garant rattaché si les informations ont été saisies
                if ($request->has('garant') && !empty($request->garant['nom'])) {
                    $demande->garant()->create($request->garant);
                }
    
                return $demande->load('garant');
            });
    
            return response()->json($resultat, 201);
    
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création : ' . $e->getMessage()], 500);
        }
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
