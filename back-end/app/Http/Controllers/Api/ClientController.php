<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientLien;
use App\Models\ClientDocument;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Personne;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    // ═══════════════════════════════════════════════════════════
    // CRUD principal
    // ═══════════════════════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $query = Client::with(['personne', 'employe']);

        if ($request->filled('sur_liste_noire')) {
            $query->where('est_sur_liste_noire', filter_var($request->sur_liste_noire, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('employe_id'))   $query->where('employe_id', $request->employe_id);
        if ($request->filled('secteur'))       $query->where('secteur_activite', $request->secteur);
        if ($request->filled('est_vip'))       $query->where('est_vip', filter_var($request->est_vip, FILTER_VALIDATE_BOOLEAN));

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('nil', 'like', "%{$s}%")
                  ->orWhere('code_client', 'like', "%{$s}%")
                  ->orWhere('numero_piece_identite', 'like', "%{$s}%")
                  ->orWhereHas('personne', fn($p) =>
                      $p->where('nom', 'like', "%{$s}%")
                        ->orWhere('prenom', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                  )
            );
        }

        return response()->json($query->paginate(20));
    }
    public function store(Request $request): JsonResponse
    {
        // 1. On ajoute la validation des champs appartenant à la table "personnes"
        $validated = $request->validate([
            // Champs obligatoires pour la table PERSONNES
            'nom'                     => 'required|string|max:100',
            'prenom'                  => 'required|string|max:100',
            'email'                   => 'required|email|unique:personnes,email',
            'telephone'               => 'nullable|string|max:20',
            'date_naissance'          => 'required|date',
    
            // Champs de la table CLIENTS
            'employe_id'              => 'required|exists:employes,id',
            'est_vip'                 => 'nullable|boolean',
            'type_piece_identite'     => 'required|string|max:50',
            'numero_piece_identite'   => 'required|string|unique:clients,numero_piece_identite',
            'date_expiration_piece'   => 'nullable|date',
            'categorie_client'        => 'nullable|string|max:100',
            'titre'                   => 'nullable|in:M.,Mme,Mlle,Dr,Pr',
            'fonction'                => 'nullable|string|max:100',
            'secteur_activite'        => 'nullable|string|max:100',
            'niveau_etude'            => 'nullable|string|max:100',
            'nom_mere'                => 'nullable|string|max:100',
            'genre'                   => 'nullable|in:HOMME,FEMME,AUTRE',
            'langue'                  => 'nullable|string|max:50',
            'pays_naissance'          => 'nullable|string|max:100',
            'ville_naissance'         => 'nullable|string|max:100',
            'situation_familiale'     => 'nullable|in:CELIBATAIRE,MARIE,DIVORCE,VEUF,UNION_LIBRE',
            'nombre_enfants'          => 'nullable|integer|min:0',
            'nom_conjoint'            => 'nullable|string|max:100',
            'prenom_conjoint'         => 'nullable|string|max:100',
            'telephone_secondaire'    => 'nullable|string|max:20',
            'email_client'            => 'nullable|email',
            'code_postal'             => 'nullable|string|max:20',
            'adresse_1'               => 'nullable|string|max:255',
            'adresse_2'               => 'nullable|string|max:255',
            'ville'                   => 'nullable|string|max:100',
            'pays'                    => 'nullable|string|max:100',
            'coordonnees_gps'         => 'nullable|string|max:50',
            'nationalite'             => 'required|string|max:100',
            'revenu_mensuel'          => 'required|numeric|min:0',
            'score_eligibilite'       => 'nullable|numeric|min:0|max:100',
        ]);
    
        try {
            // 2. Utilisation d'une transaction pour la sécurité des données
            $client = DB::transaction(function () use ($request, $validated) {
                
                // 3. Création de l'entrée dans la table "personnes"
                $personne = Personne::create([
                    'nom'            => $validated['nom'],
                    'prenom'         => $validated['prenom'],
                    'email'          => $validated['email'],
                    'telephone'      => $validated['telephone'],
                    'date_naissance' => $validated['date_naissance'],
                    'date_creation'  => now(),
                ]);
    
                // 4. Préparation des données pour le Client
                // On récupère toutes les données validées
                $clientData = $validated;
                
                // On injecte l'ID de la personne créée
                $clientData['personne_id'] = $personne->id;
                
                // Génération d'un code client unique
                $clientData['code_client'] = 'CLT-' . strtoupper(Str::random(8));
    
                // 5. Création du Client
                return Client::create($clientData);
            });
    
            // 6. Retourner le client avec ses relations
            return response()->json($client->load('personne', 'employe'), 201);
    
        } catch (\Exception $e) {
            // En cas d'erreur, Laravel annulera automatiquement la création de la personne (Rollback)
            return response()->json([
                'message' => 'Erreur lors de la création du client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Client $client): JsonResponse
    {
        $client->load([
            'personne', 'employe', 'comptes',
            'demandeCredits', 'liens.clientLie.personne',
            'documents.ajoutePar.personne',
        ]);
        return response()->json($client);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'employe_id'              => 'nullable|exists:employes,id',
            'nil'                     => "sometimes|string|unique:clients,nil,{$client->id}",
            'est_vip'                 => 'nullable|boolean',
            'type_piece_identite'     => 'sometimes|string|max:50',
            'numero_piece_identite'   => "sometimes|string|unique:clients,numero_piece_identite,{$client->id}",
            'date_expiration_piece'   => 'nullable|date',
            'categorie_client'        => 'nullable|string|max:100',
            'titre'                   => 'nullable|in:M.,Mme,Mlle,Dr,Pr',
            'fonction'                => 'nullable|string|max:100',
            'secteur_activite'        => 'nullable|string|max:100',
            'niveau_etude'            => 'nullable|string|max:100',
            'nom_mere'                => 'nullable|string|max:100',
            'genre'                   => 'nullable|in:HOMME,FEMME,AUTRE',
            'langue'                  => 'nullable|string|max:50',
            'pays_naissance'          => 'nullable|string|max:100',
            'ville_naissance'         => 'nullable|string|max:100',
            'situation_familiale'     => 'nullable|in:CELIBATAIRE,MARIE,DIVORCE,VEUF,UNION_LIBRE',
            'nombre_enfants'          => 'nullable|integer|min:0',
            'nom_conjoint'            => 'nullable|string|max:100',
            'prenom_conjoint'         => 'nullable|string|max:100',
            'telephone_secondaire'    => 'nullable|string|max:20',
            'email_client'            => 'nullable|email',
            'code_postal'             => 'nullable|string|max:20',
            'adresse_1'               => 'nullable|string|max:255',
            'adresse_2'               => 'nullable|string|max:255',
            'ville'                   => 'nullable|string|max:100',
            'pays'                    => 'nullable|string|max:100',
            'coordonnees_gps'         => 'nullable|string|max:50',
            'nationalite'             => 'sometimes|string|max:100',
            'revenu_mensuel'          => 'sometimes|numeric|min:0',
            'score_eligibilite'       => 'nullable|numeric|min:0|max:100',
            'est_sur_liste_noire'     => 'sometimes|boolean',
        ]);

        $client->update($validated);
        return response()->json($client->load('personne'));
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();
        return response()->json(['message' => 'Client supprimé avec succès.']);
    }

    // ═══════════════════════════════════════════════════════════
    // PIN / Vérification NIL
    // ═══════════════════════════════════════════════════════════

    /** Génère et envoie un code PIN au client (simulation SMS) */
    public function genererPin(Client $client): JsonResponse
    {
        $pin = $client->genererPin();
        // TODO: intégrer ici l'envoi SMS réel (ex: Twilio, OrangeSMS…)
        return response()->json([
            'message'        => 'Code PIN généré et envoyé par SMS.',
            'pin_debug'      => config('app.debug') ? $pin : null, // visible seulement en dev
        ]);
    }

    /** Le client communique son PIN à l'agent pour vérification */
    public function verifierPin(Request $request, Client $client): JsonResponse
    {
        $request->validate(['code_pin' => 'required|string']);

        if ($client->verifierPin($request->code_pin)) {
            return response()->json(['verifie' => true, 'message' => 'PIN vérifié avec succès.']);
        }
        return response()->json(['verifie' => false, 'message' => 'Code PIN incorrect.'], 422);
    }

    // ═══════════════════════════════════════════════════════════
    // Liens (onglet "Lien")
    // ═══════════════════════════════════════════════════════════

    public function liens(Client $client): JsonResponse
    {
        return response()->json($client->liens()->with('clientLie.personne')->get());
    }

    public function ajouterLien(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'client_lie_id'       => 'nullable|exists:clients,id',
            'type_lien'           => 'required|in:AMI,FAMILLE,GARANT,MANDATAIRE,CONTACT_URGENCE,CONJOINT,AUTRE',
            'nom'                 => 'nullable|string|max:100',
            'prenom'              => 'nullable|string|max:100',
            'date_naissance'      => 'nullable|date',
            'cin'                 => 'nullable|string|max:50',
            'date_expiration_cin' => 'nullable|date',
            'pays_naissance'      => 'nullable|string|max:100',
            'ville_naissance'     => 'nullable|string|max:100',
            'gsm'                 => 'nullable|string|max:20',
            'adresse'             => 'nullable|string',
            'ayant_droit'         => 'nullable|boolean',
        ]);

        if (empty($validated['client_lie_id']) && empty($validated['nom'])) {
            return response()->json(['message' => 'Fournissez un client existant ou les informations du nouveau lien.'], 422);
        }

        $lien = $client->liens()->create($validated);
        return response()->json($lien->load('clientLie.personne'), 201);
    }

    public function supprimerLien(Client $client, ClientLien $lien): JsonResponse
    {
        abort_if($lien->client_id !== $client->id, 403);
        $lien->delete();
        return response()->json(['message' => 'Lien supprimé.']);
    }

    // ═══════════════════════════════════════════════════════════
    // GED Documents (onglet "GED")
    // ═══════════════════════════════════════════════════════════

    public function documents(Client $client): JsonResponse
    {
        return response()->json($client->documents()->with('ajoutePar.personne')->get());
    }

    public function ajouterDocument(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'intitule'   => 'required|string|max:200',
            'fichier'    => 'required|file|max:10240', // 10 Mo max
            'ajoute_par' => 'nullable|exists:employes,id',
        ]);

        $chemin   = $request->file('fichier')->store("clients/{$client->id}/documents", 'local');
        $document = $client->documents()->create([
            'intitule'      => $validated['intitule'],
            'chemin_fichier'=> $chemin,
            'type_mime'     => $request->file('fichier')->getMimeType(),
            'taille_octets' => $request->file('fichier')->getSize(),
            'ajoute_par'    => $validated['ajoute_par'] ?? null,
        ]);

        return response()->json($document, 201);
    }

    public function supprimerDocument(Client $client, ClientDocument $document): JsonResponse
    {
        abort_if($document->client_id !== $client->id, 403);
        Storage::disk('local')->delete($document->chemin_fichier);
        $document->delete();
        return response()->json(['message' => 'Document supprimé.']);
    }

    // ═══════════════════════════════════════════════════════════
    // Autres endpoints existants
    // ═══════════════════════════════════════════════════════════

    public function historiquePrets(Client $client): JsonResponse
    {
        return response()->json($client->obtenirHistoriquePrets());
    }

    public function blacklist(Client $client): JsonResponse
    {
        return response()->json([
            'client_id'           => $client->id,
            'est_sur_liste_noire' => $client->verifierBlacklist(),
        ]);
    }

    public function comptes(Client $client): JsonResponse
    {
        return response()->json($client->comptes()->get());
    }

    // Upload photos CIN / portrait
    public function uploadPhoto(Request $request, Client $client): JsonResponse
    {
        $request->validate([
            'type'   => 'required|in:recto,verso,portrait,consentement',
            'fichier'=> 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $fieldMap = [
            'recto'        => 'photo_cin_recto',
            'verso'        => 'photo_cin_verso',
            'portrait'     => 'photo_portrait',
            'consentement' => 'fichier_consentement',
        ];

        $field  = $fieldMap[$request->type];
        $chemin = $request->file('fichier')->store("clients/{$client->id}/photos", 'local');
        $client->update([$field => $chemin]);

        return response()->json(['message' => 'Fichier uploadé.', 'chemin' => $chemin]);
    }
}