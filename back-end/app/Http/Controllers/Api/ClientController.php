<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::with(['personne', 'employe']);

        if ($request->filled('sur_liste_noire')) {
            $query->where('est_sur_liste_noire', filter_var($request->sur_liste_noire, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('employe_id')) {
            $query->where('employe_id', $request->employe_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('personne', fn($q) =>
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            )->orWhere('numero_piece_identite', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'personne_id'           => 'required|exists:personnes,id',
            'employe_id'            => 'nullable|exists:employes,id',
            'type_piece_identite'   => 'required|string|max:50',
            'numero_piece_identite' => 'required|string|unique:clients,numero_piece_identite',
            'date_expiration_piece' => 'nullable|date',
            'nationalite'           => 'required|string|max:100',
            'revenu_mensuel'        => 'required|numeric|min:0',
            'score_eligibilite'     => 'nullable|numeric|min:0|max:100',
        ]);

        $client = Client::create($validated);

        return response()->json($client->load('personne', 'employe'), 201);
    }

    public function show(Client $client): JsonResponse
    {
        $client->load(['personne', 'employe', 'comptes', 'demandeCredits']);

        return response()->json($client);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'employe_id'            => 'nullable|exists:employes,id',
            'type_piece_identite'   => 'sometimes|string|max:50',
            'numero_piece_identite' => "sometimes|string|unique:clients,numero_piece_identite,{$client->id}",
            'date_expiration_piece' => 'nullable|date',
            'nationalite'           => 'sometimes|string|max:100',
            'revenu_mensuel'        => 'sometimes|numeric|min:0',
            'score_eligibilite'     => 'nullable|numeric|min:0|max:100',
            'est_sur_liste_noire'   => 'sometimes|boolean',
        ]);

        $client->update($validated);

        return response()->json($client->load('personne'));
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(['message' => 'Client supprimé avec succès.']);
    }

    /** Historique complet des prêts d'un client */
    public function historiquePrets(Client $client): JsonResponse
    {
        $prets = $client->obtenirHistoriquePrets();

        return response()->json($prets);
    }

    /** Vérifier si un client est sur liste noire */
    public function blacklist(Client $client): JsonResponse
    {
        return response()->json([
            'client_id'           => $client->id,
            'est_sur_liste_noire' => $client->verifierBlacklist(),
        ]);
    }

    /** Comptes bancaires d'un client */
    public function comptes(Client $client): JsonResponse
    {
        return response()->json($client->comptes()->get());
    }
}
