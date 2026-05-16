<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Personne extends Model
{
    use HasFactory;
    protected $fillable = [
        'prenom',
        'nom',
        'date_naissance',
        'email',
        'telephone',
        'date_creation',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_creation'  => 'date',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function employe(): HasOne
    {
        return $this->hasOne(Employe::class);
    }

    public function client(): HasOne
    {
        return $this->hasOne(Client::class);
    }

    public function prospect(): HasOne
    {
        return $this->hasOne(Prospect::class);
    }

    // -------------------------------------------------------------------------
    // Accesseurs
    // -------------------------------------------------------------------------

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    // -------------------------------------------------------------------------
    // Méthodes métier
    // -------------------------------------------------------------------------

    public function calculerAge(): int
    {
        return Carbon::parse($this->date_naissance)->age;
    }
}