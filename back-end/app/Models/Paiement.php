<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Paiement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'paiements';

    protected $fillable = [
        'echeance_id',
        'employe_id',
        'date_paiement',
        'montant',
        'mode_paiement',
        'reference_transaction',
        'est_valide',
        'observation',
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant'       => 'decimal:2',
        'est_valide'    => 'boolean',
    ];

    // ── ⚡ Boot: Mise à jour automatique des échéances en cascade ───────
    protected static function boot(): void
    {
        parent::boot();

        // Déclenché AUTOMATIQUEMENT après l'insertion d'un paiement en BDD
        static::created(function (Paiement $paiement) {
            if ($paiement->est_valide) {
                $paiement->synchroniserEcheance();
            }
        });

        // Déclenché AUTOMATIQUEMENT après une modification (ex: annulation/validation)
        static::updated(function (Paiement $paiement) {
            $paiement->synchroniserEcheance();
        });

        // Déclenché AUTOMATIQUEMENT lors d'un Soft Delete (Annulation de paiement)
        static::deleted(function (Paiement $paiement) {
            $paiement->synchroniserEcheance();
        });
    }

    // ── 🤝 Relations ─────────────────────────────────────────────────

    /**
     * Lien vers l'échéance que ce paiement vient solder ou réduire.
     */
    public function echeance(): BelongsTo
    {
        return $this->belongsTo(Echeance::class, 'echeance_id');
    }

    /**
     * Lien vers l'employé/caissier qui a encaissé l'argent.
     */
    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    // ── ⚙️ Logique Métier (Calculs et Mises à jour) ─────────────────────

    /**
     * Calcule la somme de tous les paiements valides pour l'échéance liée
     * et met à jour son montant_paye ainsi que son statut.
     */
    public function synchroniserEcheance(): void
    {
        $echeance = $this->echeance;

        if ($echeance) {
            // Somme de tous les paiements actifs et valides liés à cette échéance
            $totalEncaisse = $echeance->paiements()
                ->where('est_valide', true)
                ->sum('montant');

            // Mise à jour de la colonne montant_paye sur l'échéance
            $echeance->montant_paye = $totalEncaisse;
            
            // Appelle la méthode de ton modèle Echeance pour ajuster le statut (PAYEE, PARTIELLEMENT_PAYEE, etc.)
            $echeance->actualiserStatutSelonPaiement();
        }
    }
}