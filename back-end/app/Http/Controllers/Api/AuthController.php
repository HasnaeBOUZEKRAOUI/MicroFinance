<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
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
        return response()->json($request->user()->load('personne'));
    }
}
