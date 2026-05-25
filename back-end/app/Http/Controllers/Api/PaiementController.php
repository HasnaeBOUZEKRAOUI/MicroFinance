<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Echeance;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Employe;

class PaiementController extends Controller
{
    /**
     * Liste des paiements avec filtres dynamiques
     */
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with(['echeance.pret.demandeCredit.client.personne', 'employe.personne']);

        if ($request->filled('echeance_id')) {
            $query->where('echeance_id', $request->echeance_id);
        }

        if ($request->filled('mode_paiement')) {
            $query->where('mode_paiement', $request->mode_paiement);
        }

        if ($request->filled('date_debut') && $request->filled('date_fin')) {
            $query->whereBetween('date_paiement', [$request->date_debut, $request->date_fin]);
        }

        return response()->json($query->latest('date_paiement')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        try {
            if ($request->has('reference_transaction') && trim($request->reference_transaction) === '') {
                $request->merge(['reference_transaction' => null]);
            }

            $validated = $request->validate([
                'echeance_id'           => 'required|exists:echeances,id',
                'employe_id'            => 'required|exists:employes,id',
                'date_paiement'         => 'required|date',
                'montant'               => 'required|numeric|min:0.01',
                'mode_paiement'         => 'required|in:ESPECES,VIREMENT,CHEQUE,MOBILE_MONEY,PRELEVEMENT',
                'reference_transaction' => 'nullable|string|unique:paiements,reference_transaction',
                'observation'           => 'nullable|string|max:500',
            ]);

            // Récupérer l'employé pour obtenir son numéro de caisse dynamique
            $employe = Employe::findOrFail($validated['employe_id']);
            // Si l'employé n'a pas de caisse assignée, on définit une caisse par défaut ou celle de l'agent
            $numCaisseActive = $employe->num_caisse ?? 'CAISSE-GENERALE';

            $paiement = DB::transaction(function () use ($validated, $numCaisseActive) {

                // =========================
                // ECHEANCE
                // =========================
                $echeance = Echeance::findOrFail($validated['echeance_id']);

                // =========================
                // PAIEMENT
                // =========================
                $paiement = Paiement::create([
                    'echeance_id'           => $validated['echeance_id'],
                    'employe_id'            => $validated['employe_id'],
                    'date_paiement'         => $validated['date_paiement'],
                    'montant'               => $validated['montant'],
                    'mode_paiement'         => $validated['mode_paiement'],
                    'reference_transaction' => $validated['reference_transaction'] ?? null,
                    'observation'           => $validated['observation'] ?? null,
                    'est_valide'            => true
                ]);

                // =========================
                // UPDATE ECHEANCE
                // =========================
                $echeance->montant_paye = $echeance->paiements()
                    ->where('est_valide', true)
                    ->sum('montant');
            
                $total = $echeance->total_du + $echeance->penalites;
                
                if ($echeance->montant_paye >= $total) {
                    $echeance->statut = 'PAYEE';
                } elseif ($echeance->montant_paye > 0) {
                    $echeance->statut = 'PARTIELLEMENT_PAYEE';
                } else {
                    $echeance->statut = 'EN_ATTENTE';
                }
                
                $echeance->save();

                // =========================
                // MOUVEMENT CAISSE DYNAMIQUE
                // =========================
                MouvementCaisse::create([
                    'employe_id'     => $validated['employe_id'],
                    'num_caisse'     => $numCaisseActive, // Recueille le numéro dynamique de l'agent
                    'type_mouvement' => 'ENTREE',
                    'montant'        => $validated['montant'],
                    'libelle'        => 'Paiement échéance #' . $echeance->numero_echeance,
                    'reference_id'   => $paiement->id,
                ]);

                return $paiement;
            });

            return response()->json([
                'success' => true,
                'paiement' => $paiement
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => $e->getFile(),
                'trace'   => $e->getTraceAsString()
            ], 500);
        }
    }

    public function show(Paiement $paiement): JsonResponse
    {
        return response()->json($paiement->load(['echeance.pret', 'employe.personne']));
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        if (!$paiement->est_valide) {
            return response()->json(['message' => 'Ce paiement est déjà annulé.'], 422);
        }

        DB::transaction(function () use ($paiement) {
            $paiement->update(['est_valide' => false]);
            $paiement->delete();
        });

        return response()->json(['message' => 'Paiement annulé avec succès.']);
    }

    public function valider(Paiement $paiement): JsonResponse
    {
        DB::transaction(function () use ($paiement) {
            $paiement->update(['est_valide' => true]);
        });

        return response()->json([
            'message' => 'Paiement validé avec succès.',
            'paiement' => $paiement->load('echeance')
        ]);
    }
}