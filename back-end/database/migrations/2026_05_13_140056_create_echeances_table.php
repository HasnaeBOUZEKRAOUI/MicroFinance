<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('echeances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pret_id')->constrained('prets')->onDelete('cascade');
            $table->integer('numero_echeance')->comment('Numéro d\'ordre de l\'échéance');
            $table->date('date_echeance');
            $table->decimal('total_du', 15, 2)->comment('Total à payer (principal + intérêts)');
            $table->decimal('montant_principal', 15, 2);
            $table->decimal('montant_interet', 15, 2);
            $table->decimal('montant_paye', 15, 2)->default(0);
            $table->integer('jours_retard')->default(0);
            $table->decimal('penalites', 15, 2)->default(0);
            $table->enum('statut', ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD'])->default('EN_ATTENTE');
            $table->timestamps();

            $table->unique(['pret_id', 'numero_echeance']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('echeances');
    }
};