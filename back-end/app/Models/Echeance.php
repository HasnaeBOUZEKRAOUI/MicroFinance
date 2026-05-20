<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Echeance extends Model
{
    use HasFactory;

    protected $table = 'echeances';

    protected $fillable = [
        'pret_id',
        'numero_echeance',
        'date_echeance',
        'total_du',
        'montant_principal',
        'montant_interet',
        'montant_paye',
        'jours_retard',
        'penalites',
        'statut',
    ];

    protected $casts = [
        'date_echeance'     => 'date',
        'numero_echeance'   => 'integer',
        'total_du'          => 'decimal:2',
        'montant_principal' => 'decimal:2',
        'montant_interet'   => 'decimal:2',
        'montant_paye'      => 'decimal:2',
        'jours_retard'      => 'integer',
        'penalites'         => 'decimal:2',
    ];

    // ── Relations ─────────────────────────────────────────────────

    /**
     * Lien inverse vers le prêt parent.
     */
    public function pret(): BelongsTo
    {
        return $this->belongsTo(Pret::class, 'pret_id');
    }

    /**
     * Une échéance peut recevoir plusieurs paiements ou transactions.
     * (Appelé par `$echeance->load('paiements...')` dans ton contrôleur)
     */
    public function paiements(): HasMany
    {
        return $this->hasMany(Transaction::class, 'echeance_id');
    }

    // ── Mutateurs & Accesseurs (Attributs calculés) ────────────────

    /**
     * Calcule automatiquement le montant restant dû sur cette mensualité.
     */
    public function getResteADuAttribute(): float
    {
        $duGlobal = (float) $this->total_du + (float) $this->penalites;
        $restant = $duGlobal - (float) $this->montant_paye;
        
        return $restant > 0 ? round($restant, 2) : 0.00;
    }

    // ── Méthodes métiers (Appelées par ton EcheanceController) ─────

    /**
     * Appelé par : EcheanceController@penalites
     * Calcule et enregistre les pénalités basées sur un taux journalier et le retard accumulé.
     */
    public function calculerPenalites(float $tauxJournalier = 0.002): float
    {
        // Les pénalités s'appliquent sur le capital restant dû s'il y a du retard
        if ($this->jours_retard > 0 && $this->statut !== 'PAYEE') {
            $capitalRestantDu = (float) $this->montant_principal - (float) $this->montant_paye;
            
            // Si c'est une période de grâce (principal = 0), on applique sur l'intérêt impayé
            if ($capitalRestantDu <= 0) {
                $capitalRestantDu = (float) $this->total_du - (float) $this->montant_paye;
            }

            if ($capitalRestantDu > 0) {
                $nouveauMontantPenalite = $capitalRestantDu * $tauxJournalier * $this->jours_retard;
                $this->update(['penalites' => round($nouveauMontantPenalite, 2)]);
            }
        }

        return (float) $this->penalites;
    }

    /**
     * Appelé par : EcheanceController@marquerPayee
     * Solde manuellement ou automatiquement l'échéance à 100%.
     */
    public function marquerCommePayee(): void
    {
        $totalExige = (float) $this->total_du + (float) $this->penalites;

        $this->update([
            'montant_paye' => $totalExige,
            'statut'       => 'PAYEE',
        ]);

        // Optionnel : On peut ici appeler une méthode pour vérifier si tout le prêt est soldé
        $this->verifierEtMettreAJourStatutPret();
    }

    /**
     * Met à jour le statut interne de l'échéance selon les flux financiers encaissés
     */
    public function actualiserStatutSelonPaiement(): void
    {
        $totalExige = (float) $this->total_du + (float) $this->penalites;
        $dejaPaye = (float) $this->montant_paye;

        if ($dejaPaye >= $totalExige) {
            $this->statut = 'PAYEE';
        } elseif ($dejaPaye > 0 && $dejaPaye < $totalExige) {
            $this->statut = 'PARTIELLEMENT_PAYEE';
        } else {
            $this->statut = $this->jours_retard > 0 ? 'EN_RETARD' : 'EN_ATTENTE';
        }

        $this->save();
    }

    /**
     * Synchronise le capital restant sur le modèle Pret associé
     */
    protected function verifierEtMettreAJourStatutPret(): void
    {
        $pret = $this->pret;
        if ($pret) {
            // Recalcul du capital restant dû global sur le prêt
            $totalPrincipalPaye = $pret->echeances()->sum('montant_paye'); // À affiner selon ta logique de ventilation principal/intérêt
            $nouveauRestant = $pret->montant_accorde - $totalPrincipalPaye;
            
            $pret->capital_restant = $nouveauRestant > 0 ? $nouveauRestant : 0;
            
            // Si toutes les échéances sont payées, le prêt passe en statut "SOLDE"
            $nbImpayees = $pret->echeances()->where('statut', '!=', 'PAYEE')->count();
            if ($nbImpayees === 0) {
                $pret->statut_pret = 'SOLDE';
            }
            
            $pret->save();
        }
    }
}