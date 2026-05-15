<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nouvelle table : client_liens
 * Correspond à l'onglet "Lien" du formulaire client (slide 21).
 * Permet d'ajouter des personnes liées au client :
 *   - Garant, Mandataire, 2ème contact (en cas d'injoignabilité ou décès)
 * Le lien peut pointer vers un client existant OU être une nouvelle personne.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_liens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade')
                  ->comment('Client principal');
            $table->foreignId('client_lie_id')->nullable()->constrained('clients')->onDelete('set null')
                  ->comment('Client existant dans le système (optionnel)');

            // Type de lien
            $table->enum('type_lien', ['AMI', 'FAMILLE', 'GARANT', 'MANDATAIRE', 'CONTACT_URGENCE', 'CONJOINT', 'AUTRE'])
                  ->comment('Nature du lien entre le client et la personne liée');

            // Informations si nouveau lien (personne non encore cliente)
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('cin')->nullable()->comment('Numéro CIN de la personne liée');
            $table->date('date_expiration_cin')->nullable();
            $table->string('pays_naissance', 100)->nullable();
            $table->string('ville_naissance', 100)->nullable();
            $table->string('gsm', 20)->nullable();
            $table->text('adresse')->nullable();

            $table->boolean('ayant_droit')->default(false)->comment('Cette personne est-elle ayant droit ?');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_liens');
    }
};