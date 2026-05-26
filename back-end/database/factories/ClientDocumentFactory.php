<?php

namespace Database\Factories;

use App\Models\ClientDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClientDocument>
 */
class ClientDocumentFactory extends Factory
{
    private array $typesDocuments = [
        ['intitule' => 'Copie CIN recto',         'mime' => 'image/jpeg'],
        ['intitule' => 'Copie CIN verso',          'mime' => 'image/jpeg'],
        ['intitule' => 'Justificatif de domicile', 'mime' => 'application/pdf'],
        ['intitule' => 'Fiche de consentement',    'mime' => 'application/pdf'],
        ['intitule' => 'Bulletin de salaire',       'mime' => 'application/pdf'],
        ['intitule' => 'Extrait de compte bancaire','mime' => 'application/pdf'],
        ['intitule' => 'Attestation de travail',   'mime' => 'application/pdf'],
        ['intitule' => 'Photo d\'identité',        'mime' => 'image/png'],
        ['intitule' => 'Contrat de location',      'mime' => 'application/pdf'],
        ['intitule' => 'Registre de commerce',     'mime' => 'application/pdf'],
    ];
 
    public function definition(): array
    {
        $doc  = $this->faker->randomElement($this->typesDocuments);
        $ext  = $doc['mime'] === 'application/pdf' ? 'pdf' : 'jpg';
        $size = $doc['mime'] === 'application/pdf'
            ? $this->faker->numberBetween(50000, 2000000)
            : $this->faker->numberBetween(20000, 800000);
 
        return [
            'client_id'      => null, // affecté dans le seeder
            'intitule'       => $doc['intitule'],
            'chemin_fichier' => 'documents/clients/' . $this->faker->uuid() . '.' . $ext,
            'type_mime'      => $doc['mime'],
            'taille_octets'  => $size,
            'ajoute_par'     => null,
        ];
    }
}