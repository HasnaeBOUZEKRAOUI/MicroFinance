<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class Vision360Controller extends Controller
{
    // =========================================================
    // LISTE / SEARCH / DASHBOARD
    // =========================================================

    public function index(Request $request): JsonResponse
    {
        return $this->getClientProfile($request);
    }

    public function search(Request $request): JsonResponse
    {
        return $this->getClientProfile($request);
    }

    // =========================================================
    // SHOW CLIENT (SECURISÉ PAR AGENT)
    // =========================================================

    public function show(Request $request, $id): JsonResponse
    {
        $employeId = auth()->id();

        $client = DB::table('clients')
            ->join('personnes', 'clients.personne_id', '=', 'personnes.id')
            ->where('clients.id', $id)
            ->where('clients.employe_id', $employeId) // 🔒 sécurité agent
            ->select(
                'clients.id',
                'clients.nil',
                'clients.code_client',
                'clients.est_vip',
                'clients.score_eligibilite',
                'clients.revenu_mensuel',
                'clients.est_sur_liste_noire',
                'personnes.nom',
                'personnes.prenom',
                'personnes.telephone',
                'personnes.email'
            )
            ->first();

        if (!$client) {
            return response()->json(['message' => 'Client introuvable.'], 404);
        }

        return response()->json([
            'infoClient'  => $client,
            'demandes'    => $this->getDemandes($client->id),
            'pretsActifs' => $this->getPretsActifs($client->id),
            'echeances'   => $this->getEcheances($client->id),
        ]);
    }

    // =========================================================
    // CORE PROFILE LOGIC
    // =========================================================

    private function getClientProfile(Request $request): JsonResponse
    {
        try {
            $employeId = auth()->id();

            $hasFilters =
                $request->filled('nil') ||
                $request->filled('nom') ||
                $request->filled('prenom') ||
                $request->filled('search');

            // =====================================================
            // MODE FILTRE / SEARCH
            // =====================================================
            if ($hasFilters) {

                $query = DB::table('clients')
                    ->join('personnes', 'clients.personne_id', '=', 'personnes.id')
                    ->where('clients.employe_id', $employeId); // 🔒 filtre agent

                if ($request->filled('nil')) {
                    $query->where('clients.nil', $request->nil);
                }

                if ($request->filled('nom')) {
                    $query->where('personnes.nom', 'like', '%' . $request->nom . '%');
                }

                if ($request->filled('prenom')) {
                    $query->where('personnes.prenom', 'like', '%' . $request->prenom . '%');
                }

                if ($request->filled('search')) {
                    $s = $request->search;

                    $query->where(function ($q) use ($s) {
                        $q->where('clients.nil', 'like', "%{$s}%")
                          ->orWhere('clients.code_client', 'like', "%{$s}%")
                          ->orWhere('personnes.nom', 'like', "%{$s}%")
                          ->orWhere('personnes.prenom', 'like', "%{$s}%");
                    });
                }

                $client = $query->select(
                    'clients.id',
                    'clients.nil',
                    'clients.code_client',
                    'clients.est_vip',
                    'clients.score_eligibilite',
                    'clients.revenu_mensuel',
                    'clients.est_sur_liste_noire',
                    'personnes.nom',
                    'personnes.prenom',
                    'personnes.telephone',
                    'personnes.email'
                )->first();

                if (!$client) {
                    return response()->json($this->emptyResponse());
                }

                return response()->json([
                    'infoClient'  => $client,
                    'demandes'    => $this->getDemandes($client->id),
                    'pretsActifs' => $this->getPretsActifs($client->id),
                    'echeances'   => $this->getEcheances($client->id),
                ]);
            }

            // =====================================================
            // MODE GLOBAL (DASHBOARD AGENT)
            // =====================================================
            return response()->json([
                'infoClient'  => null,
                'demandes'    => $this->getDemandes(null, 25),
                'pretsActifs' => $this->getPretsActifs(null, 25),
                'echeances'   => $this->getEcheances(null, 25),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur Vision360',
                'error'   => $e->getMessage(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

    // =========================================================
    // DEMANDES
    // =========================================================

    private function getDemandes(?int $clientId, int $limit = 100): array
    {
        $query = DB::table('demande_credits')
            ->select(
                'id',
                'date_soumission as date_demande',
                'statut_demande as statut',
                'montant_demande as montant',
                'objet_pret',
                'duree_demandee'
            );

        if ($clientId) {
            $query->where('client_id', $clientId)
                  ->orderBy('date_soumission', 'desc');
        } else {
            $query->orderBy('date_soumission', 'desc')
                  ->limit($limit);
        }

        return $query->get()->toArray();
    }

    // =========================================================
    // PRETS
    // =========================================================

    private function getPretsActifs(?int $clientId, int $limit = 100): array
    {
        $query = DB::table('prets')
            ->leftJoin('demande_credits', 'prets.demande_credit_id', '=', 'demande_credits.id')
            ->select(
                'prets.id',
                'prets.reference as code',
                'prets.date_debut as date_octroi',
                'prets.date_fin',
                'prets.montant_accorde',
                'prets.capital_restant as montant_restant',
                'prets.taux_interet',
                'prets.statut_pret as statut',
                'demande_credits.client_id'
            );

        if ($clientId) {
            $query->where('demande_credits.client_id', $clientId)
                  ->whereIn('prets.statut_pret', ['EN_COURS', 'EN_RETARD', 'EN_CONTENTIEUX'])
                  ->orderBy('prets.date_debut', 'desc');
        } else {
            $query->whereIn('prets.statut_pret', ['EN_COURS', 'EN_RETARD'])
                  ->orderBy('prets.date_debut', 'desc')
                  ->limit($limit);
        }

        return $query->get()->toArray();
    }

    // =========================================================
    // ECHEANCES
    // =========================================================

    private function getEcheances(?int $clientId, int $limit = 100): array
    {
        $query = DB::table('echeances')
            ->join('prets', 'echeances.pret_id', '=', 'prets.id')
            ->leftJoin('demande_credits', 'prets.demande_credit_id', '=', 'demande_credits.id')
            ->select(
                'echeances.id',
                'prets.reference as pret_code',
                'echeances.numero_echeance',
                'echeances.date_echeance',
                'echeances.total_du',
                'echeances.montant_paye',
                'echeances.jours_retard',
                'echeances.penalites',
                'echeances.statut',
                DB::raw('(echeances.total_du - echeances.montant_paye) as montant_restant'),
                DB::raw('DATEDIFF(NOW(), echeances.date_echeance) as jours_retard_reel')
            );

        if ($clientId) {
            $query->where('demande_credits.client_id', $clientId)
                  ->orderBy('echeances.date_echeance', 'asc');
        } else {
            $query->whereIn('echeances.statut', ['EN_RETARD', 'EN_ATTENTE', 'PARTIELLEMENT_PAYEE'])
                  ->where('echeances.date_echeance', '<', now())
                  ->orderBy('echeances.date_echeance', 'asc')
                  ->limit($limit);
        }

        return $query->get()->toArray();
    }

    // =========================================================
    // EMPTY RESPONSE
    // =========================================================

    private function emptyResponse(): array
    {
        return [
            'infoClient'  => null,
            'demandes'    => [],
            'pretsActifs' => [],
            'echeances'   => [],
        ];
    }
}