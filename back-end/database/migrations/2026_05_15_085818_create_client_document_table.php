<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nouvelle table : client_documents (GED)
 * Correspond à l'onglet "GED" du formulaire client (slide 10).
 * Gestion Électronique des Documents : conserve une trace de tous
 * les documents collectés pour chaque client.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('intitule')->comment('Nom/libellé du document');
            $table->string('chemin_fichier')->comment('Chemin de stockage du fichier');
            $table->string('type_mime')->nullable()->comment('MIME type du fichier');
            $table->unsignedBigInteger('taille_octets')->nullable();
            $table->foreignId('ajoute_par')->nullable()->constrained('employes')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_documents');
    }
};