<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\PersonneController;
use App\Http\Controllers\api\EmployeController;
use App\Http\Controllers\api\ProspectController;
use App\Http\Controllers\api\ClientController;
use App\Http\Controllers\api\CompteController;
use App\Http\Controllers\api\ProduitCreditController;
use App\Http\Controllers\api\FraisController;
use App\Http\Controllers\api\DemandeCreditController;
use App\Http\Controllers\api\PretController;
use App\Http\Controllers\api\EcheanceController;
use App\Http\Controllers\api\PaiementController;
use App\Http\Controllers\api\AlerteController;

// ─────────────────────────────────────────────
// Auth (public)
// ─────────────────────────────────────────────
Route::post('auth/login', [AuthController::class, 'login']);

// ─────────────────────────────────────────────
// Routes protégées (Sanctum)
// ─────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:ADMIN'])->group(function () {
    
    // Gestion des employés (CRUD complet)
    Route::apiResource('employes', EmployeController::class);
    
    // Gestion des produits de crédit
    Route::get('produits/{id}', [ProduitCreditController::class, 'show']);  // Voir les détails
    Route::post('produits', [ProduitCreditController::class, 'store']);     // Ajouter
    Route::put('produits/{id}', [ProduitCreditController::class, 'update']); // Modifier
    Route::delete('produits/{id}', [ProduitCreditController::class, 'destroy']); // Supprimer
});

// Route accessible par d'autres rôles (ex: agents de crédit qui ont besoin de voir la liste)
Route::middleware(['auth:sanctum', 'role:ADMIN'])->group(function () {
    Route::get('produits', [ProduitCreditController::class, 'index']);
});

Route::middleware('auth:sanctum')->group(function () {


    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    // Personnes
    Route::apiResource('personnes', PersonneController::class);

    

    // Prospects
    Route::post('prospects/{prospect}/convertir', [ProspectController::class, 'convertir']);
    Route::apiResource('prospects', ProspectController::class);

    // ── Clients ─────────────────────────────────────────────────────
    // Actions métier
    Route::get ('clients/{client}/historique-prets',       [ClientController::class, 'historiquePrets']);
    Route::get ('clients/{client}/blacklist',              [ClientController::class, 'blacklist']);
    Route::get ('clients/{client}/comptes',                [ClientController::class, 'comptes']);
    Route::post('clients/{client}/generer-pin',            [ClientController::class, 'genererPin']);
    Route::post('clients/{client}/verifier-pin',           [ClientController::class, 'verifierPin']);
    Route::post('clients/{client}/upload-photo',           [ClientController::class, 'uploadPhoto']);

    // Liens (onglet "Lien")
    Route::get   ('clients/{client}/liens',                [ClientController::class, 'liens']);
    Route::post  ('clients/{client}/liens',                [ClientController::class, 'ajouterLien']);
    Route::delete('clients/{client}/liens/{lien}',         [ClientController::class, 'supprimerLien']);

    // Documents GED (onglet "GED")
    Route::get   ('clients/{client}/documents',            [ClientController::class, 'documents']);
    Route::post  ('clients/{client}/documents',            [ClientController::class, 'ajouterDocument']);
    Route::delete('clients/{client}/documents/{document}', [ClientController::class, 'supprimerDocument']);

    Route::apiResource('clients', ClientController::class);
    
    Route::get('clients/{client}/prets', [ClientController::class, 'prets']);
    Route::get('clients/{client}/documents', [ClientController::class, 'documents']);
    Route::get('clients/{client}/alertes', [ClientController::class, 'alertes']);
    
    // CRUD standard
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