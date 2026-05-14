<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Frais extends Model
{
    protected $table = 'frais';

    protected $fillable = [
        'produit_credit_id',
        'libelle_frais',
        'taux',
        'montant_fixe',
        'est_capitalisable',
    ];

    protected $casts = [
        'taux'             => 'decimal:4',
        'montant_fixe'     => 'decimal:2',
        'est_capitalisable'=> 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function produitCredit(): BelongsTo
    {
        return $this->belongsTo(ProduitCredit::class);
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    /**
     * Calcule le montant des frais pour un montant de prêt donné.
     */
    public function calculerMontant(float $montantPret): float
    {
        if ($this->taux !== null) {
            return round($montantPret * (float) $this->taux, 2);
        }

        return (float) ($this->montant_fixe ?? 0);
    }
}
