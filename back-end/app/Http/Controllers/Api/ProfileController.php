<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementCaisse;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * GET /api/profile
     * Retourne le profil complet de l'employé connecté
     */
    public function show(Request $request): JsonResponse
    {
        $employe = $request->user()->load('personne', 'superviseur.personne');

        // Stats caisse
        $totalEntrees = MouvementCaisse::where('employe_id', $employe->id)
            ->where('type_mouvement', 'ENTREE')->sum('montant');
        $totalSorties = MouvementCaisse::where('employe_id', $employe->id)
            ->where('type_mouvement', 'SORTIE')->sum('montant');

        // Dernière activité
        $dernierMouvement = MouvementCaisse::where('employe_id', $employe->id)
            ->latest()->first();

        // Stats globales
        $nbPaiements = Paiement::where('employe_id', $employe->id)
            ->where('est_valide', true)->count();
        $montantTotalEncaisse = Paiement::where('employe_id', $employe->id)
            ->where('est_valide', true)->sum('montant');

        // Historique des 10 derniers mouvements
        $historique = MouvementCaisse::where('employe_id', $employe->id)
            ->latest()->take(10)->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'date'       => $m->created_at->format('d/m/Y H:i'),
                'type'       => $m->type_mouvement,
                'montant'    => $m->montant,
                'libelle'    => $m->libelle,
                'num_caisse' => $m->num_caisse,
            ]);

        return response()->json([
            'id'               => $employe->id,
            'nom_utilisateur'  => $employe->nom_utilisateur,
            'role'             => $employe->role,
            'date_embauche'    => $employe->date_embauche,
            'num_caisse'       => $employe->num_caisse ?? 'N/A',
            'photo'            => $employe->photo ?? null,
            'superviseur'      => $employe->superviseur ? [
                'nom_complet' => $employe->superviseur->personne?->prenom . ' ' . $employe->superviseur->personne?->nom,
                'role'        => $employe->superviseur->role,
            ] : null,
            'personne' => [
                'prenom'         => $employe->personne?->prenom,
                'nom'            => $employe->personne?->nom,
                'email'          => $employe->personne?->email,
                'telephone'      => $employe->personne?->telephone,
                'date_naissance' => $employe->personne?->date_naissance,
            ],
            'stats' => [
                'solde_caisse'          => $totalEntrees - $totalSorties,
                'total_entrees'         => $totalEntrees,
                'total_sorties'         => $totalSorties,
                'nb_paiements'          => $nbPaiements,
                'montant_total_encaisse' => $montantTotalEncaisse,
            ],
            'historique' => $historique,
        ]);
    }

    /**
     * PUT /api/profile
     * Modifier les infos personnelles
     */
    public function update(Request $request): JsonResponse
    {
        $employe = $request->user()->load('personne');

        $validated = $request->validate([
            'prenom'         => 'required|string|max:100',
            'nom'            => 'required|string|max:100',
            'email'          => 'nullable|email|max:150',
            'telephone'      => 'nullable|string|max:20',
            'date_naissance' => 'nullable|date',
            'nom_utilisateur'=> 'required|string|max:50|unique:employes,nom_utilisateur,' . $employe->id,
        ]);

        // Mise à jour de la personne
        $employe->personne->update([
            'prenom'         => $validated['prenom'],
            'nom'            => $validated['nom'],
            'email'          => $validated['email'] ?? $employe->personne->email,
            'telephone'      => $validated['telephone'] ?? $employe->personne->telephone,
            'date_naissance' => $validated['date_naissance'] ?? $employe->personne->date_naissance,
        ]);

        // Mise à jour nom_utilisateur
        $employe->update([
            'nom_utilisateur' => $validated['nom_utilisateur'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès.',
            'employe' => $employe->fresh()->load('personne'),
        ]);
    }

    /**
     * PUT /api/profile/password
     * Changer le mot de passe
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $employe = $request->user();

        $request->validate([
            'mot_de_passe_actuel' => 'required|string',
            'nouveau_mot_de_passe' => ['required', 'string', 'min:8', 'confirmed',
                Password::min(8)->letters()->numbers()
            ],
        ]);

        if (!Hash::check($request->mot_de_passe_actuel, $employe->mot_de_passe)) {
            return response()->json([
                'success' => false,
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        $employe->update([
            'mot_de_passe' => Hash::make($request->nouveau_mot_de_passe),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }

    /**
     * POST /api/profile/photo
     * Upload photo de profil
     */
    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $employe = $request->user();

        // Supprime l'ancienne photo si elle existe
        if ($employe->photo && Storage::disk('public')->exists($employe->photo)) {
            Storage::disk('public')->delete($employe->photo);
        }

        $path = $request->file('photo')->store('photos/employes', 'public');

        $employe->update(['photo' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Photo mise à jour avec succès.',
            'photo_url' => Storage::url($path),
        ]);
    }
}