<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('personne_id')->constrained('personnes')->onDelete('restrict');
            $table->foreignId('superviseur_id')->nullable()->constrained('employes')->onDelete('set null');
            $table->string('nom_utilisateur')->unique();
            $table->string('mot_de_passe');
            $table->enum('role', ['ADMIN', 'AGENT_CREDIT', 'CAISSIER', 'DIRECTEUR', 'SUPERVISEUR']);
            $table->date('date_embauche');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employes');
    }
};