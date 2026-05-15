<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model ClientLien
 * Représente une personne liée à un client (garant, mandataire,
 * contact d'urgence…) — onglet "Lien" du formulaire client.
 */
class ClientLien extends Model
{
    protected $table = 'client_liens';

    protected $fillable = [
        'client_id', 'client_lie_id', 'type_lien',
        'nom', 'prenom', 'date_naissance',
        'cin', 'date_expiration_cin',
        'pays_naissance', 'ville_naissance',
        'gsm', 'adresse', 'ayant_droit',
    ];

    protected $casts = [
        'date_naissance'      => 'date',
        'date_expiration_cin' => 'date',
        'ayant_droit'         => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /** Client lié s'il existe dans le système */
    public function clientLie(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_lie_id');
    }

    /** Nom complet affiché (depuis client existant ou saisie manuelle) */
    public function getNomCompletAttribute(): string
    {
        if ($this->clientLie) {
            return $this->clientLie->nom_complet;
        }
        return trim("{$this->prenom} {$this->nom}");
    }
}