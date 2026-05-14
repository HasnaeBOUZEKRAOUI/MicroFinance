<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PersonneController;
use App\Http\Controllers\Api\EmployeController;
use App\Http\Controllers\Api\ProspectController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompteController;
use App\Http\Controllers\Api\ProduitCreditController;
use App\Http\Controllers\Api\FraisController;
use App\Http\Controllers\Api\DemandeCreditController;
use App\Http\Controllers\Api\PretController;
use App\Http\Controllers\Api\EcheanceController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\AlerteController;

// ─────────────────────────────────────────────
// Auth (public)
// ─────────────────────────────────────────────
Route::post('auth/login', [AuthController::class, 'login']);

// ─────────────────────────────────────────────
// Routes protégées (Sanctum)
// ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    // Personnes
    Route::apiResource('personnes', PersonneController::class);

    // Employés
    Route::get('employes/{employe}/clients',        [EmployeController::class, 'clients']);
    Route::get('employes/{employe}/demande-credits', [EmployeController::class, 'demandeCredits']);
    Route::apiResource('employes', EmployeController::class);

    // Prospects
    Route::post('prospects/{prospect}/convertir', [ProspectController::class, 'convertir']);
    Route::apiResource('prospects', ProspectController::class);

    // Clients
    Route::get('clients/{client}/historique-prets', [ClientController::class, 'historiquePrets']);
    Route::get('clients/{client}/blacklist',         [ClientController::class, 'blacklist']);
    Route::get('clients/{client}/comptes',           [ClientController::class, 'comptes']);
    Route::apiResource('clients', ClientController::class);

    // Comptes
    Route::post('comptes/{compte}/debiter',  [CompteController::class, 'debiter']);
    Route::post('comptes/{compte}/crediter', [CompteController::class, 'crediter']);
    Route::apiResource('comptes', CompteController::class);

    // Produits Crédit
    Route::post('produit-credits/{produitCredit}/valider', [ProduitCreditController::class, 'valider']);
    Route::apiResource('produit-credits', ProduitCreditController::class);

    // Frais (imbriqués sous produit-credits)
    Route::post('produit-credits/{produitCredit}/frais/{frais}/simuler', [FraisController::class, 'simuler']);
    Route::apiResource('produit-credits.frais', FraisController::class)->shallow();

    // Demandes de Crédit
    Route::post('demande-credits/{demandeCredit}/affecter',      [DemandeCreditController::class, 'affecter']);
    Route::post('demande-credits/{demandeCredit}/evaluer-risque',[DemandeCreditController::class, 'evaluerRisque']);
    Route::post('demande-credits/{demandeCredit}/approuver',     [DemandeCreditController::class, 'approuver']);
    Route::post('demande-credits/{demandeCredit}/rejeter',       [DemandeCreditController::class, 'rejeter']);
    Route::apiResource('demande-credits', DemandeCreditController::class);

    // Prêts
    Route::get('prets/{pret}/echeancier',   [PretController::class, 'echeancier']);
    Route::get('prets/{pret}/solde-restant',[PretController::class, 'soldeRestant']);
    Route::apiResource('prets', PretController::class);

    // Échéances (imbriquées sous prêts)
    Route::post('prets/{pret}/echeances/{echeance}/marquer-payee', [EcheanceController::class, 'marquerPayee']);
    Route::get('prets/{pret}/echeances/{echeance}/penalites',      [EcheanceController::class, 'penalites']);
    Route::apiResource('prets.echeances', EcheanceController::class)
        ->only(['index', 'show', 'update'])
        ->shallow();

    // Paiements
    Route::post('paiements/{paiement}/valider', [PaiementController::class, 'valider']);
    Route::apiResource('paiements', PaiementController::class)->except(['update']);

    // Alertes
    Route::post('alertes/{alerte}/acquitter',    [AlerteController::class, 'acquitter']);
    Route::get('prets/{pret}/alertes',           [AlerteController::class, 'parPret']);
    Route::apiResource('alertes', AlerteController::class)->except(['update']);
});