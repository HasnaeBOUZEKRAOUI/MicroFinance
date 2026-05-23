<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Paiement extends Model
{
    use HasFactory;

    protected $table = 'paiements';

    protected $fillable = [
        'echeance_id',
        'employe_id',
        'date_paiement',
        'montant',
        'mode_paiement',
        'reference_transaction',
        'est_valide',
        'observation',
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant' => 'decimal:2',
        'est_valide' => 'boolean',
    ];

    public function echeance()
    {
        return $this->belongsTo(Echeance::class);
    }

    public function employe()
    {
        return $this->belongsTo(Employe::class);
    }
}