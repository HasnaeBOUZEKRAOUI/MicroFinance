<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Garant extends Model
{
    use HasFactory;
    protected $table = 'garants';

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