<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PersonneController extends Controller
{
    public function index(): JsonResponse
    {
        $personnes = Personne::with(['employe', 'client', 'prospect'])
            ->paginate(20);

        return response()->json($personnes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prenom'          => 'required|string|max:100',
            'nom'             => 'required|string|max:100',
            'date_naissance'  => 'required|date|before:today',
            'email'           => 'required|email|unique:personnes,email',
            'telephone'       => 'nullable|string|max:20',
            'date_creation'   => 'nullable|date',
        ]);

        $validated['date_creation'] = $validated['date_creation'] ?? now()->toDateString();

        $personne = Personne::create($validated);

        return response()->json($personne, 201);
    }

    public function show(Personne $personne): JsonResponse
    {
        $personne->load(['employe', 'client', 'prospect']);

        return response()->json($personne);
    }

    public function update(Request $request, Personne $personne): JsonResponse
    {
        $validated = $request->validate([
            'prenom'         => 'sometimes|string|max:100',
            'nom'            => 'sometimes|string|max:100',
            'date_naissance' => 'sometimes|date|before:today',
            'email'          => "sometimes|email|unique:personnes,email,{$personne->id}",
            'telephone'      => 'nullable|string|max:20',
        ]);

        $personne->update($validated);

        return response()->json($personne);
    }

    public function destroy(Personne $personne): JsonResponse
    {
        $personne->delete();

        return response()->json(['message' => 'Personne supprimée avec succès.']);
    }
}
