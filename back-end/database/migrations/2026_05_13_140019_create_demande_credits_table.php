<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demande_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->foreignId('produit_credit_id')->constrained('produit_credits')->onDelete('restrict');
            $table->foreignId('employe_id')->nullable()->constrained('employes')->onDelete('set null')->comment('Agent traitant');
            $table->decimal('montant_demande', 15, 2);
            $table->integer('duree_demandee')->comment('Durée en mois');
            $table->string('objet_pret')->comment('Motif / objet du prêt');
            $table->string('garantie')->nullable()->comment('Type de garantie fournie');
            $table->string('nom_garant')->nullable();
            $table->enum('statut_demande', [
                'EN_ATTENTE',
                'EN_COURS_ANALYSE',
                'APPROUVEE',
                'REJETEE',
                'ANNULEE',
                'DECAISSEE'
            ])->default('EN_ATTENTE');
            $table->decimal('score_risque', 5, 2)->nullable()->comment('Score de risque calculé');
            $table->text('motif_rejet')->nullable();
            $table->timestamp('date_soumission')->useCurrent();
            $table->timestamp('date_decision')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demande_credits');
    }
};