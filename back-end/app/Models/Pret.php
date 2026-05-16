<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Pret extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'prets';

    protected $fillable = [
        'demande_credit_id',
        'reference',
        'montant_accorde',
        'date_debut',
        'date_fin',
        'taux_interet',
        'statut_pret',
        'periode_grace',
        'capital_restant',
    ];

    protected $casts = [
        'date_debut'      => 'date',
        'date_fin'        => 'date',
        'montant_accorde' => 'decimal:2',
        'taux_interet'    => 'decimal:4',
        'capital_restant' => 'decimal:2',
        'periode_grace'   => 'integer',
    ];

    // ── Boot : génération automatique de la référence unique ─────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Pret $pret) {
            if (empty($pret->reference)) {
                // Génère une référence type PRT-2026-X8A2Z
                $pret->reference = 'PRT-' . date('Y') . '-' . strtoupper(Str::random(6));
            }
            
            // Par défaut, à la création, le capital restant est égal au montant accordé
            if (empty($pret->capital_restant)) {
                $pret->capital_restant = $pret->montant_accorde;
            }
        });
    }

    // ── Relations ─────────────────────────────────────────────────

    /**
     * Lien vers la demande de crédit d'origine.
     */
    public function demandeCredit(): BelongsTo
    {
        return $this->belongsTo(DemandeCredit::class, 'demande_credit_id');
    }

    /**
     * Un prêt génère plusieurs échéances de paiement.
     */
    public function echeances(): HasMany
    {
        return $this->hasMany(Echeance::class);
    }

    /**
     * Un prêt peut être lié à plusieurs transactions (déboursements, remboursements).
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // ── Scopes (Filtres pratiques) ────────────────────────────────

    public function scopeEnCours($query)
    {
        return $query->where('statut_pret', 'EN_COURS');
    }

    public function scopeEnRetard($query)
    {
        return $query->where('statut_pret', 'EN_RETARD');
    }

    // ── Méthodes métier ───────────────────────────────────────────

    /**
     * Calcule le taux de progression du remboursement (en %)
     */
    public function getProgressionRemboursementAttribute(): float
    {
        if ($this->montant_accorde <= 0) return 0;
        
        $paye = $this->montant_accorde - $this->capital_restant;
        return round(($paye / $this->montant_accorde) * 100, 2);
    }
}