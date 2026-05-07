package com.microfinance.microfinance.models;

import jakarta.persistence.*;

@Entity
public class Frais {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String libelleFrais;
    private Double taux;
    private Double montantFixe;
    private boolean estCapitalisable;

    @ManyToOne
    private ProduitCredit produit;
}