<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model ClientDocument (GED)
 * Gestion Électronique des Documents d'un client — onglet "GED".
 */
class ClientDocument extends Model
{
    protected $table = 'client_documents';

    protected $fillable = [
        'client_id', 'intitule', 'chemin_fichier',
        'type_mime', 'taille_octets', 'ajoute_par',
    ];

    protected $casts = [
        'taille_octets' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function ajoutePar(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'ajoute_par');
    }

    /** Taille lisible humainement */
    public function getTailleListibleAttribute(): string
    {
        $bytes = $this->taille_octets ?? 0;
        if ($bytes < 1024)       return "{$bytes} o";
        if ($bytes < 1048576)    return round($bytes / 1024, 1) . ' Ko';
        return round($bytes / 1048576, 1) . ' Mo';
    }
}
