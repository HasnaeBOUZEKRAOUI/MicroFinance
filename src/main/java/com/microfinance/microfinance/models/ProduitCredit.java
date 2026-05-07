package com.microfinance.microfinance.models;

import jakarta.persistence.*;

@Entity
public class ProduitCredit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String typeProduit;
    private Double montantMin;
    private Double montantMax;
    private Double tauxInteretMin;
    private Double tauxInteretMax;
    private String modeCalcul;

    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL)
    private List<Frais> fraisInclus;
}