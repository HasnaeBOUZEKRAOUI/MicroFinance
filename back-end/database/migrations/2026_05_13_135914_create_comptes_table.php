<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comptes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->string('numero_compte')->unique();
            $table->string('code_banque', 10)->nullable();
            $table->decimal('solde_actuel', 15, 2)->default(0);
            $table->enum('type_compte', ['COURANT', 'EPARGNE', 'DEPOT_A_TERME', 'MICROCREDIT']);
            $table->enum('statut', ['ACTIF', 'SUSPENDU', 'CLOTURE'])->default('ACTIF');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comptes');
    }
};