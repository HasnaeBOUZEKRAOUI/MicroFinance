<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création de la table clients avec tous les champs
     * selon le guide PowerCARD Microfinance (slide 20).
     */
    public function up(): void
    {
        // Utilisation de Schema::create car la table n'existe pas encore
        Schema::create('clients', function (Blueprint $table) {
            // ── CLÉS ET TIMESTAMPS ───────────────────────────────────────
            $table->id();
            $table->foreignId('personne_id')->constrained('personnes')->onDelete('cascade');
            $table->timestamps();

            // ── IDENTIFICATION (Champs de base) ──────────────────────────
            $table->string('type_piece_identite')->nullable();
            $table->string('numero_piece_identite')->nullable();
            $table->date('date_expiration_piece')->nullable();

            // ── IDENTIFICATION (Champs PowerCARD) ────────────────────────
            $table->string('nil')->unique()->nullable()
                  ->comment('Numéro d\'Identification Légal – obligatoire et unique');
            $table->string('code_client')->unique()->nullable()
                  ->comment('Code client généré par le système');
            $table->boolean('est_vip')->default(false);
            $table->string('photo_cin_recto')->nullable()
                  ->comment('Chemin vers la photo recto de la pièce d\'identité');
            $table->string('photo_cin_verso')->nullable()
                  ->comment('Chemin vers la photo verso de la pièce d\'identité');
            $table->string('photo_portrait')->nullable()
                  ->comment('Photo d\'identité / portrait du client');
            $table->string('fichier_consentement')->nullable()
                  ->comment('Fiche de consentement signée (chemin fichier)');
            $table->string('code_pin')->nullable()
                  ->comment('Code PIN hashé envoyé par SMS pour vérification');
            $table->boolean('pin_verifie')->default(false)
                  ->comment('True si le client a confirmé son code PIN');

            // ── INFORMATIONS CLIENTS ─────────────────────────────────────
            $table->string('categorie_client')->nullable()
                  ->comment('Catégorie : micro-entrepreneur, salarié, commerçant…');
            $table->enum('titre', ['M.', 'Mme', 'Mlle', 'Dr', 'Pr'])->nullable();
            $table->string('fonction')->nullable()
                  ->comment('Fonction / profession du client');
            $table->string('secteur_activite')->nullable()
                  ->comment('Secteur d\'activité dans lequel le crédit sera investi');
            $table->string('niveau_etude')->nullable()
                  ->comment('Niveau d\'éducation');
            $table->string('nom_mere')->nullable();
            $table->enum('genre', ['HOMME', 'FEMME', 'AUTRE'])->nullable();
            $table->string('langue', 50)->nullable()
                  ->comment('Langue préférée de communication');
            $table->string('pays_naissance', 100)->nullable();
            $table->string('ville_naissance', 100)->nullable();
            $table->enum('situation_familiale', [
                'CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF', 'UNION_LIBRE'
            ])->nullable();
            $table->integer('nombre_enfants')->default(0);
            $table->string('nom_conjoint')->nullable();
            $table->string('prenom_conjoint')->nullable();

            // ── ADRESSE ──────────────────────────────────────────────────
            $table->string('telephone_secondaire', 20)->nullable();
            $table->string('email_client')->nullable()
                  ->comment('Email direct du client (peut différer de personne.email)');
            $table->string('code_postal', 20)->nullable();
            $table->string('adresse_1')->nullable();
            $table->string('adresse_2')->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('pays', 100)->default('Maroc');
            $table->string('coordonnees_gps', 50)->nullable()
                  ->comment('Format : latitude,longitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};