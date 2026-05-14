<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\Pret;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AlerteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Alerte::with(['pret.demandeCredit.client.personne', 'acquittePar.personne']);

        if ($request->filled('niveau_gravite')) {
            $query->where('niveau_gravite', $request->niveau_gravite);
        }

        if ($request->filled('acquittee')) {
            $query->where('est_acquittee', filter_var($request->acquittee, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('pret_id')) {
            $query->where('pret_id', $request->pret_id);
        }

        return response()->json($query->latest('date_alerte')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pret_id'       => 'required|exists:prets,id',
            'message'       => 'required|string|max:500',
            'niveau_gravite'=> 'required|in:INFO,AVERTISSEMENT,CRITIQUE,URGENCE',
        ]);

        $alerte = Alerte::create(array_merge($validated, [
            'date_alerte'  => now(),
            'est_acquittee'=> false,
        ]));

        return response()->json($alerte->load('pret'), 201);
    }

    public function show(Alerte $alerte): JsonResponse
    {
        return response()->json($alerte->load(['pret.demandeCredit.client.personne', 'acquittePar.personne']));
    }

    public function destroy(Alerte $alerte): JsonResponse
    {
        $alerte->delete();

        return response()->json(['message' => 'Alerte supprimée avec succès.']);
    }

    /** Acquitter une alerte */
    public function acquitter(Request $request, Alerte $alerte): JsonResponse
    {
        if ($alerte->est_acquittee) {
            return response()->json(['message' => 'Cette alerte est déjà acquittée.'], 422);
        }

        $validated = $request->validate([
            'employe_id' => 'required|exists:employes,id',
        ]);

        $employe = Employe::findOrFail($validated['employe_id']);
        $alerte->acquitterAlerte($employe);

        return response()->json([
            'message' => 'Alerte acquittée avec succès.',
            'alerte'  => $alerte->fresh()->load('acquittePar.personne'),
        ]);
    }

    /** Alertes non acquittées d'un prêt */
    public function parPret(Pret $pret): JsonResponse
    {
        $alertes = $pret->alertes()
            ->where('est_acquittee', false)
            ->orderByRaw("FIELD(niveau_gravite, 'URGENCE','CRITIQUE','AVERTISSEMENT','INFO')")
            ->get();

        return response()->json($alertes);
    }
}
