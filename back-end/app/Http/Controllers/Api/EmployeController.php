<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class EmployeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employe::with(['personne', 'superviseur']);

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Données Personne
            'prenom'         => 'required|string|max:100',
            'nom'            => 'required|string|max:100',
            'date_naissance' => 'required|date|before:today',
            'email'          => 'required|email|unique:personnes,email',
            'telephone'      => 'nullable|string|max:20',
            // Données Employe
            'nom_utilisateur'=> 'required|string|unique:employes,nom_utilisateur',
            'mot_de_passe'   => 'required|string|min:8',
            'role'           => 'required|in:ADMIN,AGENT_CREDIT,CAISSIER,DIRECTEUR,SUPERVISEUR',
            'date_embauche'  => 'required|date',
            'superviseur_id' => 'nullable|exists:employes,id',
        ]);

        // Création de la Personne liée
        $personne = Personne::create([
            'prenom'         => $validated['prenom'],
            'nom'            => $validated['nom'],
            'date_naissance' => $validated['date_naissance'],
            'email'          => $validated['email'],
            'telephone'      => $validated['telephone'] ?? null,
            'date_creation'  => now()->toDateString(),
        ]);

        $employe = Employe::create([
            'personne_id'    => $personne->id,
            'nom_utilisateur'=> $validated['nom_utilisateur'],
            'mot_de_passe'   => Hash::make($validated['mot_de_passe']),
            'role'           => $validated['role'],
            'date_embauche'  => $validated['date_embauche'],
            'superviseur_id' => $validated['superviseur_id'] ?? null,
        ]);

        return response()->json($employe->load('personne', 'superviseur'), 201);
    }

    public function show(Employe $employe): JsonResponse
    {
        $employe->load(['personne', 'superviseur', 'subordonnes', 'clients']);

        return response()->json($employe);
    }

    public function update(Request $request, Employe $employe): JsonResponse
    {
        $validated = $request->validate([
            'nom_utilisateur'=> "sometimes|string|unique:employes,nom_utilisateur,{$employe->id}",
            'mot_de_passe'   => 'sometimes|string|min:8',
            'role'           => 'sometimes|in:ADMIN,AGENT_CREDIT,CAISSIER,DIRECTEUR,SUPERVISEUR',
            'date_embauche'  => 'sometimes|date',
            'superviseur_id' => 'nullable|exists:employes,id',
        ]);

        if (isset($validated['mot_de_passe'])) {
            $validated['mot_de_passe'] = Hash::make($validated['mot_de_passe']);
        }

        $employe->update($validated);

        return response()->json($employe->load('personne'));
    }

    public function destroy(Employe $employe): JsonResponse
    {
        $employe->delete();

        return response()->json(['message' => 'Employé supprimé avec succès.']);
    }

    /** Liste des clients gérés par un employé */
    public function clients(Employe $employe): JsonResponse
    {
        return response()->json($employe->clients()->with('personne')->paginate(20));
    }

    /** Liste des demandes de crédit traitées par un employé */
    public function demandeCredits(Employe $employe): JsonResponse
    {
        return response()->json($employe->demandeCredits()->with('client.personne')->paginate(20));
    }
}
