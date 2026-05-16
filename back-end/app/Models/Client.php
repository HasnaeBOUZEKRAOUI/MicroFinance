<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Model
{
    use HasFactory; 

    protected $fillable = [
        // Identité
        'personne_id', 
    'employe_id',
        'nil', 'code_client', 'est_vip',
        'type_piece_identite', 'numero_piece_identite',
        'date_expiration_piece',
        'photo_cin_recto', 'photo_cin_verso', 'photo_portrait',
        'fichier_consentement', 'code_pin', 'pin_verifie',

        // Informations clients
        'categorie_client', 'titre', 'fonction',
        'secteur_activite', 'niveau_etude', 'nom_mere',
        'genre', 'langue', 'pays_naissance', 'ville_naissance',
        'situation_familiale', 'nombre_enfants',
        'nom_conjoint', 'prenom_conjoint',

        // Adresse
        'telephone_secondaire', 'email_client',
        'code_postal', 'adresse_1', 'adresse_2',
        'ville', 'pays', 'coordonnees_gps',

        // Crédit
        'nationalite', 'revenu_mensuel',
        'score_eligibilite', 'est_sur_liste_noire',
    ];

    protected $hidden = ['code_pin'];

    protected $casts = [
        'date_expiration_piece' => 'date',
        'revenu_mensuel'        => 'decimal:2',
        'score_eligibilite'     => 'decimal:2',
        'est_sur_liste_noire'   => 'boolean',
        'est_vip'               => 'boolean',
        'pin_verifie'           => 'boolean',
        'nombre_enfants'        => 'integer',
    ];

    // ── Boot : génération automatique du code client ─────────────
    protected static function boot(): void
    {
        parent::boot();
    
        static::creating(function (Client $client) {
            // Génération du Code Client (Déjà présent)
            if (empty($client->code_client)) {
                $client->code_client = 'CLT-' . strtoupper(Str::random(8));
            }
    
            // Génération du NIL (AUTO-GÉNÉRÉ ICI)
            if (empty($client->nil)) {
                // Exemple : NIL + Timestamp actuel + Aléatoire 4 chiffres
                // Très efficace pour garantir l'unicité
                $client->nil = 'NIL' . date('ymd') . strtoupper(Str::random(4));
                // Résultat : NIL260515A7B2
            }
        });
    }
    // ── Relations ─────────────────────────────────────────────────
    public function personne(): BelongsTo
    {
        return $this->belongsTo(Personne::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function comptes(): HasMany
    {
        return $this->hasMany(Compte::class);
    }

    public function demandeCredits(): HasMany
    {
        return $this->hasMany(DemandeCredit::class);
    }

    public function liens(): HasMany
    {
        return $this->hasMany(ClientLien::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ClientDocument::class);
    }

    // ── Accesseurs ────────────────────────────────────────────────
    public function getNomCompletAttribute(): string
    {
        return trim(($this->personne?->prenom ?? '') . ' ' . ($this->personne?->nom ?? ''))
            ?: "Client #{$this->id}";
    }

    // ── Méthodes métier ───────────────────────────────────────────
    public function verifierBlacklist(): bool
    {
        return $this->est_sur_liste_noire;
    }

    /**
     * Générer et stocker un code PIN (retourne le PIN en clair pour l'envoi SMS).
     */
    public function genererPin(): string
    {
        $pin = (string) random_int(100000, 999999);
        $this->update(['code_pin' => bcrypt($pin), 'pin_verifie' => false]);
        return $pin;
    }

    /**
     * Vérifier le code PIN saisi par le client.
     */
    public function verifierPin(string $pin): bool
    {
        if (password_verify($pin, $this->code_pin)) {
            $this->update(['pin_verifie' => true]);
            return true;
        }
        return false;
    }

    public function obtenirHistoriquePrets(): Collection
    {
        return Pret::whereHas('demandeCredit', fn($q) =>
            $q->where('client_id', $this->id)
        )->with('echeances')->get();
    }
}