<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DemandeCredit extends Model
{
    use SoftDeletes;

    protected $table = 'demande_credits';

    protected $fillable = [
        'client_id',
        'produit_credit_id',
        'employe_id',
        'montant_demande',
        'duree_demandee',
        'objet_pret',
        'garantie',
        'nom_garant',
        'statut_demande',
        'score_risque',
        'motif_rejet',
        'date_soumission',
        'date_decision',
    ];

    protected $casts = [
        'montant_demande'  => 'decimal:2',
        'score_risque'     => 'decimal:2',
        'date_soumission'  => 'datetime',
        'date_decision'    => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function produitCredit(): BelongsTo
    {
        return $this->belongsTo(ProduitCredit::class);
    }

    /** Agent traitant la demande */
    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    /** Prêt issu de cette demande (si approuvée) */
    public function pret(): HasOne
    {
        return $this->hasOne(Pret::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeEnAttente($query)
    {
        return $query->where('statut_demande', 'EN_ATTENTE');
    }

    public function scopeApprouvees($query)
    {
        return $query->where('statut_demande', 'APPROUVEE');
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    public function evaluerRisque(): float
    {
        // Logique de scoring simplifié — à enrichir selon vos règles métier
        $client = $this->client;
        $score  = $client->score_eligibilite ?? 0;

        // Pénalité si le client est sur liste noire
        if ($client->est_sur_liste_noire) {
            $score = 0;
        }

        $this->update(['score_risque' => $score]);
        return (float) $score;
    }

    public function affecter(Employe $agent): void
    {
        $this->update([
            'employe_id'    => $agent->id,
            'statut_demande'=> 'EN_COURS_ANALYSE',
        ]);
    }
}
