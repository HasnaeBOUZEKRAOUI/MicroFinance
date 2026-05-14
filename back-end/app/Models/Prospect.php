<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prospect extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'personne_id',
        'employe_id',
        'statut_prospect',
        'source_prospect',
        'montant_pret_estime',
    ];

    protected $casts = [
        'montant_pret_estime' => 'decimal:2',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function personne(): BelongsTo
    {
        return $this->belongsTo(Personne::class);
    }

    /** Employé superviseur du prospect */
    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    /**
     * Convertit ce prospect en Client.
     * Crée l'enregistrement Client et passe le statut à CONVERTI.
     */
    public function convertirEnClient(array $donneesClient): Client
    {
        $client = Client::create(array_merge($donneesClient, [
            'personne_id' => $this->personne_id,
            'employe_id'  => $this->employe_id,
        ]));

        $this->update(['statut_prospect' => 'CONVERTI']);

        return $client;
    }
}
