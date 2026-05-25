<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom_utilisateur' => 'required|string',
            'mot_de_passe'    => 'required|string',
        ]);

        $employe = Employe::with('personne')
            ->where('nom_utilisateur', $validated['nom_utilisateur'])
            ->first();

        if (!$employe || !Hash::check($validated['mot_de_passe'], $employe->mot_de_passe)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        $token = $employe->createToken('api-token')->plainTextToken;

        return response()->json([
            'employe' => $employe,
            'token'   => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

  
    public function me(Request $request): JsonResponse
{
    $employe = $request->user()->load('personne');

    // Dernière caisse utilisée
    $dernierMouvement = \App\Models\MouvementCaisse::where('employe_id', $employe->id)
        ->latest()
        ->first();

    // Calcul du solde caisse
    $totalEntrees = \App\Models\MouvementCaisse::where('employe_id', $employe->id)
        ->where('type_mouvement', 'ENTREE')
        ->sum('montant');

    $totalSorties = \App\Models\MouvementCaisse::where('employe_id', $employe->id)
        ->where('type_mouvement', 'SORTIE')
        ->sum('montant');

    $soldeCaisse = $totalEntrees - $totalSorties;

    return response()->json([
        ...$employe->toArray(),

        'num_caisse' => $dernierMouvement?->num_caisse ?? 'N/A',

        'montant_caisse' => $soldeCaisse
    ]);
}
}
