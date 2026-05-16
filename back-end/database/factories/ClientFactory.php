<?php
// database/factories/ClientFactory.php
namespace Database\Factories;

use App\Models\Personne;
use App\Models\Employe;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ClientFactory extends Factory
{
    public function definition(): array
    {
        return [
            // Crée automatiquement une personne liée
            'personne_id' => Personne::factory(), 
            // Récupère un employé existant ou en crée un
            'employe_id' => Employe::first() ? Employe::first()->id : Employe::factory(),
            
            'nil' => $this->faker->unique()->numerify('NIL-######'),
            'code_client' => 'CLT-' . strtoupper(Str::random(8)),
            'est_vip' => $this->faker->boolean(20),
            'type_piece_identite' => 'CIN',
            'numero_piece_identite' => $this->faker->unique()->bothify('??######'),
            'date_expiration_piece' => $this->faker->dateTimeBetween('+1 year', '+10 years'),
            'categorie_client' => $this->faker->randomElement(['Commerçant', 'Salarié', 'Artisan']),
            'titre' => $this->faker->randomElement(['M.', 'Mme', 'Mlle']),
            'genre' => $this->faker->randomElement(['HOMME', 'FEMME']),
            'secteur_activite' => $this->faker->randomElement(['Commerce', 'Agriculture', 'Services']),
            'ville' => $this->faker->city(),
            'pays' => 'Maroc',
            'nationalite' => 'Marocaine',
            'revenu_mensuel' => $this->faker->randomFloat(2, 3000, 20000),
            'adresse_1' => $this->faker->streetAddress(),
        ];
    }
}