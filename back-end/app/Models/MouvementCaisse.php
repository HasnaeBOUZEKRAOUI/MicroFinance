<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class MouvementCaisse extends Model
{
    use HasFactory;

    protected $table = 'mouvements_caisse';

    protected $fillable = [
        'employe_id',
        'num_caisse',
        'type_mouvement',
        'montant',
        'libelle',
        'reference_id',
    ];
    public function employe()
    {
        return $this->belongsTo(Employe::class);
    }

   // ✅ Relation directe vers Paiement sans morphTo
public function paiement()
{
    return $this->belongsTo(Paiement::class, 'reference_id');
}
}