<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\EmployeSeeder;
use Database\Seeders\ClientSeeder;
use     Database\Seeders\ProduitCreditSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            EmployeSeeder::class,
            ClientSeeder::class,
            ProduitCreditSeeder::class,
        ]);
    }
}
