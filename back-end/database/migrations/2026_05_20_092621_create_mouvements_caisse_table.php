<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvements_caisse', function (Blueprint $table) {
            $table->id();
            
            // L'agent (employé) qui effectue l'opération de caisse
            $table->foreignId('employe_id')->constrained('employes')->onDelete('cascade');
            
            // Rappel du numéro de caisse lors de la transaction
            $table->string('num_caisse'); 
            
            // Type : 'ENTREE' (encaissement, remboursement) ou 'SORTIE' (décaissement, octroi prêt)
            $table->enum('type_mouvement', ['ENTREE', 'SORTIE']);
            
            // Le montant de l'opération (ex: 5000.00 DH)
            $table->decimal('montant', 12, 2);
            
            // Description ou motif (ex: "Remboursement échéance #14", "Fond de caisse initial")
            $table->string('libelle')->nullable();
            
            // Référence optionnelle vers une autre table (ex: l'id du prêt ou du paiement)
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable(); // Ex: 'App\Models\Paiement'
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_caisse');
    }
};