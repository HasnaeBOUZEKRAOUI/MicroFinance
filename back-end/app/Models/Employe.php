<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employe extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes, HasFactory;

    protected $fillable = [
        'personne_id',
        'superviseur_id',
        'nom_utilisateur',
        'mot_de_passe',
        'role',
        'date_embauche',
        'photo'
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

   // Dans ton modèle Employe.php

public function mouvementsCaisse()
{
    return $this->hasMany(MouvementCaisse::class, 'employe_id');
}

/**
 * Calcule le montant actuel disponible dans la caisse de l'employé
 */
public function getMontantCaisseAttribute(): float
{
    $entrees = $this->mouvementsCaisse()->where('type_mouvement', 'ENTREE')->sum('montant');
    $sorties = $this->mouvementsCaisse()->where('type_mouvement', 'SORTIE')->sum('montant');
    
    return (float) ($entrees - $sorties);
}

}