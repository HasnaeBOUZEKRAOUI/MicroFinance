<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProspectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prospect::with(['personne', 'employe']);

        if ($request->filled('statut')) {
            $query->where('statut_prospect', $request->statut);
        }

        if ($request->filled('employe_id')) {
            $query->where('employe_id', $request->employe_id);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Données Personne
            'prenom'               => 'required|string|max:100',
            'nom'                  => 'required|string|max:100',
            'date_naissance'       => 'required|date|before:today',
            'email'                => 'required|email|unique:personnes,email',
            'telephone'            => 'nullable|string|max:20',
            // Données Prospect
            'employe_id'           => 'nullable|exists:employes,id',
            'statut_prospect'      => 'required|in:NOUVEAU,EN_COURS,CONVERTI,REJETE,INACTIF',
            'source_prospect'      => 'nullable|string|max:100',
            'montant_pret_estime'  => 'nullable|numeric|min:0',
        ]);

        $personne = Personne::create([
            'prenom'         => $validated['prenom'],
            'nom'            => $validated['nom'],
            'date_naissance' => $validated['date_naissance'],
            'email'          => $validated['email'],
            'telephone'      => $validated['telephone'] ?? null,
            'date_creation'  => now()->toDateString(),
        ]);

        $prospect = Prospect::create([
            'personne_id'         => $personne->id,
            'employe_id'          => $validated['employe_id'] ?? null,
            'statut_prospect'     => $validated['statut_prospect'],
            'source_prospect'     => $validated['source_prospect'] ?? null,
            'montant_pret_estime' => $validated['montant_pret_estime'] ?? null,
        ]);

        return response()->json($prospect->load('personne', 'employe'), 201);
    }

    public function show(Prospect $prospect): JsonResponse
    {
        return response()->json($prospect->load(['personne', 'employe']));
    }

    public function update(Request $request, Prospect $prospect): JsonResponse
    {
        $validated = $request->validate([
            'employe_id'          => 'nullable|exists:employes,id',
            'statut_prospect'     => 'sometimes|in:NOUVEAU,EN_COURS,CONVERTI,REJETE,INACTIF',
            'source_prospect'     => 'nullable|string|max:100',
            'montant_pret_estime' => 'nullable|numeric|min:0',
        ]);

        $prospect->update($validated);

        return response()->json($prospect->load('personne', 'employe'));
    }

    public function destroy(Prospect $prospect): JsonResponse
    {
        $prospect->delete();

        return response()->json(['message' => 'Prospect supprimé avec succès.']);
    }

    /**
     * Convertit un prospect en client.
     */
    public function convertir(Request $request, Prospect $prospect): JsonResponse
    {
        if ($prospect->statut_prospect === 'CONVERTI') {
            return response()->json(['message' => 'Ce prospect est déjà converti en client.'], 422);
        }

        $validated = $request->validate([
            'type_piece_identite'   => 'required|string',
            'numero_piece_identite' => 'required|string|unique:clients,numero_piece_identite',
            'date_expiration_piece' => 'nullable|date|after:today',
            'nationalite'           => 'required|string|max:100',
            'revenu_mensuel'        => 'required|numeric|min:0',
        ]);

        $client = $prospect->convertirEnClient($validated);

        return response()->json([
            'message' => 'Prospect converti en client avec succès.',
            'client'  => $client->load('personne'),
        ]);
    }
}
