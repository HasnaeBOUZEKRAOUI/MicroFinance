<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProduitCredit extends Model
{
    use SoftDeletes;

    protected $table = 'produit_credits';

    protected $fillable = [
        'type_produit',
        'famille_produit',
        'montant_min',
        'montant_max',
        'taux_interet_min',
        'taux_interet_max',
        'mode_calcul',
        'actif',
    ];

    protected $casts = [
        'montant_min'       => 'decimal:2',
        'montant_max'       => 'decimal:2',
        'taux_interet_min'  => 'decimal:4',
        'taux_interet_max'  => 'decimal:4',
        'actif'             => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function frais(): HasMany
    {
        return $this->hasMany(Frais::class);
    }

    public function demandeCredits(): HasMany
    {
        return $this->hasMany(DemandeCredit::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    public function validerParametres(float $montant, float $taux): bool
    {
        return $montant >= $this->montant_min
            && $montant <= $this->montant_max
            && $taux   >= $this->taux_interet_min
            && $taux   <= $this->taux_interet_max;
    }
}
