<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produit_credit_id')->constrained('produit_credits')->onDelete('cascade');
            $table->string('libelle_frais');
            $table->decimal('taux', 5, 4)->nullable()->comment('Taux en pourcentage, ex: 0.0200 pour 2%');
            $table->decimal('montant_fixe', 15, 2)->nullable()->comment('Montant fixe si pas de taux');
            $table->boolean('est_capitalisable')->default(false)->comment('Intégré au capital du prêt');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frais');
    }
};