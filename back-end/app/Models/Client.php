<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Collection;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'personne_id',
        'employe_id',
        'type_piece_identite',
        'numero_piece_identite',
        'date_expiration_piece',
        'nationalite',
        'revenu_mensuel',
        'score_eligibilite',
        'est_sur_liste_noire',
    ];

    protected $casts = [
        'date_expiration_piece' => 'date',
        'revenu_mensuel'        => 'decimal:2',
        'score_eligibilite'     => 'decimal:2',
        'est_sur_liste_noire'   => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function personne(): BelongsTo
    {
        return $this->belongsTo(Personne::class);
    }

    /** Agent gestionnaire */
    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function comptes(): HasMany
    {
        return $this->hasMany(Compte::class);
    }

    public function demandeCredits(): HasMany
    {
        return $this->hasMany(DemandeCredit::class);
    }

    // -------------------------------------------------------------------------
    // Accesseurs délégués vers Personne
    // -------------------------------------------------------------------------

    public function getNomCompletAttribute(): string
    {
        return $this->personne?->nom_complet ?? "Client #{$this->id}";
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    public function verifierBlacklist(): bool
    {
        return $this->est_sur_liste_noire;
    }

    /**
     * Retourne tous les prêts du client (via ses demandes de crédit).
     */
    public function obtenirHistoriquePrets(): Collection
    {
        return Pret::whereHas('demandeCredit', function ($q) {
            $q->where('client_id', $this->id);
        })->with('echeances')->get();
    }
}
