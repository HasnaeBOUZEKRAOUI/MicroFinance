<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Employe extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $fillable = [
        'personne_id',
        'superviseur_id',
        'nom_utilisateur',
        'mot_de_passe',
        'role',
        'date_embauche',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    protected $casts = [
        'date_embauche' => 'date',
    ];

    /**
     * Mappe le champ mot_de_passe sur le champ attendu par Laravel Auth (password).
     */
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function personne(): BelongsTo
    {
        return $this->belongsTo(Personne::class);
    }

    /** Superviseur hiérarchique (auto-référence) */
    public function superviseur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'superviseur_id');
    }

    /** Employés supervisés */
    public function subordonnes(): HasMany
    {
        return $this->hasMany(Employe::class, 'superviseur_id');
    }

    /** Prospects dont cet employé est responsable */
    public function prospects(): HasMany
    {
        return $this->hasMany(Prospect::class);
    }

    /** Clients gérés par cet employé */
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    /** Demandes de crédit traitées */
    public function demandeCredits(): HasMany
    {
        return $this->hasMany(DemandeCredit::class);
    }

    /** Paiements enregistrés par cet employé (caissier) */
    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    /** Alertes acquittées par cet employé */
    public function alertesAcquittees(): HasMany
    {
        return $this->hasMany(Alerte::class, 'acquittee_par');
    }

    // -------------------------------------------------------------------------
    // Accesseurs délégués vers Personne
    // -------------------------------------------------------------------------

    public function getNomCompletAttribute(): string
    {
        return $this->personne?->nom_complet ?? $this->nom_utilisateur;
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    public function traiterDemande(DemandeCredit $demande): void
    {
        $demande->employe_id = $this->id;
        $demande->statut_demande = 'EN_COURS_ANALYSE';
        $demande->save();
    }

    public function gererCaisse(): bool
    {
        return in_array($this->role, ['CAISSIER', 'ADMIN']);
    }
}