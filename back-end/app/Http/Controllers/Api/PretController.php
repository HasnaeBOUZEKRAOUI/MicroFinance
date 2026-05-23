<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pret;
use App\Models\DemandeCredit;
use App\Models\MouvementCaisse;
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
        
        $dateFin = $debut->copy()->addMonths($duree + $periodeGrace);

        $pret = null;

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
            MouvementCaisse::create([
                'employe_id'     => auth()->user()->employe_id ?? 1, // Agent connecté
                'num_caisse'     => 'CAISSE-PRINCIPALE',
                'type_mouvement' => 'SORTIE', // Sortie d'argent pour le client
                'montant'        => $validated['montant_accorde'],
                'libelle'        => "Décaissement initial du Prêt " . $pret->reference,
                'reference_id'   => $pret->id,
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
    public function echeancier(Pret $pret): JsonResponse
    {
        try {
            $aujourdhui = \Carbon\Carbon::now()->startOfDay();
            $echeances = $pret->echeances()->orderBy('numero_echeance')->get();
            
            // Taux de pénalité par jour (ex: 0.05% = 0.0005)
            $tauxJournalier = 0.0005; 
    
            foreach ($echeances as $echeance) {
                if (!$echeance->date_echeance) {
                    continue;
                }
            
                // 1. On force la création de dates pures (Y-m-d) sans heures ni fuseaux horaires perturbateurs
                $dateLimite = \Carbon\Carbon::createFromFormat('Y-m-d', \Carbon\Carbon::parse($echeance->date_echeance)->format('Y-m-d'))->startOfDay();
                $dateDuJour = \Carbon\Carbon::createFromFormat('Y-m-d', date('Y-m-d'))->startOfDay();
            
                // 2. Comparaison
                if (in_array($echeance->statut, ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD']) && $dateLimite->lt($dateDuJour)) {
                    
                    $joursRetard = (int) $dateDuJour->diffInDays($dateLimite, false);
                    
                    // Si jamais le calcul donne une valeur négative ou nulle par anomalie
                    if ($joursRetard <= 0) {
                        $joursRetard = (int) abs($joursRetard); // On prend la valeur absolue au cas où c'est inversé
                    }
                    
                    // Sécurité finale si toujours <= 0
                    if ($joursRetard <= 0) {
                        $joursRetard = 1;
                    }
            
                    // 3. Calcul du reste à payer
                    $totalDu = (float) $echeance->total_du;
                    $montantPaye = (float) $echeance->montant_paye;
                    $resteAPayerMensuel = $totalDu - $montantPaye;
            
                    // 4. Application des pénalités
                    $echeance->statut = 'EN_RETARD';
                    $echeance->jours_retard = $joursRetard;
                    
                    $calculPenalite = $resteAPayerMensuel * $tauxJournalier * $joursRetard;
                    $echeance->penalites = round($calculPenalite, 2);
                    
                    // Sauvegarde brute en base de données
                    \Illuminate\Support\Facades\DB::table('echeances')
                        ->where('id', $echeance->id)
                        ->update([
                            'statut' => 'EN_RETARD',
                            'jours_retard' => $joursRetard,
                            'penalites' => $echeance->penalites,
                            'updated_at' => now()
                        ]);
                }
            }
    
            $echeancesPaginees = \Illuminate\Support\Facades\DB::table('echeances')
            ->where('pret_id', $pret->id)
            ->orderBy('numero_echeance')
            ->paginate(5); 

        return response()->json($echeancesPaginees);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Erreur calcul pénalités',
            'message' => $e->getMessage()
        ], 500);
    }
}
    
    public function soldeRestant(Pret $pret): JsonResponse
    {
        return response()->json([
            'pret_id'       => $pret->id,
            'reference'     => $pret->reference,
            'solde_restant' => $pret->capital_restant, 
        ]);
    }
}