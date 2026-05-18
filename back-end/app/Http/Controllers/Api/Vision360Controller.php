<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Client;
use App\Models\DemandeCredit;
use App\Models\Pret;
use Illuminate\Support\Facades\DB;

class Vision360Controller extends Controller
{
    public function getClientProfile(Request $request): JsonResponse
    {
        try {
            // Détection de la présence de filtres de recherche
            $hasFilters = $request->filled('nil') || $request->filled('nom') || $request->filled('prenom');

            if ($hasFilters) {
                // ── 1. MODE FILTRÉ : Recherche d'un client spécifique ──
                $query = Client::join('personnes', 'clients.personne_id', '=', 'personnes.id');

                if ($request->filled('nil')) {
                    $query->where('clients.nil', $request->nil);
                }
                if ($request->filled('nom')) {
                    $query->where('personnes.nom', 'like', '%' . $request->nom . '%');
                }
                if ($request->filled('prenom')) {
                    $query->where('personnes.prenom', 'like', '%' . $request->prenom . '%');
                }

                $client = $query->select('clients.id', 'clients.nil', 'personnes.nom', 'personnes.prenom', 'personnes.telephone')->first();

                // Si aucun client ne correspond aux critères saisis
                if (!$client) {
                    return response()->json($this->emptyResponse());
                }

                // Récupération des comptes du client (avec vos vraies colonnes)
                $comptes = DB::table('comptes')
                    ->where('client_id', $client->id)
                    ->get(['type_compte', 'numero_compte as code', 'solde_actuel as solde']);

                // Récupération des demandes de crédit
                $demandes = DB::table('demande_credits')
                    ->where('client_id', $client->id)
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'date_soumission as date_demande', 'statut_demande as statut', 'montant_demande as montant']);

                // Récupération des prêts actifs (en passant par la jointure demande_credits)
                $pretsActifs = DB::table('prets')
                    ->join('demande_credits', 'prets.demande_credit_id', '=', 'demande_credits.id')
                    ->where('demande_credits.client_id', $client->id)
                    ->where('prets.statut_pret', 'EN_COURS')
                    ->get(['prets.id as code', 'prets.date_debut as date_octroi', 'prets.montant_accorde', 'prets.capital_restant as montant_restant']);

                // Récupération des échéances en retard
                $echeances = DB::table('echeances')
                    ->join('prets', 'echeances.pret_id', '=', 'prets.id')
                    ->join('demande_credits', 'prets.demande_credit_id', '=', 'demande_credits.id')
                    ->where('demande_credits.client_id', $client->id)
                    ->whereIn('echeances.statut', ['EN_RETARD', 'EN_ATTENTE', 'PARTIELLEMENT_PAYEE'])
                    ->where('echeances.date_echeance', '<', now())
                    ->get([
                        'prets.reference as pret_code',
                        'echeances.date_echeance',
                        DB::raw('DATEDIFF(NOW(), echeances.date_echeance) as jours_retard'),
                        DB::raw('(echeances.total_du - echeances.montant_paye) as montant')
                    ]);

                return response()->json([
                    'infoClient'  => $client,
                    'comptes'     => $comptes,
                    'demandes'    => $demandes,
                    'pretsActifs' => $pretsActifs,
                    'echeances'   => $echeances
                ], 200);

            } else {
                // ── 2. MODE PAR DÉFAUT : Remplissage global initial depuis la DB ──
                
                $comptes = DB::table('comptes')
                    ->orderBy('created_at', 'desc')
                    ->limit(25)
                    ->get(['type_compte', 'numero_compte as code', 'solde_actuel as solde']);

                $demandes = DB::table('demande_credits')
                    ->orderBy('created_at', 'desc')
                    ->limit(25)
                    ->get(['id', 'date_soumission as date_demande', 'statut_demande as statut', 'montant_demande as montant']);

                $pretsActifs = DB::table('prets')
                    ->where('statut_pret', 'EN_COURS')
                    ->orderBy('created_at', 'desc')
                    ->limit(25)
                    ->get(['id as code', 'date_debut as date_octroi', 'montant_accorde', 'capital_restant as montant_restant']);

                $echeances = DB::table('echeances')
                    ->join('prets', 'echeances.pret_id', '=', 'prets.id')
                    ->whereIn('echeances.statut', ['EN_RETARD', 'EN_ATTENTE', 'PARTIELLEMENT_PAYEE'])
                    ->where('echeances.date_echeance', '<', now())
                    ->orderBy('echeances.date_echeance', 'asc')
                    ->limit(25)
                    ->get([
                        'prets.reference as pret_code',
                        'echeances.date_echeance',
                        'echeances.jours_retard',
                        DB::raw('(echeances.total_du - echeances.montant_paye) as montant')
                    ]);

                return response()->json([
                    'infoClient'  => null, // Aucun en-tête client particulier en mode global
                    'comptes'     => $comptes,
                    'demandes'    => $demandes,
                    'pretsActifs' => $pretsActifs,
                    'echeances'   => $echeances
                ], 200);
            }

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du profil 360.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function emptyResponse(): array
    {
        return [
            'infoClient'  => null,
            'comptes'     => [],
            'demandes'    => [],
            'pretsActifs' => [],
            'echeances'   => []
        ];
    }
}