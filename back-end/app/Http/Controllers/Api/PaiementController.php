<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Echeance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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

        // On n'affiche que les paiements valides par défaut dans l'index principal
        return response()->json($query->latest('date_paiement')->paginate(20));
    }

    /**
     * Enregistrer un nouveau paiement (Encaissement)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'echeance_id'           => 'required|exists:echeances,id',
            'employe_id'            => 'nullable|exists:employes,id',
            'date_paiement'         => 'required|date',
            'montant'               => 'required|numeric|min:0.01',
            'mode_paiement'         => 'required|in:ESPECES,VIREMENT,CHEQUE,MOBILE_MONEY,PRELEVEMENT',
            'reference_transaction' => 'nullable|string|unique:paiements,reference_transaction',
            'observation'           => 'nullable|string|max:500',
        ]);

        $paiement = DB::transaction(function () use ($validated) {
            // 🌟 LE HOOK Eloquent static::created() dans Paiement.php 
            // se charge d'exécuter automatiquement $this->synchroniserEcheance()
            return Paiement::create($validated);
        });

        return response()->json($paiement->load('echeance', 'employe.personne'), 201);
    }

    /**
     * Détails d'un paiement spécifique
     */
    public function show(Paiement $paiement): JsonResponse
    {
        return response()->json($paiement->load(['echeance.pret', 'employe.personne']));
    }

    /**
     * Annuler un paiement (via Soft Delete)
     */
    public function destroy(Paiement $paiement): JsonResponse
    {
        // Si le paiement est déjà annulé (soft-deleted) ou marqué invalide
        if (!$paiement->est_valide) {
            return response()->json(['message' => 'Ce paiement est déjà annulé.'], 422);
        }

        DB::transaction(function () use ($paiement) {
            // 1. On passe le flag de validité à faux
            $paiement->update(['est_valide' => false]);

            // 2. On applique le Soft Delete (génère la date dans deleted_at)
            // 🌟 LE HOOK static::deleted() va recalculer l'échéance à la baisse automatiquement !
            $paiement->delete();
        });

        return response()->json(['message' => 'Paiement annulé avec succès.']);
    }

    /**
     * Valider/Restaurer un paiement qui avait été invalidé (Optionnel)
     */
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