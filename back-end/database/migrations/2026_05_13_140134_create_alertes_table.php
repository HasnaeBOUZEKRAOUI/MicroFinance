<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pret_id')->constrained('prets')->onDelete('cascade');
            $table->text('message');
            $table->enum('niveau_gravite', ['INFO', 'AVERTISSEMENT', 'CRITIQUE', 'URGENCE']);
            $table->timestamp('date_alerte')->useCurrent();
            $table->boolean('est_acquittee')->default(false);
            $table->foreignId('acquittee_par')->nullable()->constrained('employes')->onDelete('set null');
            $table->timestamp('date_acquittement')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};