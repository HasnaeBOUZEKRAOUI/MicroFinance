<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\PersonneController;
use App\Http\Controllers\api\EmployeController;
use App\Http\Controllers\api\ClientController;
use App\Http\Controllers\api\ProduitCreditController;
use App\Http\Controllers\api\FraisController;
use App\Http\Controllers\api\DemandeCreditController;
use App\Http\Controllers\api\PretController;
use App\Http\Controllers\api\EcheanceController;
use App\Http\Controllers\api\PaiementController;
use App\Http\Controllers\api\DashboardController;
use App\Http\Controllers\api\Vision360Controller;
use App\Http\Controllers\api\StatistiquesController;
use App\Http\Controllers\api\ProfileController;
use App\Http\Controllers\Api\AssistantController;


// ════════════════════════════════════════════════════════════════
//  1. ROUTES PUBLIQUES
// ════════════════════════════════════════════════════════════════
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

// ════════════════════════════════════════════════════════════════
//  2. ROUTES AUTHENTIFIÉES – tous les rôles
// ════════════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth (session) ───────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });

    // ── Profil connecté ──────────────────────────────────────────
    Route::prefix('profile')->group(function () {
        Route::get('/',          [ProfileController::class, 'show']);
        Route::put('/',          [ProfileController::class, 'update']);
        Route::put('/password',  [ProfileController::class, 'updatePassword']);
        Route::post('/photo',    [ProfileController::class, 'updatePhoto']);
    });

    // ── Personnes ────────────────────────────────────────────────
    Route::apiResource('personnes', PersonneController::class);

    // ── Vision 360 ───────────────────────────────────────────────
    Route::prefix('vision360')->group(function () {
        Route::get('/',        [Vision360Controller::class, 'index']);
        Route::get('/search',  [Vision360Controller::class, 'search']);
        Route::get('/{id}',    [Vision360Controller::class, 'show']);
    });

    // ── Clients ──────────────────────────────────────────────────
    // Routes statiques AVANT {client} pour éviter les conflits
    Route::get('clients/options', [ClientController::class, 'options']);
    Route::get('/clients/{client}/documents', [ClientController::class, 'documents']);

    Route::post('/clients/{client}/documents', [ClientController::class, 'ajouterDocument']);
    
    Route::delete('/clients/{client}/documents/{document}', [ClientController::class, 'supprimerDocument']);
    // Sous-ressources par client
    Route::prefix('clients/{client}')->group(function () {

        // Consultation
        Route::get('portefeuille',      [ClientController::class, 'portefeuille']);
        Route::get('historique-prets',  [ClientController::class, 'historiquePrets']);
        Route::get('prets',             [ClientController::class, 'prets']);
        Route::get('blacklist',         [ClientController::class, 'blacklist']);

        // Actions métier
        Route::post('upload-photo',     [ClientController::class, 'uploadPhoto']);
        Route::post('generer-pin',      [ClientController::class, 'genererPin']);
        Route::post('verifier-pin',     [ClientController::class, 'verifierPin']);

        // GED – Documents
        Route::get('documents',                    [ClientController::class, 'documents']);
        Route::post('documents',                   [ClientController::class, 'ajouterDocument']);
        Route::delete('documents/{document}',      [ClientController::class, 'supprimerDocument']);

        // Liens
        Route::get('liens',                        [ClientController::class, 'liens']);
        Route::post('liens',                       [ClientController::class, 'ajouterLien']);
        Route::delete('liens/{lien}',              [ClientController::class, 'supprimerLien']);
    });

    // CRUD clients (après les routes custom)
    Route::apiResource('clients', ClientController::class);

   
    // ── Produits Crédit ──────────────────────────────────────────
    // Route statique AVANT {produitCredit}
    Route::get('produit-credits/options', [ProduitCreditController::class, 'options']);
    Route::post('produit-credits/{produitCredit}/valider', [ProduitCreditController::class, 'valider']);
    Route::apiResource('produit-credits', ProduitCreditController::class);

    // ── Frais (imbriqués sous produit-credits) ───────────────────
    Route::post(
        'produit-credits/{produitCredit}/frais/{frais}/simuler',
        [FraisController::class, 'simuler']
    );
    Route::apiResource('produit-credits.frais', FraisController::class)->shallow();

    // ── Demandes de Crédit ───────────────────────────────────────
    Route::prefix('demande-credits/{demandeCredit}')->group(function () {
        Route::post('affecter',       [DemandeCreditController::class, 'prendreEnCharge']);
        Route::post('evaluer-risque', [DemandeCreditController::class, 'evaluerRisque']);
        Route::post('approuver',      [DemandeCreditController::class, 'approuver']);
        Route::post('rejeter',        [DemandeCreditController::class, 'rejeter']);
    });
    Route::apiResource('demande-credits', DemandeCreditController::class);

    // ── Prêts ────────────────────────────────────────────────────
    Route::prefix('prets/{pret}')->group(function () {
        Route::get('solde-restant',  [PretController::class, 'soldeRestant']);
        Route::get('echeances',      [PretController::class, 'echeancier']);
    });
    Route::apiResource('prets', PretController::class);

    // ── Échéances (imbriquées sous prêts) ────────────────────────
    Route::prefix('prets/{pret}/echeances/{echeance}')->group(function () {
        Route::post('marquer-payee', [EcheanceController::class, 'marquerPayee']);
        Route::get('penalites',      [EcheanceController::class, 'penalites']);
    });
    Route::apiResource('prets.echeances', EcheanceController::class)
        ->only(['index', 'show', 'update'])
        ->shallow();

    // ── Paiements ────────────────────────────────────────────────
    Route::post('paiements/{paiement}/valider', [PaiementController::class, 'valider']);
    Route::apiResource('paiements', PaiementController::class)->except(['update']);

    // ── Statistiques ─────────────────────────────────────────────
    Route::prefix('statistiques')->group(function () {
        Route::get('caisse',      [StatistiquesController::class, 'caisse']);
        Route::get('agent/{id}',  [StatistiquesController::class, 'detailAgent']);
    });

    // ════════════════════════════════════════════════════════════
    //  3. ROUTES RÉSERVÉES – ADMIN + MANAGER
    // ════════════════════════════════════════════════════════════
    Route::middleware('role:ADMIN,MANAGER')->group(function () {
        Route::get('dashboard/stats', [DashboardController::class, 'getStats']);
        Route::get('produits',        [ProduitCreditController::class, 'index']);
    });

    // ════════════════════════════════════════════════════════════
    //  4. ROUTES RÉSERVÉES – ADMIN uniquement
    // ════════════════════════════════════════════════════════════
    Route::middleware('role:ADMIN')->group(function () {
        Route::apiResource('employes', EmployeController::class);

        Route::prefix('produits')->group(function () {
            Route::get('/{id}',    [ProduitCreditController::class, 'show']);
            Route::post('/',       [ProduitCreditController::class, 'store']);
            Route::put('/{id}',    [ProduitCreditController::class, 'update']);
            Route::delete('/{id}', [ProduitCreditController::class, 'destroy']);
        });
    });
    Route::prefix('assistant')->group(function () {
        Route::post('analyser/{demandeId}', [AssistantController::class, 'analyser']);
        Route::post('chat/{demandeId}',     [AssistantController::class, 'chat']);
    });
});
// Fix la route de test pour OpenRouter
// Route de test
Route::get('/test-gemini', function () {
    $apiKey = config('services.gemini.key');

    $response = \Illuminate\Support\Facades\Http::withOptions([
        'verify' => false, 'timeout' => 30,
    ])->withHeaders([
        'Authorization' => "Bearer {$apiKey}",
        'Content-Type'  => 'application/json',
    ])->post('https://openrouter.ai/api/v1/chat/completions', [
'model' => 'google/gemma-4-31b-it:free',
        'messages' => [
            ['role' => 'system', 'content' => 'Tu es un assistant financier. Réponds en français.'],
            ['role' => 'user',   'content' => 'Dis bonjour en une phrase.'],
        ],
        'max_tokens' => 50,
    ]);

    return response()->json([
        'ok'      => $response->successful(),
        'reponse' => $response->json('choices.0.message.content'),
        'erreur'  => $response->json('error'),
    ]);
});