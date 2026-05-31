<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class AssistantController extends Controller
{
    // Seuils de décision
    const RATIO_ENDETTEMENT_MAX = 40;
    const SCORE_MIN_APPROBATION = 50;

    // ════════════════════════════════════════════════════════════
    //  POST /api/assistant/analyser/{demandeId}
    //  Analyse automatique initiale du dossier
    // ════════════════════════════════════════════════════════════
    public function analyser(Request $request, $demandeId): JsonResponse
    {
        try {
            $demande = DemandeCredit::with([
                'client.personne',
                'produitCredit',
                'garant',
            ])->findOrFail($demandeId);
    
            $contexte = $this->buildContexte($demande);
    
            $reponse = $this->callGemini(
                systemPrompt: $contexte,
                userMessage: 'Analyse ce dossier de demande de crédit.',
                history: []
            );
    
            return response()->json(['message' => $reponse]);
    
        } catch (\Exception $e) {
            // ← Retourne l'erreur exacte au frontend pour déboguer
            return response()->json([
                'message' => 'Erreur : ' . $e->getMessage(),
                'trace'   => $e->getTraceAsString(), // retirez en production
            ], 500);
        }
    }
    
    public function chat(Request $request, $demandeId): JsonResponse
    {
        try {
            $request->validate([
                'message' => 'required|string|max:500',
                'history' => 'nullable|array',
            ]);
    
            $demande = DemandeCredit::with([
                'client.personne',
                'produitCredit',
                'garant',
            ])->findOrFail($demandeId);
    
            $reponse = $this->callGemini(
                systemPrompt: $this->buildContexte($demande),
                userMessage:  $request->message,
                history:      $request->history ?? []
            );
    
            return response()->json(['message' => $reponse]);
    
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur : ' . $e->getMessage(),
            ], 500);
        }
    }
    private function callGemini(string $systemPrompt, string $userMessage, array $history): string
    {
        $apiKey = config('services.gemini.key');
    
        $messages = [['role' => 'system', 'content' => $systemPrompt]];
    
        foreach ($history as $msg) {
            $messages[] = [
                'role'    => ($msg['role'] === 'model') ? 'assistant' : 'user',
                'content' => $msg['content'] ?? '',
            ];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];
    
        $response = Http::withOptions(['verify' => false, 'timeout' => 30])
            ->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type'  => 'application/json',
            ])
            ->post('https://openrouter.ai/api/v1/chat/completions', [
'model' => 'google/gemma-4-31b-it:free',
                'messages'   => $messages,
                'max_tokens' => 1000,
            ]);
    
        if ($response->failed()) {
            throw new \Exception("Erreur API : " . $response->body());
        }
    
        return $response->json('choices.0.message.content')
            ?? "Désolé, je n'ai pas pu analyser ce dossier.";
    }
    // ════════════════════════════════════════════════════════════
    //  HELPER — Construire le contexte du dossier
    // ════════════════════════════════════════════════════════════
    private function buildContexte(DemandeCredit $demande): string
    {
        $client   = $demande->client;
        $personne = $client?->personne;
        $garant   = $demande->garant;
        $produit  = $demande->produitCredit;

        // Calcul ratio endettement
        $mensualite    = $demande->duree_demandee > 0
            ? round($demande->montant_demande / $demande->duree_demandee, 2)
            : 0;

        $ratioEndettement = $client?->revenu_mensuel > 0
            ? round(($mensualite / $client->revenu_mensuel) * 100, 1)
            : null;

        // Historique prêts du client
        $nbPretsActifs = $client ? DB::table('prets')
            ->join('demande_credits', 'prets.demande_credit_id', '=', 'demande_credits.id')
            ->where('demande_credits.client_id', $client->id)
            ->whereIn('prets.statut_pret', ['EN_COURS', 'EN_RETARD'])
            ->count() : 0;

        $nbPretsRetard = $client ? DB::table('prets')
            ->join('demande_credits', 'prets.demande_credit_id', '=', 'demande_credits.id')
            ->where('demande_credits.client_id', $client->id)
            ->where('prets.statut_pret', 'EN_RETARD')
            ->count() : 0;

        return "
═══ DOSSIER DE DEMANDE DE CRÉDIT ═══

CLIENT
- Nom complet       : {$personne?->prenom} {$personne?->nom}
- Score éligibilité : " . ($client?->score_eligibilite ?? 'Non calculé') . "/100
- Revenu mensuel    : " . number_format($client?->revenu_mensuel ?? 0, 2, '.', ' ') . " MAD
- Secteur activité  : " . ($client?->secteur_activite ?? '—') . "
- Situation familiale: " . ($client?->situation_familiale ?? '—') . "
- Liste noire       : " . ($client?->est_sur_liste_noire ? '⚠️ OUI' : '✅ NON') . "
- Prêts actifs      : {$nbPretsActifs}
- Prêts en retard   : {$nbPretsRetard}

DEMANDE
- Montant demandé   : " . number_format($demande->montant_demande, 2, '.', ' ') . " MAD
- Durée             : {$demande->duree_demandee} mois
- Mensualité estimée: " . number_format($mensualite, 2, '.', ' ') . " MAD
- Ratio endettement : " . ($ratioEndettement ? "{$ratioEndettement}%" : 'Non calculable') . " (max " . self::RATIO_ENDETTEMENT_MAX . "%)
- Objet du prêt     : " . ($demande->objet_pret ?? '—') . "
- Garantie physique : " . ($demande->garantie ?? 'Aucune') . "

PRODUIT CRÉDIT
- Type              : " . ($produit?->type_produit ?? '—') . "
- Famille           : " . ($produit?->famille_produit ?? '—') . "
- Fourchette montant: " . number_format($produit?->montant_min ?? 0, 0, '.', ' ') . " – " . number_format($produit?->montant_max ?? 0, 0, '.', ' ') . " MAD
- Taux annuel       : " . (($produit?->taux_interet_min ?? 0) * 100) . "% – " . (($produit?->taux_interet_max ?? 0) * 100) . "%
- Mode calcul       : " . ($produit?->mode_calcul ?? '—') . "

GARANT
" . ($garant
    ? "- Nom             : {$garant->prenom} {$garant->nom}
- CIN            : {$garant->cin}
- Revenu mensuel : " . number_format($garant->revenu_mensuel, 2, '.', ' ') . " MAD
- Relation       : {$garant->relation_client}
- Employeur      : " . ($garant->employeur ?? '—')
    : "Aucun garant renseigné") . "

SEUILS DÉCISION
- Score minimum approbation : " . self::SCORE_MIN_APPROBATION . "/100
- Ratio endettement maximum : " . self::RATIO_ENDETTEMENT_MAX . "%
        ";
    }
}