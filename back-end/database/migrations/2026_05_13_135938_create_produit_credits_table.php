<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produit_credits', function (Blueprint $table) {
            $table->id();
            $table->string('type_produit');
            $table->string('famille_produit');
            $table->decimal('montant_min', 15, 2);
            $table->decimal('montant_max', 15, 2);
            $table->decimal('taux_interet_min', 5, 4)->comment('Ex: 0.0500 pour 5%');
            $table->decimal('taux_interet_max', 5, 4)->comment('Ex: 0.1500 pour 15%');
            $table->enum('mode_calcul', ['LINEAIRE', 'DEGRESSIF', 'CONSTANT', 'IN_FINE']);
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produit_credits');
    }
};