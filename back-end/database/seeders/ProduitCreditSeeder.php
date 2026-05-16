<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProduitCredit;

class ProduitCreditSeeder extends Seeder
{
    public function run(): void
    {
        $produits = [
            [
                'type_produit'     => 'Crédit Express',
                'famille_produit'  => 'Consommation',
                'montant_min'      => 1000.00,
                'montant_max'      => 10000.00,
                'taux_interet_min' => 0.0800, // 8%
                'taux_interet_max' => 0.1200, // 12%
                'mode_calcul'      => 'CONSTANT',
                'actif'            => true,
            ],
            [
                'type_produit'     => 'Micro-Entreprise',
                'famille_produit'  => 'Professionnel',
                'montant_min'      => 5000.00,
                'montant_max'      => 50000.00,
                'taux_interet_min' => 0.0500, // 5%
                'taux_interet_max' => 0.0900, // 9%
                'mode_calcul'      => 'DEGRESSIF',
                'actif'            => true,
            ],
            [
                'type_produit'     => 'Crédit Campagne Agricole',
                'famille_produit'  => 'Agriculture',
                'montant_min'      => 2000.00,
                'montant_max'      => 30000.00,
                'taux_interet_min' => 0.0400,
                'taux_interet_max' => 0.0700,
                'mode_calcul'      => 'IN_FINE', // Remboursement total à la fin (récolte)
                'actif'            => true,
            ],
            [
                'type_produit'     => 'Équipement Maison',
                'famille_produit'  => 'Social',
                'montant_min'      => 500.00,
                'montant_max'      => 5000.00,
                'taux_interet_min' => 0.1000,
                'taux_interet_max' => 0.1500,
                'mode_calcul'      => 'LINEAIRE',
                'actif'            => true,
            ],
            [
                'type_produit'     => 'Ancien Produit Test',
                'famille_produit'  => 'Test',
                'montant_min'      => 100.00,
                'montant_max'      => 1000.00,
                'taux_interet_min' => 0.0100,
                'taux_interet_max' => 0.0500,
                'mode_calcul'      => 'CONSTANT',
                'actif'            => false, // Produit désactivé
            ],
        ];

        foreach ($produits as $produit) {
            ProduitCredit::create($produit);
        }
    }
}