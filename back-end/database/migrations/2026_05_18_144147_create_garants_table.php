
<?php 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('garants', function (Blueprint $table) {
            $table->id();
            // Liaison avec la demande de crédit
            $table->foreignId('demande_credit_id')->constrained('demandes_credits')->onDelete('cascade');
            
            // Informations d'identité du garant
            $table->string('nom');
            $table->string('prenom');
            $table->string('cin')->unique();
            $table->string('telephone');
            $table->string('email')->nullable();
            $table->string('relation_client'); // ex: Famille, Ami, Collègue...
            
            // Informations financières
            $table->decimal('revenu_mensuel', 15, 2);
            $table->string('employeur')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('garants');
    }
};