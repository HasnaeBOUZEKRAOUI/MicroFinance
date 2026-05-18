<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Garant extends Model
{
    protected $fillable = [
        'demande_credit_id',
        'nom',
        'prenom',
        'cin',
        'telephone',
        'email',
        'relation_client',
        'revenu_mensuel',
        'employeur'
    ];

    public function demandeCredit(): BelongsTo
    {
        return $this->belongsTo(DemandeCredit::class, 'demande_credit_id');
    }
}