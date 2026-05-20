<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pret;
use App\Models\DemandeCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

    /** Décaisser un prêt (création depuis une demande approuvée) + Génération des échéances */
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

        $duree = (int) $demande->duree_demandee;
        $periodeGrace = (int) ($validated['periode_grace'] ?? 0);
        $debut = Carbon::parse($validated['date_debut']);
        
        // La date de fin s'allonge du nombre de mois de la période de grâce
        $dateFin = $debut->copy()->addMonths($duree + $periodeGrace);

        // Déclaration de la variable pour y accéder hors du scope de la transaction
        $pret = null;

        // Utilisation d'une transaction pour s'assurer que tout s'insère ou rien du tout
        DB::transaction(function () use ($validated, $demande, $debut, $dateFin, $duree, $periodeGrace, &$pret) {
            
            // 1. Création du prêt
            $pret = Pret::create([
                'demande_credit_id' => $demande->id,
                'reference'         => 'PRE-' . strtoupper(Str::random(8)),
                'montant_accorde'   => $validated['montant_accorde'],
                'date_debut'        => $debut->toDateString(),
                'date_fin'          => $dateFin->toDateString(),
                'taux_interet'      => $validated['taux_interet'],
                'statut_pret'       => 'EN_COURS',
                'periode_grace'     => $periodeGrace,
                'capital_restant'   => $validated['montant_accorde'],
            ]);

            // 2. Variables de calcul pour le plan d'amortissement
            $capitalRestantDu = (float) $validated['montant_accorde'];
            $montantPrincipalParEcheance = $capitalRestantDu / $duree; 
            $tauxMensuel = (float) $validated['taux_interet'] / 12;

            $dateEcheanceCourante = $debut->copy();
            $totalEcheances = $duree + $periodeGrace;

            // 3. Boucle de génération des échéances
            for ($i = 1; $i <= $totalEcheances; $i++) {
                $dateEcheanceCourante->addMonth();

                // Calcul des intérêts basés sur le capital qui reste à payer
                $interetDu = $capitalRestantDu * $tauxMensuel;

                // Gestion de la période de grâce
                if ($i <= $periodeGrace) {
                    $principalDu = 0; // Pas de remboursement de capital pendant la grâce
                } else {
                    $principalDu = $montantPrincipalParEcheance;
                }

                $totalDu = $principalDu + $interetDu;

                // Insertion directe dans la table échéance via le Query Builder (plus rapide dans une boucle)
                DB::table('echeances')->insert([
                    'pret_id'           => $pret->id,
                    'numero_echeance'   => $i,
                    'date_echeance'     => $dateEcheanceCourante->toDateString(),
                    'total_du'          => round($totalDu, 2),
                    'montant_principal' => round($principalDu, 2),
                    'montant_interet'   => round($interetDu, 2),
                    'montant_paye'      => 0,
                    'jours_retard'      => 0,
                    'penalites'         => 0,
                    'statut'            => 'EN_ATTENTE',
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);

                // On réduit le capital restant uniquement si on a amorti (hors période de grâce)
                if ($i > $periodeGrace) {
                    $capitalRestantDu -= $principalDu;
                }
            }

            // 4. Marquer la demande comme décaissée
            $demande->update(['statut_demande' => 'DECAISSEE']);
        });

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
            'solde_restant'   => $pret->capital_restant, // Utilisation directe de ton champ existant
            'echeances'       => $echeances,
        ]);
    }

    /** Solde restant dû */
    public function soldeRestant(Pret $pret): JsonResponse
    {
        return response()->json([
            'pret_id'       => $pret->id,
            'reference'     => $pret->reference,
            'solde_restant' => $pret->capital_restant, // Utilisation directe de ton champ existant
        ]);
    }
}