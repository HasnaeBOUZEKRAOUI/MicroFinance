<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PersonneFactory extends Factory
{
    public function definition(): array
    {
        return [
            'prenom'         => $this->faker->firstName(),
            'nom'            => $this->faker->lastName(),
            'date_naissance' => $this->faker->dateTimeBetween('-65 years', '-18 years')->format('Y-m-d'),
            'email'          => $this->faker->unique()->safeEmail(),
            'telephone'      => $this->faker->numerify('06########'),
            'date_creation'  => $this->faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
        ];
    }
}