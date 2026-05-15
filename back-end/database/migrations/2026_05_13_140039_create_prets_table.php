<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_credit_id')->nullable()->constrained('demande_credits')->onDelete('set null');
            $table->string('reference')->unique()->comment('Référence unique du prêt');
            $table->decimal('montant_accorde', 15, 2);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->decimal('taux_interet', 5, 4)->comment('Taux annuel, ex: 0.1200 pour 12%');
            $table->enum('statut_pret', [
                'EN_COURS',
                'SOLDE',
                'EN_RETARD',
                'EN_CONTENTIEUX',
                'RESTRUCTURE',
                'ABANDONNE'
            ])->default('EN_COURS');
            $table->integer('periode_grace')->default(0)->comment('Période de grâce en mois');
            $table->decimal('capital_restant', 15, 2)->nullable()->comment('Capital restant dû');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prets');
    }
};