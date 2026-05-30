<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pret;
use App\Models\DemandeCredit;
use App\Models\MouvementCaisse;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PretController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // ✅ Récupérer l'employé connecté
        $employe = auth()->user();
    
        if (!$employe) {
            return response()->json(['message' => 'Employé non trouvé.'], 403);
        }
    
        $query = Pret::with([
            'demandeCredit.client.personne',
            'demandeCredit.produitCredit',
        ])
        // ✅ Filtrer uniquement les prêts dont la demande appartient à l'agent connecté
        ->whereHas('demandeCredit', function ($q) use ($employe) {
            $q->where('employe_id', $employe->id);
        });
    
        // Filtres additionnels
        if ($request->filled('statut')) {
            $query->where('statut_pret', $request->statut);
        }
    
        if ($request->filled('client_id')) {
            $query->whereHas('demandeCredit', fn($q) =>
                $q->where('client_id', $request->client_id)
            );
        }
    
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference', 'like', "%{$s}%")
                  ->orWhereHas('demandeCredit.client.personne', fn($p) =>
                      $p->where('nom',    'like', "%{$s}%")
                        ->orWhere('prenom','like', "%{$s}%")
                  );
            });
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

        // Trouver l'agent connecté et sa caisse correspondante
        $employeId = auth()->user()->employe_id ?? 1; 
        $employe = Employe::find($employeId);
        $numCaisseActive = $employe->num_caisse ?? 'CAISSE-PRINCIPALE';

        $pret = null;

        DB::transaction(function () use ($validated, $demande, $debut, $dateFin, $duree, $periodeGrace, $employeId, $numCaisseActive, &$pret) {
            
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
                'employe_id'     => $employeId,
                'num_caisse'     => $numCaisseActive, 
                'type_mouvement' => 'SORTIE',
                'montant'        => $validated['montant_accorde'],
                'libelle'        => "Décaissement initial du Prêt " . $pret->reference,
                'reference_id'   => $pret->id,
            ]);

            $capitalRestantDu = (float) $validated['montant_accorde'];
            $montantPrincipalParEcheance = $capitalRestantDu / $duree; 
            $tauxMensuel = (float) $validated['taux_interet'] / 12;

            $dateEcheanceCourante = $debut->copy();
            $totalEcheances = $duree + $periodeGrace;

            // 3. Boucle de génération des échéances
            for ($i = 1; $i <= $totalEcheances; $i++) {
                $dateEcheanceCourante->addMonth();

                $interetDu = $capitalRestantDu * $tauxMensuel;

                if ($i <= $periodeGrace) {
                    $principalDu = 0; 
                } else {
                    $principalDu = $montantPrincipalParEcheance;
                }

                $totalDu = $principalDu + $interetDu;

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
        $pret->load(['demandeCredit.client.personne', 'demandeCredit.produitCredit', 'echeances']);
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
            $tauxJournalier = 0.0005; 
    
            foreach ($echeances as $echeance) {
                if (!$echeance->date_echeance) {
                    continue;
                }
            
                $dateLimite = \Carbon\Carbon::createFromFormat('Y-m-d', \Carbon\Carbon::parse($echeance->date_echeance)->format('Y-m-d'))->startOfDay();
                $dateDuJour = \Carbon\Carbon::createFromFormat('Y-m-d', date('Y-m-d'))->startOfDay();
            
                if (in_array($echeance->statut, ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD']) && $dateLimite->lt($dateDuJour)) {
                    
                    $joursRetard = (int) $dateDuJour->diffInDays($dateLimite, false);
                    
                    if ($joursRetard <= 0) {
                        $joursRetard = (int) abs($joursRetard);
                    }
                    
                    if ($joursRetard <= 0) {
                        $joursRetard = 1;
                    }
            
                    $totalDu = (float) $echeance->total_du;
                    $montantPaye = (float) $echeance->montant_paye;
                    $resteAPayerMensuel = $totalDu - $montantPaye;
            
                    $echeance->statut = 'EN_RETARD';
                    $echeance->jours_retard = $joursRetard;
                    
                    $calculPenalite = $resteAPayerMensuel * $tauxJournalier * $joursRetard;
                    $echeance->penalites = round($calculPenalite, 2);
                    
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