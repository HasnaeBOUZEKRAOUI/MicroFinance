<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementCaisse;
use App\Models\Paiement;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatistiquesController extends Controller
{
    /**
     * Dashboard global caisse — KPIs + stats agents + évolution journalière
     * GET /api/statistiques/caisse?date_debut=&date_fin=&employe_id=&num_caisse=
     */
    public function caisse(Request $request): JsonResponse
{
    try {
        $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
        $dateFin   = $request->get('date_fin',   now()->toDateString());
        $employeId = $request->get('employe_id') ?: null;
        $numCaisse = $request->get('num_caisse') ?: null;

        // ✅ Fonction helper au lieu de clone
        $base = fn() => MouvementCaisse::query()
        ->whereBetween(DB::raw('DATE(mouvements_caisse.created_at)'), [$dateDebut, $dateFin])
        ->when($employeId, fn($q) => $q->where('mouvements_caisse.employe_id', $employeId))
        ->when($numCaisse, fn($q) => $q->where('mouvements_caisse.num_caisse', $numCaisse));
        // KPIs
        $kpis = $base()->selectRaw("
            SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) as total_entrees,
            SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as total_sorties,
            SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE -montant END) as solde_net,
            COUNT(CASE WHEN type_mouvement = 'ENTREE' THEN 1 END) as nb_entrees,
            COUNT(CASE WHEN type_mouvement = 'SORTIE' THEN 1 END) as nb_sorties,
            COUNT(*) as nb_total_operations
        ")->first();

        // Stats par agent
        $parAgent = $base()
            ->join('employes', 'mouvements_caisse.employe_id', '=', 'employes.id')
            ->join('personnes', 'employes.personne_id', '=', 'personnes.id')
            ->selectRaw("
                mouvements_caisse.employe_id,
                CONCAT(personnes.prenom, ' ', personnes.nom) as nom_complet,
                employes.nom_utilisateur,
                employes.role,
                employes.num_caisse,
                SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) as total_encaisse,
                SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as total_decaisse,
                SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE -montant END) as solde_net,
                COUNT(CASE WHEN type_mouvement = 'ENTREE' THEN 1 END) as nb_encaissements,
                COUNT(CASE WHEN type_mouvement = 'SORTIE' THEN 1 END) as nb_decaissements,
                COUNT(*) as nb_operations,
                MAX(mouvements_caisse.created_at) as derniere_operation
            ")
            ->groupBy(
                'mouvements_caisse.employe_id',
                'personnes.prenom', 'personnes.nom',
                'employes.nom_utilisateur', 'employes.role', 'employes.num_caisse'
            )
            ->orderByDesc('total_encaisse')
            ->get();

        // Stats par caisse
        $parCaisse = $base()->selectRaw("
            mouvements_caisse.num_caisse,
            SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) as total_entrees,
            SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as total_sorties,
            SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE -montant END) as solde_net,
            COUNT(*) as nb_operations
        ")->groupBy('mouvements_caisse.num_caisse')->orderByDesc('solde_net')->get();

        // Évolution journalière
        $evolutionJournaliere = $base()->selectRaw("
    DATE(mouvements_caisse.created_at) as jour,
    SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) as entrees,
    SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as sorties,
    COUNT(*) as nb_operations
")->groupBy('jour')->orderBy('jour')->get();

        // Modes de paiement
        $parMode = Paiement::whereBetween('date_paiement', [$dateDebut, $dateFin])
            ->where('est_valide', true)
            ->when($employeId, fn($q) => $q->where('employe_id', $employeId))
            ->selectRaw("mode_paiement, COUNT(*) as nb, SUM(montant) as total")
            ->groupBy('mode_paiement')
            ->orderByDesc('total')
            ->get();

        // Derniers mouvements
        $derniersMouvements = $base()
            ->with(['employe.personne'])
            ->latest()
            ->take(20)
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'date'       => $m->created_at->format('d/m/Y H:i'),
                'type'       => $m->type_mouvement,
                'montant'    => $m->montant,
                'libelle'    => $m->libelle,
                'num_caisse' => $m->num_caisse,
                'agent'      => $m->employe?->personne
                    ? $m->employe->personne->prenom . ' ' . $m->employe->personne->nom
                    : $m->employe?->nom_utilisateur ?? '—',
            ]);

        return response()->json([
            'periode'               => ['debut' => $dateDebut, 'fin' => $dateFin],
            'kpis'                  => $kpis,
            'par_agent'             => $parAgent,
            'par_caisse'            => $parCaisse,
            'evolution_journaliere' => $evolutionJournaliere,
            'par_mode_paiement'     => $parMode,
            'top_agents'            => $parAgent->sortByDesc('nb_operations')->take(5)->values(),
            'derniers_mouvements'   => $derniersMouvements,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'message' => $e->getMessage(),
            'line'    => $e->getLine(),
            'file'    => $e->getFile(),
        ], 500);
    }
}
    /**
     * Détail complet d'un agent
     * GET /api/statistiques/agent/{id}?date_debut=&date_fin=
     */
    public function detailAgent(Request $request, int $id): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
        $dateFin   = $request->get('date_fin',   now()->toDateString());

        $employe = Employe::with('personne')->findOrFail($id);

        $mouvements = MouvementCaisse::where('employe_id', $id)
        ->whereBetween(DB::raw('DATE(mouvements_caisse.created_at)'), [$dateDebut, $dateFin])
        ->selectRaw("
                DATE(created_at) as jour,
                SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) as entrees,
                SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as sorties,
                COUNT(*) as nb_operations
            ")
            ->groupBy('jour')
            ->orderBy('jour')
            ->get();

        $paiements = Paiement::where('employe_id', $id)
            ->whereBetween('date_paiement', [$dateDebut, $dateFin])
            ->where('est_valide', true)
            ->selectRaw("
                mode_paiement,
                COUNT(*) as nb,
                SUM(montant) as total
            ")
            ->groupBy('mode_paiement')
            ->get();

        $totaux = MouvementCaisse::where('employe_id', $id)
            ->whereBetween(DB::raw('DATE(created_at)'), [$dateDebut, $dateFin])
            ->selectRaw("
                SUM(CASE WHEN type_mouvement = 'ENTREE' THEN montant ELSE 0 END) as total_encaisse,
                SUM(CASE WHEN type_mouvement = 'SORTIE' THEN montant ELSE 0 END) as total_decaisse,
                COUNT(*) as nb_operations
            ")
            ->first();

        return response()->json([
            'employe'    => $employe,
            'totaux'     => $totaux,
            'mouvements' => $mouvements,
            'paiements'  => $paiements,
        ]);
    }
}