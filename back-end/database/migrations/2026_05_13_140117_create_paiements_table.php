<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('echeance_id')->constrained('echeances')->onDelete('restrict');
            $table->foreignId('employe_id')->nullable()->constrained('employes')->onDelete('set null')->comment('Caissier ayant enregistré');
            $table->date('date_paiement');
            $table->decimal('montant', 15, 2);
            $table->enum('mode_paiement', ['ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY', 'PRELEVEMENT']);
            $table->string('reference_transaction')->unique()->nullable();
            $table->boolean('est_valide')->default(true);
            $table->text('observation')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};