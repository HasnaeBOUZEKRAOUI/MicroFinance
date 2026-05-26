<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Echeance extends Model
{
    use HasFactory;
    const TAUX_PENALITE_JOURNALIER = 0.001; // 0.1% par jour de retard

    protected $fillable = [
        'pret_id', 'numero_echeance', 'date_echeance',
        'total_du', 'montant_principal', 'montant_interet',
        'montant_paye', 'jours_retard', 'penalites', 'statut',
    ];

    protected $casts = [
        'date_echeance'    => 'date',
        'total_du'         => 'decimal:2',
        'montant_principal'=> 'decimal:2',
        'montant_interet'  => 'decimal:2',
        'montant_paye'     => 'decimal:2',
        'penalites'        => 'decimal:2',
    ];

    // ── Relations ────────────────────────────────────────────────
    public function pret()      { return $this->belongsTo(Pret::class); }
    public function paiements() { return $this->hasMany(Paiement::class); }

    // ── Calcul dynamique des jours de retard ─────────────────────
    /**
     * Calcule les jours de retard réels depuis aujourd'hui.
     * Retourne 0 si l'échéance n'est pas encore dépassée ou si payée.
     */
    public function getJoursRetardReelAttribute(): int
    {
        if ($this->statut === 'PAYEE') return 0;
        if (now()->lessThanOrEqualTo($this->date_echeance)) return 0;

        return (int) now()->diffInDays($this->date_echeance);
    }

    // ── Calcul dynamique des pénalités ───────────────────────────
    /**
     * Pénalités = capital_restant × taux_journalier × jours_retard
     * Recalcul en temps réel à chaque appel.
     */
    public function getPenalitesReellesAttribute(): float
    {
        $jours = $this->jours_retard_reel;
        if ($jours <= 0) return 0;

        $capitalRestant = (float) $this->total_du - (float) $this->montant_paye;
        return round($capitalRestant * self::TAUX_PENALITE_JOURNALIER * $jours, 2);
    }

    // ── Total réellement dû (avec pénalités actualisées) ─────────
    public function getTotalAvecPenalitesAttribute(): float
    {
        return round(
            (float) $this->total_du
            - (float) $this->montant_paye
            + $this->penalites_reelles,
            2
        );
    }

    // ── Mise à jour en base (appelée par un job/schedulé) ────────
    /**
     * Recalcule et persiste jours_retard + penalites en base.
     * À appeler via un Artisan Command schedulé chaque jour.
     */
    public function recalculerPenalites(): void
    {
        if (in_array($this->statut, ['PAYEE'])) return;

        $jours     = $this->jours_retard_reel;
        $penalites = $this->penalites_reelles;

        $this->update([
            'jours_retard' => $jours,
            'penalites'    => $penalites,
            'statut'       => $jours > 0 ? 'EN_RETARD' : $this->statut,
        ]);
    }

    // ── Scope utiles ─────────────────────────────────────────────
    public function scopeEnRetard($q)  { return $q->where('statut', 'EN_RETARD'); }
    public function scopeImpayees($q)  { return $q->whereIn('statut', ['EN_ATTENTE', 'EN_RETARD', 'PARTIELLEMENT_PAYEE']); }
    public function scopePayees($q)    { return $q->where('statut', 'PAYEE'); }
}