<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prospects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('personne_id')->constrained('personnes')->onDelete('restrict');
            $table->foreignId('employe_id')->nullable()->constrained('employes')->onDelete('set null')->comment('Employé superviseur du prospect');
            $table->enum('statut_prospect', ['NOUVEAU', 'EN_COURS', 'CONVERTI', 'REJETE', 'INACTIF']);
            $table->string('source_prospect')->nullable()->comment('Ex: Référence, Publicité, Terrain');
            $table->decimal('montant_pret_estime', 15, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospects');
    }
};