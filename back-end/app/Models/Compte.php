<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Compte extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'numero_compte',
        'code_banque',
        'solde_actuel',
        'type_compte',
        'statut',
    ];

    protected $casts = [
        'solde_actuel' => 'decimal:2',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    /**
     * @throws \Exception si solde insuffisant
     */
    public function debiter(float $montant): bool
    {
        if ($montant <= 0) {
            throw new \InvalidArgumentException('Le montant à débiter doit être positif.');
        }

        if ($this->solde_actuel < $montant) {
            throw new \Exception("Solde insuffisant. Solde actuel : {$this->solde_actuel}");
        }

        $this->decrement('solde_actuel', $montant);
        return true;
    }

    public function crediter(float $montant): bool
    {
        if ($montant <= 0) {
            throw new \InvalidArgumentException('Le montant à créditer doit être positif.');
        }

        $this->increment('solde_actuel', $montant);
        return true;
    }
}
