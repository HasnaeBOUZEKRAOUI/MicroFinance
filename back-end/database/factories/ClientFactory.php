<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ClientFactory extends Factory
{
    // Villes et pays marocains réalistes
    private array $villesMaroc = [
        'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
        'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan',
        'Salé', 'Mohammedia', 'El Jadida', 'Beni Mellal', 'Nador',
    ];

    private array $secteursActivite = [
        'Commerce général', 'Artisanat', 'Agriculture', 'Élevage',
        'Transport', 'Restauration', 'Couture / Textile', 'Bâtiment / BTP',
        'Épicerie / Alimentation', 'Coiffure / Esthétique', 'Informatique',
        'Pêche', 'Maraîchage', 'Mécanique automobile', 'Menuiserie',
    ];

    private array $fonctions = [
        'Commerçant', 'Artisan', 'Agriculteur', 'Fonctionnaire',
        'Employé du secteur privé', 'Auto-entrepreneur', 'Enseignant',
        'Infirmier', 'Chauffeur', 'Maçon', 'Électricien', 'Plombier',
    ];

    private array $niveauxEtude = [
        'Sans niveau', 'Primaire', 'Collège', 'Lycée',
        'Baccalauréat', 'Bac+2', 'Licence', 'Master', 'Doctorat',
    ];

    public function definition(): array
    {
        $genre    = $this->faker->randomElement(['HOMME', 'FEMME']);
        $prenom   = $genre === 'HOMME'
            ? $this->faker->firstNameMale()
            : $this->faker->firstNameFemale();

        $ville    = $this->faker->randomElement($this->villesMaroc);
        $statut   = $this->faker->randomElement([
            'CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF', 'UNION_LIBRE'
        ]);

        $estMarie = in_array($statut, ['MARIE', 'UNION_LIBRE']);

        return [
            // ── Clés étrangères ──────────────────────────────
            'personne_id' => \App\Models\Personne::factory()->create()->id,
            'employe_id'  => null, // affecté dans le seeder

            // ── Pièce d'identité ─────────────────────────────
            'type_piece_identite'    => $this->faker->randomElement(['CIN', 'Passeport', 'Carte de séjour']),
            'numero_piece_identite'  => strtoupper(Str::random(2)) . $this->faker->numerify('######'),
            'date_expiration_piece'  => $this->faker->dateTimeBetween('now', '+10 years')->format('Y-m-d'),

            // ── Champs PowerCARD ─────────────────────────────
            'nil'                    => $this->faker->unique()->numerify('NIL-########'),
            'code_client'            => 'CLT-' . $this->faker->unique()->numerify('######'),
            'est_vip'                => $this->faker->boolean(10), // 10% VIP
            'photo_cin_recto'        => null,
            'photo_cin_verso'        => null,
            'photo_portrait'         => null,
            'fichier_consentement'   => null,
            'code_pin'               => null,
            'pin_verifie'            => $this->faker->boolean(80),

            // ── Informations client ──────────────────────────
            'categorie_client'       => $this->faker->randomElement([
                'micro-entrepreneur', 'salarié', 'commerçant', 'agriculteur', 'artisan',
            ]),
            'titre'                  => $genre === 'HOMME'
                ? $this->faker->randomElement(['M.', 'Dr', 'Pr'])
                : $this->faker->randomElement(['Mme', 'Mlle', 'Dr']),
            'fonction'               => $this->faker->randomElement($this->fonctions),
            'secteur_activite'       => $this->faker->randomElement($this->secteursActivite),
            'niveau_etude'           => $this->faker->randomElement($this->niveauxEtude),
            'nom_mere'               => $this->faker->lastName(),
            'genre'                  => $genre,
            'langue'                 => $this->faker->randomElement(['Arabe', 'Français', 'Amazigh', 'Darija']),
            'pays_naissance'         => 'Maroc',
            'ville_naissance'        => $this->faker->randomElement($this->villesMaroc),
            'situation_familiale'    => $statut,
            'nombre_enfants'         => $this->faker->numberBetween(0, 6),
            'nom_conjoint'           => $estMarie ? $this->faker->lastName() : null,
            'prenom_conjoint'        => $estMarie ? $prenom : null,

            // ── Adresse & contact ────────────────────────────
            'telephone_secondaire'   => $this->faker->optional(0.4)->numerify('07########'),
            'email_client'           => $this->faker->optional(0.7)->safeEmail(),
            'code_postal'            => $this->faker->numerify('#####'),
            'adresse_1'              => $this->faker->streetAddress(),
            'adresse_2'              => $this->faker->optional(0.3)->secondaryAddress(),
            'ville'                  => $ville,
            'pays'                   => 'Maroc',
            'coordonnees_gps'        => $this->faker->optional(0.4)
                ->latitude(27.0, 35.9) . ',' . $this->faker->longitude(-13.0, -1.0),
            'nationalite'            => 'Marocaine',
            'revenu_mensuel'         => $this->faker->randomFloat(2, 1500, 25000),
            'score_eligibilite'      => $this->faker->optional(0.7)->randomFloat(2, 0, 100),
            'est_sur_liste_noire'    => $this->faker->boolean(3), // 3% liste noire
        ];
    }

    // ── États prédéfinis ──────────────────────────────
    public function vip(): static
    {
        return $this->state([
            'est_vip'          => true,
            'revenu_mensuel'   => $this->faker->randomFloat(2, 15000, 80000),
            'score_eligibilite'=> $this->faker->randomFloat(2, 70, 100),
        ]);
    }

    public function listeNoire(): static
    {
        return $this->state([
            'est_sur_liste_noire' => true,
            'score_eligibilite'   => $this->faker->randomFloat(2, 0, 20),
        ]);
    }

    public function pinVerifie(): static
    {
        return $this->state(['pin_verifie' => true]);
    }
}